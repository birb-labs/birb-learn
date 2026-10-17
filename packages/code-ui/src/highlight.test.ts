import { LANGUAGES } from '@birb-learn/content-schema/src/code-languages';
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
import { describe, expect, it } from 'vitest';
import { highlightCode, type HighlightedLine } from './highlight';

function lineText(line: HighlightedLine): string {
  return line.map((token) => token.text).join('');
}

describe('highlightCode', () => {
  it('turns a single statement into one line of theme-aware tokens', async () => {
    const lines = await highlightCode('print("x")\n', 'python');
    expect(lines).toHaveLength(1);
    expect(lineText(lines[0])).toBe('print("x")');
    const colors = lines[0].map((token) => token.color).filter(Boolean);
    expect(colors.length).toBeGreaterThan(0);
    for (const color of colors) {
      expect(color).toMatch(/^var\(--code-/);
    }
  });

  it('does not add an empty line for a trailing newline', async () => {
    const withNewline = await highlightCode('a = 1\nb = 2\n', 'python');
    const without = await highlightCode('a = 1\nb = 2', 'python');
    expect(withNewline).toHaveLength(2);
    expect(without).toHaveLength(2);
  });

  it('keeps interior blank lines', async () => {
    const lines = await highlightCode('a = 1\n\nb = 2\n', 'python');
    expect(lines.map(lineText)).toEqual(['a = 1', '', 'b = 2']);
  });

  it('returns no lines for empty code', async () => {
    expect(await highlightCode('', 'python')).toEqual([]);
  });

  it.each(LANGUAGES)('highlights the %s template without losing any text', async (language) => {
    const template = LANGUAGE_INFO[language].template;
    const lines = await highlightCode(template, language);
    expect(lines.map(lineText).join('\n')).toBe(template.replace(/\n$/, ''));
    // A grammar that silently failed to load would leave every token uncoloured.
    expect(lines.flat().some((token) => token.color?.startsWith('var(--code-'))).toBe(true);
  });

  it.each(LANGUAGES)('keeps a ___1___ blank inside a single %s token', async (language) => {
    const lines = await highlightCode('x = ___1___ + 1', language);
    const tokens = lines[0].filter((token) => token.text.includes('___1___'));
    expect(tokens).toHaveLength(1);
    expect(tokens[0].text.trim()).toBe('___1___');
  });

  it('only emits CSS-variable colours', async () => {
    const lines = await highlightCode(LANGUAGE_INFO.rust.template, 'rust');
    for (const token of lines.flat()) {
      if (token.color !== undefined) expect(token.color).toMatch(/^var\(--code-[a-z-]+\)$/);
    }
  });
});
