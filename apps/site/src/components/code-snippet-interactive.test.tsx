import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { HighlightedLine } from '@birb-learn/code-ui';
import type { RunOptions, RunRequest, RunResult, Runner } from '@birb-learn/code-runner';
import ptBR from '@/messages/pt-BR.json';
import { CodeSnippetInteractive, type SnippetVariant } from './code-snippet-interactive';

const push = vi.fn();

// next/navigation's router throws outside an app router tree.
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return { ...actual, useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }) };
});

function toLines(code: string): HighlightedLine[] {
  return code
    .replace(/\n$/, '')
    .split('\n')
    .map((text) => (text === '' ? [] : [{ text }]));
}

function variant(overrides: Partial<SnippetVariant> & Pick<SnippetVariant, 'language' | 'code'>): SnippetVariant {
  return {
    lines: toLines(overrides.code),
    annotations: [],
    walkthrough: [],
    runnable: false,
    ...overrides,
  };
}

const PYTHON_CODE = 'nome = "Ana"\nprint("Olá,", nome)\nfor i in range(3):\n    print(i)\n';
const C_CODE = '#include <stdio.h>\n\nint main(void) {\n    return 0;\n}\n';

const python = variant({
  language: 'python',
  code: PYTHON_CODE,
  runnable: true,
  stdin: '5\n',
  annotations: [
    { start: 1, end: 1, content: <p>Guarda o texto na variável.</p> },
    { start: 2, end: 2, content: <p>Escreve na saída.</p> },
  ],
  walkthrough: [
    { start: 1, end: 1, content: <p>Primeiro passo.</p> },
    { start: 2, end: 2, content: <p>Segundo passo.</p> },
    { start: 3, end: 4, content: <p>Terceiro passo.</p> },
  ],
});
const c = variant({ language: 'c', code: C_CODE, runnable: true });
const mysql = variant({ language: 'mysql', code: 'SELECT 1;\n', sqlSetup: 'CREATE TABLE t (a INT);' });

class FakeRunner implements Runner {
  requests: RunRequest[] = [];
  runCode(request: RunRequest, options?: RunOptions): Promise<RunResult> {
    void options;
    this.requests.push(request);
    return new Promise(() => {});
  }
}

function renderSnippet(variants: SnippetVariant[], runner: Runner = new FakeRunner()) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
      <CodeSnippetInteractive variants={variants} runner={runner} />
    </NextIntlClientProvider>,
  );
}

function lineElement(container: HTMLElement, lineNumber: number): HTMLElement {
  const element = container.querySelector<HTMLElement>(`[data-line="${lineNumber}"]`);
  if (!element) throw new Error(`no line ${lineNumber}`);
  return element;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  push.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CodeSnippetInteractive tabs', () => {
  it('shows the first variant first and switches to the other, remembering the choice', async () => {
    const user = userEvent.setup();
    const { container } = renderSnippet([python, c]);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Python' })).toHaveAttribute('aria-selected', 'true');
    expect(container.textContent).toContain('nome = "Ana"');

    await user.click(screen.getByRole('tab', { name: 'C' }));

    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('aria-selected', 'true');
    expect(container.textContent).toContain('#include <stdio.h>');
    expect(container.textContent).not.toContain('nome = "Ana"');
    expect(localStorage.getItem('birb-learn:code-lang')).toBe('c');
  });

  it('starts on the stored language when the snippet has it', () => {
    localStorage.setItem('birb-learn:code-lang', 'c');
    renderSnippet([python, c]);
    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('aria-selected', 'true');
  });

  it('falls back to the first tab when the stored language matches no variant', () => {
    localStorage.setItem('birb-learn:code-lang', 'rust');
    renderSnippet([python, c]);
    expect(screen.getByRole('tab', { name: 'Python' })).toHaveAttribute('aria-selected', 'true');
  });

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    renderSnippet([python, c]);
    screen.getByRole('tab', { name: 'Python' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'C' })).toHaveFocus();
  });

  it('still renders when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const user = userEvent.setup();
    renderSnippet([python, c]);
    await user.click(screen.getByRole('tab', { name: 'C' }));
    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows no tab list for a single variant', () => {
    renderSnippet([mysql]);
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});

