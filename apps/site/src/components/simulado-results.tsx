'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@birb-learn/theme';
// Type-only deep import: the code-runner barrel would pull the workers and engines into this graph.
import type { Runner } from '@birb-learn/code-runner/src/protocol';
import {
  regradeNotGraded,
  verdictOf,
  type GradedQuestionResult,
  type GradedResult,
  type QuestionVerdict,
} from '@/lib/grade-simulado';
import { buildCodeTaskLabels } from '@/lib/code-labels';
import { lazySiteRunner } from '@/lib/lazy-site-runner';
import { formatNumericAnswerForDisplay } from '@/lib/numeric-answer';
import { parseSelectedOptionIds } from '@/lib/multi-response-answer';
import { parseOrderingAnswer } from '@/lib/ordering-answer';
import { parseMatchingAnswer } from '@/lib/matching-answer';
import { renderMathAnswer } from '@/lib/render-math-answer';
import { FallbackNotice } from './fallback-notice';
import { SimuladoCodeReview } from './simulado-code-review';
import styles from './simulado-results.module.css';

// Question types whose "your answer"/"correct answer" value is pre-compiled,
// trusted HTML (produced from our own MDX at build time), and can therefore
// be safely rendered via `dangerouslySetInnerHTML`. `numeric` and
// `short_text` are deliberately excluded: both display the student's own
// raw typed text, which must never be treated as trusted HTML.
const HTML_ANSWER_TYPES = new Set(['multiple_choice', 'multiple_response', 'ordering', 'matching']);

function isHtmlAnswer(question: GradedQuestionResult['question']): boolean {
  if (HTML_ANSWER_TYPES.has(question.type)) return true;
  return question.type === 'short_text' && question.answerFormat === 'math';
}

function describeAnswers(
  { question, userAnswer }: GradedQuestionResult,
  locale: string,
  tTaking: ReturnType<typeof useTranslations>,
): { yourAnswer: string; correctAnswer: string } {
  if (question.type === 'multiple_choice') {
    const selected = question.options.find((option) => String(option.id) === userAnswer);
    const correct = question.options.find((option) => option.isCorrect);
    return {
      yourAnswer: selected?.textHtml ?? '',
      correctAnswer: correct?.textHtml ?? '',
    };
  }

  if (question.type === 'multiple_response') {
    const selectedIds = parseSelectedOptionIds(userAnswer);
    const selectedOptions = question.options.filter((option) => selectedIds.includes(option.id));
    const correctOptions = question.options.filter((option) => option.isCorrect);
    return {
      yourAnswer: selectedOptions.map((option) => option.textHtml).join(', '),
      correctAnswer: correctOptions.map((option) => option.textHtml).join(', '),
    };
  }

  if (question.type === 'true_false') {
    const toLabel = (value: string | null | undefined) => {
      if (value === 'true') return tTaking('true');
      if (value === 'false') return tTaking('false');
      return '';
    };
    return {
      yourAnswer: toLabel(userAnswer),
      correctAnswer: toLabel(question.correctAnswer),
    };
  }

  if (question.type === 'short_text') {
    if (question.answerFormat === 'math') {
      return {
        yourAnswer: renderMathAnswer(userAnswer ?? ''),
        correctAnswer: question.acceptedAnswers.map((answer) => renderMathAnswer(answer.text)).join(' &nbsp;/&nbsp; '),
      };
    }
    return {
      yourAnswer: userAnswer ?? '',
      correctAnswer: question.acceptedAnswers.map((answer) => answer.text).join(' / '),
    };
  }

  if (question.type === 'ordering') {
    const labelForId = (id: number) => question.options.find((option) => option.id === id)?.textHtml ?? '';
    return {
      yourAnswer: parseOrderingAnswer(userAnswer).map(labelForId).join(', '),
      correctAnswer: question.options.map((option) => option.textHtml).join(', '),
    };
  }

  if (question.type === 'matching') {
    const pairById = new Map(question.matchingPairs.map((pair) => [pair.id, pair]));
    const pairing = parseMatchingAnswer(userAnswer);
    const yourPairs = Object.entries(pairing).map(([leftId, rightId]) => {
      const left = pairById.get(Number(leftId));
      const right = pairById.get(rightId);
      return `${left?.leftHtml ?? ''} &rarr; ${right?.rightHtml ?? ''}`;
    });
    const correctPairs = question.matchingPairs.map((pair) => `${pair.leftHtml} &rarr; ${pair.rightHtml}`);
    return {
      yourAnswer: yourPairs.join(', '),
      correctAnswer: correctPairs.join(', '),
    };
  }

  // numeric: the user's raw typed text is shown as-is, and the canonical
  // correctAnswer is reformatted for the active locale for display.
  const rawUserAnswer = userAnswer ?? '';
  const correctAnswer = question.correctAnswer ?? '';
  return {
    yourAnswer: rawUserAnswer,
    correctAnswer: formatNumericAnswerForDisplay(correctAnswer, locale),
  };
}

