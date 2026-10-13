import { afterAll, describe, expect, it } from 'vitest';
import { createNodeRunner } from '../node';

const runner = createNodeRunner();

afterAll(() => {
  runner.dispose();
});

describe('TypeScript engine (Node worker)', () => {
  it('type-checks, strips types and runs the program', async () => {
    const result = await runner.runCode({
      language: 'typescript',
      source: 'const n: number = Number(input()); console.log(n + 1)',
      cases: [{ stdin: '41' }],
    });
    expect(result.status).toBe('ok');
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: '42\n', stderr: '', exitCode: 0 });
  });

  it('reports type errors as compile_error with line, column and code', async () => {
    const result = await runner.runCode({ language: 'typescript', source: 'const s: string = 5;' });
    expect(result.status).toBe('compile_error');
    expect(result.compileOutput).toContain('main.ts:1:7');
    expect(result.compileOutput).toContain('TS2322');
    expect(result.compileOutput).toBe("main.ts:1:7 - error TS2322: Type 'number' is not assignable to type 'string'.");
  });

  it('reports syntax errors as compile_error', async () => {
    const result = await runner.runCode({ language: 'typescript', source: 'const = ;' });
    expect(result.status).toBe('compile_error');
    expect(result.compileOutput).toMatch(/^main\.ts:1:\d+ - error TS\d+: /);
  });

  it('prints one line per diagnostic', async () => {
    const result = await runner.runCode({
      language: 'typescript',
      source: 'const a: string = 1;\nconst b: boolean = "x";',
    });
    expect(result.status).toBe('compile_error');
    expect(result.compileOutput?.split('\n')).toHaveLength(2);
    expect(result.compileOutput).toContain('main.ts:2:7');
  });

  it('returns null from input() once stdin is exhausted', async () => {
    const result = await runner.runCode({
      language: 'typescript',
      source: [
        'const first: string | null = input();',
        'const second: string | null = input();',
        'console.log(first, second === null);',
      ].join('\n'),
      cases: [{ stdin: 'only line\n' }],
    });
    expect(result.status).toBe('ok');
    expect(result.cases[0].stdout).toBe('only line true\n');
  });

  it('round-trips non-ASCII stdin exactly', async () => {
    const text = 'Olá, ñ, ç, 🙂';
    const result = await runner.runCode({
      language: 'typescript',
      source: 'const line = input();\nconsole.log(line);',
      cases: [{ stdin: text }],
    });
    expect(result.status).toBe('ok');
    expect(result.cases[0].stdout).toBe(`${text}\n`);
  });

  it('allows top-level await', async () => {
    const result = await runner.runCode({
      language: 'typescript',
      source: 'const value: number = await Promise.resolve(7);\nconsole.log(value);',
    });
    expect(result.status).toBe('ok');
    expect(result.cases[0].stdout).toBe('7\n');
  });

  it('runs every case against the same compiled program', async () => {
    const result = await runner.runCode({
      language: 'typescript',
      source: 'const x: number = Number(input());\nconsole.log(x * x);',
      cases: [{ stdin: '3' }, { stdin: '4' }],
    });
    expect(result.status).toBe('ok');
    expect(result.cases.map((c) => c.stdout)).toEqual(['9\n', '16\n']);
  });

  it('reports thrown errors as runtime_error', async () => {
    const result = await runner.runCode({ language: 'typescript', source: "throw new Error('boom');" });
    expect(result.status).toBe('ok');
    expect(result.cases[0]).toMatchObject({ status: 'runtime_error', exitCode: 1, stderr: 'Error: boom\n' });
  });
});
