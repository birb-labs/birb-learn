import { afterEach, describe, expect, it, vi } from 'vitest';
import { READ_ONLY_CODE_LANGUAGES } from '@birb-learn/content-schema';
import { READ_ONLY_LANGUAGES } from '../languages';
import { gradeCodeTask } from '../grading';
import { OUTPUT_LIMIT_BYTES, type RunRequest, type RunResult } from '../protocol';
import { createRunner, createSiteRunner } from '../run-code';
import { createCompilerExplorerRunner } from './compiler-explorer';
import { buildCompileRequest } from './map-response';
import cCompileError from './fixtures/c-compile-error.json';
import cExit3 from './fixtures/c-exit-3.json';
import cHello from './fixtures/c-hello.json';

// Every test injects a fake `fetch`: the unit tests never touch the network.

type FetchFn = typeof fetch;
type ExecuteBody = { options: { executeParameters: { stdin: string } } };

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A Compiler Explorer answer for a program that ran and printed `stdout`. */
const executed = (stdout: string, code = 0) => ({
  code,
  timedOut: false,
  stdout: stdout === '' ? [] : stdout.split('\n').map((text) => ({ text })),
  stderr: [],
  didExecute: true,
  buildResult: { code: 0, timedOut: false, stdout: [], stderr: [] },
});

interface Recorder {
  fetch: FetchFn;
  calls: { url: string; init: RequestInit; stdin: string }[];
  maxInFlight: () => number;
}

/** Records each call and answers with `answer(callIndex, init)`. */
function recordingFetch(answer: (index: number, init: RequestInit) => Promise<Response>): Recorder {
  const calls: Recorder['calls'] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const fake = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const index = calls.length;
    const body = JSON.parse(String(init.body)) as ExecuteBody;
    calls.push({ url: String(input), init, stdin: body.options.executeParameters.stdin });
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    try {
      return await answer(index, init);
    } finally {
      inFlight -= 1;
    }
  }) as FetchFn;
  return { fetch: fake, calls, maxInFlight: () => maxInFlight };
}

/** Rejects like the platform `fetch` does when its signal aborts, otherwise never settles. */
function hangUntilAborted(init: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
}

/** Polls until `condition` holds (a few ms at a time). */
async function waitFor(condition: () => boolean): Promise<void> {
  for (let i = 0; i < 200 && !condition(); i += 1) await new Promise((resolve) => setTimeout(resolve, 5));
  expect(condition()).toBe(true);
}

const RUST: RunRequest = { language: 'rust', source: 'fn main() {}' };
const echo = (_index: number, init: RequestInit) => {
  const stdin = (JSON.parse(String(init.body)) as ExecuteBody).options.executeParameters.stdin;
  return Promise.resolve(jsonResponse(executed(`got ${stdin}`)));
};

