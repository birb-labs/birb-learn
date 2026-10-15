import { BrowserRunner } from './browser-runner';
import { LANGUAGE_INFO } from './languages';
import type { RunResult, Runner } from './protocol';
import { createCompilerExplorerRunner } from './remote/compiler-explorer';
import { spawnBrowserWorker } from './spawn-browser';

/**
 * Routes each run by the engine of its language: `browser` languages go to
 * `browser`, `remote` languages to `remote`. Read-only (`none`)
 * languages never reach a runner. Both are `unavailable`, as is a remote
 * language without a `remote` runner.
 */
export function createRunner({ browser, remote }: { browser: Runner; remote?: Runner }): Runner {
  return {
    runCode(req, opts) {
      const info = LANGUAGE_INFO[req.language];
      if (info.engine === 'none') {
        return Promise.resolve({
          status: 'unavailable',
          reason: 'read_only',
          message: `${info.label} code is read-only in this lab`,
          cases: [],
        });
      }
      if (info.engine === 'browser') return browser.runCode(req, opts);
      if (remote) return remote.runCode(req, opts);
      return Promise.resolve({
        status: 'unavailable',
        reason: 'service_error',
        message: 'No remote runner configured',
        cases: [],
      });
    },
  };
}

/** A runner backed by Web Workers (the site and the admin). */
export function createBrowserRunner(): BrowserRunner {
  return new BrowserRunner(spawnBrowserWorker);
}

// One Compiler Explorer runner per page: its queue (one request in flight), request
// budget and cache must be shared by every caller, however many site runners exist.
let siteRemoteRunner: Runner | undefined;

/**
 * The runner of the site: Web Workers for browser languages, Compiler Explorer for the
 * compiled ones. The Compiler Explorer runner is created once and shared by every call,
 * so all site runners on a page share one queue, budget and cache (use
 * `createCompilerExplorerRunner` directly for an independent instance).
 */
export function createSiteRunner(): Runner {
  siteRemoteRunner ??= createCompilerExplorerRunner();
  return createRunner({ browser: createBrowserRunner(), remote: siteRemoteRunner });
}
