import type { Language } from '@birb-learn/content-schema';
import type { EngineCaseOutput } from './engines/types';
import { OutputCollector } from './output';
import {
  COMPILE_TIMEOUT_MS,
  ENGINE_LOAD_TIMEOUT_MS,
  clampTimeout,
  type CaseResult,
  type RunRequest,
  type RunResult,
  type Runner,
} from './protocol';
import { WORKER_CRASH_ID, type CompileOutcome, type HostMessage, type WorkerMessage } from './worker/messages';

/** The part of a worker the runner uses; wraps Web Workers and `worker_threads`. */
export interface WorkerLike {
  postMessage(msg: HostMessage): void;
  onMessage(cb: (msg: WorkerMessage) => void): void;
  terminate(): void;
}

interface PendingRequest {
  id: number;
  handle(msg: WorkerMessage): void;
  /** Rejects the request (used by `dispose`). */
  cancel(error: DOMException): void;
}

interface WorkerSlot {
  language: Language;
  worker: WorkerLike;
  dead: boolean;
  /** The request in flight, which receives the worker's messages. */
  pending?: PendingRequest;
}

type Outcome =
  | { kind: 'done'; result: EngineCaseOutput | CompileOutcome }
  | { kind: 'failed'; reason: 'engine_load' | 'internal'; message: string }
  | { kind: 'load_timeout' }
  | { kind: 'timeout' }
  | { kind: 'output_limit' };

const UNAVAILABLE: RunResult = { status: 'unavailable', cases: [] };

function abortError(): DOMException {
  return new DOMException('Aborted', 'AbortError');
}

function disposedError(): DOMException {
  return new DOMException('Disposed', 'AbortError');
}

/**
 * Runs code in one long-lived worker per language. A worker that times out,
 * floods its output, crashes or is aborted is terminated and replaced by a
 * fresh one on the next request. Once disposed, the runner rejects every run.
 */
export class BrowserRunner implements Runner {
  private readonly slots = new Map<Language, WorkerSlot>();
  // Runs of the same language are serialized: they share one worker.
  private readonly queues = new Map<Language, Promise<unknown>>();
  private nextId = 1;
  private disposed = false;

  constructor(private readonly spawn: (language: Language) => WorkerLike) {}

  runCode(req: RunRequest, opts: { signal?: AbortSignal } = {}): Promise<RunResult> {
    const previous = this.queues.get(req.language) ?? Promise.resolve();
    const run = previous.then(() => this.execute(req, opts.signal));
    const settled = run.catch(() => undefined);
    this.queues.set(req.language, settled);
    void settled.then(() => {
      if (this.queues.get(req.language) === settled) this.queues.delete(req.language);
    });
    return run;
  }

  /** Terminates every worker and rejects the runs in flight with an `AbortError`. */
  dispose(): void {
    this.disposed = true;
    for (const slot of [...this.slots.values()]) {
      const pending = slot.pending;
      this.kill(slot);
      pending?.cancel(disposedError());
    }
  }

  private async execute(req: RunRequest, signal: AbortSignal | undefined): Promise<RunResult> {
    if (signal?.aborted) throw abortError();
    const slot = this.slotFor(req.language);

    const compiled = await this.request(
      slot,
      { id: this.nextId++, type: 'compile', language: req.language, source: req.source },
      COMPILE_TIMEOUT_MS,
      signal,
    );
    if (compiled.outcome.kind !== 'done') {
      // A failed engine, or one that cannot load or compile in time, is
      // unavailable. (`request` already killed the worker on timeouts.)
      this.kill(slot);
      return UNAVAILABLE;
    }
    const { compileOutput } = compiled.outcome.result as CompileOutcome;
    if (compileOutput !== null) return { status: 'compile_error', compileOutput, cases: [] };

    const timeoutMs = clampTimeout(req.timeoutMs);
    const cases: CaseResult[] = [];
    for (const testCase of req.cases ?? [{}]) {
      // A previous case may have killed the worker; respawn it.
      const caseSlot = this.slotFor(req.language);
      const collector = new OutputCollector();
      const { outcome, durationMs } = await this.request(
        caseSlot,
        {
          id: this.nextId++,
          type: 'run',
          language: req.language,
          input: { source: req.source, stdin: testCase.stdin ?? '', sqlSetup: req.sqlSetup },
        },
        timeoutMs,
        signal,
        collector,
      );
      const output = { stdout: collector.stdout, stderr: collector.stderr, durationMs };

      switch (outcome.kind) {
        case 'load_timeout':
          return UNAVAILABLE;
        case 'timeout':
        case 'output_limit':
          cases.push({ status: outcome.kind, ...output, exitCode: null });
          break;
        case 'failed':
          this.kill(caseSlot);
          if (outcome.reason === 'engine_load') return UNAVAILABLE;
          appendError(collector, outcome.message);
          cases.push({ status: 'runtime_error', ...output, stderr: collector.stderr, exitCode: null });
          break;
        case 'done': {
          const result = outcome.result as EngineCaseOutput;
          if (result.error !== undefined) appendError(collector, result.error);
          const failed = result.error !== undefined || result.exitCode !== 0;
          cases.push({
            status: failed ? 'runtime_error' : 'ok',
            ...output,
            stderr: collector.stderr,
            exitCode: result.exitCode,
            ...(result.sql ? { sql: result.sql } : {}),
          });
          break;
        }
      }
    }
    return { status: 'ok', cases };
  }

