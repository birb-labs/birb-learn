import type { Language } from '@birb-learn/content-schema';
import type { EngineCaseOutput } from './engines/types';
import { OutputCollector } from './output';
import {
  COMPILE_TIMEOUT_MS,
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

interface WorkerSlot {
  language: Language;
  worker: WorkerLike;
  /** Receives the messages of the request in flight. */
  pending?: { id: number; handle(msg: WorkerMessage): void };
}

type Outcome =
  | { kind: 'done'; result: EngineCaseOutput | CompileOutcome }
  | { kind: 'failed'; reason: 'engine_load' | 'internal'; message: string }
  | { kind: 'timeout' }
  | { kind: 'output_limit' };

const UNAVAILABLE: RunResult = { status: 'unavailable', cases: [] };

function abortError(): DOMException {
  return new DOMException('Aborted', 'AbortError');
}

/**
 * Runs code in one long-lived worker per language. A worker that times out,
 * floods its output, crashes or is aborted is terminated and replaced by a
 * fresh one on the next request.
 */
export class BrowserRunner implements Runner {
  private readonly slots = new Map<Language, WorkerSlot>();
  // Runs of the same language are serialized: they share one worker.
  private readonly queues = new Map<Language, Promise<unknown>>();
  private nextId = 1;

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

  /** Terminates every worker. */
  dispose(): void {
    for (const slot of [...this.slots.values()]) this.kill(slot);
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
    if (compiled.kind !== 'done') {
      // A failed engine, or one that cannot compile in time, is unavailable.
      // (`request` already killed the worker on timeout.)
      if (compiled.kind === 'failed') this.kill(slot);
      return UNAVAILABLE;
    }
    const { compileOutput } = compiled.result as CompileOutcome;
    if (compileOutput !== null) return { status: 'compile_error', compileOutput, cases: [] };

    const timeoutMs = clampTimeout(req.timeoutMs);
    const cases: CaseResult[] = [];
    for (const testCase of req.cases ?? [{}]) {
      // A previous case may have killed the worker; respawn it.
      const caseSlot = this.slotFor(req.language);
      const collector = new OutputCollector();
      const started = performance.now();
      const outcome = await this.request(
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
      const durationMs = Math.round(performance.now() - started);
      const output = { stdout: collector.stdout, stderr: collector.stderr, durationMs };

      switch (outcome.kind) {
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
    let slot = this.slots.get(language);
    if (!slot) {
      const created: WorkerSlot = { language, worker: this.spawn(language) };
      created.worker.onMessage((msg) => {
        const pending = created.pending;
        if (pending && (msg.id === pending.id || msg.id === WORKER_CRASH_ID)) pending.handle(msg);
      });
      this.slots.set(language, created);
      slot = created;
    }
    return slot;
  }

  /** Terminates a worker and forgets it, so the next request spawns a fresh one. */
  private kill(slot: WorkerSlot): void {
    slot.pending = undefined;
    if (this.slots.get(slot.language) === slot) this.slots.delete(slot.language);
    slot.worker.terminate();
  }

  /**
   * Sends one request and waits for its outcome. Kills the worker on timeout,
   * on output overflow and on abort (which rejects with an `AbortError`).
   */
  private request(
    slot: WorkerSlot,
    msg: HostMessage,
    timeoutMs: number,
    signal: AbortSignal | undefined,
    collector?: OutputCollector,
  ): Promise<Outcome> {
    return new Promise<Outcome>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        if (slot.pending?.id === msg.id) slot.pending = undefined;
      };
      const finish = (outcome: Outcome, killWorker = false) => {
        cleanup();
        if (killWorker) this.kill(slot);
        resolve(outcome);
      };
      const onAbort = () => {
        cleanup();
        this.kill(slot);
        reject(abortError());
      };
      const timer = setTimeout(() => finish({ kind: 'timeout' }, true), timeoutMs);

      slot.pending = {
        id: msg.id,
        handle: (reply) => {
          if (reply.type === 'output') {
            if (collector && !collector.push(reply.stream, reply.chunk)) finish({ kind: 'output_limit' }, true);
          } else if (reply.type === 'done') {
            finish({ kind: 'done', result: reply.result });
          } else {
            finish({ kind: 'failed', reason: reply.reason, message: reply.message });
          }
        },
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
