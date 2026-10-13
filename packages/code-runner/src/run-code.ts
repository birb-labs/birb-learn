import { BrowserRunner } from './browser-runner';
import { LANGUAGE_INFO } from './languages';
import type { RunResult, Runner } from './protocol';
import { spawnBrowserWorker } from './spawn-browser';

const UNAVAILABLE: RunResult = { status: 'unavailable', cases: [] };

/**
 * Routes each run by the engine of its language: `browser` languages go to
 * `browser`, `remote` languages to `remote`. Without a `remote` runner a
 * remote language is `unavailable`.
 */
export function createRunner({ browser, remote }: { browser: Runner; remote?: Runner }): Runner {
  return {
    runCode(req, opts) {
      if (LANGUAGE_INFO[req.language].engine === 'browser') return browser.runCode(req, opts);
      if (remote) return remote.runCode(req, opts);
      return Promise.resolve({ ...UNAVAILABLE, cases: [] });
    },
  };
}

/** A runner backed by Web Workers (the site and the admin). */
export function createBrowserRunner(): BrowserRunner {
  return new BrowserRunner(spawnBrowserWorker);
}
