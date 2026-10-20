import { createBrowserRunner, createCompilerExplorerRunner, createRunner } from '@birb-learn/code-runner';
import type { Runner } from '@birb-learn/code-runner/src/protocol';

let adminRunner: Runner | undefined;

/**
 * The one code runner of the admin (Web Workers for the browser languages,
 * Compiler Explorer for the compiled ones), created on first use so loading
 * the admin never spawns a worker. The runner runs in the author's browser:
 * the admin has no run endpoint. Memoized, so every Verify click shares one
 * Compiler Explorer queue, request budget and cache.
 */
export function getAdminRunner(): Runner {
  adminRunner ??= createRunner({ browser: createBrowserRunner(), remote: createCompilerExplorerRunner() });
  return adminRunner;
}