/** "Your answer" and, when wrong, "Correct answer" for every type except `code`. */
function AnswerReview({ entry, locale }: { entry: GradedQuestionResult; locale: string }) {
  const t = useTranslations('simulado.results');
  const tTaking = useTranslations('simulado.taking');
  const { yourAnswer, correctAnswer } = describeAnswers(entry, locale, tTaking);
  const renderAsHtml = isHtmlAnswer(entry.question);

  return (
    <>
      <p className={styles.answers}>
        <strong>{t('yourAnswer')}:</strong>{' '}
        {renderAsHtml ? (
          // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
          <span dangerouslySetInnerHTML={{ __html: yourAnswer }} />
        ) : (
          yourAnswer
        )}
      </p>
      {!entry.isCorrect && (
        <p className={styles.answers}>
          <strong>{t('correctAnswer')}:</strong>{' '}
          {renderAsHtml ? (
            // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
            <span dangerouslySetInnerHTML={{ __html: correctAnswer }} />
          ) : (
            correctAnswer
          )}
        </p>
      )}
    </>
  );
}

const STATUS_ICONS: Record<QuestionVerdict, 'check-circle' | 'x-circle' | 'clock'> = {
  correct: 'check-circle',
  incorrect: 'x-circle',
  not_graded: 'clock',
};

const STATUS_CLASSES: Record<QuestionVerdict, string> = {
  correct: styles.statusCorrect,
  incorrect: styles.statusIncorrect,
  not_graded: styles.statusNotGraded,
};

/** The earliest time a retry can succeed: the longest `retryAfterMs` among the not-graded questions, from now. */
function retryReadyAt(result: GradedResult): number {
  const waits = result.perQuestion.map((entry) =>
    verdictOf(entry) === 'not_graded' ? (entry.notGraded?.retryAfterMs ?? 0) : 0,
  );
  return Date.now() + Math.max(0, ...waits);
}

/** The answers map the result was graded from (it also serves attempts reopened from the history). */
function answersOf(result: GradedResult): Record<number, string> {
  const answers: Record<number, string> = {};
  for (const entry of result.perQuestion) {
    if (entry.userAnswer !== undefined) answers[entry.question.id] = entry.userAnswer;
  }
  return answers;
}

