'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@birb-learn/theme';
import type { ExportedQuestion } from '@/lib/simulado-selection';
import { parseSelectedOptionIds, toggleOptionId } from '@/lib/multi-response-answer';
import { FallbackNotice } from './fallback-notice';
import { ProgressBar } from './progress-bar';
import { NumericAnswerInput } from './numeric-answer-input';
import { TrueFalseInput } from './true-false-input';
import { ShortTextAnswerInput } from './short-text-answer-input';
import { OrderingInput } from './ordering-input';
import { MatchingInput } from './matching-input';
import styles from './simulado-taking.module.css';

export function SimuladoTaking({
  questions,
  answers,
  onAnswerChange,
  onFinish,
}: {
  questions: ExportedQuestion[];
  answers: Record<number, string>;
  onAnswerChange: (questionId: number, value: string) => void;
  onFinish: () => void | Promise<void>;
}) {
  const t = useTranslations('simulado.taking');
  const [isFinishing, setIsFinishing] = useState(false);

  async function handleFinishClick() {
    setIsFinishing(true);
    try {
      await onFinish();
    } finally {
      setIsFinishing(false);
    }
  }

  const answeredCount = questions.filter((question) => (answers[question.id] ?? '') !== '').length;

  return (
    <div className={styles.list}>
      <div className={styles.progressBar}>
        <div className={styles.progressText}>
          <Icon name="list-checks" size={16} aria-hidden />
          <span>{t('progress', { answered: answeredCount, total: questions.length })}</span>
        </div>
        <ProgressBar
          value={answeredCount}
          max={questions.length}
          size="sm"
          label={t('progress', { answered: answeredCount, total: questions.length })}
        />
      </div>

      {questions.map((question, index) => (
        <div key={question.id} className={styles.question}>
          <p className={styles.questionNumber}>
            <span className={styles.questionBadge} aria-hidden>
              {index + 1}
            </span>
            {t('question', { number: index + 1 })}
            {(answers[question.id] ?? '') !== '' && (
              <span className={styles.answered}>
                <Icon name="check" size={12} aria-hidden />
                {t('answered')}
              </span>
            )}
          </p>
          {question.isFallback && <FallbackNotice />}
          {/* eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX, not user input */}
          <div dangerouslySetInnerHTML={{ __html: question.promptHtml }} />

          {question.type === 'multiple_choice' &&
            question.options.map((option) => (
              <div key={option.id} className={styles.optionRow}>
                <input
                  type="radio"
                  id={`q${question.id}-o${option.id}`}
                  name={`question-${question.id}`}
                  checked={answers[question.id] === String(option.id)}
                  onChange={() => onAnswerChange(question.id, String(option.id))}
                />
                <label
                  htmlFor={`q${question.id}-o${option.id}`}
                  // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
                  dangerouslySetInnerHTML={{ __html: option.textHtml }}
                />
              </div>
            ))}

          {question.type === 'multiple_response' && (
            <>
              <p className={styles.hint}>{t('selectAllThatApply')}</p>
              {question.options.map((option) => {
                const selectedIds = parseSelectedOptionIds(answers[question.id]);
                return (
                  <div key={option.id} className={styles.optionRow}>
                    <input
                      type="checkbox"
                      id={`q${question.id}-o${option.id}`}
                      checked={selectedIds.includes(option.id)}
                      onChange={() => onAnswerChange(question.id, toggleOptionId(answers[question.id], option.id))}
                    />
                    <label
                      htmlFor={`q${question.id}-o${option.id}`}
                      // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
                      dangerouslySetInnerHTML={{ __html: option.textHtml }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {question.type === 'numeric' && (
            <NumericAnswerInput
              value={answers[question.id] ?? ''}
              onChange={(value) => onAnswerChange(question.id, value)}
            />
          )}

          {question.type === 'true_false' && (
            <TrueFalseInput
              questionId={question.id}
              value={answers[question.id]}
              onChange={(value) => onAnswerChange(question.id, value)}
            />
          )}

          {question.type === 'short_text' && (
            <ShortTextAnswerInput
              value={answers[question.id] ?? ''}
              onChange={(value) => onAnswerChange(question.id, value)}
              answerFormat={question.answerFormat}
            />
          )}

          {question.type === 'ordering' && (
            <OrderingInput
              options={question.options}
              onChange={(value) => onAnswerChange(question.id, value)}
            />
          )}

          {question.type === 'matching' && (
            <MatchingInput
              pairs={question.matchingPairs}
              onChange={(value) => onAnswerChange(question.id, value)}
            />
          )}
        </div>
      ))}

      <button type="button" className={styles.finishButton} onClick={handleFinishClick} disabled={isFinishing}>
        <Icon name={isFinishing ? 'timer' : 'check-circle'} size={18} aria-hidden />
        {isFinishing ? t('grading') : t('finish')}
      </button>
    </div>
  );
}
