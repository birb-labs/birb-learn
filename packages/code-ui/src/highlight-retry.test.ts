import { beforeEach, describe, expect, it, vi } from 'vitest';

// The highlighter is cached at module level, so this file owns its own module
// instance and wraps the real factory to inject a failure.
vi.mock('shiki/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('shiki/core')>();
  return { ...actual, createHighlighterCore: vi.fn(actual.createHighlighterCore) };
});

describe('highlightCode after a failed highlighter load', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('retries on the next call instead of caching the rejection', async () => {
    const shiki = await import('shiki/core');
    const { highlightCode } = await import('./highlight');
    vi.mocked(shiki.createHighlighterCore).mockRejectedValueOnce(new Error('chunk load failed'));

    await expect(highlightCode('print("x")', 'python')).rejects.toThrow('chunk load failed');

    const lines = await highlightCode('print("x")', 'python');
    expect(lines.map((line) => line.map((token) => token.text).join(''))).toEqual(['print("x")']);
    expect(shiki.createHighlighterCore).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight load between concurrent callers', async () => {
    const shiki = await import('shiki/core');
    const { highlightCode } = await import('./highlight');
    vi.mocked(shiki.createHighlighterCore).mockClear();

    const [first, second] = await Promise.all([highlightCode('a = 1', 'python'), highlightCode('b = 2', 'python')]);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(shiki.createHighlighterCore).toHaveBeenCalledTimes(1);
  });
});
