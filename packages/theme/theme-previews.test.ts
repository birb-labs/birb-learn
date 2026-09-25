/**
 * @vitest-environment node
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { THEME_PREVIEWS } from './theme-previews';
import { THEME_NAMES, type ResolvedMode } from './theme-types';

const tokensPath = fileURLToPath(new URL('./tokens.css', import.meta.url));
const tokensCss = readFileSync(tokensPath, 'utf-8');

const THEME_MODE_BLOCK = /html\[data-theme="([a-z]+)"\]\[data-mode="(light|dark)"\]\s*\{([^}]*)\}/g;

function readTokens(theme: string, mode: string): Record<string, string> {
  for (const match of tokensCss.matchAll(THEME_MODE_BLOCK)) {
    if (match[1] === theme && match[2] === mode) {
      const tokens: Record<string, string> = {};
      for (const [, name, value] of match[3].matchAll(/(--[a-z-]+)\s*:\s*([^;]+);/g)) {
        tokens[name] = value.trim().toLowerCase();
      }
      return tokens;
    }
  }
  throw new Error(`No tokens.css block for ${theme}/${mode}`);
}

const MODES: ResolvedMode[] = ['light', 'dark'];

describe('THEME_PREVIEWS', () => {
  it('has an entry for every theme and resolved mode', () => {
    expect(Object.keys(THEME_PREVIEWS).sort()).toEqual([...THEME_NAMES].sort());
    for (const theme of THEME_NAMES) {
      expect(Object.keys(THEME_PREVIEWS[theme]).sort()).toEqual([...MODES].sort());
    }
  });

  for (const theme of THEME_NAMES) {
    for (const mode of MODES) {
      it(`${theme}/${mode} matches tokens.css`, () => {
        const tokens = readTokens(theme, mode);
        expect(THEME_PREVIEWS[theme][mode]).toEqual({
          background: tokens['--color-background'],
          accent: tokens['--color-accent'],
        });
      });
    }
  }
});
