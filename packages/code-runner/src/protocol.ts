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
  /** Per case, default 5000 ms, max 10000 ms. Ignored by remote (Compiler Explorer) runs, which enforce their own 20 s limit. */
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
  /** Set only when `reason` is `'rate_limited'`: how long to wait before a retry can succeed. */
  retryAfterMs?: number;
  cases: CaseResult[];
}

/**
 * Progress of a run, for the UI. `loading_engine` is reported at most once per
 * run, when the run has to wait for a worker to load its engine (not when the
 * engine is already loaded). Every case reports `case_started` then, when it
 * finishes, `case_done` (cached remote cases included); a run that stops early
 * (compile error, `unavailable`, abort) reports no more events.
 */
export type RunProgress =
  | { phase: 'loading_engine' }
  | { phase: 'case_started'; caseIndex: number; caseCount: number }
  | { phase: 'case_done'; caseIndex: number; caseCount: number };

export interface RunOptions {
  signal?: AbortSignal;
  /** Called synchronously by the runner; an exception it throws is ignored. */
  onProgress?: (progress: RunProgress) => void;
}

export interface Runner {
  runCode(req: RunRequest, opts?: RunOptions): Promise<RunResult>;
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

/** Reports `progress` to `onProgress`, ignoring a missing or throwing callback: progress must never break a run. */
export function reportProgress(onProgress: RunOptions['onProgress'], progress: RunProgress): void {
  try {
    onProgress?.(progress);
  } catch {
    // A broken progress listener is the UI's bug, not the run's.
  }
}
