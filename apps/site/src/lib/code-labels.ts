import type { CodeTaskLabels, RunPanelLabels } from '@birb-learn/code-ui';

/** The part of next-intl's translator the labels need; it keeps this file free of message-key typing. */
export type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * Builds the code task view's labels from a translator scoped to the `code`
 * namespace (it needs `code.task`, `code.run` and `code.codeLabel`). Functions
 * included, so, like the run panel's, they are built where the view is rendered.
 */
export function buildCodeTaskLabels(t: Translate): CodeTaskLabels {
  return {
    run: buildRunPanelLabels((key, values) => t(`run.${key}`, values)),
    codeRegion: (language) => t('codeLabel', { language }),
    writeEditor: t('task.writeEditor'),
    fixEditor: t('task.fixEditor'),
    predictAnswer: t('task.predictAnswer'),
    chooseBugLine: t('task.chooseBugLine'),
    fixTheCode: t('task.fixTheCode'),
    blank: (n) => t('task.blank', { n }),
    line: (number, text) => t('task.line', { number, text }),
    emptyLine: (number) => t('task.emptyLine', { number }),
    check: t('task.check'),
    checking: t('task.checking'),
    verdict: {
      correct: t('task.verdict.correct'),
      incorrect: t('task.verdict.incorrect'),
      not_graded: t('task.verdict.not_graded'),
    },
    tests: t('task.tests'),
    testName: (n) => t('task.testName', { n }),
    testPassed: t('task.testPassed'),
    testFailed: t('task.testFailed'),
    expected: t('task.expected'),
    actual: t('task.actual'),
    blankCorrect: (n) => t('task.blankCorrect', { n }),
    blankIncorrect: (n) => t('task.blankIncorrect', { n }),
    lineCorrect: t('task.lineCorrect'),
    lineIncorrect: t('task.lineIncorrect'),
    hintTitle: (n) => t('task.hintTitle', { n }),
    showHint: (n, total) => t('task.showHint', { n, total }),
    showSolution: t('task.showSolution'),
    hideSolution: t('task.hideSolution'),
    solution: t('task.solution'),
    explanation: t('task.explanation'),
  };
}

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
