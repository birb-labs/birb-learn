import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('.', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

// Engines and the worker entry are bundled into browser workers: `node:*`
// modules may only be reached through guarded dynamic imports.
describe('browser safety', () => {
  it('has no static node: imports outside node.ts', () => {
    const offenders = sourceFiles(SRC)
      .filter((path) => relative(SRC, path) !== 'node.ts')
      .filter((path) => /^\s*(import|export)\b[^;]*?\bfrom\s+['"]node:|^\s*import\s+['"]node:/m.test(readFileSync(path, 'utf8')))
      .map((path) => relative(SRC, path));
    expect(offenders).toEqual([]);
  });
});
