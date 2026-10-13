import type { CodeTaskPayloadData } from '@birb-learn/content-schema';
import { describe, expect, it } from 'vitest';
import {
  composeSource,
  gradeCodeTask,
  normalizeBlankAnswer,
  resultSetMatches,
  substituteBlanks,
} from './grading';
import type { CaseResult, RunRequest, RunResult, Runner, SqlResultSet } from './protocol';

function caseResult(overrides: Partial<CaseResult> = {}): CaseResult {
  return { status: 'ok', stdout: '', stderr: '', exitCode: 0, durationMs: 1, ...overrides };
}

function fakeRunner(handler: (req: RunRequest, callIndex: number) => RunResult) {
  const requests: RunRequest[] = [];
  const runner: Runner = {
    async runCode(req) {
      requests.push(req);
      return handler(req, requests.length - 1);
    },
  };
  return { runner, requests };
}

// Echoes each case's expected stdout (plus trailing whitespace) in request order.
function echoRunner(expectedStdouts: string[]) {
  return fakeRunner((req) => ({
    status: 'ok',
    cases: (req.cases ?? []).map((_, index) => caseResult({ stdout: `${expectedStdouts[index]}  \n` })),
  }));
}

function payload(overrides: Partial<CodeTaskPayloadData> = {}): CodeTaskPayloadData {
  return { starterCode: '', tests: [], blanks: [], hints: [], ...overrides };
}

const ioTests = [
  { name: 'one', stdin: '1\n', expectedStdout: 'a' },
  { name: 'two', stdin: '2\n', expectedStdout: 'b' },
];

describe('composeSource', () => {
  it('joins prefix, code and suffix with newlines only when non-empty', () => {
    expect(composeSource('CODE', { prefix: 'PRE', suffix: 'SUF' })).toBe('PRE\nCODE\nSUF');
    expect(composeSource('CODE', { prefix: '', suffix: 'SUF' })).toBe('CODE\nSUF');
    expect(composeSource('CODE', { prefix: 'PRE', suffix: '' })).toBe('PRE\nCODE');
    expect(composeSource('CODE')).toBe('CODE');
  });
});

describe('substituteBlanks', () => {
  it('replaces every marker and uses an empty string for missing answers', () => {
    expect(substituteBlanks('a = ___1___; b = ___2___; c = ___1___', { 1: 'x' })).toBe('a = x; b = ; c = x');
  });
});

describe('normalizeBlankAnswer', () => {
  it('trims and collapses whitespace runs', () => {
    expect(normalizeBlankAnswer('  x +  \t 1 \n')).toBe('x + 1');
  });
});

describe('resultSetMatches', () => {
  const expected: SqlResultSet = { columns: ['Id', 'Name'], rows: [['1', 'a'], ['2', 'b']] };

  it('compares column names case-insensitively', () => {
    expect(resultSetMatches({ columns: ['id', 'NAME'], rows: expected.rows }, expected, false)).toBe(true);
    expect(resultSetMatches({ columns: ['id', 'other'], rows: expected.rows }, expected, false)).toBe(false);
  });

  it('ignores row order by default and enforces it with orderMatters', () => {
    const reversed: SqlResultSet = { columns: expected.columns, rows: [['2', 'b'], ['1', 'a']] };
    expect(resultSetMatches(reversed, expected, false)).toBe(true);
    expect(resultSetMatches(reversed, expected, true)).toBe(false);
    expect(resultSetMatches(expected, expected, true)).toBe(true);
  });

  it('compares rows as multisets', () => {
    const a = { columns: ['x'], rows: [['a'], ['a'], ['b']] };
    const b = { columns: ['x'], rows: [['a'], ['b'], ['b']] };
    expect(resultSetMatches(a, b, false)).toBe(false);
  });

  it('distinguishes null from the string "null" and checks counts', () => {
    expect(resultSetMatches({ columns: ['x'], rows: [[null]] }, { columns: ['x'], rows: [['null']] }, false)).toBe(
      false,
    );
    expect(resultSetMatches({ columns: ['x'], rows: [['a']] }, { columns: ['x'], rows: [] }, false)).toBe(false);
    expect(resultSetMatches({ columns: ['x', 'y'], rows: [] }, { columns: ['x'], rows: [] }, false)).toBe(false);
  });

  it('is false for a missing actual result set', () => {
    expect(resultSetMatches(undefined, expected, false)).toBe(false);
  });
});

