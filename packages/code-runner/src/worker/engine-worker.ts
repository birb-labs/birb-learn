// Worker entry: runs in a browser Web Worker or a Node `worker_threads`
// worker. It is bundled for the browser, so `node:*` modules are only reached
// through dynamic imports behind an environment check.
import type { Language } from '@birb-learn/content-schema';
import { ENGINE_LOADERS } from '../engines/registry';
import type { Engine, EngineEnv } from '../engines/types';
import { cdnAssetUrl, type RuntimePackage } from '../runtime-assets';
import type { HostMessage, WorkerMessage } from './messages';

interface Port {
  post(msg: WorkerMessage): void;
  listen(cb: (msg: HostMessage) => void): void;
}

class EngineLoadError extends Error {}

const isNode = typeof process !== 'undefined' && !!process.versions?.node;

const env: EngineEnv = {
  isNode,
  assetUrl: isNode ? nodeAssetUrl : cdnAssetUrl,
};

function nodeAssetUrl(pkg: RuntimePackage, path: string): string {
  return new URL(path, import.meta.resolve(`${pkg}/package.json`)).href;
}

const engines = new Map<Language, Promise<Engine>>();

// One engine per language, created on first use and reused afterwards.
function getEngine(language: Language): Promise<Engine> {
  let engine = engines.get(language);
  if (!engine) {
    const loader = ENGINE_LOADERS[language];
    engine = (async () => {
      try {
        if (!loader) throw new Error(`No browser engine for ${language}`);
        return await (await loader())(env);
      } catch (error) {
        engines.delete(language);
        throw new EngineLoadError(errorMessage(error));
      }
    })();
    engines.set(language, engine);
  }
  return engine;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function handle(msg: HostMessage, port: Port): Promise<void> {
  try {
    const engine = await getEngine(msg.language);
    if (msg.type === 'compile') {
      const compileOutput = engine.compile ? await engine.compile(msg.source) : null;
      port.post({ id: msg.id, type: 'done', result: { compileOutput } });
    } else {
      const result = await engine.runCase(msg.input, (stream, chunk) =>
        port.post({ id: msg.id, type: 'output', stream, chunk }),
      );
      port.post({ id: msg.id, type: 'done', result });
    }
  } catch (error) {
    const reason = error instanceof EngineLoadError ? 'engine_load' : 'internal';
    port.post({ id: msg.id, type: 'failed', reason, message: errorMessage(error) });
  }
}

function start(port: Port): void {
  // Requests are handled one at a time, in arrival order.
  let queue = Promise.resolve();
  port.listen((msg) => {
    queue = queue.then(() => handle(msg, port));
  });
}

interface BrowserScope {
  postMessage(msg: unknown): void;
  addEventListener(type: 'message', cb: (event: MessageEvent) => void): void;
}

const scope = (globalThis as { self?: Partial<BrowserScope> }).self;
if (scope && typeof scope.postMessage === 'function' && typeof scope.addEventListener === 'function') {
  // Listen synchronously so no message is dropped while the module evaluates.
  const browser = scope as BrowserScope;
  start({
    post: (msg) => browser.postMessage(msg),
    listen: (cb) => browser.addEventListener('message', (event) => cb(event.data as HostMessage)),
  });
} else {
  // `parentPort` queues messages until a listener is attached.
  void import('node:worker_threads').then(({ parentPort }) => {
    if (!parentPort) throw new Error('engine-worker must run inside a worker thread');
    start({
      post: (msg) => parentPort.postMessage(msg),
      listen: (cb) => parentPort.on('message', cb),
    });
  });
}
