'use client';

import { useEffect, useRef, useState } from 'react';
// Deep imports: the code-runner barrel would pull the workers and engines into this graph.
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
import type { RunProgress, RunResult, RunStatus, Runner } from '@birb-learn/code-runner/src/protocol';
import type { Language } from '@birb-learn/content-schema/src/code-languages';
import type { RunPanelLabels } from './labels';
import { OutputView } from './output-view';
import styles from './run-panel.module.css';

export interface RunPanelProps {
  runner: Runner;
  language: Language;
  source: string;
  stdin?: string;
  onStdinChange?: (stdin: string) => void;
  /** SQL only: statements run before `source` in the same fresh database. */
  sqlSetup?: string;
  showStdin?: boolean;
  /** Lists the SQL setup above the toolbar (default); turn it off when the caller already shows it, e.g. in an editor. */
  showSqlSetup?: boolean;
  labels: RunPanelLabels;
}

/** How often the rate-limit countdown refreshes. */
const COUNTDOWN_TICK_MS = 250;

function progressText(progress: RunProgress | null, language: Language, labels: RunPanelLabels): string {
  if (progress?.phase === 'loading_engine') return labels.loadingEngine(LANGUAGE_INFO[language].label);
  // A single case needs no counter; the counter counts finished cases, so none is shown before the first one ends.
  if (progress && progress.caseCount > 1) {
    const finished = progress.phase === 'case_done' ? progress.caseIndex + 1 : progress.caseIndex;
    if (finished > 0) return labels.caseProgress(finished, progress.caseCount);
  }
  return labels.running;
}

function finalStatus(result: RunResult): RunStatus {
  if (result.status !== 'ok') return result.status;
  return result.cases.find((c) => c.status !== 'ok')?.status ?? 'ok';
}

export function RunPanel({ runner, language, source, stdin, onStdinChange, sqlSetup, showStdin = false, showSqlSetup = true, labels }: RunPanelProps) {
  const info = LANGUAGE_INFO[language];
  const [localStdin, setLocalStdin] = useState(stdin ?? '');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  // Absolute deadline of the rate-limit wait, and what is left of it.
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [retryRemainingMs, setRetryRemainingMs] = useState(0);
  // The in-flight run's controller; cleared as soon as that run is stopped, replaced or settled.
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (retryUntil === null) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, retryUntil - Date.now());
      setRetryRemainingMs(remaining);
      if (remaining === 0) setRetryUntil(null);
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(timer);
  }, [retryUntil]);

  function settle(controller: AbortController, outcome: RunResult) {
    // A stopped, replaced or unmounted run no longer owns the panel.
    if (controllerRef.current !== controller || controller.signal.aborted) return;
    controllerRef.current = null;
    setRunning(false);
    setProgress(null);
    setResult(outcome);
    if (outcome.status === 'unavailable' && outcome.reason === 'rate_limited' && outcome.retryAfterMs !== undefined && outcome.retryAfterMs > 0) {
      setRetryRemainingMs(outcome.retryAfterMs);
      setRetryUntil(Date.now() + outcome.retryAfterMs);
    }
  }

  function run() {
    if (controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setRunning(true);
    setProgress(null);
    setResult(null);
    setRetryUntil(null);
    setRetryRemainingMs(0);
    const currentStdin = stdin ?? localStdin;
    runner
      .runCode(
        {
          language,
          source,
          cases: [info.isSql ? {} : { stdin: currentStdin }],
          ...(info.isSql && sqlSetup ? { sqlSetup } : {}),
        },
        {
          signal: controller.signal,
          onProgress: (event) => {
            if (controllerRef.current === controller && !controller.signal.aborted) setProgress(event);
          },
        },
      )
      .then(
        (outcome) => settle(controller, outcome),
        // The runner contract is to resolve; a rejection is a bug on its side, shown as a failed service.
        () => settle(controller, { status: 'unavailable', reason: 'service_error', cases: [] }),
      );
  }

  function stop() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setRunning(false);
    setProgress(null);
  }

  // A result belongs to the language it ran in: switching language drops it and aborts a run in flight.
  const previousLanguageRef = useRef(language);
  useEffect(() => {
    if (previousLanguageRef.current === language) return;
    previousLanguageRef.current = language;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setRunning(false);
    setProgress(null);
    setResult(null);
    setRetryUntil(null);
    setRetryRemainingMs(0);
  }, [language]);

  const waiting = retryRemainingMs > 0;
  const status = running ? progressText(progress, language, labels) : result && result.status !== 'unavailable' ? labels.status[finalStatus(result)] : '';
  const statusKind = running ? 'running' : result ? finalStatus(result) : undefined;

  return (
    <div className={styles.panel}>
      {info.engine === 'remote' && <p className={styles.notice}>{labels.remoteNotice}</p>}
      {showSqlSetup && info.isSql && sqlSetup && (
        <details className={styles.setup}>
          <summary>{labels.sqlSetup}</summary>
          <pre className={styles.setupCode}>{sqlSetup}</pre>
        </details>
      )}
      {showStdin && !info.isSql && (
        <label className={styles.stdin}>
          <span className={styles.stdinLabel}>{labels.stdin}</span>
          <textarea
            className={styles.stdinInput}
            rows={3}
            spellCheck={false}
            value={stdin ?? localStdin}
            onChange={(event) => {
              setLocalStdin(event.target.value);
              onStdinChange?.(event.target.value);
            }}
          />
        </label>
      )}
      <div className={styles.toolbar}>
        {running ? (
          <button type="button" className={styles.button} onClick={stop}>
            {labels.stop}
          </button>
        ) : (
          <button type="button" className={`${styles.button} ${styles.primary}`} onClick={run} disabled={waiting}>
            {labels.run}
          </button>
        )}
        <p className={styles.status} role="status" data-status={statusKind}>
          {status}
        </p>
      </div>
      {!running && result?.status === 'unavailable' && result.reason && (
        <div className={styles.unavailable}>
          <p role="alert" className={styles.unavailableMessage}>
            {labels.unavailable[result.reason]}
          </p>
          {result.reason === 'rate_limited' &&
            (waiting ? (
              <p className={styles.retry}>{labels.retryIn(Math.ceil(retryRemainingMs / 1000))}</p>
            ) : (
              <button type="button" className={styles.button} onClick={run}>
                {labels.retry}
              </button>
            ))}
        </div>
      )}
      {!running && result && result.status !== 'unavailable' && <OutputView result={result} labels={labels} />}
    </div>
  );
}