describe('gradeCodeTask: write', () => {
  it('passes when every case matches, with a single runCode call', async () => {
    const { runner, requests } = echoRunner(['a', 'b']);
    const result = await gradeCodeTask('write', 'python', payload({ tests: ioTests }), { kind: 'write', code: 'x' }, runner);
    expect(result.verdict).toBe('correct');
    expect(result.tests.map((t) => t.passed)).toEqual([true, true]);
    expect(requests).toHaveLength(1);
    expect(requests[0]!.cases).toEqual([{ stdin: '1\n' }, { stdin: '2\n' }]);
    expect(requests[0]!.language).toBe('python');
  });

  it('fails when a case differs and reports expected and actual', async () => {
    const { runner } = echoRunner(['a', 'WRONG']);
    const result = await gradeCodeTask('write', 'python', payload({ tests: ioTests }), { kind: 'write', code: 'x' }, runner);
    expect(result.verdict).toBe('incorrect');
    expect(result.tests[0]!.passed).toBe(true);
    expect(result.tests[1]).toMatchObject({ name: 'two', passed: false, status: 'ok', expected: 'b', actual: 'WRONG' });
  });

  it('fails a case whose status is not ok even if stdout matches', async () => {
    const { runner } = fakeRunner(() => ({
      status: 'ok',
      cases: [caseResult({ stdout: 'a' }), caseResult({ status: 'timeout', stdout: 'b' })],
    }));
    const result = await gradeCodeTask('write', 'python', payload({ tests: ioTests }), { kind: 'write', code: 'x' }, runner);
    expect(result.verdict).toBe('incorrect');
    expect(result.tests[1]).toMatchObject({ passed: false, status: 'timeout' });
  });

  it('wraps the code with the harness', async () => {
    const { runner, requests } = echoRunner(['a', 'b']);
    await gradeCodeTask(
      'write',
      'python',
      payload({ tests: ioTests, harness: { prefix: 'PRE', suffix: 'SUF' } }),
      { kind: 'write', code: 'CODE' },
      runner,
    );
    expect(requests[0]!.source).toBe('PRE\nCODE\nSUF');
  });

  it('is incorrect with compileOutput on a compile error', async () => {
    const { runner } = fakeRunner(() => ({ status: 'compile_error', compileOutput: 'boom', cases: [] }));
    const result = await gradeCodeTask('write', 'c', payload({ tests: ioTests }), { kind: 'write', code: 'x' }, runner);
    expect(result.verdict).toBe('incorrect');
    expect(result.compileOutput).toBe('boom');
    expect(result.tests.every((t) => !t.passed)).toBe(true);
  });

  it('is not_graded when the runner is unavailable', async () => {
    const { runner } = fakeRunner(() => ({ status: 'unavailable', cases: [] }));
    const result = await gradeCodeTask('write', 'python', payload({ tests: ioTests }), { kind: 'write', code: 'x' }, runner);
    expect(result.verdict).toBe('not_graded');
  });

  it('treats missing case results as failures', async () => {
    const { runner } = fakeRunner(() => ({ status: 'ok', cases: [caseResult({ stdout: 'a' })] }));
    const result = await gradeCodeTask('write', 'python', payload({ tests: ioTests }), { kind: 'write', code: 'x' }, runner);
    expect(result.verdict).toBe('incorrect');
    expect(result.tests[1]!.passed).toBe(false);
  });
});

describe('gradeCodeTask: predict_output', () => {
  it('compares normalized output without calling the runner', async () => {
    const { runner, requests } = fakeRunner(() => {
      throw new Error('runner must not be called');
    });
    const result = await gradeCodeTask(
      'predict_output',
      'python',
      payload({ expectedOutput: '1\n2' }),
      { kind: 'predict_output', output: '1\r\n2  \n' },
      runner,
    );
    expect(result.verdict).toBe('correct');
    expect(requests).toHaveLength(0);

    const wrong = await gradeCodeTask(
      'predict_output',
      'python',
      payload({ expectedOutput: '1\n2' }),
      { kind: 'predict_output', output: '1\n3' },
      runner,
    );
    expect(wrong.verdict).toBe('incorrect');
  });
});

describe('gradeCodeTask: fill_blank', () => {
  const blanks = [{ id: 1, accepted: ['x + 1', 'x+1'] }];

  it('grades blanks without tests', async () => {
    const { runner, requests } = fakeRunner(() => {
      throw new Error('runner must not be called');
    });
    const base = payload({ starterCode: 'y = ___1___', blanks });
    const right = await gradeCodeTask('fill_blank', 'python', base, { kind: 'fill_blank', blanks: { 1: '  x +  1 ' } }, runner);
    expect(right.verdict).toBe('correct');
    expect(right.blanksCorrect).toEqual({ 1: true });

    const wrong = await gradeCodeTask('fill_blank', 'python', base, { kind: 'fill_blank', blanks: { 1: 'x + 2' } }, runner);
    expect(wrong.verdict).toBe('incorrect');
    expect(wrong.blanksCorrect).toEqual({ 1: false });
    expect(requests).toHaveLength(0);
  });

  it('runs tests on the source with blanks substituted', async () => {
    const { runner, requests } = echoRunner(['a', 'b']);
    const result = await gradeCodeTask(
      'fill_blank',
      'python',
      payload({ starterCode: 'y = ___1___', blanks, tests: ioTests, harness: { prefix: 'PRE', suffix: '' } }),
      { kind: 'fill_blank', blanks: { 1: 'x+1' } },
      runner,
    );
    expect(result.verdict).toBe('correct');
    expect(requests[0]!.source).toBe('PRE\ny = x+1');
  });

  it('is incorrect when a blank is wrong even if tests pass', async () => {
    const { runner } = echoRunner(['a', 'b']);
    const result = await gradeCodeTask(
      'fill_blank',
      'python',
      payload({ starterCode: 'y = ___1___', blanks, tests: ioTests }),
      { kind: 'fill_blank', blanks: { 1: 'nope' } },
      runner,
    );
    expect(result.verdict).toBe('incorrect');
    expect(result.blanksCorrect).toEqual({ 1: false });
  });
});

