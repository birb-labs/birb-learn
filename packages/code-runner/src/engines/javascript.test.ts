import { describe, expect, it } from 'vitest';
import { createJavaScriptEngine } from './javascript';
import type { Engine, EngineCaseOutput } from './types';

const env = {
  isNode: true,
  assetUrl: () => {
    throw new Error('the JavaScript engine needs no assets');
  },
};

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
  it('formats console.log arguments like browsers', async () => {
    const { stdout, stderr, result } = await run("console.log('Olá', 1, {a:1})");
    expect(stdout).toBe('Olá 1 {"a":1}\n');
    expect(stderr).toBe('');
    expect(result).toEqual({ exitCode: 0 });
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
});
