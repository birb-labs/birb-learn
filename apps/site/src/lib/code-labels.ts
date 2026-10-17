import type { RunPanelLabels } from '@birb-learn/code-ui';

/** The part of next-intl's translator the labels need; it keeps this file free of message-key typing. */
export type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * Builds the run panel's labels from a translator scoped to the `code.run`
 * namespace. The labels include functions, so they cannot cross from a Server
 * Component to a Client Component: build them where the panel is rendered.
 */
export function buildRunPanelLabels(t: Translate): RunPanelLabels {
  return {
    run: t('run'),
    stop: t('stop'),
    stdin: t('stdin'),
    sqlSetup: t('sqlSetup'),
    output: t('output'),
    stdout: t('stdout'),
    stderr: t('stderr'),
    compileError: t('compileError'),
    running: t('running'),
    loadingEngine: (language) => t('loadingEngine', { language }),
    caseProgress: (done, total) => t('caseProgress', { done, total }),
    status: {
      ok: t('status.ok'),
      compile_error: t('status.compile_error'),
      runtime_error: t('status.runtime_error'),
      timeout: t('status.timeout'),
      output_limit: t('status.output_limit'),
      unavailable: t('status.unavailable'),
    },
    unavailable: {
      read_only: t('unavailable.read_only'),
      rate_limited: t('unavailable.rate_limited'),
      offline: t('unavailable.offline'),
      service_error: t('unavailable.service_error'),
      engine_load: t('unavailable.engine_load'),
    },
    retryIn: (seconds) => t('retryIn', { seconds }),
    retry: t('retry'),
    rowsShown: (shown, total) => t('rowsShown', { shown, total }),
    remoteNotice: t('remoteNotice'),
    noOutput: t('noOutput'),
  };
}
