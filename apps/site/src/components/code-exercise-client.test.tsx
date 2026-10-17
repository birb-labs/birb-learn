import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import type { RunRequest, RunResult, Runner } from '@birb-learn/code-runner/src/protocol';
import ptBR from '@/messages/pt-BR.json';
import { CodeExerciseClient } from './code-exercise-client';

const getSiteRunner = vi.fn<() => Runner>();
vi.mock('@/lib/site-runner', () => ({ getSiteRunner: () => getSiteRunner() }));

const PREDICT: CodeTaskPayloadData = {
  starterCode: 'let x = 2;\nx += 3;\nconsole.log(x * 2);\n',
  expectedOutput: '10',
  tests: [],
  blanks: [],
  hints: ['Acompanhe `x`.'],
};

const WRITE: CodeTaskPayloadData = {
  starterCode: 'n = int(input())\n',
  solution: 'n = int(input())\nprint(n * 2)\n',
  tests: [{ stdin: '4\n', expectedStdout: '8\n' }],
  blanks: [],
  hints: [],
};

const toLines = (code: string) => code.replace(/\n$/, '').split('\n').map((text) => [{ text }]);

/** The live region carries the verdict; the visible card repeats it, so the text itself is not unique. */
async function expectVerdict(text: string) {
  await waitFor(() => expect(document.querySelector('[data-announcement]')).toHaveTextContent(text));
}

function renderExercise(props: Partial<React.ComponentProps<typeof CodeExerciseClient>> = {}) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
      <CodeExerciseClient
        kind="predict_output"
        language="javascript"
        starterTokens={toLines(PREDICT.starterCode)}
        payload={PREDICT}
        prompt={<p>O que o programa imprime?</p>}
        resolution={<p>x vira 5.</p>}
        hints={[<p key="1">Acompanhe x.</p>]}
        solutionTokens={toLines(PREDICT.starterCode)}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('CodeExerciseClient', () => {
  it('shows the prompt at once and the interactive view once it has loaded', async () => {
    renderExercise();

    expect(screen.getByText('O que o programa imprime?')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Verificar' })).toBeInTheDocument();
    // The prompt is not shown twice once the view has replaced the fallback.
    expect(screen.getAllByText('O que o programa imprime?')).toHaveLength(1);
  });

  it('grades in Portuguese and offers hints and the solution', async () => {
    renderExercise();

    fireEvent.change(await screen.findByLabelText('A saída que você prevê'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    await expectVerdict('Correto!');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar dica 1 de 1' }));
    expect(screen.getByText('Acompanhe x.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar solução' }));
    expect(screen.getByText('x vira 5.')).toBeInTheDocument();
  });

  it('uses an injected runner', async () => {
    const requests: RunRequest[] = [];
    const runner: Runner = {
      async runCode(request): Promise<RunResult> {
        requests.push(request);
        return { status: 'ok', cases: [{ status: 'ok', stdout: '8\n', stderr: '', exitCode: 0, durationMs: 1 }] };
      },
    };
    renderExercise({ kind: 'write', language: 'python', payload: WRITE, starterTokens: toLines(WRITE.starterCode), runner });

    fireEvent.click(await screen.findByRole('button', { name: 'Verificar' }));
    await expectVerdict('Correto!');
    expect(requests).toHaveLength(1);
  });

  it('resolves the site runner only when a check runs', async () => {
    getSiteRunner.mockReset();
    getSiteRunner.mockReturnValue({
      runCode: async () => ({ status: 'ok', cases: [{ status: 'ok', stdout: '8\n', stderr: '', exitCode: 0, durationMs: 1 }] }),
    });
    renderExercise({ kind: 'write', language: 'python', payload: WRITE, starterTokens: toLines(WRITE.starterCode) });

    fireEvent.click(await screen.findByRole('button', { name: 'Verificar' }));
    await expectVerdict('Correto!');
    expect(getSiteRunner).toHaveBeenCalledTimes(1);
  });

  it('does not create the site runner for a task that never runs code', async () => {
    getSiteRunner.mockReset();
    renderExercise();

    fireEvent.click(await screen.findByRole('button', { name: 'Verificar' }));
    await expectVerdict('Ainda não');
    expect(getSiteRunner).not.toHaveBeenCalled();
  });
});
