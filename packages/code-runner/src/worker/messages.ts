import type { Language } from '@birb-learn/content-schema';
import type { EngineCaseInput, EngineCaseOutput } from '../engines/types';

/** Host to worker. The host always sends `compile` before the cases. */
export type HostMessage =
  | { id: number; type: 'compile'; language: Language; source: string }
  | { id: number; type: 'run'; language: Language; input: EngineCaseInput };

export type CompileOutcome = { compileOutput: string | null };

/**
 * Worker to host. Every message carries the `id` of the request it answers.
 * `engine_ready` is sent for every request once the engine of its language is
 * loaded (immediately when cached), before compiling or running.
 */
export type WorkerMessage =
  | { id: number; type: 'engine_ready' }
  | { id: number; type: 'output'; stream: 'stdout' | 'stderr'; chunk: string }
  | { id: number; type: 'done'; result: EngineCaseOutput | CompileOutcome }
  | { id: number; type: 'failed'; reason: 'engine_load' | 'internal'; message: string };

/** The worker side of the channel to the host. */
export interface WorkerPort {
  post(msg: WorkerMessage): void;
  listen(cb: (msg: HostMessage) => void): void;
}

/**
 * Id of the `failed/internal` message the spawn wrappers synthesize when the
 * worker itself crashes or exits: the host drops that worker and fails the
 * pending request, if any.
 */
export const WORKER_CRASH_ID = -1;

export function workerCrashMessage(message: string): WorkerMessage {
  return { id: WORKER_CRASH_ID, type: 'failed', reason: 'internal', message };
}
