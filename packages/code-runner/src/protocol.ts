import type { Language } from '@birb-learn/content-schema';

// Run protocol shared by the browser runner, the remote runner and the Node
// engines. Keep it free of runtime-specific types.

export type RunStatus =
  | 'ok'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'output_limit'
  | 'unavailable';

/** Why a run is `unavailable`. The UI translates by reason; `message` is for developers. */
export type UnavailableReason = 'read_only' | 'rate_limited' | 'offline' | 'service_error' | 'engine_load';

export interface RunRequest {
  language: Language;
  /** Single source file. */
  source: string;
  /** Defaults to `[{}]`: the program is compiled once and run once per case. */
  cases?: { stdin?: string }[];
  /** SQL only: executed before `source` in the same fresh database. */
  sqlSetup?: string;
  /** Per case, default 5000 ms, max 10000 ms. */
  timeoutMs?: number;
}

/** One result set; cells are normalized to strings (`NULL` becomes `null`). */
export interface SqlResultSet {
  columns: string[];
  rows: (string | null)[][];
}

export interface CaseResult {
  status: RunStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  /** SQL languages only. */
  sql?: { resultSets: SqlResultSet[] };
}

export interface RunResult {
  /** `'ok'` unless compilation failed, or `'unavailable'`. */
  status: RunStatus;
  compileOutput?: string;
  /** Set only when `status` is `'unavailable'`. */
  reason?: UnavailableReason;
  /** English developer message; set only when `status` is `'unavailable'`. */
  message?: string;
  cases: CaseResult[];
}

export interface Runner {
  runCode(req: RunRequest, opts?: { signal?: AbortSignal }): Promise<RunResult>;
}

export const DEFAULT_TIMEOUT_MS = 5000;
export const MAX_TIMEOUT_MS = 10000;
/** Budget for a worker to load the engine of a language (runtime download included). */
export const ENGINE_LOAD_TIMEOUT_MS = 120000;
/** Budget for the compile step, counted once the engine is loaded. */
export const COMPILE_TIMEOUT_MS = 20000;
/** Combined stdout + stderr per case, in UTF-8 bytes (64 KiB). */
export const OUTPUT_LIMIT_BYTES = 65536;

/** Returns the per-case timeout to use: default when missing or invalid, capped at the maximum. */
export function clampTimeout(ms?: number): number {
  if (ms === undefined || !Number.isFinite(ms) || ms <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(ms, MAX_TIMEOUT_MS);
}
