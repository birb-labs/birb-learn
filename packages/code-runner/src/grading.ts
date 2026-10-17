// Deep imports: the content-schema barrel also exports the Drizzle queries,
// which would otherwise end up in every browser bundle that grades code.
import { isSqlLanguage, type CodeKind, type Language } from '@birb-learn/content-schema/src/code-languages';
import {
  parseLineRange,
  type CodeTaskPayloadData,
  type SqlTestData,
} from '@birb-learn/content-schema/src/code-payloads';
import { formatResultSets, normalizeOutput } from './output';
import type { RunResult, RunStatus, Runner, SqlResultSet } from './protocol';

export type CodeAnswer =
  | { kind: 'write'; code: string }
  | { kind: 'predict_output'; output: string }
  | { kind: 'fill_blank'; blanks: Record<number, string> }
  | { kind: 'find_bug'; line: number; code: string };

export interface TestOutcome {
  name?: string;
  passed: boolean;
  status: RunStatus;
  /** Display string: normalized stdout, or formatted result sets for SQL. */
  expected: string;
  /** Display string: normalized stdout, or formatted result sets for SQL. */
  actual: string;
}

export interface CodeGradeResult {
  verdict: 'correct' | 'incorrect' | 'not_graded';
  compileOutput?: string;
  tests: TestOutcome[];
  /** find_bug only. */
  lineCorrect?: boolean;
  /** fill_blank only. */
  blanksCorrect?: Record<number, boolean>;
}

type RunOptions = { signal?: AbortSignal };
type AnyTest = CodeTaskPayloadData['tests'][number];

const BLANK_MARKER_PATTERN = /___(\d+)___/g;

/** Joins prefix, code and suffix with newlines, skipping empty parts. */
export function composeSource(code: string, harness?: { prefix: string; suffix: string }): string {
  if (!harness) return code;
  return [harness.prefix, code, harness.suffix].filter((part) => part !== '').join('\n');
}

/** Replaces every `___n___` marker with the answer for blank n (missing answers become ''). */
export function substituteBlanks(code: string, blanks: Record<number, string>): string {
  return code.replace(BLANK_MARKER_PATTERN, (_marker, id: string) => blanks[Number(id)] ?? '');
}

