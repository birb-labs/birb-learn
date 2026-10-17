// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// A fresh module per test, so the memoized runner never leaks between tests.
async function freshGetSiteRunner() {
  vi.resetModules();
  return (await import('./site-runner')).getSiteRunner;
}

describe('getSiteRunner', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws outside the browser (SSR and static export)', async () => {
    const getSiteRunner = await freshGetSiteRunner();
    expect(typeof window).toBe('undefined');
    expect(() => getSiteRunner()).toThrow('getSiteRunner() is browser-only');
  });

  it('returns the same runner on every call in the browser', async () => {
    vi.stubGlobal('window', {});
    const getSiteRunner = await freshGetSiteRunner();
    const runner = getSiteRunner();
    expect(typeof runner.runCode).toBe('function');
    expect(getSiteRunner()).toBe(runner);
  });
});
