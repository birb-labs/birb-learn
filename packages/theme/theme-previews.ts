import type { ResolvedMode, ThemeName } from './theme-types';

/** The two colours a theme swatch shows in the appearance panel. */
export interface ThemePreview {
  background: string;
  accent: string;
}

/**
 * Background and accent of every theme x resolved mode, mirrored from
 * `tokens.css` so swatches can render every palette at once, without
 * switching the active theme. `theme-previews.test.ts` fails if these
 * drift from the stylesheet.
 */
export const THEME_PREVIEWS: Record<ThemeName, Record<ResolvedMode, ThemePreview>> = {
  default: {
    light: { background: '#faf8f4', accent: '#c2410c' },
    dark: { background: '#17140f', accent: '#fb923c' },
  },
  solarized: {
    light: { background: '#fdf6e3', accent: '#1c6aa3' },
    dark: { background: '#002b36', accent: '#5aaee8' },
  },
  monokai: {
    light: { background: '#fafafa', accent: '#4d7a00' },
    dark: { background: '#272822', accent: '#ace43b' },
  },
  mocha: {
    light: { background: '#eff1f5', accent: '#7f2bee' },
    dark: { background: '#1e1e2e', accent: '#c398f6' },
  },
};
