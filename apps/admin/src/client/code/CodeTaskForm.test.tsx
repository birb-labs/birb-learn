import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CodeKind, Language } from '@birb-learn/content-schema/src/code-languages';
import type { CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { CodeTaskForm } from './CodeTaskForm';

vi.mock('@birb-learn/code-ui/editor', async () => ({ CodeEditor: (await import('./test-support')).FakeCodeEditor }));
vi.mock('../components/MdxEditor', async () => ({ MdxEditor: (await import('./test-support')).FakeMdxEditor }));

const WRITE: CodeTaskPayloadData = {
  starterCode: 'n = int(input())\n',
  solution: 'n = int(input())\nprint(n * 2)\n',
  tests: [{ name: 'Dobro', stdin: '4\n', expectedStdout: '8\n' }],
  blanks: [],
  hints: [],
};

/** Holds the state the page owns, so the form can be driven like in the page. */
function Harness({
  initialKind = 'write',
  initialLanguage = 'python',
  initial = WRITE,
  spy,
}: {
  initialKind?: CodeKind;
  initialLanguage?: Language;
  initial?: CodeTaskPayloadData;
  spy?: (payload: CodeTaskPayloadData) => void;
}) {
  const [kind, setKind] = useState(initialKind);
  const [language, setLanguage] = useState(initialLanguage);
  const [value, setValue] = useState(initial);
  return (
    <CodeTaskForm
      kind={kind}
      language={language}
      value={value}
      onChange={(next) => {
        setValue(next);
        spy?.(next);
      }}
      onKindChange={setKind}
      onLanguageChange={setLanguage}
    />
  );
}

describe('CodeTaskForm', () => {
  it('shows the fields of a write task and hides the other kinds', () => {
    render(<Harness />);

    expect(screen.getByLabelText('Código inicial')).toBeInTheDocument();
    expect(screen.getByLabelText('Solução')).toBeInTheDocument();
    expect(screen.getByLabelText('Prefixo do harness')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do teste 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Saída esperada')).not.toBeInTheDocument();
    expect(screen.queryByText('Lacunas')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Linhas com erro')).not.toBeInTheDocument();
  });

  it('shows only the expected output for predict_output', () => {
    render(<Harness initialKind="predict_output" initial={{ ...WRITE, tests: [], expectedOutput: '8' }} />);

    expect(screen.getByLabelText('Saída esperada')).toHaveValue('8');
    expect(screen.queryByLabelText('Solução')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Prefixo do harness')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Adicionar teste' })).not.toBeInTheDocument();
  });

  it('reports the kind and the language the author picks', async () => {
    const onKindChange = vi.fn();
    const onLanguageChange = vi.fn();
    render(
      <CodeTaskForm
        kind="write"
        language="python"
        value={WRITE}
        onChange={() => {}}
        onKindChange={onKindChange}
        onLanguageChange={onLanguageChange}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Tipo de tarefa'), 'find_bug');
    await userEvent.selectOptions(screen.getByLabelText('Linguagem'), 'sqlite');

    expect(onKindChange).toHaveBeenCalledWith('find_bug');
    expect(onLanguageChange).toHaveBeenCalledWith('sqlite');
  });

  it('shows the blanks editor when the kind is fill_blank', async () => {
    render(<Harness />);
    expect(screen.queryByText('Lacunas')).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Tipo de tarefa'), 'fill_blank');

    expect(screen.getByText('Lacunas')).toBeInTheDocument();
  });

  it('adds blank 2 when ___2___ is typed in the starter code, and drops it again', () => {
    const spy = vi.fn();
    render(<Harness initialKind="fill_blank" spy={spy} />);

    fireEvent.change(screen.getByLabelText('Código com lacunas'), { target: { value: 'x = ___2___\ny = ___1___' } });

    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        starterCode: 'x = ___2___\ny = ___1___',
        blanks: [
          { id: 1, accepted: [''] },
          { id: 2, accepted: [''] },
        ],
      }),
    );
    expect(screen.getByLabelText('Respostas aceitas da lacuna 2 (1)')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Código com lacunas'), { target: { value: 'x = ___1___' } });
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ blanks: [{ id: 1, accepted: [''] }] }));
  });

  it('keeps the accepted answers of a blank that stays in the code', () => {
    const spy = vi.fn();
    const initial = { ...WRITE, starterCode: 'x = ___1___', blanks: [{ id: 1, accepted: ['2', 'two'] }] };
    render(<Harness initialKind="fill_blank" initial={initial} spy={spy} />);

    fireEvent.change(screen.getByLabelText('Código com lacunas'), { target: { value: 'x = ___1___ + ___2___' } });

    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        blanks: [
          { id: 1, accepted: ['2', 'two'] },
          { id: 2, accepted: [''] },
        ],
      }),
    );
  });

  it('edits, adds and removes the accepted answers of a blank', async () => {
    const spy = vi.fn();
    const initial = { ...WRITE, starterCode: 'x = ___1___', blanks: [{ id: 1, accepted: ['2'] }] };
    render(<Harness initialKind="fill_blank" initial={initial} spy={spy} />);

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar resposta aceita da lacuna 1' }));
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ blanks: [{ id: 1, accepted: ['2', ''] }] }));

    fireEvent.change(screen.getByLabelText('Respostas aceitas da lacuna 1 (2)'), { target: { value: 'two' } });
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ blanks: [{ id: 1, accepted: ['2', 'two'] }] }));

    await userEvent.click(screen.getByRole('button', { name: 'Remover resposta aceita 1 da lacuna 1' }));
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ blanks: [{ id: 1, accepted: ['two'] }] }));
  });

  it('shows the bug lines for find_bug', () => {
    const spy = vi.fn();
    render(<Harness initialKind="find_bug" initial={{ ...WRITE, bugLines: '1' }} spy={spy} />);

    fireEvent.change(screen.getByLabelText('Linhas com erro'), { target: { value: '1-2' } });

    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ bugLines: '1-2' }));
  });

  it('edits stdout tests for a programming language', async () => {
    const spy = vi.fn();
    render(<Harness spy={spy} />);

    fireEvent.change(screen.getByLabelText('Entrada do teste 1'), { target: { value: '5\n' } });
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ tests: [{ name: 'Dobro', stdin: '5\n', expectedStdout: '8\n' }] }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar teste' }));
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tests: [
          { name: 'Dobro', stdin: '5\n', expectedStdout: '8\n' },
          { stdin: '', expectedStdout: '' },
        ],
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remover teste 1' }));
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ tests: [{ stdin: '', expectedStdout: '' }] }));
  });

  it('shows SQL test rows instead of stdout tests for a SQL language', () => {
    const sqlTest = {
      sqlSetup: 'CREATE TABLE t (a);',
      expectedRows: { columns: ['a'], rows: [['1'], [null]] },
      orderMatters: true,
    };
    render(<Harness initialLanguage="sqlite" initial={{ ...WRITE, tests: [sqlTest] }} />);

    expect(screen.getByLabelText('Preparação SQL do teste 1')).toHaveValue('CREATE TABLE t (a);');
    expect(screen.getByLabelText('Ordem importa no teste 1')).toBeChecked();
    expect(screen.getByLabelText('Coluna 1 do teste 1')).toHaveValue('a');
    expect(screen.getByLabelText('Teste 1, linha 1, coluna 1')).toHaveValue('1');
    expect(screen.getByLabelText('Teste 1, linha 2, coluna 1 é NULL')).toBeChecked();
    expect(screen.queryByLabelText('Entrada do teste 1')).not.toBeInTheDocument();
  });

  it('edits the expected rows grid of a SQL test', async () => {
    const spy = vi.fn();
    const sqlTest = { sqlSetup: '', expectedRows: { columns: ['a'], rows: [['1']] }, orderMatters: false };
    render(<Harness initialLanguage="sqlite" initial={{ ...WRITE, tests: [sqlTest] }} spy={spy} />);
    const lastTests = () => (spy.mock.lastCall![0] as CodeTaskPayloadData).tests;

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar coluna ao teste 1' }));
    expect(lastTests()[0]).toMatchObject({ expectedRows: { columns: ['a', ''], rows: [['1', '']] } });

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar linha ao teste 1' }));
    expect(lastTests()[0]).toMatchObject({ expectedRows: { rows: [['1', ''], ['', '']] } });

    fireEvent.change(screen.getByLabelText('Teste 1, linha 2, coluna 2'), { target: { value: 'x' } });
    expect(lastTests()[0]).toMatchObject({ expectedRows: { rows: [['1', ''], ['', 'x']] } });

    await userEvent.click(screen.getByLabelText('Teste 1, linha 1, coluna 1 é NULL'));
    expect(lastTests()[0]).toMatchObject({ expectedRows: { rows: [[null, ''], ['', 'x']] } });

    await userEvent.click(screen.getByRole('button', { name: 'Remover coluna 1 do teste 1' }));
    expect(lastTests()[0]).toMatchObject({ expectedRows: { columns: [''], rows: [[''], ['x']] } });

    await userEvent.click(screen.getByRole('button', { name: 'Remover linha 1 do teste 1' }));
    expect(lastTests()[0]).toMatchObject({ expectedRows: { rows: [['x']] } });
  });

  it('pads a row shorter than the header, so its missing cells can be edited', () => {
    const spy = vi.fn();
    const sqlTest = { sqlSetup: '', expectedRows: { columns: ['a', 'b'], rows: [['1']] }, orderMatters: false };
    render(<Harness initialLanguage="sqlite" initial={{ ...WRITE, tests: [sqlTest] }} spy={spy} />);

    fireEvent.change(screen.getByLabelText('Teste 1, linha 1, coluna 2'), { target: { value: 'x' } });

    expect((spy.mock.lastCall![0] as CodeTaskPayloadData).tests[0]).toMatchObject({ expectedRows: { rows: [['1', 'x']] } });
  });

  it('gives every form its own control ids, so labels never reach another block', () => {
    render(
      <>
        <Harness />
        <Harness />
      </>,
    );

    const secondLabel = screen.getAllByText('Tipo de tarefa')[1] as HTMLLabelElement;
    expect(secondLabel.control).toBe(screen.getAllByLabelText('Tipo de tarefa')[1]);
    expect(screen.getAllByLabelText('Tipo de tarefa')[0]).not.toBe(secondLabel.control);
  });

  it('adds a SQL test for a SQL language', async () => {
    const spy = vi.fn();
    render(<Harness initialLanguage="sqlite" initial={{ ...WRITE, tests: [] }} spy={spy} />);

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar teste' }));

    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tests: [{ sqlSetup: '', expectedRows: { columns: ['column'], rows: [['1']] }, orderMatters: false }],
      }),
    );
  });

  it('sets the harness only when it has content', () => {
    const spy = vi.fn();
    render(<Harness spy={spy} />);

    fireEvent.change(screen.getByLabelText('Prefixo do harness'), { target: { value: 'import sys\n' } });
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ harness: { prefix: 'import sys\n', suffix: '' } }));

    fireEvent.change(screen.getByLabelText('Prefixo do harness'), { target: { value: '' } });
    expect(spy.mock.lastCall![0]).not.toHaveProperty('harness');
  });

  it('adds, edits, reorders and removes hints', async () => {
    const spy = vi.fn();
    render(<Harness initial={{ ...WRITE, hints: ['A', 'B'] }} spy={spy} />);

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar dica' }));
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ hints: ['A', 'B', 'Nova dica.'] }));

    fireEvent.change(screen.getByLabelText('Dica 1'), { target: { value: 'A2' } });
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ hints: ['A2', 'B', 'Nova dica.'] }));

    await userEvent.click(screen.getByRole('button', { name: 'Descer dica 1' }));
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ hints: ['B', 'A2', 'Nova dica.'] }));

    await userEvent.click(screen.getByRole('button', { name: 'Remover dica 3' }));
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ hints: ['B', 'A2'] }));
  });
});
