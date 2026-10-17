import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CaseResult, RunOptions, RunRequest, RunResult, Runner, UnavailableReason } from '@birb-learn/code-runner/src/protocol';
import { RunPanel } from './run-panel';
import { TEST_LABELS } from './test-labels';

function caseResult(overrides: Partial<CaseResult> = {}): CaseResult {
  return { status: 'ok', stdout: '', stderr: '', exitCode: 0, durationMs: 1, ...overrides };
}

function okResult(overrides: Partial<CaseResult> = {}): RunResult {
  return { status: 'ok', cases: [caseResult(overrides)] };
}

/** A runner whose runs stay pending until the test settles them. */
class FakeRunner implements Runner {
  requests: RunRequest[] = [];
  options: (RunOptions | undefined)[] = [];
  private settlers: { resolve: (result: RunResult) => void; reject: (error: unknown) => void }[] = [];

  runCode(req: RunRequest, opts?: RunOptions): Promise<RunResult> {
    this.requests.push(req);
    this.options.push(opts);
    return new Promise((resolve, reject) => {
      this.settlers.push({ resolve, reject });
    });
  }

  get signal(): AbortSignal {
    const signal = this.options.at(-1)?.signal;
    if (!signal) throw new Error('no run in flight');
    return signal;
  }

  progress(event: Parameters<NonNullable<RunOptions['onProgress']>>[0]): void {
    this.options.at(-1)?.onProgress?.(event);
  }

  async settle(result: RunResult): Promise<void> {
    await this.settleAt(this.settlers.length - 1, result);
  }

  async settleAt(index: number, result: RunResult): Promise<void> {
    await act(async () => {
      this.settlers[index]?.resolve(result);
    });
  }

  async fail(error: unknown): Promise<void> {
    await act(async () => {
      this.settlers.at(-1)?.reject(error);
    });
  }
}

function setup(props: Partial<React.ComponentProps<typeof RunPanel>> = {}) {
  const runner = new FakeRunner();
  const view = render(<RunPanel runner={runner} language="python" source="print(1)" labels={TEST_LABELS} {...props} />);
  return { runner, ...view };
}

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

