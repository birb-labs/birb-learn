/**
 * @vitest-environment node
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const tokensPath = fileURLToPath(new URL('./tokens.css', import.meta.url));
const tokensCss = readFileSync(tokensPath, 'utf-8');

const THEME_MODE_BLOCK = /html\[data-theme="([a-z]+)"\]\[data-mode="(light|dark)"\]\s*\{([^}]*)\}/g;

function extractPropertyNames(blockBody: string): string[] {
  return [...blockBody.matchAll(/(--[a-z-]+)\s*:/g)].map((match) => match[1]).sort();
}

describe('theme tokens', () => {
  it('defines the same set of custom properties in every theme x mode block', () => {
    const blocks = [...tokensCss.matchAll(THEME_MODE_BLOCK)];
    expect(blocks).toHaveLength(8); // 4 themes x 2 modes

    const propertySets = blocks.map((match) => ({
      theme: match[1],
      mode: match[2],
      properties: extractPropertyNames(match[3]),
    }));

    const [first, ...rest] = propertySets;
    expect(first.properties.length).toBeGreaterThan(0);
    for (const block of rest) {
      expect(block.properties).toEqual(first.properties);
    }
  });
});
