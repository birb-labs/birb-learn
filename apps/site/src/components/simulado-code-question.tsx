'use client';

import { Suspense, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { parseCodeAnswer, serializeCodeAnswer } from '@birb-learn/code-ui';
import type { ExportedCodeTask } from '@/lib/export-question';
import { buildCodeTaskLabels } from '@/lib/code-labels';
import { lazySiteRunner } from '@/lib/lazy-site-runner';
import { createRetryableLazy } from '@/lib/retryable-lazy';
import { LazyIslandBoundary } from './lazy-island-boundary';

// The editor entry brings CodeMirror; keep it out of the chunk that renders the rest of the simulado.
const CodeTaskView = createRetryableLazy(() => import('@birb-learn/code-ui/editor').then((module) => ({ default: module.CodeTaskView })));

/**
 * A `code` question while the simulado is being taken: the task view in exam
 * mode (no check, hints, solution or resolution), storing the serialized answer.
 */
export function SimuladoCodeQuestion({
  task,
  promptHtml,
  answer,
  onAnswerChange,
}: {
  task: ExportedCodeTask;
  promptHtml: string;
  answer: string | undefined;
  onAnswerChange: (value: string) => void;
}) {
  const t = useTranslations('code');
  const labels = useMemo(() => buildCodeTaskLabels(t), [t]);
  // Parsed once per stored string: the view takes every new answer object as a new answer from the parent.
  const storedAnswer = useMemo(() => parseCodeAnswer(task.kind, answer), [task.kind, answer]);
  // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX, not user input
  const prompt = <div dangerouslySetInnerHTML={{ __html: promptHtml }} />;

  return (
    // While the editor code loads, the prompt stays readable. The boundary sits inside the question,
    // so a load failure leaves the answers held by the simulado untouched.
    <LazyIslandBoundary onRetry={CodeTaskView.reset} context={prompt}>
      <Suspense fallback={prompt}>
        <CodeTaskView
          mode="exam"
          kind={task.kind}
          language={task.language}
          starterTokens={task.starterTokens}
          payload={task.payload}
          prompt={prompt}
          answer={storedAnswer}
          onAnswerChange={(next) => onAnswerChange(serializeCodeAnswer(next))}
          runner={lazySiteRunner}
          labels={labels}
        />
      </Suspense>
    </LazyIslandBoundary>
  );
}
