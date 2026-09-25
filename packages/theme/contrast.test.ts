/**
 * @vitest-environment node
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const tokensPath = fileURLToPath(new URL('./tokens.css', import.meta.url));
const tokensCss = readFileSync(tokensPath, 'utf-8');

const THEME_MODE_BLOCK = /html\[data-theme="([a-z]+)"\]\[data-mode="(light|dark)"\]\s*\{([^}]*)\}/g;

interface PaletteBlock {
  theme: string;
  mode: string;
  tokens: Record<string, string>;
}

function parseBlocks(css: string): PaletteBlock[] {
  return [...css.matchAll(THEME_MODE_BLOCK)].map((match) => {
    const tokens: Record<string, string> = {};
    for (const [, name, value] of match[3].matchAll(/(--[a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
      tokens[name] = value.toLowerCase();
    }
    return { theme: match[1], mode: match[2], tokens };
  });
}

function channelToLinear(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance of a `#rrggbb` colour. */
function relativeLuminance(hex: string): number {
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channelToLinear(red) + 0.7152 * channelToLinear(green) + 0.0722 * channelToLinear(blue);
}

/** WCAG 2.x contrast ratio between two `#rrggbb` colours (1 to 21). */
function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

interface ContrastRule {
  foreground: string[];
  background: string[];
  min: number;
}

const RULES: ContrastRule[] = [
  { foreground: ['--color-foreground'], background: ['--color-background', '--color-elevated', '--color-surface'], min: 4.5 },
  { foreground: ['--color-muted'], background: ['--color-background', '--color-elevated'], min: 4.5 },
  { foreground: ['--color-accent'], background: ['--color-background', '--color-elevated', '--color-accent-soft'], min: 4.5 },
  { foreground: ['--color-on-accent'], background: ['--color-accent'], min: 4.5 },
  { foreground: ['--color-rail-foreground'], background: ['--color-rail-background'], min: 4.5 },
  { foreground: ['--color-rail-accent'], background: ['--color-rail-background'], min: 3.0 },
  {
    foreground: ['--color-success', '--color-danger', '--color-warning', '--color-info'],
    background: ['--color-elevated'],
    min: 3.0,
  },
];

describe('theme contrast', () => {
  const blocks = parseBlocks(tokensCss);

  it('parses all 4 themes x 2 modes', () => {
    expect(blocks).toHaveLength(8);
  });

  it.each(blocks.map((block) => [`${block.theme}/${block.mode}`, block] as const))(
    '%s meets the WCAG contrast minimums',
    (_label, block) => {
      const failures: string[] = [];
      for (const rule of RULES) {
        for (const foreground of rule.foreground) {
          for (const background of rule.background) {
            const fgValue = block.tokens[foreground];
            const bgValue = block.tokens[background];
            const pair = `${block.theme}/${block.mode}: ${foreground} on ${background}`;
            if (!fgValue || !bgValue) {
              failures.push(`${pair} is missing (${foreground}=${fgValue}, ${background}=${bgValue})`);
              continue;
            }
            const ratio = contrastRatio(fgValue, bgValue);
            if (ratio < rule.min) {
              failures.push(`${pair} is ${ratio.toFixed(2)}:1, needs ${rule.min}:1`);
            }
          }
        }
      }
      expect(failures, failures.join('\n')).toEqual([]);
    },
  );
});
