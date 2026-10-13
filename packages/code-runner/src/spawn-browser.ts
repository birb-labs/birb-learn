import type { Language } from '@birb-learn/content-schema';
import type { WorkerLike } from './browser-runner';
import { workerCrashMessage, type WorkerMessage } from './worker/messages';

/** Spawns the engine worker as a module Web Worker. */
export function spawnBrowserWorker(language: Language): WorkerLike {
  const worker = new Worker(new URL('./worker/engine-worker.ts', import.meta.url), {
    type: 'module',
    name: `code-runner-${language}`,
  });
  return {
    postMessage: (msg) => worker.postMessage(msg),
    onMessage: (cb) => {
      worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => cb(event.data));
      // A crash (e.g. an error thrown from a timer of the program) fails the pending request.
      worker.addEventListener('error', (event) => {
        event.preventDefault();
        cb(workerCrashMessage(event.message || 'The worker crashed'));
      });
      worker.addEventListener('messageerror', () => cb(workerCrashMessage('The worker sent an unreadable message')));
    },
    terminate: () => worker.terminate(),
  };
}