describe('RunPanel run flow', () => {
  it('sends the request and shows the stdout', async () => {
    const { runner } = setup({ stdin: 'in', showStdin: true });
    click('Run');
    expect(runner.requests[0]).toMatchObject({ language: 'python', source: 'print(1)', cases: [{ stdin: 'in' }] });
    await runner.settle(okResult({ stdout: 'hello\n' }));
    expect(screen.getByText('hello')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy();
  });

  it('sends the SQL setup instead of stdin for SQL languages', () => {
    const { runner } = setup({ language: 'sqlite', source: 'SELECT 1', sqlSetup: 'CREATE TABLE t(a)', showStdin: true });
    expect(screen.queryByLabelText('Input')).toBeNull();
    click('Run');
    expect(runner.requests[0]).toMatchObject({ language: 'sqlite', sqlSetup: 'CREATE TABLE t(a)' });
    expect(runner.requests[0].cases?.[0]?.stdin).toBeUndefined();
  });

  it('shows the stdin textarea only when asked and reports edits', () => {
    const onStdinChange = vi.fn();
    const { rerender, runner } = setup();
    expect(screen.queryByLabelText('Input')).toBeNull();
    rerender(<RunPanel runner={runner} language="python" source="" showStdin onStdinChange={onStdinChange} labels={TEST_LABELS} />);
    fireEvent.change(screen.getByLabelText('Input'), { target: { value: '42' } });
    expect(onStdinChange).toHaveBeenCalledWith('42');
  });

  it('turns Run into Stop while running, and Stop aborts the run', async () => {
    const { runner } = setup();
    click('Run');
    expect(screen.queryByRole('button', { name: 'Run' })).toBeNull();
    const { signal } = runner.options[0]!;
    expect(signal?.aborted).toBe(false);
    click('Stop');
    expect(signal?.aborted).toBe(true);
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy();
    // A late settlement of the stopped run is ignored.
    await runner.settle(okResult({ stdout: 'late' }));
    expect(screen.queryByText('late')).toBeNull();
  });

  it('runs again after Stop with a fresh signal and ignores the stopped run settling later', async () => {
    const { runner } = setup();
    click('Run');
    click('Stop');
    click('Run');
    expect(runner.requests).toHaveLength(2);
    expect(runner.options[0]?.signal?.aborted).toBe(true);
    expect(runner.options[1]?.signal?.aborted).toBe(false);
    // The first run settles after Stop: it must neither show output nor end the second run.
    await runner.settleAt(0, okResult({ stdout: 'stale' }));
    expect(screen.queryByText('stale')).toBeNull();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy();
    await runner.settleAt(1, okResult({ stdout: 'fresh' }));
    expect(screen.getByText('fresh')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy();
  });

  it('aborts the run and clears the result when the language changes', async () => {
    const { runner, rerender } = setup();
    click('Run');
    await runner.settle(okResult({ stdout: 'python output' }));
    expect(screen.getByText('python output')).toBeTruthy();
    click('Run');
    const { signal } = runner.options[1]!;
    rerender(<RunPanel runner={runner} language="lua" source="print(1)" labels={TEST_LABELS} />);
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByText('python output')).toBeNull();
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy();
    await runner.settleAt(1, okResult({ stdout: 'late output' }));
    expect(screen.queryByText('late output')).toBeNull();
  });

  it('clears a finished result when the language changes', async () => {
    const { runner, rerender } = setup();
    click('Run');
    await runner.settle(okResult({ stdout: 'python output' }));
    rerender(<RunPanel runner={runner} language="lua" source="print(1)" labels={TEST_LABELS} />);
    expect(screen.queryByText('python output')).toBeNull();
    expect(screen.queryByText(TEST_LABELS.status.ok)).toBeNull();
  });

  it('aborts the in-flight run on unmount without updating state afterwards', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { runner, unmount } = setup();
    click('Run');
    const { signal } = runner.options[0]!;
    unmount();
    expect(signal?.aborted).toBe(true);
    await runner.settle(okResult({ stdout: 'late' }));
    runner.progress({ phase: 'case_done', caseIndex: 0, caseCount: 1 });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('shows a runner crash as a service error', async () => {
    const { runner } = setup();
    click('Run');
    await runner.fail(new Error('boom'));
    expect(screen.getByText(TEST_LABELS.unavailable.service_error)).toBeTruthy();
    expect(screen.queryByText('boom')).toBeNull();
  });
});

describe('RunPanel statuses', () => {
  it('shows the compile output under the compile error heading', async () => {
    const { runner } = setup({ language: 'c' });
    click('Run');
    await runner.settle({ status: 'compile_error', compileOutput: 'error: expected ;', cases: [] });
    expect(screen.getByText('Compile error')).toBeTruthy();
    expect(screen.getByText('error: expected ;')).toBeTruthy();
  });

  it('shows the case status and stderr for a runtime error', async () => {
    const { runner } = setup();
    click('Run');
    await runner.settle(okResult({ status: 'runtime_error', stderr: 'Traceback...', exitCode: 1 }));
    expect(screen.getByText(TEST_LABELS.status.runtime_error)).toBeTruthy();
    expect(screen.getByText('Standard error')).toBeTruthy();
    expect(screen.getByText('Traceback...')).toBeTruthy();
  });

  it('says so when a run printed nothing', async () => {
    const { runner } = setup();
    click('Run');
    await runner.settle(okResult());
    expect(screen.getByText('No output')).toBeTruthy();
  });

  it.each<UnavailableReason>(['read_only', 'rate_limited', 'offline', 'service_error', 'engine_load'])(
    'shows its own label for the unavailable reason %s',
    async (reason) => {
      const { runner } = setup();
      click('Run');
      await runner.settle({ status: 'unavailable', reason, message: 'dev only message', retryAfterMs: reason === 'rate_limited' ? 1000 : undefined, cases: [] });
      expect(screen.getByText(TEST_LABELS.unavailable[reason])).toBeTruthy();
      for (const other of Object.keys(TEST_LABELS.unavailable) as UnavailableReason[]) {
        if (other !== reason) expect(screen.queryByText(TEST_LABELS.unavailable[other])).toBeNull();
      }
      expect(screen.queryByText('dev only message')).toBeNull();
    },
  );
});

describe('RunPanel rate limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down and keeps Run disabled until the wait is over', async () => {
    const { runner } = setup();
    click('Run');
    await runner.settle({ status: 'unavailable', reason: 'rate_limited', retryAfterMs: 2500, cases: [] });
    expect(screen.getByText('Retry in 3s')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Run' }) as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Retry in 2s')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Run' }) as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByText(/Retry in/)).toBeNull();
    expect((screen.getByRole('button', { name: 'Run' }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('stops its timer on unmount', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { runner, unmount } = setup();
    click('Run');
    await runner.settle({ status: 'unavailable', reason: 'rate_limited', retryAfterMs: 2500, cases: [] });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    errorSpy.mockRestore();
  });
});

describe('RunPanel progress', () => {
  it('shows the running label, then engine loading and case progress', async () => {
    const { runner } = setup({ language: 'python' });
    click('Run');
    expect(screen.getByRole('status').textContent).toContain('Running...');
    act(() => runner.progress({ phase: 'loading_engine' }));
    expect(screen.getByRole('status').textContent).toContain('Loading Python...');
    act(() => runner.progress({ phase: 'case_started', caseIndex: 0, caseCount: 2 }));
    expect(screen.getByRole('status').textContent).toContain('Case 0 of 2');
    act(() => runner.progress({ phase: 'case_done', caseIndex: 0, caseCount: 2 }));
    expect(screen.getByRole('status').textContent).toContain('Case 1 of 2');
    await runner.settle(okResult());
    expect(screen.getByRole('status').textContent).not.toContain('Case');
  });
});

describe('RunPanel remote languages', () => {
  it('shows the remote notice only for remote languages', () => {
    const { rerender, runner } = setup({ language: 'rust' });
    expect(screen.getByText('Runs on a remote server')).toBeTruthy();
    rerender(<RunPanel runner={runner} language="python" source="" labels={TEST_LABELS} />);
    expect(screen.queryByText('Runs on a remote server')).toBeNull();
  });
});

describe('RunPanel hostile output', () => {
  const HOSTILE = '<img src=x onerror=alert(1)>';

  it('renders stdout, stderr and compile output as literal text', async () => {
    const { runner, container } = setup();
    click('Run');
    await runner.settle({ status: 'compile_error', compileOutput: HOSTILE, cases: [caseResult({ stdout: HOSTILE, stderr: HOSTILE })] });
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText(HOSTILE)).toHaveLength(3);
  });

  it('renders hostile text in SQL cells literally', async () => {
    const { runner, container } = setup({ language: 'sqlite' });
    click('Run');
    await runner.settle(okResult({ sql: { resultSets: [{ columns: [HOSTILE], rows: [[HOSTILE]] }] } }));
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText(HOSTILE)).toHaveLength(2);
  });
});

describe('RunPanel scrollable output', () => {
  it('makes each output block keyboard focusable and named by its heading', async () => {
    const { runner } = setup();
    click('Run');
    await runner.settle(okResult({ stdout: 'out', stderr: 'err' }));
    for (const [text, heading] of [['out', 'Standard output'], ['err', 'Standard error']]) {
      const block = screen.getByText(text);
      expect(block.getAttribute('tabindex')).toBe('0');
      expect(screen.getByRole('region', { name: heading })).toBe(block);
    }
  });
});

describe('RunPanel large output', () => {
  it('renders 64 KiB of stdout', async () => {
    const big = 'x'.repeat(64 * 1024);
    const { runner, container } = setup();
    click('Run');
    await runner.settle(okResult({ stdout: big }));
    expect(container.textContent).toContain(big);
  });
});

describe('RunPanel SQL output', () => {
  it('renders one table per result set', async () => {
    const { runner } = setup({ language: 'sqlite', source: 'SELECT 1; SELECT 2' });
    click('Run');
    await runner.settle(
      okResult({
        sql: {
          resultSets: [
            { columns: ['a'], rows: [['1']] },
            { columns: ['b'], rows: [['2']] },
          ],
        },
      }),
    );
    expect(screen.getAllByRole('table')).toHaveLength(2);
  });
});
