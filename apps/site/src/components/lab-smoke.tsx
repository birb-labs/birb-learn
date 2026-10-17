'use client';

// Temporary vehicle for the runner smoke test (`e2e/runner.spec.ts`): proves
// that the site bundles `@birb-learn/code-runner` and runs every engine in a
// real browser. The real lab page replaces it.
import { useState } from 'react';
import { LANGUAGE_INFO, type RunProgress, type RunResult } from '@birb-learn/code-runner';
import type { Language } from '@birb-learn/content-schema';
import { getSiteRunner } from '@/lib/site-runner';

const RUNNABLE_LANGUAGES = (Object.keys(LANGUAGE_INFO) as Language[]).filter(
  (language) => LANGUAGE_INFO[language].engine !== 'none',
);

function describeProgress(progress: RunProgress): string {
  if (progress.phase === 'loading_engine') return 'Loading engine…';
  const position = `${progress.caseIndex + 1}/${progress.caseCount}`;
  return progress.phase === 'case_started' ? `Running case ${position}…` : `Finished case ${position}`;
}

/** Plain-text rendering of a run result; it is shown in a `<pre>`, never as HTML. */
function formatResult(result: RunResult): string {
  if (result.status === 'unavailable') return `unavailable (${result.reason}): ${result.message ?? ''}`;
  if (result.status === 'compile_error') return `compile_error\n${result.compileOutput ?? ''}`;
  return result.cases
    .map((testCase) => {
      const tables = (testCase.sql?.resultSets ?? []).map((set) =>
        [set.columns.join(' | '), ...set.rows.map((row) => row.map((cell) => cell ?? 'NULL').join(' | '))].join('\n'),
      );
      return [`[${testCase.status}]`, testCase.stdout, testCase.stderr, ...tables].filter(Boolean).join('\n');
    })
    .join('\n');
}

export function LabSmoke() {
  const [language, setLanguage] = useState<Language>('javascript');
  const [source, setSource] = useState(LANGUAGE_INFO.javascript.template);
  const [status, setStatus] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setOutput('');
    setStatus('');
    try {
      const result = await getSiteRunner().runCode(
        { language, source },
        { onProgress: (progress) => setStatus(describeProgress(progress)) },
      );
      setOutput(formatResult(result));
      setStatus('done');
    } catch (error) {
      setOutput(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
      setStatus('failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <section>
      <select
        aria-label="Language"
        data-testid="lab-language"
        value={language}
        onChange={(event) => {
          const next = event.target.value as Language;
          setLanguage(next);
          setSource(LANGUAGE_INFO[next].template);
        }}
      >
        {RUNNABLE_LANGUAGES.map((id) => (
          <option key={id} value={id}>
            {LANGUAGE_INFO[id].label}
          </option>
        ))}
      </select>
      <textarea
        aria-label="Source"
        data-testid="lab-source"
        rows={12}
        cols={80}
        spellCheck={false}
        value={source}
        onChange={(event) => setSource(event.target.value)}
      />
      <button type="button" data-testid="lab-run" disabled={running} onClick={() => void run()}>
        Run
      </button>
      <p data-testid="lab-status">{status}</p>
      <pre data-testid="lab-output">{output}</pre>
    </section>
  );
}
