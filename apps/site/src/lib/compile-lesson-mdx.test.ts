import fs from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { compileLessonMdx } from './compile-lesson-mdx';

const require = createRequire(import.meta.url);

describe('compileLessonMdx', () => {
  it('compiles Markdown headings and paragraphs', async () => {
    const element = await compileLessonMdx('# Título\n\nUm parágrafo de teste.');
    const html = renderToStaticMarkup(element);

    expect(html).toContain('<h1>Título</h1>');
    expect(html).toContain('Um parágrafo de teste.');
  });

  it('compiles inline LaTeX math into KaTeX HTML', async () => {
    const element = await compileLessonMdx('Fórmula: $x^2$.');
    const html = renderToStaticMarkup(element);

    expect(html).toContain('class="katex"');
  });

  it('strips the raw-LaTeX annotation element while keeping the MathML accessibility tree', async () => {
    const element = await compileLessonMdx('Fórmula: $x^2$.');
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain('<annotation');
    expect(html).not.toContain('x^2');
    expect(html).toContain('class="katex-mathml"');
  });

  it('rejects malformed MDX with a thrown error rather than silently producing empty output', async () => {
    await expect(compileLessonMdx('<Unclosed')).rejects.toThrow();
  });

  it('emits KaTeX size classes that exist in the stylesheet the site imports', async () => {
    // globals.css imports katex/dist/katex.min.css. If rehype-katex renders
    // with a different katex version, class names drift (0.18 renamed
    // `.sizing` to `.katex-sizing`) and sub/superscripts render full-size,
    // overlapping their neighbors.
    const css = fs.readFileSync(require.resolve('katex/dist/katex.min.css'), 'utf8');
    const element = await compileLessonMdx('$E_{c,\\text{final}} = \\frac{m v_f^2}{2}$');
    const html = renderToStaticMarkup(element);

    const selectors = [...html.matchAll(/class="(?:[^"]*\s)?(\S+) (reset-size\d+) (size\d+)/g)].map(
      ([, sizing, reset, size]) => `.${sizing}.${reset}.${size}`,
    );
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(css, `stylesheet has no rule for ${selector}`).toContain(selector);
    }
  });

  it('renders a paragraph made only of $$…$$ as display math', async () => {
    const html = renderToStaticMarkup(await compileLessonMdx('Texto.\n\n$$W = \\frac{m v^2}{2}$$\n\nMais texto.'));

    expect(html).toContain('katex-display');
    expect(html).not.toMatch(/<p>\s*<span class="katex">/);
  });

  it('keeps $$…$$ inline when it sits inside a sentence', async () => {
    const html = renderToStaticMarkup(await compileLessonMdx('Veja $$x^2$$ no meio da frase.'));

    expect(html).not.toContain('katex-display');
    expect(html).toContain('class="katex"');
  });

  it('still renders fenced $$ blocks as display math', async () => {
    const html = renderToStaticMarkup(await compileLessonMdx('$$\nx^2\n$$'));

    expect(html).toContain('katex-display');
  });

  it('compiles GFM (pipe) tables into real HTML tables', async () => {
    const element = await compileLessonMdx('| a | b |\n|---|---|\n| 1 | 2 |\n');
    const html = renderToStaticMarkup(element);

    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
    expect(html).toContain('<td>2</td>');
  });
});
