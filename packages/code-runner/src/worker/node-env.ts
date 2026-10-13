// Node-only half of the engine worker. `engine-worker.ts` loads it through a
// bundler-ignored dynamic import, so it never reaches a browser bundle.
import { existsSync, readFileSync } from 'node:fs';
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

/**
 * `file://` URL of the `package.json` of an installed runtime package. A package
 * whose `exports` map hides its manifest is found by walking up from its entry point.
 */
export function packageManifestUrl(pkg: string): string {
  try {
    return import.meta.resolve(`${pkg}/package.json`);
  } catch {
    let directory = new URL('.', import.meta.resolve(pkg));
    for (;;) {
      const manifest = new URL('package.json', directory);
      if (existsSync(manifest) && (JSON.parse(readFileSync(manifest, 'utf8')) as { name?: string }).name === pkg) {
        return manifest.href;
      }
      const parent = new URL('..', directory);
      if (parent.href === directory.href) throw new Error(`Cannot find the manifest of ${pkg}`);
      directory = parent;
    }
  }
}

/** `file://` URL of a file of an installed runtime package. */
export function nodeAssetUrl(pkg: RuntimePackage, path: string): string {
  return new URL(path, packageManifestUrl(pkg)).href;
}