export function SimuladoResults({
  result,
  locale,
  onBackToSetup,
  onResultChange,
  runner = lazySiteRunner,
}: {
  result: GradedResult;
  locale: string;
  onBackToSetup: () => void;
  /** Called with the new result once a retry has graded the not-graded questions again. */
  onResultChange?: (result: GradedResult) => void;
  /** Tests inject a fake; by default the shared site runner is found when a retry first runs code. */
  runner?: Runner;
}) {
  const t = useTranslations('simulado.results');
  const tTaking = useTranslations('simulado.taking');
  const tCode = useTranslations('code');
  const codeLabels = useMemo(() => buildCodeTaskLabels(tCode), [tCode]);
  const [onlyWrong, setOnlyWrong] = useState(false);

  // The shown result starts as the prop and is replaced by a retry; a new prop replaces it again.
  const [shown, setShown] = useState(() => ({ result, readyAt: retryReadyAt(result) }));
  const [seenResult, setSeenResult] = useState(result);
  if (result !== seenResult) {
    setSeenResult(result);
    if (result !== shown.result) setShown({ result, readyAt: retryReadyAt(result) });
  }
  const current = shown.result;
  const { readyAt } = shown;

  const [now, setNow] = useState(() => Date.now());
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  // The in-flight retry's controller; aborted on unmount.
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [],
  );

  // Ticks the retry countdown until a retry is allowed.
  useEffect(() => {
    if (readyAt <= Date.now()) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= readyAt) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [readyAt]);

  async function retry() {
    if (controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setRetrying(true);
    setRetryFailed(false);

    let next: GradedResult | undefined;
    try {
      next = await regradeNotGraded(current, answersOf(current), locale, { runner, signal: controller.signal });
    } catch {
      next = undefined;
    }

    // An unmounted view no longer owns the state.
    if (controller.signal.aborted) return;
    controllerRef.current = null;
    setRetrying(false);
    if (!next) {
      setRetryFailed(true);
      return;
    }
    setShown({ result: next, readyAt: retryReadyAt(next) });
    setNow(Date.now());
    onResultChange?.(next);
  }

  const notGradedCount = current.perQuestion.filter((entry) => verdictOf(entry) === 'not_graded').length;
  const waitSeconds = Math.ceil(Math.max(0, readyAt - now) / 1000);
  const percent = current.total > 0 ? Math.round((current.correctCount / current.total) * 100) : 0;
  const level = percent >= 80 ? 'high' : percent >= 50 ? 'mid' : 'low';
  const message = level === 'high' ? t('excellent') : level === 'mid' ? t('good') : t('keepGoing');
  const visible = current.perQuestion
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !onlyWrong || !entry.isCorrect);

  let retryLabel = t('retry');
  if (retrying) retryLabel = t('retrying');
  else if (waitSeconds > 0) retryLabel = t('retryIn', { seconds: waitSeconds });

  return (
    <div className={styles.wrapper}>
      <section className={styles.hero} data-level={level}>
        <div
          className={styles.ring}
          style={{ '--percent': `${percent}%` } as React.CSSProperties}
          role="img"
          aria-label={t('percentCorrect', { percent })}
        >
          <span className={styles.ringValue}>{percent}%</span>
        </div>
        <div className={styles.heroText}>
          <p className={styles.message}>{message}</p>
          <p className={styles.score}>
            {notGradedCount > 0
              ? t('scoreWithNotGraded', { correct: current.correctCount, notGraded: notGradedCount, total: current.total })
              : t('score', { correct: current.correctCount, total: current.total })}
          </p>
          {retryFailed && (
            <p className={styles.retryError} role="alert">
              {t('retryError')}
            </p>
          )}
        </div>
        <div className={styles.heroActions}>
          {notGradedCount > 0 && (
            <button
              type="button"
              className={styles.retryButton}
              disabled={retrying || waitSeconds > 0}
              onClick={() => void retry()}
            >
              <Icon name={retrying ? 'timer' : 'rotate-ccw'} size={16} aria-hidden />
              {retryLabel}
            </button>
          )}
          <button type="button" className={styles.retryButton} onClick={onBackToSetup}>
            <Icon name="rotate-ccw" size={16} aria-hidden />
            {t('backToSetup')}
          </button>
        </div>
      </section>

      <div className={styles.reviewHeader}>
        <h2 className={styles.reviewTitle}>{t('reviewTitle')}</h2>
        <div className={styles.filter} role="group" aria-label={t('reviewTitle')}>
          <button type="button" className={styles.filterButton} aria-pressed={!onlyWrong} onClick={() => setOnlyWrong(false)}>
            {t('filterAll')}
          </button>
          <button type="button" className={styles.filterButton} aria-pressed={onlyWrong} onClick={() => setOnlyWrong(true)}>
            {t('filterWrong')}
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {visible.map(({ entry, index }) => {
          const { question, isCorrect } = entry;
          const verdict = verdictOf(entry);
          const statusLabel = { correct: t('correct'), incorrect: t('incorrect'), not_graded: t('notGraded') }[verdict];

          return (
            <div key={question.id} className={styles.question} data-correct={isCorrect} data-verdict={verdict}>
              <p className={`${styles.status} ${STATUS_CLASSES[verdict]}`}>
                <Icon name={STATUS_ICONS[verdict]} size={16} aria-hidden />
                {statusLabel}
                <span className={styles.questionLabel}>{tTaking('question', { number: index + 1 })}</span>
              </p>
              {question.isFallback && <FallbackNotice />}
              {/* eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX */}
              <div dangerouslySetInnerHTML={{ __html: question.promptHtml }} />

              {question.code ? (
                <SimuladoCodeReview entry={entry} task={question.code} labels={codeLabels} />
              ) : (
                <AnswerReview entry={entry} locale={locale} />
              )}

              <div className={styles.resolutionBox}>
                <p className={styles.resolutionLabel}>
                  <Icon name="lightbulb" size={14} aria-hidden />
                  {t('resolution')}
                </p>
                <div
                  className={styles.resolution}
                  // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
                  dangerouslySetInnerHTML={{ __html: question.resolutionHtml }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
