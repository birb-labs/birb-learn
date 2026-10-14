import { describe, expect, it } from 'vitest';
import type { RunRequest, RunResult, Runner } from './protocol';
import { createRunner } from './run-code';

function fakeRunner(result: RunResult): Runner & { calls: RunRequest[] } {
  const calls: RunRequest[] = [];
  return {
    calls,
    runCode: async (req) => {
      calls.push(req);
      return result;
    },
  };
}

const BROWSER_RESULT: RunResult = { status: 'ok', cases: [] };
const REMOTE_RESULT: RunResult = { status: 'compile_error', compileOutput: 'remote', cases: [] };

describe('createRunner', () => {
  it('routes browser languages to the browser runner and remote languages to the remote runner', async () => {
    const browser = fakeRunner(BROWSER_RESULT);
    const remote = fakeRunner(REMOTE_RESULT);
    const runner = createRunner({ browser, remote });

    expect(await runner.runCode({ language: 'python', source: 'print(1)' })).toBe(BROWSER_RESULT);
    expect(await runner.runCode({ language: 'rust', source: 'fn main() {}' })).toBe(REMOTE_RESULT);
    expect(browser.calls.map((c) => c.language)).toEqual(['python']);
    expect(remote.calls.map((c) => c.language)).toEqual(['rust']);
  });

  it('reports a remote language as unavailable without a remote runner', async () => {
    const browser = fakeRunner(BROWSER_RESULT);
    const runner = createRunner({ browser });

    expect(await runner.runCode({ language: 'rust', source: 'fn main() {}' })).toEqual({
      status: 'unavailable',
      reason: 'service_error',
      message: 'No remote runner configured',
      cases: [],
    });
    expect(browser.calls).toEqual([]);
  });

  it('reports a read-only language as unavailable without calling any runner', async () => {
    const browser = fakeRunner(BROWSER_RESULT);
    const remote = fakeRunner(REMOTE_RESULT);
    const runner = createRunner({ browser, remote });

    expect(await runner.runCode({ language: 'mysql', source: 'SELECT 1;' })).toEqual({
      status: 'unavailable',
      reason: 'read_only',
      message: 'MySQL code is read-only in this lab',
      cases: [],
    });
    expect(browser.calls).toEqual([]);
    expect(remote.calls).toEqual([]);
  });

  it('forwards the request and the abort signal unchanged', async () => {
    const received: { req: RunRequest; signal?: AbortSignal }[] = [];
    const browser: Runner = {
      runCode: async (req, opts) => {
        received.push({ req, signal: opts?.signal });
        return BROWSER_RESULT;
      },
    };
    const controller = new AbortController();
    const req: RunRequest = { language: 'lua', source: 'print(1)', cases: [{ stdin: 'x' }], timeoutMs: 1000 };

    await createRunner({ browser }).runCode(req, { signal: controller.signal });

    expect(received).toEqual([{ req, signal: controller.signal }]);
  });
});
