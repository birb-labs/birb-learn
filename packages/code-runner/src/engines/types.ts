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

/**
 * What engines need from the platform they run on. Engines are bundled into
 * browser workers, so they never touch Node APIs themselves: the worker passes
 * a Node implementation (`worker/node-env.ts`) or a browser one (CDN + `fetch`).
 */
export interface EngineEnv {
  /**
   * Where a runtime loader finds a file of a runtime package: a filesystem path
   * in Node, the CDN URL in browsers. `''` names the package directory itself
   * (with a trailing separator).
   */
  assetLocation(pkg: RuntimePackage, path: string): string;
  /** The contents of a file of a runtime package; rejects when it cannot be loaded. */
  readAsset(pkg: RuntimePackage, path: string): Promise<Uint8Array>;
  /**
   * Imports an ES module file of a runtime package, unbundled: from
   * `node_modules` in Node, from the CDN in browsers. For runtimes that cannot
   * go through the site bundler (see the engines that use it).
   */
  importModule(pkg: RuntimePackage, path: string): Promise<unknown>;
  /**
   * Makes `handler` receive the reason of every promise rejection of the worker
   * that nothing handles, instead of letting it crash the worker. Call once.
   */
  onUnhandledRejection(handler: (reason: unknown) => void): void;
}

export type EngineFactory = (env: EngineEnv) => Promise<Engine>;
