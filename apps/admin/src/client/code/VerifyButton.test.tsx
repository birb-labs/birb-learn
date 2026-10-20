import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Runner } from '@birb-learn/code-runner/src/protocol';
import type { CodeSnippetPayloadData, CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { VerifyButton } from './VerifyButton';
import { fakeRunner, OK_RUN } from './test-support';

const adminRunner = vi.hoisted(() => ({ current: undefined as Runner | undefined }));
vi.mock('./admin-runner', () => ({
  getAdminRunner: () => {
    if (!adminRunner.current) throw new Error('No fake runner installed');
    return adminRunner.current;
  },
}));

const SNIPPET: CodeSnippetPayloadData = {
  variants: [
    { language: 'python', code: 'print("Hello, world!")', annotations: [], walkthrough: [], runnable: true, expectedOutput: 'Hello, world!' },
  ],
};

const TASK: CodeTaskPayloadData = {
  starterCode: 'n = int(input())\n',
  solution: 'n = int(input())\nprint(n * 2)\n',
  tests: [{ stdin: '4\n', expectedStdout: '8\n' }],
  blanks: [],
  hints: [],
};

afterEach(() => {
  adminRunner.current = undefined;
});

describe('VerifyButton', () => {
  it('says everything is fine when a snippet runs as claimed', async () => {
    const { runner, requests } = fakeRunner(OK_RUN);
    adminRunner.current = runner;
    render(<VerifyButton kind="snippet" payload={SNIPPET} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('Tudo certo')).toBeInTheDocument();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ language: 'python', source: 'print("Hello, world!")' });
  });

  it('lists the error of a failing run with its path, as text', async () => {
    adminRunner.current = fakeRunner({
      status: 'ok',
      cases: [{ status: 'ok', stdout: '<b>no</b>\n', stderr: '', exitCode: 0, durationMs: 1 }],
    }).runner;
    render(<VerifyButton kind="snippet" payload={SNIPPET} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    const item = await screen.findByText(/output differs from expectedOutput/);
    expect(item).toHaveTextContent('"<b>no</b>"');
    expect(item.querySelector('b')).toBeNull();
    expect(screen.getByText('variants[0]')).toBeInTheDocument();
    expect(screen.getByText('Erro')).toBeInTheDocument();
    expect(screen.queryByText('Tudo certo')).not.toBeInTheDocument();
  });

  it('keeps the line breaks of a multi-line message', async () => {
    adminRunner.current = fakeRunner({ status: 'compile_error', compileOutput: 'line one\nline two', cases: [] }).runner;
    render(<VerifyButton kind="snippet" payload={SNIPPET} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    const message = await screen.findByText(/does not compile/);
    expect(message).toHaveTextContent('compiler output: line one line two');
    expect(message.textContent).toContain('\n');
    expect(message).toHaveStyle({ whiteSpace: 'pre-wrap' });
  });

  it('shows a warning when the runner is rate limited', async () => {
    adminRunner.current = fakeRunner({ status: 'unavailable', reason: 'rate_limited', retryAfterMs: 3000, cases: [] }).runner;
    render(<VerifyButton kind="snippet" payload={SNIPPET} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('rate limited, retry in 3s')).toBeInTheDocument();
    expect(screen.getByText('Aviso')).toBeInTheDocument();
  });

  it('lists what could not be verified and does not claim everything is fine', async () => {
    const { runner, requests } = fakeRunner(OK_RUN);
    adminRunner.current = runner;
    const mysql: CodeSnippetPayloadData = {
      variants: [{ language: 'mysql', code: 'SELECT 1;', annotations: [], walkthrough: [], runnable: false, expectedOutput: '1' }],
    };
    render(<VerifyButton kind="snippet" payload={mysql} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('Não verificado')).toBeInTheDocument();
    expect(screen.getByText('variants[0]')).toBeInTheDocument();
    expect(screen.queryByText('Tudo certo')).not.toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('reports a payload that fails validation without running anything', async () => {
    const { runner, requests } = fakeRunner(OK_RUN);
    adminRunner.current = runner;
    const bad: CodeSnippetPayloadData = {
      variants: [{ ...SNIPPET.variants[0], annotations: [{ lines: '9', mdx: 'x' }] }],
    };
    render(<VerifyButton kind="snippet" payload={bad} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText(/past the end of the code/)).toBeInTheDocument();
    expect(screen.getByText('Erro')).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('reports a payload that does not match the schema without running anything', async () => {
    const { runner, requests } = fakeRunner(OK_RUN);
    adminRunner.current = runner;
    const bad = { variants: [{ ...SNIPPET.variants[0], code: '' }] };
    render(<VerifyButton kind="snippet" payload={bad} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText(/variants\[0\]\.code/)).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('verifies a task: the solution has to pass every test', async () => {
    const { runner, requests } = fakeRunner((index) => ({
      status: 'ok',
      cases: [{ status: 'ok', stdout: index === 0 ? '8\n' : '9\n', stderr: '', exitCode: 0, durationMs: 1 }],
    }));
    adminRunner.current = runner;
    render(<VerifyButton kind="task" taskKind="write" language="python" payload={TASK} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('Tudo certo')).toBeInTheDocument();
    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0]).toMatchObject({ language: 'python' });
  });

  it('shows an error when the solution of a task fails a test', async () => {
    adminRunner.current = fakeRunner({
      status: 'ok',
      cases: [{ status: 'ok', stdout: '7\n', stderr: '', exitCode: 0, durationMs: 1 }],
    }).runner;
    render(<VerifyButton kind="task" taskKind="write" language="python" payload={TASK} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText(/solution fails test #1/)).toBeInTheDocument();
    expect(screen.getByText('solution')).toBeInTheDocument();
  });

  it('applies the cross-field task checks before running', async () => {
    const { runner, requests } = fakeRunner(OK_RUN);
    adminRunner.current = runner;
    render(<VerifyButton kind="task" taskKind="find_bug" language="python" payload={TASK} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('required for a find_bug task')).toBeInTheDocument();
    expect(screen.getByText('bugLines')).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('aborts the run when it unmounts', async () => {
    let signal: AbortSignal | undefined;
    adminRunner.current = {
      runCode: (_request, opts) => {
        signal = opts?.signal;
        return new Promise(() => {});
      },
    };
    const { unmount } = render(<VerifyButton kind="snippet" payload={SNIPPET} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    await waitFor(() => expect(signal).toBeDefined());
    expect(signal!.aborted).toBe(false);
    expect(screen.getByRole('button', { name: 'Verificando…' })).toBeDisabled();

    unmount();

    expect(signal!.aborted).toBe(true);
  });

  it('shows the failure when the runner throws', async () => {
    adminRunner.current = {
      runCode: () => Promise.reject(new Error('boom')),
    };
    render(<VerifyButton kind="snippet" payload={SNIPPET} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('Falha ao verificar: boom')).toBeInTheDocument();
  });

  it('forgets the previous report when the payload changes', async () => {
    adminRunner.current = fakeRunner(OK_RUN).runner;
    const { rerender } = render(<VerifyButton kind="snippet" payload={SNIPPET} />);
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    expect(await screen.findByText('Tudo certo')).toBeInTheDocument();

    rerender(<VerifyButton kind="snippet" payload={{ variants: [{ ...SNIPPET.variants[0], code: 'print(1)' }] }} />);

    expect(screen.queryByText('Tudo certo')).not.toBeInTheDocument();
  });
});
