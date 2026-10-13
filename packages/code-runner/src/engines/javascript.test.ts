import { describe, expect, it } from 'vitest';
import { createJavaScriptEngine } from './javascript';
import type { Engine, EngineCaseOutput, EngineEnv } from './types';

const noAssets = (): never => {
  throw new Error('the JavaScript engine needs no assets');
};

/** An environment whose unhandled rejections the test reports by hand. */
function createEnv() {
  let handler: (reason: unknown) => void = () => {};
  const env: EngineEnv = {
    assetLocation: noAssets,
    readAsset: noAssets,
    onUnhandledRejection: (h) => {
      handler = h;
    },
  };
  return { env, reject: (reason: unknown) => handler(reason) };
}

const { env } = createEnv();

async function run(source: string, stdin = '') {
  const engine: Engine = await createJavaScriptEngine(env);
  let stdout = '';
  let stderr = '';
  const result: EngineCaseOutput = await engine.runCase({ source, stdin }, (stream, chunk) => {
    if (stream === 'stdout') stdout += chunk;
    else stderr += chunk;
  });
  return { stdout, stderr, result };
}

describe('JavaScript engine', () => {
  it('formats console.log arguments like Node', async () => {
    const { stdout, stderr, result } = await run("console.log('Olá', 1, {a:1})");
    expect(stdout).toBe('Olá 1 { a: 1 }\n');
    expect(stderr).toBe('');
    expect(result).toEqual({ exitCode: 0 });
  });

  it('shows undefined, NaN, -0, bigints, maps, sets and cycles as Node does', async () => {
    const { stdout } = await run(
      [
        'console.log([1, undefined, NaN], new Map([[1,2]]), new Set([1]), {a: undefined}, -0, 10n);',
        'const o = { name: "o" }; o.self = o; console.log(o);',
        "console.log('%s scored %d%%', 'Ana', 97);",
      ].join('\n'),
    );
    expect(stdout).toBe(
      [
        '[ 1, undefined, NaN ] Map(1) { 1 => 2 } Set(1) { 1 } { a: undefined } -0 10n',
        "<ref *1> { name: 'o', self: [Circular *1] }",
        'Ana scored 97%',
        '',
      ].join('\n'),
    );
  });

  it('describes a thrown non-error value like Node', async () => {
    expect((await run("throw { code: 'E' }")).result).toEqual({ exitCode: 1, error: "Uncaught { code: 'E' }" });
    expect((await run("throw 'plain'")).result).toEqual({ exitCode: 1, error: 'Uncaught plain' });
  });

  it('sends console.error to stderr', async () => {
    const { stdout, stderr } = await run("console.error('x')");
    expect(stdout).toBe('');
    expect(stderr).toBe('x\n');
  });

  it('reads stdin lines with input() and returns null when exhausted', async () => {
    const { stdout } = await run('console.log(input()); console.log(input()); console.log(input() === null);', 'a\nb\n');
    expect(stdout).toBe('a\nb\ntrue\n');
  });

  it('reports a thrown error as a runtime error', async () => {
    const { result } = await run("throw new TypeError('bad')");
    expect(result).toEqual({ exitCode: 1, error: 'TypeError: bad' });
  });

  it('hides network globals', async () => {
    const { stdout } = await run('console.log(typeof fetch)');
    expect(stdout).toBe('undefined\n');
  });

  it('returns the syntax error from compile', async () => {
    const engine = await createJavaScriptEngine(env);
    const output = await engine.compile!('let = ;');
    expect(output).toMatch(/^SyntaxError/);
    expect(await engine.compile!("console.log('ok')")).toBeNull();
  });

  it('supports top-level await', async () => {
    const { stdout, result } = await run('const n = await Promise.resolve(1); console.log(n)');
    expect(stdout).toBe('1\n');
    expect(result).toEqual({ exitCode: 0 });
  });

  it('ends the running case with an unhandled rejection and ignores one between cases', async () => {
    const { env: own, reject } = createEnv();
    const engine = await createJavaScriptEngine(own);
    const pending = engine.runCase({ source: 'await new Promise((r) => setTimeout(r, 5000))', stdin: '' }, () => {});
    setTimeout(() => reject(new TypeError('lost')), 20);
    const started = performance.now();
    expect(await pending).toEqual({ exitCode: 1, error: 'Uncaught (in promise) TypeError: lost' });
    expect(performance.now() - started).toBeLessThan(1000);

    reject('between cases');
    const next = await engine.runCase({ source: 'console.log(1)', stdin: '' }, () => {});
    expect(next).toEqual({ exitCode: 0 });
  });
});
