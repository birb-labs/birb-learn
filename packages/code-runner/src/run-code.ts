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

/** The runner of the site: Web Workers for browser languages, Compiler Explorer for the compiled ones. */
export function createSiteRunner(): Runner {
  return createRunner({ browser: createBrowserRunner(), remote: createCompilerExplorerRunner() });
}
