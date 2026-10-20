import { OutputCollector } from '../output';
import {
  reportProgress,
  type CaseResult,
  type RunOptions,
  type RunRequest,
  type RunResult,
  type Runner,
  type UnavailableReason,
} from '../protocol';
import { COMPILER_EXPLORER_COMPILERS, type RemoteLanguage } from './compilers';
import { buildCompileRequest, mapCompilerExplorerResponse } from './map-response';

/**
 * Fixed time budget of one Compiler Explorer request. Every request includes the
 * compilation (a cold Go build took about 30 s), and the service enforces its own
 * 20 s execution limit, which it reports as `timedOut` (a `timeout` case, about 22 s
 * round-trip). When this timer fires first the service is slow or hung, so the run
 * is `unavailable` (`service_error`), never a student's `timeout`.
 */
export const REMOTE_REQUEST_TIMEOUT_MS = 45000;

export const DEFAULT_REQUEST_BUDGET = { requests: 20, windowMs: 60000 };

/** Results (and, separately, compile errors) kept in memory per runner; the oldest is dropped first. */
const CACHE_LIMIT = 200;

export interface CompilerExplorerRunnerOptions {
  /** Defaults to the global `fetch`, looked up at call time. */
  fetch?: typeof fetch;
  /** Clock in milliseconds, defaults to `Date.now`. */
  now?: () => number;
  /** Most requests per rolling window for this runner instance. */
  budget?: { requests: number; windowMs: number };
  /** Overrides `REMOTE_REQUEST_TIMEOUT_MS` (tests only). */
  requestTimeoutMs?: number;
  /**
   * Stores finished results and compile errors, used instead of the in-memory
   * cache (for a cache that outlives the runner, e.g. a key-value store). A
   * failing `get` counts as a miss and a failing `set` is ignored: a cache
   * must never break a run.
   */
  cache?: RemoteResultCache;
}

/** What the remote runner remembers: a case result is keyed on (compiler, flags, source, stdin), a compile error on (compiler, flags, source). */
export interface RemoteResultCache {
  get(key: string): Promise<CaseOutcome | undefined>;
  set(key: string, value: CaseOutcome): Promise<void>;
}

export type CaseOutcome =
  | { kind: 'case'; result: CaseResult; cacheable: boolean }
  | { kind: 'compile_error'; compileOutput: string }
  | { kind: 'unavailable'; reason: UnavailableReason; message: string; retryAfterMs?: number };

class RequestTimeoutError extends Error {}

/** The default cache: in memory, the oldest entry is dropped first. */
function createMemoryCache(): RemoteResultCache {
  const entries = new Map<string, CaseOutcome>();
  return {
    async get(key) {
      return entries.get(key);
    },
    async set(key, value) {
      entries.delete(key);
      entries.set(key, value);
      if (entries.size > CACHE_LIMIT) entries.delete(entries.keys().next().value as string);
    },
  };
}

function abortError(): DOMException {
  return new DOMException('The run was aborted', 'AbortError');
}

function unavailable(reason: UnavailableReason, message: string, retryAfterMs?: number): RunResult {
  return {
    status: 'unavailable',
    reason,
    message,
    ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
    cases: [],
  };
}

/** A `Retry-After` header in whole seconds as milliseconds, or `undefined` when it is missing or not that form. */
function parseRetryAfterMs(header: string | null): number | undefined {
  if (header === null || !/^\s*\d+\s*$/.test(header)) return undefined;
  return Number(header) * 1000;
}

/**
 * Runs C, C++, Go, Java and Rust on the public Compiler Explorer service (one
 * request per case, compiling every time).
 *
 * Politeness towards the volunteer-run service, per runner instance: one request
 * in flight (other runs queue), at most `budget.requests` requests per rolling
 * `budget.windowMs` (beyond that the run is `unavailable` with `rate_limited`, a
 * `retryAfterMs` hint and nothing more is sent), an HTTP 429 cool-down, and an
 * in-memory cache (or the injected `cache`) of finished results and of compile
 * errors per source, so an identical program and input is never sent twice. A run whose uncached cases fit
 * the budget but not what is left of it fails fast, before anything is sent.
 *
 * `RunRequest.timeoutMs` is ignored: the service has its own execution limit and
 * every request is bounded by `REMOTE_REQUEST_TIMEOUT_MS` (see there).
 */
