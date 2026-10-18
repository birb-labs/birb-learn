import { describe, expect, it } from 'vitest';
import ptBR from './pt-BR.json';
import enUS from './en-US.json';
import es from './es.json';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('translation message parity', () => {
  it('has the same keys in pt-BR, en-US and es', () => {
    const ptKeys = flattenKeys(ptBR).sort();
    const enKeys = flattenKeys(enUS).sort();
    const esKeys = flattenKeys(es).sort();

    expect(enKeys).toEqual(ptKeys);
    expect(esKeys).toEqual(ptKeys);
  });
});

function collect(value: unknown, key: string, found: string[] = []): string[] {
  if (typeof value !== 'object' || value === null) return found;
  for (const [name, child] of Object.entries(value as Record<string, unknown>)) {
    if (name === key && typeof child === 'string') found.push(child);
    else collect(child, key, found);
  }
  return found;
}

const LOCALES = [
  ['pt-BR', ptBR],
  ['en-US', enUS],
  ['es', es],
] as const;

describe.each(LOCALES)('%s message format', (_locale, messages) => {
  it('writes every retry countdown as "{seconds} s"', () => {
    const countdowns = collect(messages, 'retryIn');
    expect(countdowns.length).toBeGreaterThanOrEqual(2);
    for (const text of countdowns) expect(text).toMatch(/\{seconds\} s(?!\w)/);
  });

  it('uses the ellipsis character, not three dots, in the code and lab strings', () => {
    const code = JSON.stringify([(messages as Record<string, unknown>).code, (messages as Record<string, unknown>).lab]);
    expect(code).not.toContain('...');
  });

  it('names godbolt.org and Compiler Explorer in the remote notice', () => {
    const [notice] = collect((messages as Record<string, unknown>).code, 'remoteNotice');
    expect(notice).toContain('godbolt.org');
    expect(notice).toContain('Compiler Explorer');
  });
});
