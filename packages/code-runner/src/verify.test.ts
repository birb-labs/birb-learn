import type { CodeSnippetPayloadData, CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { describe, expect, it } from 'vitest';
import type { CaseResult, RunRequest, RunResult, Runner } from './protocol';
import { verifyCodeSnippet, verifyCodeTask } from './verify';

function caseResult(overrides: Partial<CaseResult> = {}): CaseResult {
  return { status: 'ok', stdout: '', stderr: '', exitCode: 0, durationMs: 1, ...overrides };
}

function fakeRunner(handler: (req: RunRequest) => RunResult) {
  const requests: RunRequest[] = [];
  const runner: Runner = {
    async runCode(req) {
      requests.push(req);
      return handler(req);
    },
  };
  return { runner, requests };
}

/** Answers every case with `stdout` chosen from the program source. */
function programs(stdoutOf: (source: string, stdin: string) => string) {
  return fakeRunner((req) => ({
    status: 'ok',
    cases: (req.cases ?? [{}]).map((c) => caseResult({ stdout: stdoutOf(req.source, c.stdin ?? '') })),
  }));
}

const unavailable = (reason: RunResult['reason'], extra: Partial<RunResult> = {}): RunResult => ({
  status: 'unavailable',
  reason,
  message: `fake ${reason}`,
  cases: [],
  ...extra,
});

function snippet(...variants: Partial<CodeSnippetPayloadData['variants'][number]>[]): CodeSnippetPayloadData {
  return {
    variants: variants.map((variant) => ({
      language: 'python',
      code: 'print(1)',
      annotations: [],
      walkthrough: [],
      runnable: false,
      ...variant,
    })),
  };
}

function task(overrides: Partial<CodeTaskPayloadData> = {}): CodeTaskPayloadData {
  return { starterCode: '', tests: [], blanks: [], hints: [], ...overrides };
}

const tests = [
  { name: 'doubles one', stdin: '1', expectedStdout: '2' },
  { stdin: '2', expectedStdout: '4' },
];

// The program prints the value its source says it prints.
const doubler = (source: string, stdin: string) => (source.includes('GOOD') ? String(Number(stdin) * 2) : '0');

describe('verifyCodeSnippet', () => {
  it('reports a runnable variant whose output differs from expectedOutput', async () => {
    const { runner } = programs(() => 'wrong\n');

    const report = await verifyCodeSnippet(snippet({ runnable: true, expectedOutput: 'right' }), runner);

    expect(report.notVerified).toEqual([]);
    expect(report.issues).toEqual([
      { path: 'variants[0]', severity: 'error', message: expect.stringContaining('right') },
    ]);
    expect(report.issues[0].message).toContain('wrong');
  });

  it('accepts matching output after normalization and runs only runnable variants', async () => {
    const { runner, requests } = programs(() => 'right  \n\n');

    const report = await verifyCodeSnippet(
      snippet(
        { language: 'c', runnable: false, expectedOutput: 'ignored' },
        { runnable: true, expectedOutput: 'right', stdin: 'in' },
      ),
      runner,
    );

    expect(report).toEqual({ issues: [], notVerified: [] });
    expect(requests).toEqual([{ language: 'python', source: 'print(1)', cases: [{ stdin: 'in' }] }]);
  });

  it('only requires status ok when no expectedOutput is set', async () => {
    const failing = fakeRunner(() => ({ status: 'ok', cases: [caseResult({ status: 'runtime_error', stderr: 'boom' })] }));
    const fine = programs(() => 'anything');

    expect((await verifyCodeSnippet(snippet({ runnable: true }), failing.runner)).issues).toEqual([
      { path: 'variants[0]', severity: 'error', message: expect.stringContaining('runtime_error') },
    ]);
    expect((await verifyCodeSnippet(snippet({ runnable: true }), fine.runner)).issues).toEqual([]);
  });

  it('reports a compile error with the compiler output at its variant', async () => {
    const { runner } = fakeRunner(() => ({ status: 'compile_error', compileOutput: 'expected ;', cases: [] }));

    const report = await verifyCodeSnippet(snippet({ language: 'c' }, { language: 'c', runnable: true }), runner);

    expect(report.issues).toEqual([
      { path: 'variants[1]', severity: 'error', message: expect.stringContaining('expected ;') },
    ]);
  });

  it('puts a runnable MySQL variant in notVerified without running it', async () => {
    const { runner, requests } = programs(() => '');

    const report = await verifyCodeSnippet(snippet({ language: 'python' }, { language: 'mysql', runnable: true }), runner);

    expect(report).toEqual({ issues: [], notVerified: ['variants[1]'] });
    expect(requests).toEqual([]);
  });

  it('passes sqlSetup through to the runner', async () => {
    const { runner, requests } = programs(() => 'x');

    await verifyCodeSnippet(snippet({ language: 'sqlite', runnable: true, sqlSetup: 'CREATE TABLE t(a);' }), runner);

    expect(requests[0]).toMatchObject({ language: 'sqlite', sqlSetup: 'CREATE TABLE t(a);' });
  });
});

describe('verifyCodeTask: runner outcomes', () => {
  it('turns rate_limited into a warning with the wait in seconds', async () => {
    const { runner } = fakeRunner(() => unavailable('rate_limited', { retryAfterMs: 12300 }));

    const snippetReport = await verifyCodeSnippet(snippet({ runnable: true }), runner);
    const taskReport = await verifyCodeTask('write', 'rust', task({ solution: 'GOOD', tests }), runner);

    expect(snippetReport.issues).toEqual([
      { path: 'variants[0]', severity: 'warning', message: 'rate limited, retry in 13s' },
    ]);
    expect(taskReport.issues).toEqual([{ path: 'solution', severity: 'warning', message: 'rate limited, retry in 13s' }]);
  });

  it('turns any other unavailable reason into an error naming it', async () => {
    const { runner } = fakeRunner(() => unavailable('offline'));

    const snippetReport = await verifyCodeSnippet(snippet({ language: 'go', runnable: true }), runner);
    const taskReport = await verifyCodeTask('write', 'go', task({ solution: 'GOOD', tests }), runner);

    for (const issues of [snippetReport.issues, taskReport.issues]) {
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('error');
      expect(issues[0].message).toContain('offline');
    }
  });
});

describe('verifyCodeTask: write', () => {
  it('accepts a solution that passes every test', async () => {
    const { runner, requests } = programs(doubler);

    const report = await verifyCodeTask('write', 'python', task({ solution: 'GOOD', tests }), runner);

    expect(report).toEqual({ issues: [], notVerified: [] });
    expect(requests).toHaveLength(1);
    expect(requests[0].cases).toEqual([{ stdin: '1' }, { stdin: '2' }]);
  });

  it('composes the harness around the solution', async () => {
    const { runner, requests } = programs(doubler);

    await verifyCodeTask(
      'write',
      'python',
      task({ solution: 'GOOD', tests, harness: { prefix: 'PRE', suffix: 'SUF' } }),
      runner,
    );

    expect(requests[0].source).toBe('PRE\nGOOD\nSUF');
  });

  it('names the failing test', async () => {
    const { runner } = programs((source, stdin) => (stdin === '2' ? '5' : doubler(source, stdin)));

    const report = await verifyCodeTask('write', 'python', task({ solution: 'GOOD', tests }), runner);

    expect(report.issues).toEqual([
      { path: 'solution', severity: 'error', message: expect.stringContaining('test #2') },
    ]);
    expect(report.issues[0].message).toMatch(/expected "4"/);
    expect(report.issues[0].message).toMatch(/got "5"/);
  });

  it('uses the test name when there is one', async () => {
    const { runner } = programs(() => '0');

    const report = await verifyCodeTask('write', 'python', task({ solution: 'BAD', tests }), runner);

    expect(report.issues.map((issue) => issue.message)).toEqual([
      expect.stringContaining('"doubles one"'),
      expect.stringContaining('test #2'),
    ]);
  });

  it('reports a compile error once instead of one issue per test', async () => {
    const { runner } = fakeRunner(() => ({ status: 'compile_error', compileOutput: 'syntax error', cases: [] }));

    const report = await verifyCodeTask('write', 'c', task({ solution: 'BAD', tests }), runner);

    expect(report.issues).toEqual([
      { path: 'solution', severity: 'error', message: expect.stringContaining('syntax error') },
    ]);
  });

  it('requires a solution', async () => {
    const { runner, requests } = programs(doubler);

    const report = await verifyCodeTask('write', 'python', task({ tests }), runner);

    expect(report.issues).toEqual([{ path: 'solution', severity: 'error', message: expect.stringContaining('required') }]);
    expect(requests).toEqual([]);
  });

  it('runs nothing when there are no tests', async () => {
    const { runner, requests } = programs(doubler);

    const report = await verifyCodeTask('write', 'python', task({ solution: 'GOOD' }), runner);

    expect(report).toEqual({ issues: [], notVerified: [] });
    expect(requests).toEqual([]);
  });

  it('runs SQL tests one by one with their setup', async () => {
    const { runner, requests } = fakeRunner(() => ({
      status: 'ok',
      cases: [caseResult({ sql: { resultSets: [{ columns: ['n'], rows: [['1']] }] } })],
    }));
    const sqlTests = [
      { name: 'one row', sqlSetup: 'SETUP1', expectedRows: { columns: ['n'], rows: [['1']] }, orderMatters: false },
      { name: 'two rows', sqlSetup: 'SETUP2', expectedRows: { columns: ['n'], rows: [['1'], ['2']] }, orderMatters: false },
    ];

    const report = await verifyCodeTask('write', 'sqlite', task({ solution: 'SELECT 1 AS n', tests: sqlTests }), runner);

    expect(requests.map((req) => req.sqlSetup)).toEqual(['SETUP1', 'SETUP2']);
    expect(report.issues).toEqual([
      { path: 'solution', severity: 'error', message: expect.stringContaining('"two rows"') },
    ]);
  });
});

describe('verifyCodeTask: fill_blank', () => {
  const fill = (overrides: Partial<CodeTaskPayloadData> = {}) =>
    task({
      starterCode: 'print(___1___)  # ___2___',
      solution: 'GOOD',
      tests,
      blanks: [
        { id: 1, accepted: ['GOOD', 'ALT'] },
        { id: 2, accepted: ['note'] },
      ],
      ...overrides,
    });

  it('accepts a solution and a starter filled with the first accepted answers that both pass', async () => {
    const { runner, requests } = programs(doubler);

    const report = await verifyCodeTask('fill_blank', 'python', fill(), runner);

    expect(report).toEqual({ issues: [], notVerified: [] });
    expect(requests.map((req) => req.source)).toEqual(['GOOD', 'print(GOOD)  # note']);
  });

  it('reports blanks whose first accepted answers do not make the starter pass', async () => {
    const { runner } = programs(doubler);

    const report = await verifyCodeTask(
      'fill_blank',
      'python',
      fill({ blanks: [{ id: 1, accepted: ['ALT'] }, { id: 2, accepted: ['note'] }] }),
      runner,
    );

    expect(report.issues).toEqual([
      { path: 'blanks', severity: 'error', message: expect.stringContaining('"doubles one"') },
      { path: 'blanks', severity: 'error', message: expect.stringContaining('test #2') },
    ]);
  });

  it('reports a failing solution without hiding the blanks check', async () => {
    const { runner, requests } = programs(doubler);

    const report = await verifyCodeTask('fill_blank', 'python', fill({ solution: 'BAD' }), runner);

    expect(report.issues.map((issue) => issue.path)).toEqual(['solution', 'solution']);
    expect(requests).toHaveLength(2);
  });
});

describe('verifyCodeTask: find_bug', () => {
  const bug = (overrides: Partial<CodeTaskPayloadData> = {}) =>
    task({ starterCode: 'BAD', solution: 'GOOD', bugLines: '1', tests, ...overrides });

  it('accepts a passing solution and a failing starter', async () => {
    const { runner } = programs(doubler);

    expect(await verifyCodeTask('find_bug', 'python', bug(), runner)).toEqual({ issues: [], notVerified: [] });
  });

  it('reports a starter that passes every test', async () => {
    const { runner } = programs(() => '2');
    const oneTest = [tests[0]];

    const report = await verifyCodeTask('find_bug', 'python', bug({ tests: oneTest }), runner);

    expect(report.issues).toEqual([{ path: 'starterCode', severity: 'error', message: 'starterCode passes all tests' }]);
  });

  it('does not run the starter when there are no tests', async () => {
    const { runner, requests } = programs(doubler);

    const report = await verifyCodeTask('find_bug', 'python', bug({ tests: [] }), runner);

    expect(report).toEqual({ issues: [], notVerified: [] });
    expect(requests).toEqual([]);
  });

  it('counts a starter that does not compile as failing', async () => {
    const { runner } = fakeRunner((req) =>
      req.source === 'BAD'
        ? { status: 'compile_error', compileOutput: 'nope', cases: [] }
        : { status: 'ok', cases: (req.cases ?? []).map((c) => caseResult({ stdout: String(Number(c.stdin) * 2) })) },
    );

    expect(await verifyCodeTask('find_bug', 'c', bug(), runner)).toEqual({ issues: [], notVerified: [] });
  });
});

describe('verifyCodeTask: predict_output', () => {
  const predict = (overrides: Partial<CodeTaskPayloadData> = {}) =>
    task({ starterCode: 'print("hi")', expectedOutput: 'hi', ...overrides });

  it('accepts output equal to expectedOutput after normalization', async () => {
    const { runner, requests } = programs(() => 'hi  \n');

    expect(await verifyCodeTask('predict_output', 'python', predict(), runner)).toEqual({ issues: [], notVerified: [] });
    expect(requests).toHaveLength(1);
  });

  it('reports a mismatch', async () => {
    const { runner } = programs(() => 'bye\n');

    const report = await verifyCodeTask('predict_output', 'python', predict(), runner);

    expect(report.issues).toEqual([
      { path: 'expectedOutput', severity: 'error', message: expect.stringContaining('bye') },
    ]);
  });

  it('reports a run that does not finish', async () => {
    const { runner } = fakeRunner(() => ({ status: 'ok', cases: [caseResult({ status: 'timeout' })] }));

    const report = await verifyCodeTask('predict_output', 'python', predict(), runner);

    expect(report.issues).toEqual([
      { path: 'starterCode', severity: 'error', message: expect.stringContaining('timeout') },
    ]);
  });

  it('puts a MySQL predict_output in notVerified without running it', async () => {
    const { runner, requests } = programs(() => '');

    const report = await verifyCodeTask('predict_output', 'mysql', predict({ starterCode: 'SELECT 1;' }), runner);

    expect(report).toEqual({ issues: [], notVerified: ['expectedOutput'] });
    expect(requests).toEqual([]);
  });
});
