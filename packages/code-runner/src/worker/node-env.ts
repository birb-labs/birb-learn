// Node-only half of the engine worker. `engine-worker.ts` loads it through a
// bundler-ignored dynamic import, so it never reaches a browser bundle.
import { parentPort } from 'node:worker_threads';
import type { RuntimePackage } from '../runtime-assets';
import type { HostMessage, WorkerPort } from './messages';

/** The channel to the host thread. `parentPort` queues messages until a listener is attached. */
export function nodePort(): WorkerPort {
  const port = parentPort;
  if (!port) throw new Error('engine-worker must run inside a worker thread');
  return {
    post: (msg) => port.postMessage(msg),
    listen: (cb) => port.on('message', (msg: HostMessage) => cb(msg)),
  };
}

/** `file://` URL of a file of an installed runtime package. */
export function nodeAssetUrl(pkg: RuntimePackage, path: string): string {
  return new URL(path, import.meta.resolve(`${pkg}/package.json`)).href;
}
