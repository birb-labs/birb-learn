'use client';

import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { HighlightedLine } from '@birb-learn/code-ui';
// Type-only and deep imports: the code-runner barrel would pull the workers and engines into this graph.
import type { Runner } from '@birb-learn/code-runner/src/protocol';
import type { CodeKind, Language } from '@birb-learn/content-schema/src/code-languages';
import type { CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { buildCodeTaskLabels } from '@/lib/code-labels';
import { lazySiteRunner } from '@/lib/lazy-site-runner';
import styles from './code-exercise-client.module.css';

// The editor entry brings CodeMirror; keep it out of the chunk that hydrates the rest of the lesson.
const CodeTaskView = lazy(() => import('@birb-learn/code-ui/editor').then((module) => ({ default: module.CodeTaskView })));

export interface CodeExerciseClientProps {
  kind: CodeKind;
  language: Language;
  starterTokens: HighlightedLine[];
  payload: CodeTaskPayloadData;
  /** The prompt, resolution and hints are MDX compiled by the server half; the client only places them. */
  prompt: ReactNode;
  resolution?: ReactNode;
  hints: ReactNode[];
  solutionTokens?: HighlightedLine[];
  /** Tests inject a fake; by default the shared site runner is found when a run is first asked for. */
  runner?: Runner;
}

/** Client half of a `code_exercise` block: the practice view, with labels built from the page's locale. */
export function CodeExerciseClient({ kind, language, starterTokens, payload, prompt, resolution, hints, solutionTokens, runner }: CodeExerciseClientProps) {
  const t = useTranslations('code');
  const labels = useMemo(() => buildCodeTaskLabels(t), [t]);

  return (
    // While the editor code loads the prompt stays readable (and it is what the static page shows without JavaScript).
    <Suspense fallback={<div className={styles.fallback}>{prompt}</div>}>
      <CodeTaskView
        mode="practice"
        kind={kind}
        language={language}
        starterTokens={starterTokens}
        payload={payload}
        prompt={prompt}
        resolution={resolution}
        hints={hints}
        solutionTokens={solutionTokens}
        runner={runner ?? lazySiteRunner}
        labels={labels}
      />
    </Suspense>
  );
}
