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

/** Every string the code task view shows, on top of the run panel's; the caller supplies the translated text. */
export interface CodeTaskLabels {
  run: RunPanelLabels;
  /** Accessible name of a code region (read-only code); receives the language's display name. */
  codeRegion: (language: string) => string;
  /** Accessible name of the editor in a `write` task. */
  writeEditor: string;
  /** Accessible name of the editor in a `find_bug` task, where the student fixes the code. */
  fixEditor: string;
  /** Accessible name of the `predict_output` answer box. */
  predictAnswer: string;
  /** Instruction above the buggy code in a `find_bug` task. */
  chooseBugLine: string;
  /** Heading above the fix editor in a `find_bug` task. */
  fixTheCode: string;
  /** Accessible name of the gap numbered `n` in a `fill_blank` task. */
  blank: (n: number) => string;
  /** Accessible name of a line button: the line number and the line's own text. */
  line: (lineNumber: number, text: string) => string;
  /** Accessible name of the button of a line with no text. */
  emptyLine: (lineNumber: number) => string;
  check: string;
  checking: string;
  /** Progress of a check in flight: tests finished out of all tests. */
  testProgress: (done: number, total: number) => string;
  verdict: { correct: string; incorrect: string; not_graded: string };
  tests: string;
  /** Fallback name of an unnamed test; `n` is 1-based. */
  testName: (n: number) => string;
  testPassed: string;
  testFailed: string;
  expected: string;
  actual: string;
  blankCorrect: (n: number) => string;
  blankIncorrect: (n: number) => string;
  lineCorrect: string;
  lineIncorrect: string;
  /** Title of hint number `n`, once revealed. */
  hintTitle: (n: number) => string;
  /** The button that reveals hint `n` of `total`. */
  showHint: (n: number, total: number) => string;
  showSolution: string;
  hideSolution: string;
  solution: string;
  explanation: string;
}
