// Node-only entry: the one module allowed to import `node:worker_threads`.
// Used by the tests and by the content validation script.
import { Worker } from 'node:worker_threads';
import type { Language } from '@birb-learn/content-schema';
import { BrowserRunner, type WorkerLike } from './browser-runner';
import { workerCrashMessage, type HostMessage, type WorkerMessage } from './worker/messages';

/** Spawns the engine worker as a `worker_threads` worker, running its TypeScript source through tsx. */
export function spawnNodeWorker(language: Language): WorkerLike {
  const worker = new Worker(new URL('./worker/engine-worker.ts', import.meta.url), {
    execArgv: ['--import', import.meta.resolve('tsx')],
    name: `code-runner-${language}`,
  });
  // Idle workers must not keep the process alive; pending requests hold a timer.
  worker.unref();
  let terminated = false;
  return {
    postMessage: (msg: HostMessage) => worker.postMessage(msg),
    onMessage: (cb: (msg: WorkerMessage) => void) => {
      worker.on('message', cb);
      // Without an `error` listener a crash would be rethrown in the host.
      worker.on('error', (error) => cb(workerCrashMessage(error.message)));
      worker.on('exit', (code) => {
        if (!terminated) cb(workerCrashMessage(`The worker exited with code ${code}`));
      });
    },
    terminate: () => {
      terminated = true;
      void worker.terminate();
    },
  };
}

/** A runner backed by Node workers (tests and content validation). */
export function createNodeRunner(): BrowserRunner {
  return new BrowserRunner(spawnNodeWorker);
}
