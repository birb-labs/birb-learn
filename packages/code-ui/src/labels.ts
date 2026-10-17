// Type-only deep import: the code-runner barrel would pull the workers and engines into this graph.
import type { RunStatus, UnavailableReason } from '@birb-learn/code-runner/src/protocol';

/** Every string the run panel shows; the caller supplies the translated text (this package has no i18n). */
export interface RunPanelLabels {
  run: string;
  stop: string;
  stdin: string;
  sqlSetup: string;
  output: string;
  stdout: string;
  stderr: string;
  compileError: string;
  running: string;
  loadingEngine: (language: string) => string;
  caseProgress: (done: number, total: number) => string;
  status: Record<RunStatus, string>;
  unavailable: Record<UnavailableReason, string>;
  retryIn: (seconds: number) => string;
  retry: string;
  rowsShown: (shown: number, total: number) => string;
  remoteNotice: string;
  noOutput: string;
}
