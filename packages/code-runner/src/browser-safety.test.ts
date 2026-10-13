import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('.', import.meta.url));
// The only modules that may statically import `node:*`.
const NODE_ONLY = ['node.ts', join('worker', 'node-env.ts')];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

// Static `import`/`export ... from 'node:...'` and side-effect imports;
// `import type` is erased and therefore allowed.
const STATIC_NODE_IMPORT = /^\s*(import|export)\b(?!\s+type\b)[^;]*?\bfrom\s+['"]node:|^\s*import\s+['"]node:/m;

// Engines and the worker entry are bundled into browser workers: `node:*`
// modules may only be reached through guarded dynamic imports.
describe('browser safety', () => {
  it('has no static node: imports outside the Node-only modules', () => {
    const offenders = sourceFiles(SRC)
      .map((path) => relative(SRC, path))
      .filter((path) => !NODE_ONLY.includes(path))
      .filter((path) => STATIC_NODE_IMPORT.test(readFileSync(join(SRC, path), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('keeps the worker entry free of node: specifiers and import.meta.resolve', () => {
    const source = readFileSync(join(SRC, 'worker', 'engine-worker.ts'), 'utf8');
    expect(source).not.toMatch(/['"`]node:/);
    expect(source).not.toContain('import.meta.resolve');
  });

  it('detects static node: imports but not type-only or dynamic ones', () => {
    const cases: [string, boolean][] = [
      ["import { Worker } from 'node:worker_threads';", true],
      ['import {\n  readFileSync,\n} from "node:fs";', true],
      ["import 'node:fs';", true],
      ["export { x } from 'node:fs';", true],
      ["import type { Worker } from 'node:worker_threads';", false],
      ["void import('node:worker_threads');", false],
    ];
    for (const [source, expected] of cases) expect([source, STATIC_NODE_IMPORT.test(source)]).toEqual([source, expected]);
  });
});
