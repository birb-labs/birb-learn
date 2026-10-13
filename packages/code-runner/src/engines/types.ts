import type { SqlResultSet } from '../protocol';
import type { RuntimePackage } from '../runtime-assets';

export type Emit = (stream: 'stdout' | 'stderr', chunk: string) => void;

export interface EngineCaseInput {
  source: string;
  stdin: string;
  sqlSetup?: string;
}

/**
 * `error` set (or a non-zero `exitCode`) means `runtime_error`. The engine must
 * not write `error` to the output itself: the host appends it to stderr.
 */
export interface EngineCaseOutput {
  exitCode: number | null;
  error?: string;
  sql?: { resultSets: SqlResultSet[] };
}

export interface Engine {
  /** Returns the compiler output on failure, `null` on success. */
  compile?(source: string): Promise<string | null>;
  runCase(input: EngineCaseInput, emit: Emit): Promise<EngineCaseOutput>;
}

export interface EngineEnv {
  isNode: boolean;
  /** URL of a file of a runtime package: the CDN in browsers, `file://` in Node. */
  assetUrl(pkg: RuntimePackage, path: string): string;
}

export type EngineFactory = (env: EngineEnv) => Promise<Engine>;
