import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language } from '@birb-learn/content-schema';
import { BrowserRunner, type WorkerLike } from './browser-runner';
import { createNodeRunner, spawnNodeWorker } from './node';
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
    // The worker's own `setTimeout` is not the program's tracked one: its exception crashes the worker.
    const result = await runner.runCode({
      language: 'javascript',
      source:
        "globalThis.setTimeout(() => { throw new Error('late') }, 0); await new Promise((r) => setTimeout(r, 1000));",
    });
    expect(result.cases[0].status).toBe('runtime_error');
    expect(result.cases[0].stderr).toContain('late');

    const next = await runner.runCode({ language: 'javascript', source: "console.log('alive')" });
    expect(next.cases[0]).toMatchObject({ status: 'ok', stdout: 'alive\n' });
  });

  it('drops a worker that crashes while idle, so the next run is ok and fast', async () => {
    const result = await runner.runCode({
      language: 'javascript',
      source: "globalThis.setTimeout(() => { throw new Error('late') }, 50)",
    });
    expect(result.cases[0].status).toBe('ok');
    await new Promise((resolve) => setTimeout(resolve, 300));

    const started = performance.now();
    const next = await runner.runCode({ language: 'javascript', source: "console.log('fresh')" });
    expect(performance.now() - started).toBeLessThan(3000);
    expect(next.status).toBe('ok');
    expect(next.cases[0]).toMatchObject({ status: 'ok', stdout: 'fresh\n' });
  });

  it('settles a run promptly on dispose and spawns nothing afterwards', async () => {
    let spawned = 0;
    const own = new BrowserRunner((language: Language) => {
      spawned += 1;
      return spawnNodeWorker(language);
    });
    const run = own.runCode({ language: 'javascript', source: 'while(true){}', cases: [{}, {}], timeoutMs: 1000 });
    const outcome = run.then(
      () => 'resolved',
      (error: unknown) => (error instanceof Error || error instanceof DOMException ? error.name : 'other'),
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
    const disposedAt = performance.now();
    own.dispose();
    expect(await outcome).toBe('AbortError');
    expect(performance.now() - disposedAt).toBeLessThan(100);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(spawned).toBe(1);
    await expect(own.runCode({ language: 'javascript', source: '1' })).rejects.toMatchObject({ name: 'AbortError' });
    expect(spawned).toBe(1);
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

describe('BrowserRunner with Node workers (JavaScript asynchronous work)', () => {
  function runJs(source: string, extra: { cases?: { stdin?: string }[]; timeoutMs?: number } = {}) {
    return runner.runCode({ language: 'javascript', source, ...extra });
  }

  it('waits for setTimeout callbacks before ending the case', async () => {
    const result = await runJs("setTimeout(() => console.log('later'), 20); console.log('now')");
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: 'now\nlater\n', stderr: '', exitCode: 0 });
  });

  it('runs nested promise chains to completion', async () => {
    const result = await runJs(
      'Promise.resolve(1).then((x) => x + 1).then((x) => Promise.resolve(x * 10)).then((x) => console.log(x));',
    );
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: '20\n' });
  });

  it('keeps the output of an un-awaited async main', async () => {
    const result = await runJs(
      "async function main() { await new Promise((r) => setTimeout(r, 20)); console.log('done'); }\nmain();",
    );
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: 'done\n' });
  });

  it('reports an unhandled rejection as runtime_error', async () => {
    const result = await runJs("console.log('before'); Promise.reject(new TypeError('nope'));");
    expect(result.cases[0]).toMatchObject({
      status: 'runtime_error',
      stdout: 'before\n',
      stderr: 'Uncaught (in promise) TypeError: nope\n',
      exitCode: 1,
    });
    const main = await runJs("async function main() { throw new Error('boom'); }\nmain();");
    expect(main.cases[0]).toMatchObject({ status: 'runtime_error', stderr: 'Uncaught (in promise) Error: boom\n' });
  });

  it('reports an exception thrown by a timer callback as runtime_error', async () => {
    const result = await runJs(
      "setTimeout(() => { throw new RangeError('tick'); }, 5); setTimeout(() => console.log('never'), 50);",
    );
    expect(result.cases[0]).toMatchObject({ status: 'runtime_error', stdout: '', stderr: 'RangeError: tick\n' });
  });

  it('cancels timers with clearTimeout and clearInterval', async () => {
    const result = await runJs(
      [
        "const t = setTimeout(() => console.log('cancelled'), 10);",
        'clearTimeout(t);',
        'let n = 0;',
        'const i = setInterval(() => { n += 1; if (n === 3) { clearInterval(i); console.log(n); } }, 5);',
        "queueMicrotask(() => console.log('micro'));",
      ].join('\n'),
    );
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: 'micro\n3\n' });
  });

  it('times out an endless setInterval and recovers on the next run', async () => {
    const result = await runJs("setInterval(() => {}, 10); console.log('started')", { timeoutMs: 500 });
    expect(result.cases[0]).toMatchObject({ status: 'timeout', stdout: 'started\n', exitCode: null });

    const next = await runJs("console.log('again')");
    expect(next.cases[0]).toMatchObject({ status: 'ok', stdout: 'again\n' });
  });

  it('never lets a timer of a finished case print into the next case', async () => {
    // Case 1 fails while its timer is pending; case 2 outlives that timer's delay
    // and lists (through a worker global) every timer that fired meanwhile.
    const result = await runJs(
      [
        'const n = input();',
        'setTimeout(() => { (globalThis.fired ??= []).push(n); console.log(`late ${n}`); }, 100);',
        "if (n === '1') throw new Error('fail');",
        'await new Promise((r) => setTimeout(r, 300));',
        "console.log(globalThis.fired.join(','));",
      ].join('\n'),
      { cases: [{ stdin: '1' }, { stdin: '2' }] },
    );
    expect(result.cases.map((c) => [c.status, c.stdout])).toEqual([
      ['runtime_error', ''],
      ['ok', 'late 2\n2\n'],
    ]);
  });
});

