import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
import type { CodeSnippetPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { CodeSnippetForm } from './CodeSnippetForm';

vi.mock('@birb-learn/code-ui/editor', async () => ({ CodeEditor: (await import('./test-support')).FakeCodeEditor }));
vi.mock('../components/MdxEditor', async () => ({ MdxEditor: (await import('./test-support')).FakeMdxEditor }));

const PYTHON: CodeSnippetPayloadData['variants'][number] = {
  language: 'python',
  code: 'print(1)\nprint(2)\n',
  annotations: [],
  walkthrough: [],
  runnable: true,
};

function snippet(...variants: CodeSnippetPayloadData['variants']): CodeSnippetPayloadData {
  return { variants };
}

describe('CodeSnippetForm', () => {
  it('adds a variant in the first language no variant uses, with that language template', async () => {
    const onChange = vi.fn();
    render(<CodeSnippetForm value={snippet(PYTHON)} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar variante' }));

    expect(onChange).toHaveBeenLastCalledWith({
      variants: [PYTHON, { language: 'c', code: LANGUAGE_INFO.c.template, annotations: [], walkthrough: [], runnable: false }],
    });
  });

  it('adds an annotation that covers line 1 with placeholder text', async () => {
    const onChange = vi.fn();
    render(<CodeSnippetForm value={snippet(PYTHON)} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar anotação' }));

    expect(onChange).toHaveBeenLastCalledWith({
      variants: [{ ...PYTHON, annotations: [{ lines: '1', mdx: 'Nova anotação.' }] }],
    });
  });

  it('edits the lines and the MDX of an annotation, and a walkthrough step', () => {
    const onChange = vi.fn();
    const value = snippet({
      ...PYTHON,
      annotations: [{ lines: '1', mdx: 'A' }],
      walkthrough: [{ lines: '2', mdx: 'B' }],
    });
    render(<CodeSnippetForm value={value} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Variante 1: linhas da anotação 1'), { target: { value: '1-2' } });
    expect(onChange).toHaveBeenLastCalledWith({
      variants: [{ ...value.variants[0], annotations: [{ lines: '1-2', mdx: 'A' }] }],
    });

    fireEvent.change(screen.getByLabelText('Variante 1: texto do passo 1'), { target: { value: 'C' } });
    expect(onChange).toHaveBeenLastCalledWith({
      variants: [{ ...value.variants[0], walkthrough: [{ lines: '2', mdx: 'C' }] }],
    });
  });

  it('reorders and removes annotation rows', async () => {
    const onChange = vi.fn();
    const value = snippet({
      ...PYTHON,
      annotations: [
        { lines: '1', mdx: 'A' },
        { lines: '2', mdx: 'B' },
      ],
    });
    render(<CodeSnippetForm value={value} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Descer anotação 1' }));
    expect(onChange).toHaveBeenLastCalledWith({
      variants: [{ ...value.variants[0], annotations: [{ lines: '2', mdx: 'B' }, { lines: '1', mdx: 'A' }] }],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Remover anotação 2' }));
    expect(onChange).toHaveBeenLastCalledWith({
      variants: [{ ...value.variants[0], annotations: [{ lines: '1', mdx: 'A' }] }],
    });
  });

  it('reorders variants and keeps at least one', async () => {
    const onChange = vi.fn();
    const javascript = { ...PYTHON, language: 'javascript' as const, code: 'console.log(1)' };
    render(<CodeSnippetForm value={snippet(PYTHON, javascript)} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Descer variante 1' }));
    expect(onChange).toHaveBeenLastCalledWith({ variants: [javascript, PYTHON] });

    await userEvent.click(screen.getByRole('button', { name: 'Remover variante 2' }));
    expect(onChange).toHaveBeenLastCalledWith({ variants: [PYTHON] });
  });

  it('does not allow removing the only variant', () => {
    render(<CodeSnippetForm value={snippet(PYTHON)} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Remover variante 1' })).toBeDisabled();
  });

  it('hides the runnable checkbox for mysql, which is read-only', () => {
    const { rerender } = render(<CodeSnippetForm value={snippet(PYTHON)} onChange={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'Executável' })).toBeChecked();

    rerender(<CodeSnippetForm value={snippet({ ...PYTHON, language: 'mysql', runnable: false })} onChange={() => {}} />);
    expect(screen.queryByRole('checkbox', { name: 'Executável' })).not.toBeInTheDocument();
  });

  it('clears runnable when the language changes to mysql', () => {
    const onChange = vi.fn();
    render(<CodeSnippetForm value={snippet(PYTHON)} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Linguagem da variante 1'), { target: { value: 'mysql' } });

    expect(onChange).toHaveBeenLastCalledWith({ variants: [{ ...PYTHON, language: 'mysql', runnable: false }] });
  });

  it('offers stdin for programs and the SQL setup for SQL languages, never both', () => {
    const { rerender } = render(<CodeSnippetForm value={snippet(PYTHON)} onChange={() => {}} />);
    expect(screen.getByLabelText('Entrada (stdin) da variante 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Preparação SQL da variante 1')).not.toBeInTheDocument();

    rerender(<CodeSnippetForm value={snippet({ ...PYTHON, language: 'sqlite' })} onChange={() => {}} />);
    expect(screen.queryByLabelText('Entrada (stdin) da variante 1')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Preparação SQL da variante 1')).toBeInTheDocument();
  });

  it('omits the optional fields again when they are cleared', () => {
    const onChange = vi.fn();
    const value = snippet({ ...PYTHON, stdin: '4', expectedOutput: '8' });
    render(<CodeSnippetForm value={value} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Saída esperada da variante 1'), { target: { value: '' } });

    expect(onChange).toHaveBeenLastCalledWith({ variants: [{ ...PYTHON, stdin: '4' }] });
  });

  it('edits the code of a variant', () => {
    const onChange = vi.fn();
    render(<CodeSnippetForm value={snippet(PYTHON)} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Código da variante 1'), { target: { value: 'print(3)' } });

    expect(onChange).toHaveBeenLastCalledWith({ variants: [{ ...PYTHON, code: 'print(3)' }] });
  });
});