/** Trims and collapses internal whitespace runs to a single space. */
export function normalizeBlankAnswer(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function rowKey(row: (string | null)[]): string {
  return JSON.stringify(row);
}

/**
 * Compares a result set against the expected one. Column names are compared
 * case-insensitively; rows are compared as a multiset unless `orderMatters`.
 */
export function resultSetMatches(
  actual: SqlResultSet | undefined,
  expected: SqlResultSet,
  orderMatters: boolean,
): boolean {
  if (!actual) return false;
  if (actual.columns.length !== expected.columns.length) return false;
  if (actual.rows.length !== expected.rows.length) return false;
  const columnsMatch = actual.columns.every(
    (column, index) => column.toLowerCase() === expected.columns[index]!.toLowerCase(),
  );
  if (!columnsMatch) return false;

  const actualKeys = actual.rows.map(rowKey);
  const expectedKeys = expected.rows.map(rowKey);
  if (!orderMatters) {
    actualKeys.sort();
    expectedKeys.sort();
  }
  return actualKeys.every((key, index) => key === expectedKeys[index]);
}

function isSqlTest(test: AnyTest): test is SqlTestData {
  return 'expectedRows' in test;
}

// An outcome for a test that never produced a result (compile error, missing case).
function failedOutcome(test: AnyTest, status: RunStatus): TestOutcome {
  const expected = isSqlTest(test) ? formatResultSets([test.expectedRows]) : normalizeOutput(test.expectedStdout);
  return { name: test.name, passed: false, status, expected, actual: '' };
}

async function runSqlTests(
  runner: Runner,
  language: Language,
  source: string,
  tests: AnyTest[],
  opts?: RunOptions,
): Promise<{ compileOutput?: string; unavailable: boolean; tests: TestOutcome[] }> {
  const outcomes: TestOutcome[] = [];
  let compileOutput: string | undefined;

  for (const test of tests) {
    if (!isSqlTest(test)) {
      outcomes.push(failedOutcome(test, 'runtime_error'));
      continue;
    }
    const run = await runner.runCode({ language, source, sqlSetup: test.sqlSetup }, opts);
    if (run.status === 'unavailable') return { unavailable: true, tests: outcomes };
    if (run.status === 'compile_error') {
      compileOutput ??= run.compileOutput;
      outcomes.push(failedOutcome(test, 'compile_error'));
      continue;
    }

    const caseResult = run.cases[0];
    if (!caseResult) {
      outcomes.push(failedOutcome(test, run.status));
      continue;
    }
    const resultSets = caseResult.sql?.resultSets ?? [];
    const lastSet = resultSets[resultSets.length - 1];
    outcomes.push({
      name: test.name,
      passed: caseResult.status === 'ok' && resultSetMatches(lastSet, test.expectedRows, test.orderMatters),
      status: caseResult.status,
      expected: formatResultSets([test.expectedRows]),
      actual: lastSet ? formatResultSets([lastSet]) : '',
    });
  }

  return { compileOutput, unavailable: false, tests: outcomes };
}

function outcomesFromRun(run: RunResult, tests: AnyTest[]): TestOutcome[] {
  return tests.map((test, index) => {
    if (isSqlTest(test)) return failedOutcome(test, 'runtime_error');
    const caseResult = run.cases[index];
    if (!caseResult) return failedOutcome(test, run.status);
    const expected = normalizeOutput(test.expectedStdout);
    const actual = normalizeOutput(caseResult.stdout);
    return {
      name: test.name,
      passed: caseResult.status === 'ok' && actual === expected,
      status: caseResult.status,
      expected,
      actual,
    };
  });
}

/**
 * Runs the tests against `source`. Non-SQL languages use a single run with one
 * case per test; SQL languages use one run per test (each has its own setup).
 */
export async function runTests(
  runner: Runner,
  language: Language,
  source: string,
  tests: CodeTaskPayloadData['tests'],
  opts?: RunOptions,
): Promise<{ compileOutput?: string; unavailable: boolean; tests: TestOutcome[] }> {
  if (isSqlLanguage(language)) return runSqlTests(runner, language, source, tests, opts);

  const cases = tests.map((test) => ({ stdin: isSqlTest(test) ? '' : test.stdin }));
  const run = await runner.runCode({ language, source, cases }, opts);
  if (run.status === 'unavailable') return { unavailable: true, tests: [] };
  if (run.status === 'compile_error') {
    return {
      compileOutput: run.compileOutput,
      unavailable: false,
      tests: tests.map((test) => failedOutcome(test, 'compile_error')),
    };
  }
  return { unavailable: false, tests: outcomesFromRun(run, tests) };
}

/**
 * A failed check that needs no run (a wrong blank, a wrong line) makes the answer
 * incorrect whatever the tests say, even when they could not run.
 */
function verdictFromTests(
  run: Awaited<ReturnType<typeof runTests>>,
  otherChecksPass: boolean,
): CodeGradeResult['verdict'] {
  if (!otherChecksPass) return 'incorrect';
  if (run.unavailable) return 'not_graded';
  const allPassed = run.tests.every((test) => test.passed);
  return otherChecksPass && allPassed ? 'correct' : 'incorrect';
}

/** Grades an answer to a code task. Throws when the answer kind does not match `kind`. */
export async function gradeCodeTask(
  kind: CodeKind,
  language: Language,
  payload: CodeTaskPayloadData,
  answer: CodeAnswer,
  runner: Runner,
  opts?: RunOptions,
): Promise<CodeGradeResult> {
  if (answer.kind !== kind) throw new Error('answer kind mismatch');

  switch (answer.kind) {
    case 'write': {
      const source = composeSource(answer.code, payload.harness);
      const run = await runTests(runner, language, source, payload.tests, opts);
      return { verdict: verdictFromTests(run, true), compileOutput: run.compileOutput, tests: run.tests };
    }

    case 'predict_output': {
      const matches = normalizeOutput(answer.output) === normalizeOutput(payload.expectedOutput ?? '');
      return { verdict: matches ? 'correct' : 'incorrect', tests: [] };
    }

    case 'fill_blank': {
      const blanksCorrect: Record<number, boolean> = {};
      for (const blank of payload.blanks) {
        const given = normalizeBlankAnswer(answer.blanks[blank.id] ?? '');
        blanksCorrect[blank.id] = blank.accepted.some((accepted) => normalizeBlankAnswer(accepted) === given);
      }
      const allBlanksCorrect = Object.values(blanksCorrect).every(Boolean);
      if (payload.tests.length === 0) {
        return { verdict: allBlanksCorrect ? 'correct' : 'incorrect', tests: [], blanksCorrect };
      }
      const source = composeSource(substituteBlanks(payload.starterCode, answer.blanks), payload.harness);
      const run = await runTests(runner, language, source, payload.tests, opts);
      return {
        verdict: verdictFromTests(run, allBlanksCorrect),
        compileOutput: run.compileOutput,
        tests: run.tests,
        blanksCorrect,
      };
    }

    case 'find_bug': {
      const { start, end } = parseLineRange(payload.bugLines!);
      const lineCorrect = answer.line >= start && answer.line <= end;
      if (payload.tests.length === 0) {
        return { verdict: lineCorrect ? 'correct' : 'incorrect', tests: [], lineCorrect };
      }
      const source = composeSource(answer.code, payload.harness);
      const run = await runTests(runner, language, source, payload.tests, opts);
      return {
        verdict: verdictFromTests(run, lineCorrect),
        compileOutput: run.compileOutput,
        tests: run.tests,
        lineCorrect,
      };
    }
  }
}