type Send = (msg: WorkerMessage) => void;

// A fake worker driven by `script`; `worker` is the 1-based spawn count.
function scriptedRunner(script: (msg: HostMessage, send: Send, worker: number) => void) {
  const stats = { spawned: 0, terminated: 0 };
  const spawn = (): WorkerLike => {
    const worker = ++stats.spawned;
    let listener: Send = () => {};
    const send: Send = (msg) => queueMicrotask(() => listener(msg));
    return {
      postMessage(msg) {
        script(msg, send, worker);
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

// A fake worker that answers every request with `reply(msg)`.
function fakeRunner(reply: (msg: HostMessage) => WorkerMessage) {
  return scriptedRunner((msg, send) => send(reply(msg)));
}

describe('BrowserRunner with a fake worker', () => {
  it('returns unavailable when the engine fails to load', async () => {
    const { runner: fake, stats } = fakeRunner((msg) => ({
      id: msg.id,
      type: 'failed',
      reason: 'engine_load',
      message: 'no engine',
    }));
    const result = await fake.runCode({ language: 'python', source: "print('hi')" });
    expect(result).toEqual({ status: 'unavailable', reason: 'engine_load', message: 'no engine', cases: [] });
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

describe('BrowserRunner engine load budget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function track<T>(promise: Promise<T>) {
    const state: { settled: boolean; value?: T } = { settled: false };
    void promise.then((value) => {
      state.settled = true;
      state.value = value;
    });
    return state;
  }

  // The engine is ready `readyAfterMs` after the compile request (never when
  // null), then compiling takes `compileMs`. Cases answer immediately.
  function slowEngine(readyAfterMs: number | null, compileMs: number) {
    return scriptedRunner((msg, send) => {
      if (msg.type === 'compile') {
        if (readyAfterMs === null) return;
        setTimeout(() => send({ id: msg.id, type: 'engine_ready' }), readyAfterMs);
        setTimeout(() => send({ id: msg.id, type: 'done', result: { compileOutput: null } }), readyAfterMs + compileMs);
      } else {
        send({ id: msg.id, type: 'engine_ready' });
        send({ id: msg.id, type: 'output', stream: 'stdout', chunk: 'hi\n' });
        send({ id: msg.id, type: 'done', result: { exitCode: 0 } });
      }
    });
  }

  it('does not kill a slow engine load at the compile timeout', async () => {
    const { runner: fake, stats } = slowEngine(30000, 15000);
    const result = track(fake.runCode({ language: 'python', source: 'x' }));
    await vi.advanceTimersByTimeAsync(45000);
    expect(result.settled).toBe(true);
    expect(result.value?.status).toBe('ok');
    expect(result.value?.cases[0].stdout).toBe('hi\n');
    expect(stats.terminated).toBe(0);
    fake.dispose();
  });

  it('counts the compile timeout from engine_ready', async () => {
    const { runner: fake, stats } = slowEngine(30000, 21000);
    const result = track(fake.runCode({ language: 'python', source: 'x' }));
    await vi.advanceTimersByTimeAsync(49999);
    expect(result.settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(result.value).toEqual({
      status: 'unavailable',
      reason: 'engine_load',
      message: 'Engine compile timed out',
      cases: [],
    });
    expect(stats.terminated).toBe(1);
    fake.dispose();
  });

  it('returns unavailable when the engine never loads within the load budget', async () => {
    const { runner: fake, stats } = slowEngine(null, 0);
    const result = track(fake.runCode({ language: 'python', source: 'x' }));
    await vi.advanceTimersByTimeAsync(119999);
    expect(result.settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(result.value).toEqual({
      status: 'unavailable',
      reason: 'engine_load',
      message: 'Engine load timed out',
      cases: [],
    });
    expect(stats.terminated).toBe(1);
    fake.dispose();
  });

  it('gives a respawned worker the load budget before the case timeout starts', async () => {
    // Worker 1: compiles, then hangs on the first case. Worker 2 (respawned
    // after the timeout) needs 8 s to load the engine, then runs in 100 ms.
    const { runner: fake, stats } = scriptedRunner((msg, send, worker) => {
      if (msg.type === 'compile') {
        send({ id: msg.id, type: 'engine_ready' });
        send({ id: msg.id, type: 'done', result: { compileOutput: null } });
      } else if (worker === 1) {
        send({ id: msg.id, type: 'engine_ready' });
      } else {
        setTimeout(() => send({ id: msg.id, type: 'engine_ready' }), 8000);
        setTimeout(() => send({ id: msg.id, type: 'done', result: { exitCode: 0 } }), 8100);
      }
    });
    const result = track(fake.runCode({ language: 'python', source: 'x', cases: [{}, {}], timeoutMs: 1000 }));
    await vi.advanceTimersByTimeAsync(9200);
    expect(result.settled).toBe(true);
    expect(result.value?.cases.map((c) => c.status)).toEqual(['timeout', 'ok']);
    expect(result.value?.cases[1].durationMs).toBeLessThan(1000);
    expect(stats.spawned).toBe(2);
    fake.dispose();
  });
});
