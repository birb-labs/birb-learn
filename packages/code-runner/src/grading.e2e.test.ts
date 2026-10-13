import type { CodeTaskPayloadData } from '@birb-learn/content-schema';
import { afterAll, describe, expect, it } from 'vitest';
import { gradeCodeTask } from './grading';
import { createNodeRunner } from './node';
import { createRunner } from './run-code';

// Grading through the real engines (Node workers), not a fake runner.
const runner = createNodeRunner();

afterAll(() => {
  runner.dispose();
});

function payload(overrides: Partial<CodeTaskPayloadData> = {}): CodeTaskPayloadData {
  return { starterCode: '', tests: [], blanks: [], hints: [], ...overrides };
}

describe('gradeCodeTask end to end', () => {
  it('grades a JavaScript write task test by test', async () => {
    const tests = [
      { name: 'doubles', stdin: '2\n', expectedStdout: '4\n' },
      { name: 'negative', stdin: '-3\n', expectedStdout: '6\n' },
    ];
    const code = 'const n = Number(input());\nconsole.log(n * 2);';
    const result = await gradeCodeTask('write', 'javascript', payload({ tests }), { kind: 'write', code }, runner);
    expect(result.verdict).toBe('incorrect');
    expect(result.tests).toEqual([
      { name: 'doubles', passed: true, status: 'ok', expected: '4', actual: '4' },
      { name: 'negative', passed: false, status: 'ok', expected: '6', actual: '-6' },
    ]);
  });

  it('grades a SQLite write task with differently cased columns and unordered rows as correct', async () => {
    const tests = [
      {
        name: 'names',
        sqlSetup: "CREATE TABLE people(id INTEGER, name TEXT); INSERT INTO people VALUES (1, 'Ana'), (2, 'Bia'), (3, NULL);",
        expectedRows: { columns: ['ID', 'Name'], rows: [['3', null], ['1', 'Ana'], ['2', 'Bia']] },
        orderMatters: false,
      },
    ];
    const code = 'SELECT id, name FROM people ORDER BY id;';
    const result = await gradeCodeTask('write', 'sqlite', payload({ tests }), { kind: 'write', code }, runner);
    expect(result.verdict).toBe('correct');
    expect(result.tests[0]).toMatchObject({ passed: true, status: 'ok', actual: 'id | name\n1 | Ana\n2 | Bia\n3 | NULL' });
  });

  it('grades a TypeScript compile error as incorrect with the compiler output', async () => {
    const tests = [{ name: 'echo', stdin: 'x\n', expectedStdout: 'x\n' }];
    const code = 'const line: number = input();\nconsole.log(line);';
    const result = await gradeCodeTask('write', 'typescript', payload({ tests }), { kind: 'write', code }, runner);
    expect(result.verdict).toBe('incorrect');
    expect(result.compileOutput).toMatch(/^main\.ts:1:7 - error TS2322: /);
    expect(result.tests).toEqual([{ name: 'echo', passed: false, status: 'compile_error', expected: 'x', actual: '' }]);
  });

  it('grades a PostgreSQL task over dates and timestamps as correct', async () => {
    const tests = [
      {
        name: 'events',
        sqlSetup: [
          'CREATE TABLE events(day date, at timestamp, at_utc timestamptz);',
          "INSERT INTO events VALUES ('2024-01-02', '2024-01-02 03:04:05', '2024-01-02 03:04:05+00');",
        ].join(' '),
        expectedRows: {
          columns: ['day', 'at', 'at_utc'],
          rows: [['2024-01-02', '2024-01-02 03:04:05', '2024-01-02 03:04:05+00']],
        },
        orderMatters: true,
      },
    ];
    const code = 'SELECT day, at, at_utc FROM events;';
    const result = await gradeCodeTask('write', 'postgresql', payload({ tests }), { kind: 'write', code }, runner);
    expect(result.tests[0]).toMatchObject({ passed: true, status: 'ok' });
    expect(result.verdict).toBe('correct');
  });

  it('grades a wrong blank as incorrect when the language runs remotely and no remote runner exists', async () => {
    const routed = createRunner({ browser: runner });
    const task = payload({
      starterCode: 'fn main() { println!("{}", ___1___); }',
      blanks: [{ id: 1, accepted: ['42'] }],
      tests: [{ name: 'answer', stdin: '', expectedStdout: '42\n' }],
    });
    const wrong = await gradeCodeTask('fill_blank', 'rust', task, { kind: 'fill_blank', blanks: { 1: '41' } }, routed);
    expect(wrong).toMatchObject({ verdict: 'incorrect', blanksCorrect: { 1: false }, tests: [] });
    const right = await gradeCodeTask('fill_blank', 'rust', task, { kind: 'fill_blank', blanks: { 1: '42' } }, routed);
    expect(right.verdict).toBe('not_graded');
  });
});
