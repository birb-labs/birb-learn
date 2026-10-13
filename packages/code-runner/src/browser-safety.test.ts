import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
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

// Relative `from '...'` and side-effect `import '...'` specifiers. Type-only
// ones are erased, but following them too is the conservative choice.
const RELATIVE_SPECIFIER = /(?:\bfrom\s+|^\s*import\s+)['"](\.{1,2}\/[^'"]+)['"]/gm;
// Any `node:` specifier: static, side-effect or dynamic.
const ANY_NODE_SPECIFIER = /\bfrom\s+['"]node:|^\s*import\s+['"]node:|\bimport\(\s*['"]node:/m;

function resolveRelative(from: string, specifier: string): string {
  const base = join(dirname(from), specifier);
  return [`${base}.ts`, join(base, 'index.ts')].find((path) => existsSync(path) && statSync(path).isFile()) ?? base;
}

/** Every file reachable from `entry` through relative imports, `entry` included. */
function reachableFrom(entry: string): string[] {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(RELATIVE_SPECIFIER)) queue.push(resolveRelative(file, match[1]));
  }
  return [...seen];
}

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

  it('reaches no node: specifier from the public entry point', () => {
    const reachable = reachableFrom(join(SRC, 'index.ts'));
    // Guards the walk itself: the entry point must really pull in the runner.
    expect(reachable.map((path) => relative(SRC, path))).toEqual(
      expect.arrayContaining(['index.ts', 'run-code.ts', 'browser-runner.ts', 'spawn-browser.ts']),
    );
    const offenders = reachable
      .filter((path) => ANY_NODE_SPECIFIER.test(readFileSync(path, 'utf8')))
      .map((path) => relative(SRC, path));
    expect(offenders).toEqual([]);
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
