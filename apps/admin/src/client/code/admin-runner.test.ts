import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Runner } from '@birb-learn/code-runner/src/protocol';

const mocks = vi.hoisted(() => ({
  browser: { runCode: vi.fn() },
  remote: { runCode: vi.fn() },
  combined: { runCode: vi.fn() },
  createBrowserRunner: vi.fn(),
  createCompilerExplorerRunner: vi.fn(),
  createRunner: vi.fn(),
}));

vi.mock('@birb-learn/code-runner', () => {
  mocks.createBrowserRunner.mockImplementation(() => mocks.browser);
  mocks.createCompilerExplorerRunner.mockImplementation(() => mocks.remote);
  mocks.createRunner.mockImplementation(() => mocks.combined);
  return {
    createBrowserRunner: mocks.createBrowserRunner,
    createCompilerExplorerRunner: mocks.createCompilerExplorerRunner,
    createRunner: mocks.createRunner,
  };
});

describe('getAdminRunner', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('is created on first use, not on import', async () => {
    const { getAdminRunner } = await import('./admin-runner');
    expect(mocks.createRunner).not.toHaveBeenCalled();

    getAdminRunner();

    expect(mocks.createRunner).toHaveBeenCalledTimes(1);
  });

  it('routes browser languages to Web Workers and the rest to Compiler Explorer', async () => {
    const { getAdminRunner } = await import('./admin-runner');

    const runner: Runner = getAdminRunner();

    expect(runner).toBe(mocks.combined);
    expect(mocks.createRunner).toHaveBeenCalledWith({ browser: mocks.browser, remote: mocks.remote });
  });

  it('is memoized: every caller shares one runner, queue and budget', async () => {
    const { getAdminRunner } = await import('./admin-runner');

    expect(getAdminRunner()).toBe(getAdminRunner());
    expect(mocks.createBrowserRunner).toHaveBeenCalledTimes(1);
    expect(mocks.createCompilerExplorerRunner).toHaveBeenCalledTimes(1);
  });
});