describe('gradeCodeTask: find_bug', () => {
  const bugPayload = payload({ starterCode: 'a\nb\nc\nd', bugLines: '3-4', tests: ioTests });

  it('is correct for a line inside the range with passing tests', async () => {
    const { runner } = echoRunner(['a', 'b']);
    const result = await gradeCodeTask('find_bug', 'python', bugPayload, { kind: 'find_bug', line: 4, code: 'fixed' }, runner);
    expect(result.verdict).toBe('correct');
    expect(result.lineCorrect).toBe(true);
  });

  it('is incorrect for a line outside the range', async () => {
    const { runner, requests } = echoRunner(['a', 'b']);
    const result = await gradeCodeTask('find_bug', 'python', bugPayload, { kind: 'find_bug', line: 2, code: 'fixed' }, runner);
    expect(result.verdict).toBe('incorrect');
    expect(result.lineCorrect).toBe(false);
    expect(requests[0]!.source).toBe('fixed');
  });

  it('is incorrect when the line is right but tests fail', async () => {
    const { runner } = echoRunner(['a', 'WRONG']);
    const result = await gradeCodeTask('find_bug', 'python', bugPayload, { kind: 'find_bug', line: 3, code: 'fixed' }, runner);
    expect(result.verdict).toBe('incorrect');
    expect(result.lineCorrect).toBe(true);
  });

  it('grades the line alone when there are no tests', async () => {
    const { runner, requests } = fakeRunner(() => {
      throw new Error('runner must not be called');
    });
    const result = await gradeCodeTask(
      'find_bug',
      'python',
      payload({ starterCode: 'a\nb', bugLines: '2' }),
      { kind: 'find_bug', line: 2, code: 'x' },
      runner,
    );
    expect(result.verdict).toBe('correct');
    expect(requests).toHaveLength(0);
  });
});

describe('gradeCodeTask: SQL', () => {
  const sqlTests = [
    { name: 'first', sqlSetup: 'CREATE TABLE t1;', expectedRows: { columns: ['x'], rows: [['1']] }, orderMatters: false },
    { name: 'second', sqlSetup: 'CREATE TABLE t2;', expectedRows: { columns: ['x'], rows: [['2']] }, orderMatters: false },
  ];

  it('runs one call per test with that test setup and compares the last result set', async () => {
    const { runner, requests } = fakeRunner((req) => {
      const value = req.sqlSetup === 'CREATE TABLE t1;' ? '1' : '2';
      return {
        status: 'ok',
        cases: [
          caseResult({
            sql: {
              resultSets: [
                { columns: ['ignored'], rows: [['0']] },
                { columns: ['X'], rows: [[value]] },
              ],
            },
          }),
        ],
      };
    });
    const result = await gradeCodeTask('write', 'sqlite', payload({ tests: sqlTests }), { kind: 'write', code: 'SELECT 1' }, runner);
    expect(result.verdict).toBe('correct');
    expect(requests).toHaveLength(2);
    expect(requests.map((r) => r.sqlSetup)).toEqual(['CREATE TABLE t1;', 'CREATE TABLE t2;']);
    expect(requests.every((r) => r.source === 'SELECT 1' && r.language === 'sqlite')).toBe(true);
    expect(result.tests[0]).toMatchObject({ name: 'first', passed: true, expected: 'x\n1', actual: 'X\n1' });
  });

  it('is incorrect (and does not throw) when no result sets are returned', async () => {
    const { runner } = fakeRunner(() => ({ status: 'ok', cases: [caseResult({ sql: { resultSets: [] } })] }));
    const result = await gradeCodeTask('write', 'sqlite', payload({ tests: sqlTests }), { kind: 'write', code: 'x' }, runner);
    expect(result.verdict).toBe('incorrect');
    expect(result.tests.every((t) => !t.passed)).toBe(true);
  });

  it('is not_graded when the runner is unavailable', async () => {
    const { runner } = fakeRunner(() => ({ status: 'unavailable', cases: [] }));
    const result = await gradeCodeTask('write', 'sqlite', payload({ tests: sqlTests }), { kind: 'write', code: 'x' }, runner);
    expect(result.verdict).toBe('not_graded');
  });
});

describe('gradeCodeTask: validation', () => {
  it('throws on an answer kind mismatch', async () => {
    const { runner } = echoRunner([]);
    await expect(
      gradeCodeTask('write', 'python', payload(), { kind: 'predict_output', output: '' }, runner),
    ).rejects.toThrow('answer kind mismatch');
  });
});
