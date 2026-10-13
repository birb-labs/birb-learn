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

// Comments a dynamic `import(...)` may carry before its specifier (bundler hints).
const HINTS = String.raw`(?:\/\*[\s\S]*?\*\/\s*)*`;
// Relative `from '...'`, side-effect `import '...'` and dynamic `import('...')`
// specifiers (the engine registry loads every engine dynamically). Type-only
// ones are erased, but following them too is the conservative choice.
const RELATIVE_SPECIFIER = new RegExp(
  String.raw`(?:\bfrom\s+|^\s*import\s+|\bimport\(\s*${HINTS})['"](\.{1,2}\/[^'"]+)['"]`,
  'gm',
);
// Any `node:` specifier: static, side-effect, dynamic or `require`d.
const ANY_NODE_SPECIFIER = new RegExp(
  String.raw`\bfrom\s+['"]node:|^\s*import\s+['"]node:|\b(?:import|require)\(\s*${HINTS}['"\`]node:`,
  'm',
);

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

  it('keeps every engine free of node: specifiers', () => {
    // Engines reach Node-only operations through their `EngineEnv`.
    const offenders = sourceFiles(join(SRC, 'engines'))
      .filter((path) => ANY_NODE_SPECIFIER.test(readFileSync(path, 'utf8')))
      .map((path) => relative(SRC, path));
    expect(offenders).toEqual([]);
  });

  it('reaches no node: specifier from the worker entry, engines included', () => {
    const reachable = reachableFrom(join(SRC, 'worker', 'engine-worker.ts')).map((path) => relative(SRC, path));
    // Guards the walk itself: it must follow the registry's dynamic imports into every engine.
    expect(reachable).toEqual(
      expect.arrayContaining([
        join('engines', 'registry.ts'),
        ...['javascript', 'typescript', 'python', 'lua', 'ruby', 'sqlite', 'postgresql'].map((name) =>
          join('engines', `${name}.ts`),
        ),
      ]),
    );
    const offenders = reachable
      .filter((path) => !NODE_ONLY.includes(path))
      .filter((path) => ANY_NODE_SPECIFIER.test(readFileSync(join(SRC, path), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('follows dynamic relative imports and detects every kind of node: specifier', () => {
    const relative = (source: string) => [...source.matchAll(RELATIVE_SPECIFIER)].map((match) => match[1]);
    expect(relative("const m = import('./javascript');")).toEqual(['./javascript']);
    expect(relative('import(/* webpackIgnore: true */ "../x.ts")')).toEqual(['../x.ts']);
    expect(relative("import('pyodide')")).toEqual([]);
    const cases: [string, boolean][] = [
      ["const { readFile } = await import('node:fs/promises');", true],
      ['await import(/* @vite-ignore */ "node:url")', true],
      ["require('node:fs')", true],
      ["import 'node:fs';", true],
      ["import { x } from 'node:fs';", true],
      ["const NODE_ENV_MODULE = './node-env.ts';", false],
      ["await import('pyodide')", false],
    ];
    for (const [source, expected] of cases) expect([source, ANY_NODE_SPECIFIER.test(source)]).toEqual([source, expected]);
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