describe('CodeSnippetInteractive annotations', () => {
  it('opens the popover when the marker takes focus and closes it on Escape', async () => {
    const user = userEvent.setup();
    renderSnippet([python]);

    expect(screen.queryByRole('tooltip')).toBeNull();
    const marker = screen.getByRole('button', { name: 'Nota 1' });
    await user.tab(); // the code region
    await user.tab(); // the first marker
    expect(marker).toHaveFocus();

    const popover = screen.getByRole('tooltip');
    expect(popover).toHaveTextContent('Guarda o texto na variável.');
    expect(marker).toHaveAttribute('aria-describedby', popover.id);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('opens on hover and closes when the pointer leaves', async () => {
    const user = userEvent.setup();
    renderSnippet([python]);
    await user.hover(screen.getByRole('button', { name: 'Nota 2' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Escreve na saída.');
    await user.unhover(screen.getByRole('button', { name: 'Nota 2' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('pins the popover on click so it survives the pointer leaving, and unpins on a second click', async () => {
    const user = userEvent.setup();
    renderSnippet([python]);
    const marker = screen.getByRole('button', { name: 'Nota 1' });
    await user.click(marker);
    await user.unhover(marker);
    await user.click(document.body); // moves the focus away too
    expect(screen.getByRole('tooltip')).toHaveTextContent('Guarda o texto na variável.');
    await user.click(marker);
    await user.unhover(marker);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('closes a pinned popover on Escape', async () => {
    const user = userEvent.setup();
    renderSnippet([python]);
    await user.click(screen.getByRole('button', { name: 'Nota 1' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('puts a marker only on the first line of each range', () => {
    const { container } = renderSnippet([python]);
    expect(within(lineElement(container, 1)).getByRole('button', { name: 'Nota 1' })).toBeInTheDocument();
    expect(within(lineElement(container, 2)).getByRole('button', { name: 'Nota 2' })).toBeInTheDocument();
    expect(within(lineElement(container, 3)).queryByRole('button')).toBeNull();
  });
});

describe('CodeSnippetInteractive walkthrough', () => {
  async function startWalkthrough() {
    const user = userEvent.setup();
    const view = renderSnippet([python, c]);
    await user.click(screen.getByRole('button', { name: 'Percorrer o código' }));
    return { user, ...view };
  }

  it('offers no walkthrough for a variant without steps', () => {
    renderSnippet([c]);
    expect(screen.queryByRole('button', { name: 'Percorrer o código' })).toBeNull();
  });

  it('dims every line outside the current step and shows its narration', async () => {
    const { container } = await startWalkthrough();
    expect(screen.getByText('Primeiro passo.')).toBeInTheDocument();
    const dimmed = [1, 2, 3, 4].map((n) => lineElement(container, n).hasAttribute('data-dimmed'));
    expect(dimmed).toEqual([false, true, true, true]);
  });

  it('announces the step counter in a polite live region', async () => {
    await startWalkthrough();
    const counter = screen.getByText('Passo 1 de 3');
    expect(counter.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
  });

  it('advances with the arrow keys and the buttons, a range step highlighting all its lines', async () => {
    const { user, container } = await startWalkthrough();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Segundo passo.')).toBeInTheDocument();
    expect(screen.getByText('Passo 2 de 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Próximo passo' }));
    expect(screen.getByText('Terceiro passo.')).toBeInTheDocument();
    expect([1, 2, 3, 4].map((n) => lineElement(container, n).hasAttribute('data-dimmed'))).toEqual([true, true, false, false]);
    expect(screen.getByRole('button', { name: 'Próximo passo' })).toHaveAttribute('aria-disabled', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Segundo passo.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Passo anterior' }));
    expect(screen.getByText('Primeiro passo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Passo anterior' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps the arrow keys away from the lesson stepper while walking through', async () => {
    const { user } = await startWalkthrough();
    const onWindowKey = vi.fn();
    window.addEventListener('keydown', onWindowKey);
    await user.keyboard('{ArrowRight}');
    window.removeEventListener('keydown', onWindowKey);
    expect(onWindowKey).not.toHaveBeenCalled();
  });

  it('exits on Escape and on the exit button', async () => {
    const { user, container } = await startWalkthrough();
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Passo 1 de 3')).toBeNull();
    expect(container.querySelector('[data-dimmed]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Percorrer o código' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Percorrer o código' }));
    await user.click(screen.getByRole('button', { name: 'Sair do passo a passo' }));
    expect(screen.queryByText('Passo 1 de 3')).toBeNull();
  });

  it('leaves walkthrough mode when another tab is chosen', async () => {
    const { user } = await startWalkthrough();
    await user.click(screen.getByRole('tab', { name: 'C' }));
    expect(screen.queryByText('Passo 1 de 3')).toBeNull();
  });
});

describe('CodeSnippetInteractive run', () => {
  it('mounts the run panel, with the runner of the prop, only after the run button is used', async () => {
    const user = userEvent.setup();
    const runner = new FakeRunner();
    renderSnippet([python], runner);

    expect(screen.queryByRole('button', { name: 'Executar' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Executar o código' }));

    const runButton = await screen.findByRole('button', { name: 'Executar' });
    expect(screen.getByLabelText('Entrada')).toHaveValue('5\n');
    await user.click(runButton);

    expect(runner.requests).toHaveLength(1);
    expect(runner.requests[0]).toMatchObject({ language: 'python', source: PYTHON_CODE, cases: [{ stdin: '5\n' }] });
  });

  it('hides the panel again from the same button', async () => {
    const user = userEvent.setup();
    renderSnippet([python]);
    await user.click(screen.getByRole('button', { name: 'Executar o código' }));
    await screen.findByRole('button', { name: 'Executar' });
    await user.click(screen.getByRole('button', { name: 'Ocultar execução' }));
    expect(screen.queryByRole('button', { name: 'Executar' })).toBeNull();
  });

  it('does not touch the runner while rendering', () => {
    const runCode = vi.fn();
    renderSnippet([python], { runCode });
    expect(runCode).not.toHaveBeenCalled();
  });

  it('has no run button for a variant that is not runnable', () => {
    renderSnippet([variant({ language: 'python', code: 'x = 1\n', runnable: false })]);
    expect(screen.queryByRole('button', { name: 'Executar o código' })).toBeNull();
  });

  it('offers OneCompiler for MySQL: copies the code and opens the site in a new tab', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderSnippet([mysql]);

    expect(screen.queryByRole('button', { name: 'Executar o código' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Copiar e abrir no OneCompiler' }));

    expect(writeText).toHaveBeenCalledWith('SELECT 1;\n');
    expect(open).toHaveBeenCalledWith('https://onecompiler.com/mysql', '_blank', 'noopener,noreferrer');
  });

  it('shows no OneCompiler button for other languages', () => {
    renderSnippet([python]);
    expect(screen.queryByRole('button', { name: 'Copiar e abrir no OneCompiler' })).toBeNull();
  });
});

describe('CodeSnippetInteractive copy and lab', () => {
  it('copies the code of the active variant and confirms it', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderSnippet([python, c]);

    await user.click(screen.getByRole('button', { name: 'Copiar' }));
    expect(writeText).toHaveBeenCalledWith(PYTHON_CODE);
    expect(await screen.findByText('Copiado!')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'C' }));
    await user.click(screen.getByRole('button', { name: 'Copiar' }));
    expect(writeText).toHaveBeenLastCalledWith(C_CODE);
  });

  it('reports a failed copy instead of throwing', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderSnippet([python]);
    await user.click(screen.getByRole('button', { name: 'Copiar' }));
    expect(await screen.findByText('Não foi possível copiar')).toBeInTheDocument();
  });

  it('stores the code for the lab and navigates to it', async () => {
    const user = userEvent.setup();
    renderSnippet([python, c]);
    await user.click(screen.getByRole('button', { name: 'Abrir no laboratório' }));

    expect(JSON.parse(sessionStorage.getItem('birb-learn:lab:incoming') ?? 'null')).toEqual({
      language: 'python',
      code: PYTHON_CODE,
      stdin: '5\n',
      sqlSetup: '',
    });
    expect(push).toHaveBeenCalledWith('/pt-BR/lab/#lang=python');
  });

  it('carries an edited stdin to the lab', async () => {
    const user = userEvent.setup();
    renderSnippet([python]);
    await user.click(screen.getByRole('button', { name: 'Executar o código' }));
    const stdin = await screen.findByLabelText('Entrada');
    fireEvent.change(stdin, { target: { value: '9\n' } });
    await user.click(screen.getByRole('button', { name: 'Abrir no laboratório' }));
    expect(JSON.parse(sessionStorage.getItem('birb-learn:lab:incoming') ?? 'null')).toMatchObject({ stdin: '9\n' });
  });

  it('navigates even when sessionStorage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const user = userEvent.setup();
    renderSnippet([python]);
    await user.click(screen.getByRole('button', { name: 'Abrir no laboratório' }));
    expect(push).toHaveBeenCalledWith('/pt-BR/lab/#lang=python');
  });

  it('does not offer the lab for MySQL, which cannot run there', () => {
    renderSnippet([mysql]);
    expect(screen.queryByRole('button', { name: 'Abrir no laboratório' })).toBeNull();
  });
});

describe('CodeSnippetInteractive accessibility', () => {
  it('names the scrollable code region by language', () => {
    renderSnippet([python, c]);
    expect(screen.getByRole('region', { name: 'Código em Python' }).tagName).toBe('PRE');
  });
});
