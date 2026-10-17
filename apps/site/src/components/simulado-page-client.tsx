'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { SubjectSummary, TopicNode } from '@birb-learn/content-schema';
import { SimuladoSetup, type SimuladoConfig } from './simulado-setup';
import { SimuladoTaking } from './simulado-taking';
import { SimuladoResults } from './simulado-results';
import { SimuladoHistory } from './simulado-history';
import { selectQuestions, type ExportedQuestion } from '@/lib/simulado-selection';
import { gradeSimulado, type GradedResult } from '@/lib/grade-simulado';
import { useSimuladoHistory, type SimuladoAttempt } from '@/hooks/use-simulado-history';
import styles from './simulado-page-client.module.css';

type ViewState =
  | { view: 'setup' }
  | { view: 'taking'; questions: ExportedQuestion[] }
  /** `attemptId` is the history entry the result is stored in, updated after a retry. */
  | { view: 'results'; result: GradedResult; attemptId: string };

export function SimuladoPageClient({
  subjects,
  tagTreesBySubject,
  locale,
}: {
  subjects: SubjectSummary[];
  tagTreesBySubject: Record<number, TopicNode[]>;
  locale: string;
}) {
  const t = useTranslations('simulado.setup');
  const tTaking = useTranslations('simulado.taking');
  const [state, setState] = useState<ViewState>({ view: 'setup' });
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Code questions graded so far, while the code tests run. */
  const [codeProgress, setCodeProgress] = useState<{ done: number; total: number } | null>(null);
  const { history, addAttempt, updateAttempt } = useSimuladoHistory();
  // The grading in flight; aborted when the page unmounts.
  const gradingRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      gradingRef.current?.abort();
      gradingRef.current = null;
    },
    [],
  );

  async function handleStart(config: SimuladoConfig) {
    setLoadError(null);
    setNotice(null);

    let allQuestions: ExportedQuestion[];
    try {
      const response = await fetch(`/data/questions.${locale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions.${locale}.json: ${response.status}`);
      }
      allQuestions = await response.json();
    } catch {
      setLoadError(t('loadError'));
      return;
    }

    const { questions: selected, shortfalls } = selectQuestions(allQuestions, config, tagTreesBySubject);

    if (shortfalls.length > 0) {
      setNotice(
        shortfalls
          .map((shortfall) =>
            t('notEnoughQuestionsModule', {
              module: shortfall.moduleIndex + 1,
              available: shortfall.available,
              requested: shortfall.requested,
            }),
          )
          .join(' '),
      );
    }

    if (selected.length === 0) {
      return;
    }

    setAnswers({});
    setState({ view: 'taking', questions: selected });
  }

  function handleAnswerChange(questionId: number, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleFinish() {
    if (state.view !== 'taking' || gradingRef.current) return;
    const controller = new AbortController();
    gradingRef.current = controller;
    setLoadError(null);

    let result: GradedResult | undefined;
    try {
      // The runner defaults to the site runner (Web Workers plus Compiler Explorer), found on the first run.
      result = await gradeSimulado(state.questions, answers, locale, {
        signal: controller.signal,
        onProgress: (done, total) => {
          if (!controller.signal.aborted) setCodeProgress({ done, total });
        },
      });
    } catch {
      result = undefined;
    }

    // An unmounted page no longer owns the state, and its attempt is not recorded.
    if (controller.signal.aborted) return;
    gradingRef.current = null;
    setCodeProgress(null);
    if (!result) {
      setLoadError(tTaking('gradingError'));
      return;
    }
    const attemptId = addAttempt(result);
    setState({ view: 'results', result, attemptId });
  }

  function handleViewAttempt(attempt: SimuladoAttempt) {
    setState({ view: 'results', result: attempt.result, attemptId: attempt.completedAt });
  }

  function handleResultChange(attemptId: string, result: GradedResult) {
    updateAttempt(attemptId, result);
    setState((prev) => (prev.view === 'results' && prev.attemptId === attemptId ? { ...prev, result } : prev));
  }

  if (state.view === 'taking') {
    return (
      <>
        {notice && <p className={styles.notice}>{notice}</p>}
        {loadError && <p className={styles.notice}>{loadError}</p>}
        <SimuladoTaking
          questions={state.questions}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onFinish={handleFinish}
        />
        <p className={styles.progress} role="status">
          {codeProgress && tTaking('gradingCode', { done: codeProgress.done, total: codeProgress.total })}
        </p>
      </>
    );
  }

  if (state.view === 'results') {
    const { attemptId } = state;
    return (
      <SimuladoResults
        result={state.result}
        locale={locale}
        onBackToSetup={() => setState({ view: 'setup' })}
        onResultChange={(result) => handleResultChange(attemptId, result)}
      />
    );
  }

  return (
    <div className={styles.stack}>
      {loadError && <p className={styles.notice}>{loadError}</p>}
      {notice && <p className={styles.notice}>{notice}</p>}
      <SimuladoSetup subjects={subjects} tagTreesBySubject={tagTreesBySubject} onStart={handleStart} />
      <SimuladoHistory history={history} onViewAttempt={handleViewAttempt} />
    </div>
  );
}
