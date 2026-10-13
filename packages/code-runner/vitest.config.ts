import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // WASM runtimes (Pyodide, PGlite, ...) load slowly on a cold start.
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});
