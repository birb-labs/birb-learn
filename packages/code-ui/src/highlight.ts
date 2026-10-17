// Type-only deep import: the content-schema barrel would pull Drizzle into browser bundles.
import type { Language } from '@birb-learn/content-schema/src/code-languages';
// Deep import: the code-runner barrel would pull the workers and engines into this graph.
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
import { createHighlighterCore, createCssVariablesTheme, type HighlighterCore, type LanguageInput } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

export interface HighlightedToken {
  text: string;
  /** A `var(--code-…)` reference, so the colour follows the active theme and mode. */
  color?: string;
  fontStyle?: 'italic' | 'bold';
}

export type HighlightedLine = HighlightedToken[];

// Shiki's FontStyle bit flags (the enum itself is not exported by the core entry).
const FONT_STYLE_ITALIC = 1;
const FONT_STYLE_BOLD = 2;

// One loader per Shiki grammar used by `LANGUAGE_INFO[…].shikiLang`; this is the
// whole set of grammars that ever ships. The SQL dialects share one grammar.
const GRAMMAR_LOADERS: Record<string, () => LanguageInput> = {
  c: () => import('shiki/langs/c.mjs'),
  cpp: () => import('shiki/langs/cpp.mjs'),
  go: () => import('shiki/langs/go.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  lua: () => import('shiki/langs/lua.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  ruby: () => import('shiki/langs/ruby.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
};

const THEME_NAME = 'birb-code';

// Colours are `var(--code-token-…)` strings resolved by the `--code-*` custom
// properties in `@birb-learn/theme`, so one highlighted result serves every
// theme and mode. The JavaScript regex engine avoids shipping the Oniguruma
// wasm to the browser.
let highlighterPromise: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [createCssVariablesTheme({ name: THEME_NAME, variablePrefix: '--code-' })],
    langs: Object.values(GRAMMAR_LOADERS).map((load) => load()),
    engine: createJavaScriptRegexEngine(),
  });
  return highlighterPromise;
}

function toFontStyle(flags: number | undefined): HighlightedToken['fontStyle'] {
  if (flags === undefined || flags < 0) return undefined;
  if (flags & FONT_STYLE_ITALIC) return 'italic';
  if (flags & FONT_STYLE_BOLD) return 'bold';
  return undefined;
}

export async function highlightCode(code: string, language: Language): Promise<HighlightedLine[]> {
  // A trailing newline terminates the last line; it does not start another one.
  const source = code.endsWith('\n') ? code.slice(0, -1) : code;
  if (source === '') return [];
  const highlighter = await getHighlighter();
  const lines = highlighter.codeToTokensBase(source, {
    lang: LANGUAGE_INFO[language].shikiLang,
    theme: THEME_NAME,
  });
  return lines.map((line) =>
    line.map((token) => {
      const result: HighlightedToken = { text: token.content };
      if (token.color) result.color = token.color;
      const fontStyle = toFontStyle(token.fontStyle);
      if (fontStyle) result.fontStyle = fontStyle;
      return result;
    }),
  );
}