  private slotFor(language: Language): WorkerSlot {
    if (this.disposed) throw disposedError();
    let slot = this.slots.get(language);
    if (!slot) {
      const created: WorkerSlot = { language, worker: this.spawn(language), dead: false };
      created.worker.onMessage((msg) => {
        if (created.dead) return;
        const pending = created.pending;
        if (msg.id === WORKER_CRASH_ID) {
          // The worker is gone: drop it even when idle, then fail the request in flight.
          this.kill(created);
          pending?.handle(msg);
        } else if (pending && msg.id === pending.id) {
          pending.handle(msg);
        }
      });
      this.slots.set(language, created);
      slot = created;
    }
    return slot;
  }

  /** Terminates a worker and forgets it, so the next request spawns a fresh one. Idempotent. */
  private kill(slot: WorkerSlot): void {
    if (slot.dead) return;
    slot.dead = true;
    slot.pending = undefined;
    if (this.slots.get(slot.language) === slot) this.slots.delete(slot.language);
    slot.worker.terminate();
  }

  /**
   * Sends one request and waits for its outcome. The worker gets
   * `ENGINE_LOAD_TIMEOUT_MS` to answer `engine_ready`, then `timeoutMs` to
   * finish; `durationMs` is counted from `engine_ready`. Kills the worker on
   * either timeout, on output overflow and on abort (which rejects with an
   * `AbortError`).
   */
  private request(
    slot: WorkerSlot,
    msg: HostMessage,
    timeoutMs: number,
    signal: AbortSignal | undefined,
    collector?: OutputCollector,
  ): Promise<{ outcome: Outcome; durationMs: number }> {
    return new Promise((resolve, reject) => {
      let startedAt = performance.now();
      let ready = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        if (slot.pending?.id === msg.id) slot.pending = undefined;
      };
      const finish = (outcome: Outcome, killWorker = false) => {
        const durationMs = Math.round(performance.now() - startedAt);
        cleanup();
        if (killWorker) this.kill(slot);
        resolve({ outcome, durationMs });
      };
      const fail = (error: DOMException, killWorker: boolean) => {
        cleanup();
        if (killWorker) this.kill(slot);
        reject(error);
      };
      const onAbort = () => fail(abortError(), true);

      timer = setTimeout(() => finish({ kind: 'load_timeout' }, true), ENGINE_LOAD_TIMEOUT_MS);
      slot.pending = {
        id: msg.id,
        handle: (reply) => {
          switch (reply.type) {
            case 'engine_ready':
              if (ready) break;
              ready = true;
              startedAt = performance.now();
              clearTimeout(timer);
              timer = setTimeout(() => finish({ kind: 'timeout' }, true), timeoutMs);
              break;
            case 'output':
              if (collector && !collector.push(reply.stream, reply.chunk)) finish({ kind: 'output_limit' }, true);
              break;
            case 'done':
              finish({ kind: 'done', result: reply.result });
              break;
            case 'failed':
              finish({ kind: 'failed', reason: reply.reason, message: reply.message });
              break;
          }
        },
        cancel: (error) => fail(error, false),
      };
      if (signal?.aborted) return onAbort();
      signal?.addEventListener('abort', onAbort, { once: true });
      slot.worker.postMessage(msg);
    });
  }
}

/** Appends an engine error to stderr, on its own line. */
function appendError(collector: OutputCollector, error: string): void {
  collector.push('stderr', error.endsWith('\n') ? error : `${error}\n`);
}
