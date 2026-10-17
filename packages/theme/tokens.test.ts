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

  it('defines every code highlighting variable in every theme x mode block', () => {
    // The Shiki css-variables theme (variablePrefix `--code-`) emits these, and
    // CodeLines reads the surface variables.
    const required = [
      '--code-background',
      '--code-foreground',
      '--code-line-highlight',
      '--code-line-number',
      '--code-selection',
      ...['constant', 'string', 'comment', 'keyword', 'parameter', 'function', 'string-expression', 'punctuation', 'link', 'inserted', 'deleted', 'changed'].map((name) => `--code-token-${name}`),
      ...['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].flatMap((name) => [`--code-ansi-${name}`, `--code-ansi-bright-${name}`]),
    ];
    for (const match of tokensCss.matchAll(THEME_MODE_BLOCK)) {
      const properties = extractPropertyNames(match[3]);
      for (const name of required) {
        expect(properties, `${match[1]}/${match[2]} is missing ${name}`).toContain(name);
      }
    }
  });
});
