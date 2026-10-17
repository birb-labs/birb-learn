// Worker entry: runs in a browser Web Worker or a Node `worker_threads`
// worker. It is bundled for the browser, so everything Node-specific lives in
// `node-env.ts`, loaded through a dynamic import that bundlers leave alone.
import type { Language } from '@birb-learn/content-schema';
import { ENGINE_LOADERS } from '../engines/registry';
import type { Engine, EngineEnv } from '../engines/types';
import { cdnAssetUrl, cdnReadAsset } from '../runtime-assets';
import type { HostMessage, WorkerPort } from './messages';

class EngineLoadError extends Error {}

// A variable specifier (plus the ignore hints) keeps bundlers from following it.
const NODE_ENV_MODULE = './node-env.ts';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function start(port: WorkerPort, env: EngineEnv): void {
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

  async function handle(msg: HostMessage): Promise<void> {
    try {
      const engine = await getEngine(msg.language);
      port.post({ id: msg.id, type: 'engine_ready' });
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

  // Requests are handled one at a time, in arrival order.
  let queue = Promise.resolve();
  port.listen((msg) => {
    queue = queue.then(() => handle(msg));
  });
}

interface BrowserScope {
  postMessage(msg: unknown): void;
  addEventListener(type: 'message', cb: (event: MessageEvent) => void): void;
  addEventListener(type: 'unhandledrejection', cb: (event: PromiseRejectionEvent) => void): void;
}

const scope = (globalThis as { self?: Partial<BrowserScope> }).self;

if (scope && typeof scope.postMessage === 'function' && typeof scope.addEventListener === 'function') {
  // Listen synchronously so no message is dropped while the module evaluates.
  const browser = scope as BrowserScope;
  start(
    {
      post: (msg) => browser.postMessage(msg),
      listen: (cb) => browser.addEventListener('message', (event) => cb(event.data as HostMessage)),
    },
    {
      assetLocation: cdnAssetUrl,
      readAsset: cdnReadAsset,
      // A CDN URL computed at run time, which bundlers must leave alone.
      importModule: (pkg, path) => import(/* webpackIgnore: true */ /* @vite-ignore */ cdnAssetUrl(pkg, path)),
      onUnhandledRejection(handler) {
        browser.addEventListener('unhandledrejection', (event) => {
          event.preventDefault();
          handler(event.reason);
        });
      },
    },
  );
} else {
  void (
    import(/* webpackIgnore: true */ /* @vite-ignore */ NODE_ENV_MODULE) as Promise<typeof import('./node-env')>
  ).then(({ nodePort, nodeEngineEnv }) => start(nodePort(), nodeEngineEnv));
}
