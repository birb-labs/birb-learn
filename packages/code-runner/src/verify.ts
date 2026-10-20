// Deep imports: the content-schema barrel also exports the Drizzle queries,
// which would otherwise end up in every browser bundle that verifies code.
import type { CodeKind, Language } from '@birb-learn/content-schema/src/code-languages';
import type { CodeSnippetPayloadData, CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { composeSource, runTests, substituteBlanks, type TestOutcome } from './grading';
import { normalizeOutput } from './output';
import type { RunRequest, RunResult, Runner } from './protocol';

// Checks that authored code does what its payload claims. Shared by the admin
// SPA ("Verify" button) and `content:validate`, so it must stay browser-safe.

export interface VerifyIssue {
  /** Where in the payload: `variants[1]`, `solution`, `starterCode`, `blanks`, `expectedOutput`. */
  path: string;
  /** English developer message. */
  message: string;
  /** A warning does not mean the code is wrong (the runner could not say). */
  severity: 'error' | 'warning';
}

export interface VerifyReport {
  issues: VerifyIssue[];
  /** Paths whose code could not be executed at all (MySQL is read-only). */
  notVerified: string[];
}

interface VerifyOptions {
  signal?: AbortSignal;
}

type TestRun = Awaited<ReturnType<typeof runTests>>;

const SHOWN_CHARS = 120;
const DETAIL_CHARS = 500;

/** `text` as a quoted, single-line string of bounded length. */
function quoted(text: string): string {
  const shown = text.length > SHOWN_CHARS ? `${text.slice(0, SHOWN_CHARS)}...` : text;
  return JSON.stringify(shown);
}

/** Compiler output or stderr, trimmed and bounded, ready to append to a message. */
function detail(label: string, text: string | undefined): string {
  const trimmed = text?.trim() ?? '';
  if (trimmed === '') return '';
  const shown = trimmed.length > DETAIL_CHARS ? `${trimmed.slice(0, DETAIL_CHARS)}...` : trimmed;
  return `\n${label}: ${shown}`;
}

function unavailableIssue(path: string, run: RunResult): VerifyIssue {
  if (run.reason === 'rate_limited') {
    const message =
      run.retryAfterMs === undefined
        ? 'rate limited, retry later'
        : `rate limited, retry in ${Math.ceil(run.retryAfterMs / 1000)}s`;
    return { path, severity: 'warning', message };
  }
  const reason = run.reason ?? 'unknown';
  const cause = run.message ? `: ${run.message}` : '';
  return { path, severity: 'error', message: `runner unavailable (${reason})${cause}` };
}

/**
 * Wraps a runner to remember why its last run was `unavailable`: `runTests`
 * only reports that it was, and the issue has to say why.
 */
function trackUnavailable(runner: Runner): { runner: Runner; lastUnavailable: () => RunResult | undefined } {
  let last: RunResult | undefined;
  return {
    lastUnavailable: () => last,
    runner: {
      async runCode(req, opts) {
        const run = await runner.runCode(req, opts);
        if (run.status === 'unavailable') last = run;
        return run;
      },
    },
  };
}

function testLabel(test: TestOutcome, index: number): string {
  return test.name ? quoted(test.name) : `#${index + 1}`;
}

/** One issue per failed test, or a single one when the code did not compile. */
function failureIssues(path: string, subject: string, run: TestRun): VerifyIssue[] {
  if (run.compileOutput !== undefined) {
    const message = `${subject} does not compile${detail('compiler output', run.compileOutput)}`;
    return [{ path, severity: 'error', message }];
  }
  return run.tests.flatMap((test, index): VerifyIssue[] => {
    if (test.passed) return [];
    const status = test.status === 'ok' ? '' : ` (${test.status})`;
    const message = `${subject} fails test ${testLabel(test, index)}: expected ${quoted(test.expected)}, got ${quoted(test.actual)}${status}${detail('stderr', test.stderr)}`;
    return [{ path, severity: 'error', message }];
  });
}

/**
 * Runs the tests against `source`. Returns `undefined` after reporting an
 * unavailable runner (the checks that follow would hit the same wall).
 */
async function runChecked(
  tracked: ReturnType<typeof trackUnavailable>,
  report: VerifyReport,
  path: string,
  language: Language,
  source: string,
  tests: CodeTaskPayloadData['tests'],
  opts?: VerifyOptions,
): Promise<TestRun | undefined> {
  const run = await runTests(tracked.runner, language, source, tests, opts);
  if (!run.unavailable) return run;
  const cause = tracked.lastUnavailable();
  report.issues.push(
    cause ? unavailableIssue(path, cause) : { path, severity: 'error', message: 'runner unavailable' },
  );
  return undefined;
}

/**
 * Runs every `runnable` variant of a snippet: the run must be `ok`, and its
 * output must equal `expectedOutput` when one is set. MySQL variants are only
 * reported in `notVerified`.
 */
export async function verifyCodeSnippet(
  payload: CodeSnippetPayloadData,
  runner: Runner,
  opts: VerifyOptions = {},
): Promise<VerifyReport> {
  const report: VerifyReport = { issues: [], notVerified: [] };

  for (const [index, variant] of payload.variants.entries()) {
    const path = `variants[${index}]`;
    if (variant.language === 'mysql') {
      if (variant.runnable || variant.expectedOutput !== undefined) report.notVerified.push(path);
      continue;
    }
    if (!variant.runnable) continue;

    const request: RunRequest = {
      language: variant.language,
      source: variant.code,
      cases: [variant.stdin === undefined ? {} : { stdin: variant.stdin }],
      ...(variant.sqlSetup === undefined ? {} : { sqlSetup: variant.sqlSetup }),
    };
    const run = await runner.runCode(request, opts);

    if (run.status === 'unavailable') {
      report.issues.push(unavailableIssue(path, run));
    } else if (run.status === 'compile_error') {
      const message = `does not compile${detail('compiler output', run.compileOutput)}`;
      report.issues.push({ path, severity: 'error', message });
    } else {
      const result = run.cases[0];
      if (!result || result.status !== 'ok') {
        const message = `run ended with ${result?.status ?? run.status}${detail('stderr', result?.stderr)}`;
        report.issues.push({ path, severity: 'error', message });
      } else if (variant.expectedOutput !== undefined) {
        const expected = normalizeOutput(variant.expectedOutput);
        const actual = normalizeOutput(result.stdout);
        if (actual !== expected) {
          report.issues.push({
            path,
            severity: 'error',
            message: `output differs from expectedOutput: expected ${quoted(expected)}, got ${quoted(actual)}${detail('stderr', result.stderr)}`,
          });
        }
      }
    }
  }

  return report;
}

/**
 * Checks a code task of the given kind (spec §11.3):
 * - `write`, `fill_blank`, `find_bug`: the `solution` passes every test;
 * - `fill_blank`: so does the starter filled with the first accepted answer of each blank;
 * - `find_bug`: the `starterCode` fails at least one test (when there are tests);
 * - `predict_output`: running `starterCode` prints `expectedOutput`.
 * MySQL `predict_output` is only reported in `notVerified`.
 */
export async function verifyCodeTask(
  kind: CodeKind,
  language: Language,
  payload: CodeTaskPayloadData,
  runner: Runner,
  opts: VerifyOptions = {},
): Promise<VerifyReport> {
  const report: VerifyReport = { issues: [], notVerified: [] };
  const tracked = trackUnavailable(runner);

  if (kind === 'predict_output') {
    await verifyPredictOutput(tracked, report, language, payload, opts);
    return report;
  }

  if (payload.solution === undefined) {
    report.issues.push({ path: 'solution', severity: 'error', message: 'solution is required' });
    return report;
  }
  if (payload.tests.length === 0) {
    report.notVerified.push('tests: no tests, solution not run');
    return report;
  }

  const solutionSource = composeSource(payload.solution, payload.harness);
  const solutionRun = await runChecked(tracked, report, 'solution', language, solutionSource, payload.tests, opts);
  if (!solutionRun) return report;
  report.issues.push(...failureIssues('solution', 'solution', solutionRun));

  if (kind === 'fill_blank') {
    // What a student who gives the first accepted answer of each blank submits.
    const blanks = Object.fromEntries(payload.blanks.map((blank) => [blank.id, blank.accepted[0] ?? '']));
    const source = composeSource(substituteBlanks(payload.starterCode, blanks), payload.harness);
    const run = await runChecked(tracked, report, 'blanks', language, source, payload.tests, opts);
    if (run) report.issues.push(...failureIssues('blanks', 'starterCode with the first accepted answers', run));
  }

  if (kind === 'find_bug') {
    const source = composeSource(payload.starterCode, payload.harness);
    const run = await runChecked(tracked, report, 'starterCode', language, source, payload.tests, opts);
    if (run && run.tests.every((test) => test.passed)) {
      report.issues.push({ path: 'starterCode', severity: 'error', message: 'starterCode passes all tests' });
    }
  }

  return report;
}

async function verifyPredictOutput(
  tracked: ReturnType<typeof trackUnavailable>,
  report: VerifyReport,
  language: Language,
  payload: CodeTaskPayloadData,
  opts: VerifyOptions,
): Promise<void> {
  if (language === 'mysql') {
    report.notVerified.push('expectedOutput');
    return;
  }
  if (payload.expectedOutput === undefined) {
    report.issues.push({ path: 'expectedOutput', severity: 'error', message: 'expectedOutput is required' });
    return;
  }

  // Exactly what the student sees: a harness is for tests, a predict_output has none.
  const run = await tracked.runner.runCode({ language, source: payload.starterCode, cases: [{}] }, opts);
  if (run.status === 'unavailable') {
    report.issues.push(unavailableIssue('starterCode', run));
  } else if (run.status === 'compile_error') {
    const message = `starterCode does not compile${detail('compiler output', run.compileOutput)}`;
    report.issues.push({ path: 'starterCode', severity: 'error', message });
  } else {
    const result = run.cases[0];
    if (!result || result.status !== 'ok') {
      report.issues.push({
        path: 'starterCode',
        severity: 'error',
        message: `starterCode run ended with ${result?.status ?? run.status}${detail('stderr', result?.stderr)}`,
      });
      return;
    }
    const expected = normalizeOutput(payload.expectedOutput);
    const actual = normalizeOutput(result.stdout);
    if (actual !== expected) {
      report.issues.push({
        path: 'expectedOutput',
        severity: 'error',
        message: `starterCode prints ${quoted(actual)}, not the expectedOutput ${quoted(expected)}${detail('stderr', result.stderr)}`,
      });
    }
  }
}
