// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));

// Relative `from '...'`, side-effect `import '...'`, `export ... from '...'` and
// dynamic `import('...')` specifiers. Type-only ones are erased, but following
// them too is the conservative choice.
const SPECIFIER = /(?:\bfrom\s+|^\s*import\s+|\bimport\(\s*(?:\/\*[\s\S]*?\*\/\s*)*)['"]([^'"]+)['"]/gm;

function specifiersOf(source: string): string[] {
  return [...source.matchAll(SPECIFIER)].map((match) => match[1]);
}

function resolveRelative(from: string, specifier: string): string {
  const base = join(dirname(from), specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')];
  const found = candidates.find((path) => existsSync(path) && statSync(path).isFile());
  if (!found) throw new Error(`Cannot resolve ${specifier} from ${from}`);
  return found;
}

/** Every file reachable from `entry` through relative imports, and every bare specifier met on the way. */
function walk(entry: string): { files: string[]; bare: string[] } {
  const seen = new Set<string>();
  const bare = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    // CSS modules are leaves.
    if (!/\.tsx?$/.test(file)) continue;
    for (const specifier of specifiersOf(readFileSync(file, 'utf8'))) {
      if (specifier.startsWith('.')) queue.push(resolveRelative(file, specifier));
      else bare.add(specifier);
    }
  }
  return { files: [...seen].map((path) => relative(PACKAGE_ROOT, path)), bare: [...bare] };
}

describe('code-ui entry points', () => {
  it('keeps CodeMirror out of the read-only snippet entry', () => {
    const { files, bare } = walk(join(PACKAGE_ROOT, 'index.ts'));
    // Guards the walk itself: it must really reach the snippet modules.
    expect(files).toEqual(expect.arrayContaining(['index.ts', join('src', 'highlight.ts'), join('src', 'code-lines.tsx')]));
    expect(bare.filter((specifier) => specifier.startsWith('@codemirror/') || specifier.startsWith('@lezer/'))).toEqual([]);
    expect(files.filter((file) => /code-editor|editor-|run-panel|sql-grid|output-view/.test(file))).toEqual([]);
  });

  it('puts the editor and run panel behind the editor entry', () => {
    const { files, bare } = walk(join(PACKAGE_ROOT, 'editor.ts'));
    expect(files).toEqual(
      expect.arrayContaining([join('src', 'code-editor.tsx'), join('src', 'editor-languages.ts'), join('src', 'run-panel.tsx'), join('src', 'sql-grid.tsx')]),
    );
    expect(bare).toEqual(expect.arrayContaining(['@codemirror/view', '@codemirror/state']));
  });

  it('detects bare and dynamic specifiers', () => {
    expect(specifiersOf("import { a } from '@codemirror/view';\nexport * from './x';\nawait import('@codemirror/lang-sql');\nimport './y.css';")).toEqual([
      '@codemirror/view',
      './x',
      '@codemirror/lang-sql',
      './y.css',
    ]);
  });

  it('declares the two entries and keeps only CSS as a side effect', () => {
    const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    expect(pkg.exports).toEqual({ '.': './index.ts', './editor': './editor.ts' });
    expect(pkg.sideEffects).toEqual(['*.css']);
  });
});
