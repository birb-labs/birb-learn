import { afterAll, describe, expect, it } from 'vitest';
import { BrowserRunner, type WorkerLike } from './browser-runner';
import { createNodeRunner } from './node';
import { OUTPUT_LIMIT_BYTES } from './protocol';
import type { HostMessage, WorkerMessage } from './worker/messages';

const runner = createNodeRunner();

afterAll(() => {
  runner.dispose();
});

describe('BrowserRunner with Node workers (JavaScript)', () => {
  it('runs hello world', async () => {
    const result = await runner.runCode({ language: 'javascript', source: "console.log('Hello, world!')" });
    expect(result.status).toBe('ok');
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: 'Hello, world!\n', stderr: '', exitCode: 0 });
    expect(result.cases[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('runs one case per stdin', async () => {
    const result = await runner.runCode({
      language: 'javascript',
      source: 'console.log(Number(input())*2)',
      cases: [{ stdin: '2' }, { stdin: '3' }],
    });
    expect(result.status).toBe('ok');
    expect(result.cases.map((c) => c.stdout)).toEqual(['4\n', '6\n']);
  });

  it('round-trips non-ASCII stdin exactly', async () => {
    const text = 'Olá, ñ, ç, 🙂';
    const result = await runner.runCode({
      language: 'javascript',
      source: 'console.log(input())',
      cases: [{ stdin: text }],
    });
    expect(result.cases[0].stdout).toBe(`${text}\n`);
  });

  it('reports a thrown error as runtime_error with the message on stderr', async () => {
    const result = await runner.runCode({ language: 'javascript', source: "throw new TypeError('bad')" });
    expect(result.status).toBe('ok');
    expect(result.cases[0]).toMatchObject({ status: 'runtime_error', exitCode: 1, stderr: 'TypeError: bad\n' });
  });

  it('times out an infinite loop and recovers on the next run', async () => {
    const started = performance.now();
    const result = await runner.runCode({ language: 'javascript', source: 'while(true){}', timeoutMs: 500 });
    expect(performance.now() - started).toBeLessThan(3000);
    expect(result.cases[0].status).toBe('timeout');
    expect(result.cases[0].exitCode).toBeNull();

    const next = await runner.runCode({ language: 'javascript', source: "console.log('again')" });
    expect(next.cases[0]).toMatchObject({ status: 'ok', stdout: 'again\n' });
  });

  it('keeps the partial output of a timed-out case', async () => {
    const result = await runner.runCode({
      language: 'javascript',
      source: "console.log('partial'); while(true){}",
      timeoutMs: 500,
    });
    expect(result.cases[0].status).toBe('timeout');
    expect(result.cases[0].stdout).toContain('partial');
  });

  it('kills a flooding program early with output_limit', async () => {
    const started = performance.now();
    const result = await runner.runCode({
      language: 'javascript',
      source: "while(true) console.log('x'.repeat(1000))",
    });
    expect(performance.now() - started).toBeLessThan(3000);
    expect(result.cases[0].status).toBe('output_limit');
    expect(new TextEncoder().encode(result.cases[0].stdout).length).toBeLessThanOrEqual(OUTPUT_LIMIT_BYTES);
  });

  it('returns compile_error without running any case', async () => {
    const result = await runner.runCode({ language: 'javascript', source: 'let = ;', cases: [{}, {}] });
    expect(result.status).toBe('compile_error');
    expect(result.cases).toEqual([]);
    expect(result.compileOutput).toMatch(/^SyntaxError/);
  });

  it('rejects with AbortError when aborted and recovers on the next run', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);
    await expect(
      runner.runCode({ language: 'javascript', source: 'while(true){}' }, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    const next = await runner.runCode({ language: 'javascript', source: "console.log('after abort')" });
    expect(next.cases[0]).toMatchObject({ status: 'ok', stdout: 'after abort\n' });
  });

  it('reports a worker crash as runtime_error and recovers on the next run', async () => {
    const result = await runner.runCode({
      language: 'javascript',
      source: "setTimeout(() => { throw new Error('late') }, 0); await new Promise((r) => setTimeout(r, 1000));",
    });
    expect(result.cases[0].status).toBe('runtime_error');
    expect(result.cases[0].stderr).toContain('late');

    const next = await runner.runCode({ language: 'javascript', source: "console.log('alive')" });
    expect(next.cases[0]).toMatchObject({ status: 'ok', stdout: 'alive\n' });
  });

  it('serializes concurrent runs of the same language', async () => {
    const [a, b] = await Promise.all([
      runner.runCode({ language: 'javascript', source: "console.log('a')" }),
      runner.runCode({ language: 'javascript', source: "console.log('b')" }),
    ]);
    expect(a.cases[0].stdout).toBe('a\n');
    expect(b.cases[0].stdout).toBe('b\n');
  });

  it('clamps the timeout to the maximum', { timeout: 20000 }, async () => {
    const result = await runner.runCode({
      language: 'javascript',
      source: "const end = Date.now() + 10500; while (Date.now() < end) {} console.log('finished')",
      timeoutMs: 999999,
    });
    expect(result.cases[0].status).toBe('timeout');
    expect(result.cases[0].stdout).toBe('');
  });
});

describe('BrowserRunner with a fake worker', () => {
  // A worker that answers every request with `reply(msg)`.
  function fakeRunner(reply: (msg: HostMessage) => WorkerMessage) {
    const stats = { spawned: 0, terminated: 0 };
    const spawn = (): WorkerLike => {
      stats.spawned += 1;
      let listener: (msg: WorkerMessage) => void = () => {};
      return {
        postMessage(msg) {
          queueMicrotask(() => listener(reply(msg)));
        },
        onMessage(cb) {
          listener = cb;
        },
        terminate() {
          stats.terminated += 1;
        },
      };
    };
    return { runner: new BrowserRunner(spawn), stats };
  }

  it('returns unavailable when the engine fails to load', async () => {
    const { runner: fake, stats } = fakeRunner((msg) => ({
      id: msg.id,
      type: 'failed',
      reason: 'engine_load',
      message: 'no engine',
    }));
    const result = await fake.runCode({ language: 'python', source: "print('hi')" });
    expect(result).toEqual({ status: 'unavailable', cases: [] });
    expect(stats.terminated).toBe(1);
    fake.dispose();
  });

  it('turns an internal failure during a case into runtime_error and respawns the worker', async () => {
    const { runner: fake, stats } = fakeRunner((msg) =>
      msg.type === 'compile'
        ? { id: msg.id, type: 'done', result: { compileOutput: null } }
        : { id: msg.id, type: 'failed', reason: 'internal', message: 'engine broke' },
    );
    const result = await fake.runCode({ language: 'python', source: 'x', cases: [{}, {}] });
    expect(result.status).toBe('ok');
    expect(result.cases.map((c) => [c.status, c.stderr, c.exitCode])).toEqual([
      ['runtime_error', 'engine broke\n', null],
      ['runtime_error', 'engine broke\n', null],
    ]);
    expect(stats).toEqual({ spawned: 2, terminated: 2 });
    fake.dispose();
  });
});
