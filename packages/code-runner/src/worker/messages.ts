import type { Language } from '@birb-learn/content-schema';
import type { EngineCaseInput, EngineCaseOutput } from '../engines/types';

/** Host to worker. The host always sends `compile` before the cases. */
export type HostMessage =
  | { id: number; type: 'compile'; language: Language; source: string }
  | { id: number; type: 'run'; language: Language; input: EngineCaseInput };

export type CompileOutcome = { compileOutput: string | null };

/** Worker to host. Every message carries the `id` of the request it answers. */
export type WorkerMessage =
  | { id: number; type: 'output'; stream: 'stdout' | 'stderr'; chunk: string }
  | { id: number; type: 'done'; result: EngineCaseOutput | CompileOutcome }
  | { id: number; type: 'failed'; reason: 'engine_load' | 'internal'; message: string };

/**
 * Id of the `failed/internal` message the spawn wrappers synthesize when the
 * worker itself crashes or exits: it fails whatever request is pending.
 */
export const WORKER_CRASH_ID = -1;

export function workerCrashMessage(message: string): WorkerMessage {
  return { id: WORKER_CRASH_ID, type: 'failed', reason: 'internal', message };
}