describe('createCompilerExplorerRunner', () => {
  describe('basic flow', () => {
    it('runs every case in order with its own stdin, one request per case', async () => {
      const fake = recordingFetch(echo);
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });

      const result = await runner.runCode({ ...RUST, cases: [{ stdin: 'a' }, { stdin: 'b' }, { stdin: 'c' }] });

      expect(fake.calls.map((c) => c.stdin)).toEqual(['a', 'b', 'c']);
      expect(result.status).toBe('ok');
      expect(result.cases.map((c) => [c.status, c.stdout, c.exitCode])).toEqual([
        ['ok', 'got a\n', 0],
        ['ok', 'got b\n', 0],
        ['ok', 'got c\n', 0],
      ]);
    });

    it('defaults to a single case with empty stdin', async () => {
      const fake = recordingFetch(() => Promise.resolve(jsonResponse(cHello)));
      const result = await createCompilerExplorerRunner({ fetch: fake.fetch }).runCode({ language: 'c', source: 'x' });

      expect(fake.calls.map((c) => c.stdin)).toEqual(['']);
      expect(result.cases).toHaveLength(1);
      expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: 'Hello, world!\n', exitCode: 0 });
    });

    it('stops after the first request when the program does not compile', async () => {
      const fake = recordingFetch(() => Promise.resolve(jsonResponse(cCompileError)));
      const result = await createCompilerExplorerRunner({ fetch: fake.fetch }).runCode({
        language: 'c',
        source: 'int main(',
        cases: [{ stdin: '1' }, { stdin: '2' }, { stdin: '3' }],
      });

      expect(fake.calls).toHaveLength(1);
      expect(result.status).toBe('compile_error');
      expect(result.compileOutput).toContain('error');
      expect(result.cases).toEqual([]);
    });

    it('reports a non-zero exit code as a runtime error with that exit code', async () => {
      const fake = recordingFetch(() => Promise.resolve(jsonResponse(cExit3)));
      const result = await createCompilerExplorerRunner({ fetch: fake.fetch }).runCode({ language: 'c', source: 'x' });

      expect(result.status).toBe('ok');
      expect(result.cases[0]).toMatchObject({ status: 'runtime_error', exitCode: 3 });
    });

    it('maps a time limit enforced by the service to a timeout case', async () => {
      const fake = recordingFetch(() =>
        Promise.resolve(
          jsonResponse({
            ...executed('', 143),
            timedOut: true,
            stderr: [{ text: 'Killed - processing time exceeded' }],
          }),
        ),
      );
      const result = await createCompilerExplorerRunner({ fetch: fake.fetch }).runCode(RUST);

      expect(result.cases[0]).toMatchObject({ status: 'timeout', exitCode: null });
    });

    it('records how long each request took', async () => {
      let clock = 1000;
      const fake = recordingFetch(() => {
        clock += 250;
        return Promise.resolve(jsonResponse(executed('x')));
      });
      const result = await createCompilerExplorerRunner({ fetch: fake.fetch, now: () => clock }).runCode(RUST);

      expect(result.cases[0].durationMs).toBe(250);
    });

    it('reports a language without a compiler as a service error without sending anything', async () => {
      const fake = recordingFetch(echo);
      const result = await createCompilerExplorerRunner({ fetch: fake.fetch }).runCode({
        language: 'python',
        source: 'print(1)',
      });

      expect(result).toMatchObject({ status: 'unavailable', reason: 'service_error', cases: [] });
      expect(fake.calls).toEqual([]);
    });
  });

  describe('limits', () => {
    it('treats its own timer firing as a service failure and stops the run', async () => {
      const fake = recordingFetch((index, init) =>
        index === 0 ? hangUntilAborted(init) : Promise.resolve(jsonResponse(executed('second'))),
      );
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch, requestTimeoutMs: 100 });

      const started = Date.now();
      const result = await runner.runCode({ ...RUST, cases: [{}, {}], timeoutMs: 10000 });

      expect(Date.now() - started).toBeLessThan(2000);
      expect(result).toEqual({
        status: 'unavailable',
        reason: 'service_error',
        message: 'Compiler Explorer did not answer within 45 s',
        cases: [],
      });
      expect(fake.calls).toHaveLength(1);
    });

    it('is not_graded at the grading level when the service hangs', async () => {
      const fake = recordingFetch((_index, init) => hangUntilAborted(init));
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch, requestTimeoutMs: 20 });
      const tests = [
        { name: 'one', stdin: '1\n', expectedStdout: 'a' },
        { name: 'two', stdin: '2\n', expectedStdout: 'b' },
      ];

      const graded = await gradeCodeTask(
        'write',
        'rust',
        { starterCode: '', tests, blanks: [], hints: [] },
        { kind: 'write', code: 'fn main() {}' },
        runner,
      );

      expect(graded.verdict).toBe('not_graded');
      expect(fake.calls).toHaveLength(1);
    });

    it('does not wait for a fetch that ignores its signal', async () => {
      const fake = recordingFetch(() => new Promise<Response>(() => {}));
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch, requestTimeoutMs: 50 });

      const result = await runner.runCode(RUST);

      expect(result).toMatchObject({ status: 'unavailable', reason: 'service_error' });
    });

    it('ignores the per-case timeout of the request: the service enforces its own limit', async () => {
      const fake = recordingFetch((_index, init) => hangUntilAborted(init));
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch, requestTimeoutMs: 120 });

      const started = Date.now();
      await runner.runCode({ ...RUST, timeoutMs: 20 });

      expect(Date.now() - started).toBeGreaterThanOrEqual(100);
    });

    it('cuts oversized output at the limit and reports output_limit', async () => {
      const big = 'x'.repeat(OUTPUT_LIMIT_BYTES * 2);
      const fake = recordingFetch(() => Promise.resolve(jsonResponse(executed(big))));
      const result = await createCompilerExplorerRunner({ fetch: fake.fetch }).runCode(RUST);

      const [only] = result.cases;
      expect(only.status).toBe('output_limit');
      expect(new TextEncoder().encode(only.stdout + only.stderr).length).toBeLessThanOrEqual(OUTPUT_LIMIT_BYTES);
      expect(only.stdout.length).toBeGreaterThan(0);
    });

    it('keeps the text it got when the service itself truncated the output', async () => {
      const fake = recordingFetch(() => Promise.resolve(jsonResponse({ ...executed('partial'), truncated: true })));
      const result = await createCompilerExplorerRunner({ fetch: fake.fetch }).runCode(RUST);

      expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: 'partial\n' });
    });
  });

  describe('failures never throw', () => {
    const run = (answer: () => Promise<Response>): Promise<RunResult> =>
      createCompilerExplorerRunner({ fetch: recordingFetch(answer).fetch }).runCode({
        ...RUST,
        cases: [{ stdin: 'a' }, { stdin: 'b' }],
      });

    it('reports a network failure (TypeError) as offline', async () => {
      const result = await run(() => Promise.reject(new TypeError('Failed to fetch')));
      expect(result).toMatchObject({ status: 'unavailable', reason: 'offline', cases: [] });
      expect(result.message).toEqual(expect.any(String));
    });

    it('reports HTTP 429 as rate_limited', async () => {
      const result = await run(() => Promise.resolve(jsonResponse({}, 429)));
      expect(result).toMatchObject({ status: 'unavailable', reason: 'rate_limited', cases: [] });
    });

    it('reports other non-2xx statuses as service_error with the status in the message', async () => {
      const result = await run(() => Promise.resolve(jsonResponse({}, 503)));
      expect(result).toMatchObject({ status: 'unavailable', reason: 'service_error', cases: [] });
      expect(result.message).toContain('503');
    });

    it('reports invalid JSON as service_error', async () => {
      const result = await run(() => Promise.resolve(new Response('<html>oops</html>', { status: 200 })));
      expect(result).toMatchObject({ status: 'unavailable', reason: 'service_error', cases: [] });
    });

    it('reports an unexpected payload shape as service_error', async () => {
      const result = await run(() => Promise.resolve(jsonResponse({ hello: 'world' })));
      expect(result).toMatchObject({ status: 'unavailable', reason: 'service_error', cases: [] });
    });

    it('reports an unexpected fetch error as service_error', async () => {
      const result = await run(() => Promise.reject(new Error('boom')));
      expect(result).toMatchObject({ status: 'unavailable', reason: 'service_error', cases: [] });
    });

    it('does not send the remaining cases after a failure', async () => {
      const fake = recordingFetch(() => Promise.resolve(jsonResponse({}, 503)));
      await createCompilerExplorerRunner({ fetch: fake.fetch }).runCode({ ...RUST, cases: [{}, {}, {}] });
      expect(fake.calls).toHaveLength(1);
    });
  });

  describe('abort', () => {
    it('rejects with AbortError mid-request, aborts the fetch signal, and later runs still work', async () => {
      let seenSignal: AbortSignal | undefined;
      const fake = recordingFetch((index, init) => {
        seenSignal = init.signal ?? undefined;
        return index === 0 ? hangUntilAborted(init) : Promise.resolve(jsonResponse(executed('after')));
      });
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });
      const controller = new AbortController();

      const pending = runner.runCode(RUST, { signal: controller.signal });
      await waitFor(() => fake.calls.length === 1);
      controller.abort();

      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      expect(seenSignal?.aborted).toBe(true);
      const next = await runner.runCode({ ...RUST, source: 'again' });
      expect(next.cases[0]).toMatchObject({ status: 'ok', stdout: 'after\n' });
    });

    it('rejects with AbortError even when the fetch ignores its signal', async () => {
      const fake = recordingFetch(() => new Promise<Response>(() => {}));
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });
      const controller = new AbortController();

      const pending = runner.runCode(RUST, { signal: controller.signal });
      await waitFor(() => fake.calls.length === 1);
      controller.abort();

      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('rejects without sending anything when already aborted', async () => {
      const fake = recordingFetch(echo);
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });
      const controller = new AbortController();
      controller.abort();

      await expect(runner.runCode(RUST, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
      expect(fake.calls).toEqual([]);
    });

    it('rejects a queued run on abort without ever sending its request', async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      const fake = recordingFetch(async () => {
        await gate;
        return jsonResponse(executed('first'));
      });
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });
      const controller = new AbortController();

      const first = runner.runCode({ ...RUST, source: 'one' });
      await waitFor(() => fake.calls.length === 1);
      const queued = runner.runCode({ ...RUST, source: 'two' }, { signal: controller.signal });
      controller.abort();

      await expect(queued).rejects.toMatchObject({ name: 'AbortError' });
      release();
      await first;
      expect(fake.calls).toHaveLength(1);
    });

    it('keeps later runs behind the one in flight after a queued run was aborted', async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      const fake = recordingFetch(async (index) => {
        if (index === 0) await gate;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return jsonResponse(executed('x'));
      });
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });
      const controller = new AbortController();

      const first = runner.runCode({ ...RUST, source: 'one' });
      await waitFor(() => fake.calls.length === 1);
      const queued = runner.runCode({ ...RUST, source: 'two' }, { signal: controller.signal });
      const third = runner.runCode({ ...RUST, source: 'three' });
      controller.abort();
      await expect(queued).rejects.toMatchObject({ name: 'AbortError' });
      release();
      await Promise.all([first, third]);

      expect(fake.maxInFlight()).toBe(1);
      expect(fake.calls).toHaveLength(2);
    });
  });

  describe('concurrency', () => {
    it('never has two requests in flight for one runner', async () => {
      const fake = recordingFetch(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return jsonResponse(executed('x'));
      });
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });

      const results = await Promise.all([
        runner.runCode({ ...RUST, source: 'a', cases: [{ stdin: '1' }, { stdin: '2' }] }),
        runner.runCode({ ...RUST, source: 'b', cases: [{ stdin: '1' }, { stdin: '2' }] }),
        runner.runCode({ ...RUST, source: 'c' }),
      ]);

      expect(results.every((r) => r.status === 'ok')).toBe(true);
      expect(fake.calls).toHaveLength(5);
      expect(fake.maxInFlight()).toBe(1);
    });

    it('lets a run after a failed one proceed', async () => {
      const fake = recordingFetch((index) =>
        index === 0 ? Promise.reject(new TypeError('down')) : Promise.resolve(jsonResponse(executed('up'))),
      );
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });

      const [first, second] = await Promise.all([
        runner.runCode({ ...RUST, source: 'a' }),
        runner.runCode({ ...RUST, source: 'b' }),
      ]);

      expect(first.reason).toBe('offline');
      expect(second.status).toBe('ok');
    });
  });

  describe('request budget', () => {
    it('refuses the 21st request within the window without sending it, and allows again afterwards', async () => {
      let clock = 5000;
      const fake = recordingFetch(() => Promise.resolve(jsonResponse(executed('x'))));
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch, now: () => clock });

      for (let i = 0; i < 20; i += 1) {
        const result = await runner.runCode({ ...RUST, source: `program ${i}` });
        expect(result.status).toBe('ok');
        clock += 1000;
      }
      expect(fake.calls).toHaveLength(20);

      const refused = await runner.runCode({ ...RUST, source: 'program 21' });
      expect(refused).toMatchObject({ status: 'unavailable', reason: 'rate_limited', cases: [] });
      expect(fake.calls).toHaveLength(20);

      // The first request was made at t=5000: at t=65000 it left the 60 s window.
      clock = 65000;
      const allowed = await runner.runCode({ ...RUST, source: 'program 22' });
      expect(allowed.status).toBe('ok');
      expect(fake.calls).toHaveLength(21);
    });

    it('counts every case of a run and stops with rate_limited when the budget runs out mid-run', async () => {
      const fake = recordingFetch(() => Promise.resolve(jsonResponse(executed('x'))));
      const runner = createCompilerExplorerRunner({
        fetch: fake.fetch,
        now: () => 0,
        budget: { requests: 2, windowMs: 60000 },
      });

      const result = await runner.runCode({ ...RUST, cases: [{ stdin: '1' }, { stdin: '2' }, { stdin: '3' }] });

      expect(result).toMatchObject({ status: 'unavailable', reason: 'rate_limited', cases: [] });
      expect(fake.calls).toHaveLength(2);
    });

    it('counts failed requests too', async () => {
      const fake = recordingFetch(() => Promise.reject(new TypeError('down')));
      const runner = createCompilerExplorerRunner({
        fetch: fake.fetch,
        now: () => 0,
        budget: { requests: 1, windowMs: 60000 },
      });

      expect((await runner.runCode(RUST)).reason).toBe('offline');
      expect((await runner.runCode(RUST)).reason).toBe('rate_limited');
      expect(fake.calls).toHaveLength(1);
    });

    it('gives every runner instance its own budget', async () => {
      const fake = recordingFetch(() => Promise.resolve(jsonResponse(executed('x'))));
      const options = { fetch: fake.fetch, now: () => 0, budget: { requests: 1, windowMs: 60000 } };
      const one = createCompilerExplorerRunner(options);
      const two = createCompilerExplorerRunner(options);

      expect((await one.runCode(RUST)).status).toBe('ok');
      expect((await two.runCode(RUST)).status).toBe('ok');
    });
  });

  describe('cache', () => {
    it('answers an identical run from memory without a request or budget use', async () => {
      const fake = recordingFetch(echo);
      const runner = createCompilerExplorerRunner({
        fetch: fake.fetch,
        now: () => 0,
        budget: { requests: 1, windowMs: 60000 },
      });
      const req: RunRequest = { ...RUST, cases: [{ stdin: 'a' }] };

      const first = await runner.runCode(req);
      const second = await runner.runCode(req);

      expect(fake.calls).toHaveLength(1);
      expect(second).toEqual(first);
    });

    it('keys the cache on language, source and stdin', async () => {
      const fake = recordingFetch(echo);
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });

      await runner.runCode({ ...RUST, cases: [{ stdin: 'a' }] });
      await runner.runCode({ ...RUST, cases: [{ stdin: 'b' }] });
      await runner.runCode({ ...RUST, source: 'other', cases: [{ stdin: 'a' }] });
      await runner.runCode({ language: 'go', source: RUST.source, cases: [{ stdin: 'a' }] });

      expect(fake.calls).toHaveLength(4);
    });

    it('caches runtime errors', async () => {
      const fake = recordingFetch(() => Promise.resolve(jsonResponse(cExit3)));
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });

      await runner.runCode({ language: 'c', source: 'exit3' });
      const again = await runner.runCode({ language: 'c', source: 'exit3' });

      expect(fake.calls).toHaveLength(1);
      expect(again.cases[0]).toMatchObject({ status: 'runtime_error', exitCode: 3 });
    });

    it('does not cache failures, timeouts or compile errors', async () => {
      const answers = [
        () => Promise.reject(new TypeError('down')),
        () => Promise.resolve(jsonResponse(cCompileError)),
        () => Promise.resolve(jsonResponse(cCompileError)),
      ];
      const fake = recordingFetch((index) => answers[index]());
      const runner = createCompilerExplorerRunner({ fetch: fake.fetch });

      await runner.runCode({ language: 'c', source: 'same' });
      await runner.runCode({ language: 'c', source: 'same' });
      await runner.runCode({ language: 'c', source: 'same' });
      expect(fake.calls).toHaveLength(3);

      const hanging = recordingFetch((_index, init) => hangUntilAborted(init));
      const timing = createCompilerExplorerRunner({ fetch: hanging.fetch, requestTimeoutMs: 20 });
      await timing.runCode(RUST);
      await timing.runCode(RUST);
      expect(hanging.calls).toHaveLength(2);
    });
  });

  describe('request shape', () => {
    it('posts the compile request as JSON, without credentials', async () => {
      const fake = recordingFetch(() => Promise.resolve(jsonResponse(executed('x'))));
      await createCompilerExplorerRunner({ fetch: fake.fetch }).runCode({
        language: 'cpp',
        source: 'int main() {}',
        cases: [{ stdin: 'in' }],
      });

      const expected = buildCompileRequest('cpp', 'int main() {}', 'in');
      const [call] = fake.calls;
      expect(call.url).toBe(expected.url);
      expect(call.init.method).toBe('POST');
      expect(call.init.credentials).toBe('omit');
      expect(JSON.parse(String(call.init.body))).toEqual(expected.body);
      expect(new Headers(call.init.headers).get('Content-Type')).toBe('application/json');
      expect(new Headers(call.init.headers).get('Accept')).toBe('application/json');
    });
  });
});

