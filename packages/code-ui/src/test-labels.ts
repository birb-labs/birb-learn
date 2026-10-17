import type { RunPanelLabels } from './labels';

/** Distinct English labels for the component tests. */
export const TEST_LABELS: RunPanelLabels = {
  run: 'Run',
  stop: 'Stop',
  stdin: 'Input',
  sqlSetup: 'Setup',
  output: 'Output',
  stdout: 'Standard output',
  stderr: 'Standard error',
  compileError: 'Compile error',
  running: 'Running...',
  loadingEngine: (language) => `Loading ${language}...`,
  caseProgress: (done, total) => `Case ${done} of ${total}`,
  status: {
    ok: 'Finished',
    compile_error: 'Did not compile',
    runtime_error: 'Crashed',
    timeout: 'Timed out',
    output_limit: 'Too much output',
    unavailable: 'Unavailable',
  },
  unavailable: {
    read_only: 'This language cannot run here',
    rate_limited: 'Too many runs',
    offline: 'You are offline',
    service_error: 'The runner failed',
    engine_load: 'The engine did not load',
  },
  retryIn: (seconds) => `Retry in ${seconds}s`,
  retry: 'Try again',
  rowsShown: (shown, total) => `Showing ${shown} of ${total} rows`,
  remoteNotice: 'Runs on a remote server',
  noOutput: 'No output',
};
