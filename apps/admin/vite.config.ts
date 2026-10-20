import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

// wasmoon (the Lua engine of the code runner) runs `await import('module')` in a
// branch taken only under Node; browsers never reach it, but the bundler must
// resolve it. Only the engine worker bundles wasmoon, so the stand-in is a worker
// plugin: the app and the Cloudflare worker keep resolving `module` as before.
// Same idea as the site's `turbopack.resolveAlias`.
const EMPTY_MODULE_ID = '\0empty-node-module';
function emptyNodeModule(): Plugin {
  return {
    name: 'empty-node-module',
    enforce: 'pre',
    resolveId: (source) => (source === 'module' ? EMPTY_MODULE_ID : null),
    load: (id) => (id === EMPTY_MODULE_ID ? 'export default {};' : null),
  };
}

export default defineConfig({
  // `configPath` is set explicitly because Vite's `root` below is
  // `src/client`, and @cloudflare/vite-plugin resolves its default
  // `wrangler.jsonc` lookup relative to that root, not the project root
  // where the file actually lives. Without this, the plugin silently
  // falls back to an assets-only worker (no Hono routes registered).
  plugins: [react(), cloudflare({ configPath: '../../wrangler.jsonc' })],
  root: 'src/client',
  // The code runner's engine worker (`new Worker(new URL(...), { type: 'module' })`)
  // is a code-split bundle, which the default `iife` worker format cannot express.
  worker: { format: 'es', plugins: () => [emptyNodeModule()] },
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
});
