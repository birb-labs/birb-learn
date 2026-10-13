import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { createNodeRunner } from '../node';
import { fetchAsset } from '../runtime-assets';
import { nodeAssetUrl } from '../worker/node-env';
import { createTypeScriptEngine, fetchLibFiles } from './typescript';
import type { EngineEnv } from './types';

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

describe('TypeScript engine (empty and types-only programs)', () => {
  it.each([
    ['empty', ''],
    ['whitespace-only', ' '],
    ['comment-only', '// hi'],
    ['types-only', 'type A = number;'],
  ])('runs a %s program', async (_name, source) => {
    const result = await runner.runCode({ language: 'typescript', source });
    expect(result.status).toBe('ok');
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: '', stderr: '', exitCode: 0 });
  });

  it.each([
    ['a trailing line comment', 'console.log(1);\n// end'],
    ['a trailing block comment', 'console.log(1);\n/* end */\n'],
    ['leading and trailing comments around types', '/* a */\n\ntype A = 1;\n\n// b'],
  ])('runs a program with %s', async (_name, source) => {
    const result = await runner.runCode({ language: 'typescript', source });
    expect(result.status).toBe('ok');
    expect(result.cases[0]).toMatchObject({ status: 'ok', stderr: '', exitCode: 0 });
    expect(result.cases[0].stdout).toBe(source.includes('console.log') ? '1\n' : '');
  });

  it('rejects export statements with a clear compile_error', async () => {
    for (const source of ['export const x = 1;', 'const y = 2;\nexport { y };', 'export default 3;']) {
      const result = await runner.runCode({ language: 'typescript', source });
      expect(result.status).toBe('compile_error');
      expect(result.compileOutput).toMatch(/^main\.ts:\d+:1 - error: export statements are not supported in this lab$/m);
    }
  });
});

describe('TypeScript engine (browser lib loading)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // The browser environment, with the installed package standing in for the CDN.
  const env: EngineEnv = {
    assetLocation: nodeAssetUrl,
    readAsset: (pkg, path) => fetchAsset(nodeAssetUrl(pkg, path)),
  };

  /** A `fetch` serving the installed lib files, with optional per-file status overrides. */
  function stubFetch(overrides: Record<string, number> = {}) {
    const requested: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      const name = url.slice(url.lastIndexOf('/') + 1);
      requested.push(name);
      const status = overrides[name];
      if (status) return new Response('<html>error page</html>', { status });
      return new Response(await readFile(fileURLToPath(url), 'utf8'));
    });
    return requested;
  }

  it('fetches the lib files referenced from lib.es2022.d.ts', async () => {
    const requested = stubFetch();
    const engine = await createTypeScriptEngine(env);
    expect(requested).toEqual(expect.arrayContaining(['lib.es2022.d.ts', 'lib.es2022.string.d.ts', 'lib.es5.d.ts']));
    expect(requested.some((name) => name.startsWith('lib.dom'))).toBe(false);
    expect(new Set(requested).size).toBe(requested.length);
    expect(await engine.compile?.('const s: string = 5;')).toContain('TS2322');
    expect(await engine.compile?.('console.log("a".at(-1))')).toBeNull();
  });

  it.each([404, 429, 503])('rejects engine creation when a needed lib answers %i', async (status) => {
    stubFetch({ 'lib.es2022.string.d.ts': status });
    await expect(createTypeScriptEngine(env)).rejects.toThrow(`lib.es2022.string.d.ts: the server answered ${status}`);
  });

  it('collects the transitive references', async () => {
    const texts: Record<string, string> = {
      'lib.a.d.ts': '/// <reference lib="b" />\n/// <reference lib="c" />',
      'lib.b.d.ts': '/// <reference lib="c" />',
      'lib.c.d.ts': 'declare const c: 1;',
    };
    const fetched: string[] = [];
    const files = await fetchLibFiles('a', async (file) => {
      fetched.push(file);
      return texts[file];
    });
    expect([...files.keys()].sort()).toEqual(['/lib.a.d.ts', '/lib.b.d.ts', '/lib.c.d.ts']);
    expect(fetched.sort()).toEqual(['lib.a.d.ts', 'lib.b.d.ts', 'lib.c.d.ts']);
  });
});
