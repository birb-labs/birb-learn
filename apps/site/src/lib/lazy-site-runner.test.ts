import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RunResult, Runner } from '@birb-learn/code-runner/src/protocol';

const getSiteRunner = vi.fn<() => Runner>();
vi.mock('@/lib/site-runner', () => ({ getSiteRunner: () => getSiteRunner() }));

import { lazySiteRunner } from './lazy-site-runner';

const OK: RunResult = { status: 'ok', cases: [{ status: 'ok', stdout: '1\n', stderr: '', exitCode: 0, durationMs: 1 }] };

describe('lazySiteRunner', () => {
  beforeEach(() => {
    getSiteRunner.mockReset();
  });

  it('does not touch the site runner until it is asked to run', () => {
    expect(getSiteRunner).not.toHaveBeenCalled();
  });

  it('delegates a run, with its options, to the site runner', async () => {
    const runCode = vi.fn().mockResolvedValue(OK);
    getSiteRunner.mockReturnValue({ runCode });
    const signal = new AbortController().signal;

    const result = await lazySiteRunner.runCode({ language: 'python', source: 'print(1)' }, { signal });

    expect(result).toBe(OK);
    expect(runCode).toHaveBeenCalledWith({ language: 'python', source: 'print(1)' }, { signal });
  });

  it('reports an unavailable engine when the site runner cannot be created', async () => {
    getSiteRunner.mockImplementation(() => {
      throw new Error('browser-only');
    });

    const result = await lazySiteRunner.runCode({ language: 'python', source: '' });

    expect(result).toMatchObject({ status: 'unavailable', reason: 'engine_load', cases: [] });
  });
});