export function createCompilerExplorerRunner(options: CompilerExplorerRunnerOptions = {}): Runner {
  const now = options.now ?? Date.now;
  const budget = options.budget ?? DEFAULT_REQUEST_BUDGET;
  const requestTimeoutMs = options.requestTimeoutMs ?? REMOTE_REQUEST_TIMEOUT_MS;
  // Looked up per call: the platform `fetch` must be called on the global object.
  const doFetch: typeof fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));

  // Results are kept apart from compile errors so that, in memory, neither evicts the other.
  // Compile errors are deterministic and independent of stdin, and beginners re-run
  // broken code often: remember them per (compiler, flags, source).
  const cache = options.cache ?? createMemoryCache();
  const compileErrors = options.cache ?? createMemoryCache();
  const requestTimes: number[] = [];
  // After an HTTP 429 the budget counts as spent until this instant.
  let blockedUntil = 0;
  // Settles when the run before the newest one has finished.
  let tail: Promise<void> = Promise.resolve();

  /** Requests that may still be sent in the current window. */
  function remainingBudget(): number {
    const current = now();
    while (requestTimes.length > 0 && requestTimes[0] <= current - budget.windowMs) requestTimes.shift();
    return budget.requests - requestTimes.length;
  }

  /** Milliseconds until `needed` requests have left the window (0: none), never less than the 429 cool-down. */
  function retryAfterMs(needed: number): number {
    const current = now();
    const oldestToLeave = requestTimes[Math.min(needed, requestTimes.length) - 1];
    const windowWait = oldestToLeave === undefined ? 0 : oldestToLeave + budget.windowMs - current;
    return Math.max(0, windowWait, blockedUntil - current);
  }

  function rateLimited(message: string, needed: number): RunResult {
    return unavailable('rate_limited', message, retryAfterMs(needed));
  }

  async function recall(store: RemoteResultCache, key: string): Promise<CaseOutcome | undefined> {
    try {
      return await store.get(key);
    } catch {
      return undefined;
    }
  }

  async function remember(store: RemoteResultCache, key: string, value: CaseOutcome): Promise<void> {
    try {
      await store.set(key, value);
    } catch {
      // A broken cache only costs a request next time.
    }
  }

  /** Sends one request. Throws `AbortError` when the caller aborts. */
  async function sendCase(
    language: RemoteLanguage,
    source: string,
    stdin: string,
    signal: AbortSignal | undefined,
  ): Promise<CaseOutcome> {
    requestTimes.push(now());
    const startedAt = now();
    const { url, body } = buildCompileRequest(language, source, stdin);

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, requestTimeoutMs);
    const onCallerAbort = () => controller.abort();
    signal?.addEventListener('abort', onCallerAbort, { once: true });

    // Settles when the request is cancelled, even if `fetch` ignores its signal.
    const cancelled = new Promise<never>((_resolve, reject) => {
      controller.signal.addEventListener('abort', () => reject(new RequestTimeoutError()), { once: true });
    });
    cancelled.catch(() => {});

    const exchange = (async (): Promise<{ status: number; json: unknown; retryAfter: string | null }> => {
      const response = await doFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        credentials: 'omit',
        signal: controller.signal,
      });
      const retryAfter = response.headers.get('Retry-After');
      if (!response.ok) return { status: response.status, json: undefined, retryAfter };
      return { status: response.status, json: await response.json(), retryAfter };
    })();
    exchange.catch(() => {});

    const durationMs = () => now() - startedAt;
    try {
      const { status, json, retryAfter } = await Promise.race([exchange, cancelled]);
      if (status === 429) {
        // Treat the budget as spent until the service says it is fine again.
        const coolDownMs = parseRetryAfterMs(retryAfter) ?? budget.windowMs;
        blockedUntil = now() + coolDownMs;
        return {
          kind: 'unavailable',
          reason: 'rate_limited',
          message: 'Compiler Explorer answered HTTP 429 (too many requests)',
          retryAfterMs: coolDownMs,
        };
      }
      // An unknown compiler id answers 404: the pin in `compilers.ts` needs refreshing.
      if (status === 404) {
        const { id } = COMPILER_EXPLORER_COMPILERS[language];
        return { kind: 'unavailable', reason: 'service_error', message: `Compiler Explorer no longer has compiler ${id}` };
      }
      if (status < 200 || status > 299) {
        return { kind: 'unavailable', reason: 'service_error', message: `Compiler Explorer answered HTTP ${status}` };
      }

      const mapped = mapCompilerExplorerResponse(json);
      if (mapped.kind === 'service_timeout') {
        return { kind: 'unavailable', reason: 'service_error', message: 'Compiler Explorer build timed out' };
      }
      if (mapped.kind === 'compile_error') return { kind: 'compile_error', compileOutput: mapped.compileOutput };

      const collector = new OutputCollector();
      collector.push('stdout', mapped.stdout);
      collector.push('stderr', mapped.stderr);
      const overflowed = collector.overflowed && mapped.status !== 'timeout';
      const result: CaseResult = {
        status: overflowed ? 'output_limit' : mapped.status,
        stdout: collector.stdout,
        stderr: collector.stderr,
        exitCode: mapped.exitCode,
        durationMs: durationMs(),
      };
      // A timeout depends on the service's load, so it is never reused.
      return { kind: 'case', result, cacheable: result.status !== 'timeout' };
    } catch (error) {
      if (signal?.aborted) throw abortError();
      if (timedOut) {
        // The service reports its own execution limit as `timedOut`, so a silent
        // service is slow or hung: never blame the student's program for it.
        return {
          kind: 'unavailable',
          reason: 'service_error',
          message: `Compiler Explorer did not answer within ${REMOTE_REQUEST_TIMEOUT_MS / 1000} s`,
        };
      }
      if (error instanceof TypeError) {
        return { kind: 'unavailable', reason: 'offline', message: 'Could not reach Compiler Explorer (network error)' };
      }
      const detail = error instanceof Error ? error.message : String(error);
      return { kind: 'unavailable', reason: 'service_error', message: `Compiler Explorer request failed: ${detail}` };
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onCallerAbort);
    }
  }

  async function runCases(
    req: RunRequest,
    language: RemoteLanguage,
    { signal, onProgress }: RunOptions,
  ): Promise<RunResult> {
    const { id, flags } = COMPILER_EXPLORER_COMPILERS[language];
    const cases: CaseResult[] = [];

    const sourceKey = JSON.stringify([id, flags, req.source]);
    const knownCompileError = await recall(compileErrors, sourceKey);
    if (knownCompileError?.kind === 'compile_error') {
      return { status: 'compile_error', compileOutput: knownCompileError.compileOutput, cases: [] };
    }

    const keyOf = (stdin: string) => JSON.stringify([id, flags, req.source, stdin]);
    const testCases = req.cases ?? [{}];

    // Fail fast: a run that fits the budget but not what is left of it would waste
    // requests on a partial result. A run larger than the whole budget cannot fit
    // ever, so it is sent in order and stops where the budget runs out.
    const known = new Map<string, CaseResult>();
    for (const key of new Set(testCases.map((c) => keyOf(c.stdin ?? '')))) {
      const hit = await recall(cache, key);
      if (hit?.kind === 'case') known.set(key, hit.result);
    }
    const uncached = new Set(testCases.map((c) => keyOf(c.stdin ?? '')).filter((key) => !known.has(key))).size;
    if (uncached > 0) {
      const remaining = remainingBudget();
      if (blockedUntil > now()) {
        return rateLimited('Compiler Explorer asked for a pause after HTTP 429', 0);
      }
      if (uncached > remaining && uncached <= budget.requests) {
        return rateLimited(
          `${uncached} Compiler Explorer requests needed, ${remaining} left of ${budget.requests} per ${budget.windowMs / 1000} s`,
          uncached - remaining,
        );
      }
    }

    const caseCount = testCases.length;
    for (const [caseIndex, testCase] of testCases.entries()) {
      if (signal?.aborted) throw abortError();
      reportProgress(onProgress, { phase: 'case_started', caseIndex, caseCount });
      const stdin = testCase.stdin ?? '';
      const key = keyOf(stdin);
      const cached = known.get(key);
      if (cached) {
        cases.push({ ...cached });
        reportProgress(onProgress, { phase: 'case_done', caseIndex, caseCount });
        continue;
      }
      if (remainingBudget() <= 0) {
        return rateLimited(`More than ${budget.requests} Compiler Explorer requests in ${budget.windowMs / 1000} s`, 1);
      }

      const outcome = await sendCase(language, req.source, stdin, signal);
      if (outcome.kind === 'unavailable') return unavailable(outcome.reason, outcome.message, outcome.retryAfterMs);
      // The program is compiled for every case, so a build failure ends the run at once.
      if (outcome.kind === 'compile_error') {
        await remember(compileErrors, sourceKey, outcome);
        return { status: 'compile_error', compileOutput: outcome.compileOutput, cases: [] };
      }
      if (outcome.cacheable) {
        known.set(key, outcome.result);
        await remember(cache, key, outcome);
      }
      cases.push(outcome.result);
      reportProgress(onProgress, { phase: 'case_done', caseIndex, caseCount });
    }
    return { status: 'ok', cases };
  }

  return {
    async runCode(req, opts) {
      const signal = opts?.signal;
      if (!Object.hasOwn(COMPILER_EXPLORER_COMPILERS, req.language)) {
        return unavailable('service_error', `No Compiler Explorer compiler is configured for ${req.language}`);
      }
      if (signal?.aborted) throw abortError();

      // Queue behind the previous run: only one request is in flight at a time.
      const previous = tail;
      let release!: () => void;
      tail = new Promise<void>((resolve) => {
        release = resolve;
      });

      let onQueuedAbort: (() => void) | undefined;
      const queuedAbort = new Promise<'aborted'>((resolve) => {
        onQueuedAbort = () => resolve('aborted');
        signal?.addEventListener('abort', onQueuedAbort, { once: true });
      });
      const turn = await Promise.race([previous.then(() => 'turn' as const), queuedAbort]);
      if (onQueuedAbort) signal?.removeEventListener('abort', onQueuedAbort);
      if (turn === 'aborted') {
        // Later runs still wait for the one in flight.
        void previous.then(release);
        throw abortError();
      }

      try {
        return await runCases(req, req.language as RemoteLanguage, { signal, onProgress: opts?.onProgress });
      } finally {
        release();
      }
    },
  };
}