describe('createSiteRunner', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes a remote language to Compiler Explorer through the global fetch', async () => {
    const fake = recordingFetch(() => Promise.resolve(jsonResponse(executed('hi'))));
    vi.stubGlobal('fetch', fake.fetch);

    const result = await createSiteRunner().runCode(RUST);

    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0].url).toContain('/compiler/r1990/compile');
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: 'hi\n' });
  });

  it('keeps read-only languages read-only without any request', async () => {
    const fake = recordingFetch(echo);
    vi.stubGlobal('fetch', fake.fetch);

    const mysql = await createSiteRunner().runCode({ language: 'mysql', source: 'SELECT 1;' });

    expect(mysql).toMatchObject({ status: 'unavailable', reason: 'read_only' });
    expect(fake.calls).toEqual([]);
  });

  it('createRunner sends a remote language to the given remote runner and never to the browser runner', async () => {
    const fake = recordingFetch(() => Promise.resolve(jsonResponse(executed('hi'))));
    const runner = createRunner({
      browser: { runCode: () => Promise.reject(new Error('browser runner must not be used')) },
      remote: createCompilerExplorerRunner({ fetch: fake.fetch }),
    });

    const result = await runner.runCode(RUST);

    expect(result.cases[0].stdout).toBe('hi\n');
  });
});

describe('read-only languages', () => {
  it('match the read-only languages of the content schema', () => {
    expect([...READ_ONLY_LANGUAGES]).toEqual([...READ_ONLY_CODE_LANGUAGES]);
  });
});
