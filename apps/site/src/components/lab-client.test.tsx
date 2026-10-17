import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
import type { Runner } from '@birb-learn/code-runner/src/protocol';
import ptBR from '@/messages/pt-BR.json';
import { LabClient } from './lab-client';

// CodeMirror needs a real layout engine to be typed into; the real editor and
// run panel are covered by their own tests and by the browser smoke tests.
vi.mock('@birb-learn/code-ui/editor', () => {
  const remoteLanguages = ['c', 'cpp', 'java', 'go', 'rust'];
  return {
    CodeEditor: ({ value, onChange, language, ariaLabel }: { value: string; onChange: (value: string) => void; language: string; ariaLabel: string }) => (
      <textarea aria-label={ariaLabel} data-language={language} value={value} onChange={(event) => onChange(event.target.value)} />
    ),
    RunPanel: ({
      language,
      source,
      stdin,
      showStdin,
      sqlSetup,
      showSqlSetup,
      labels,
    }: {
      language: string;
      source: string;
      stdin?: string;
      showStdin?: boolean;
      sqlSetup?: string;
      showSqlSetup?: boolean;
      labels: { run: string; remoteNotice: string };
    }) => (
      <div data-testid="run-panel" data-language={language} data-source={source} data-stdin={stdin} data-show-stdin={String(showStdin)} data-sql-setup={sqlSetup} data-show-sql-setup={String(showSqlSetup)}>
        {remoteLanguages.includes(language) && <p>{labels.remoteNotice}</p>}
        <button type="button">{labels.run}</button>
      </div>
    ),
  };
});

const runner: Runner = { runCode: () => new Promise(() => {}) };

function renderLab() {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
      <LabClient runner={runner} />
    </NextIntlClientProvider>,
  );
}

async function renderLoadedLab() {
  renderLab();
  await screen.findByRole('textbox', { name: /^Código em/ });
}

const picker = () => screen.getByRole('combobox', { name: ptBR.lab.languageLabel });
const editor = () => screen.getByRole('textbox', { name: /^Código em/ });

function setHash(hash: string) {
  window.history.replaceState(null, '', `/pt-BR/lab/${hash}`);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setHash('');
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('LabClient language selection', () => {
  it('opens Python with its template when nothing asks for another language', async () => {
    await renderLoadedLab();
    expect(picker()).toHaveValue('python');
    expect(editor()).toHaveValue(LANGUAGE_INFO.python.template);
  });

  it('uses the language in the URL hash', async () => {
    setHash('#lang=lua');
    await renderLoadedLab();
    expect(picker()).toHaveValue('lua');
    expect(editor()).toHaveValue(LANGUAGE_INFO.lua.template);
  });

  it('ignores an unknown language in the hash', async () => {
    setHash('#lang=cobol');
    await renderLoadedLab();
    expect(picker()).toHaveValue('python');
  });

  it('prefers the snippet handed over by a lesson to the hash, and consumes it', async () => {
    setHash('#lang=lua');
    sessionStorage.setItem(
      'birb-learn:lab:incoming',
      JSON.stringify({ language: 'ruby', code: 'puts gets', stdin: '7\n', sqlSetup: '' }),
    );
    await renderLoadedLab();
    expect(picker()).toHaveValue('ruby');
    expect(editor()).toHaveValue('puts gets');
    expect(screen.getByTestId('run-panel')).toHaveAttribute('data-stdin', '7\n');
    expect(sessionStorage.getItem('birb-learn:lab:incoming')).toBeNull();
  });

  it('falls back to the hash when the handed-over snippet is invalid', async () => {
    setHash('#lang=lua');
    sessionStorage.setItem('birb-learn:lab:incoming', JSON.stringify({ language: 'cobol', code: 'x' }));
    await renderLoadedLab();
    expect(picker()).toHaveValue('lua');
  });

  it('restores the code saved for the language', async () => {
    localStorage.setItem('birb-learn:lab:python', 'print("saved")');
    await renderLoadedLab();
    expect(editor()).toHaveValue('print("saved")');
  });

  it('still works when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    await renderLoadedLab();
    expect(editor()).toHaveValue(LANGUAGE_INFO.python.template);
    fireEvent.change(editor(), { target: { value: 'print(2)' } });
    expect(editor()).toHaveValue('print(2)');
  });
});

describe('LabClient language picker', () => {
  it('groups the languages by where they run', async () => {
    await renderLoadedLab();
    const inBrowser = within(screen.getByRole('group', { name: ptBR.lab.groups.browser }));
    const remote = within(screen.getByRole('group', { name: ptBR.lab.groups.remote }));
    const readOnly = within(screen.getByRole('group', { name: ptBR.lab.groups.readOnly }));
    expect(inBrowser.getAllByRole('option').map((option) => option.textContent)).toEqual(
      ['JavaScript', 'TypeScript', 'Python', 'Lua', 'Ruby', 'SQLite', 'PostgreSQL'],
    );
    expect(remote.getAllByRole('option').map((option) => option.textContent)).toEqual(['C', 'C++', 'Java', 'Go', 'Rust']);
    expect(readOnly.getAllByRole('option').map((option) => option.textContent)).toEqual(['MySQL']);
  });

  it('keeps the code of each language apart while switching', async () => {
    const user = userEvent.setup();
    await renderLoadedLab();
    fireEvent.change(editor(), { target: { value: 'print("py")' } });

    await user.selectOptions(picker(), 'lua');
    expect(editor()).toHaveValue(LANGUAGE_INFO.lua.template);
    fireEvent.change(editor(), { target: { value: 'print("lua")' } });

    await user.selectOptions(picker(), 'python');
    expect(editor()).toHaveValue('print("py")');
    await user.selectOptions(picker(), 'lua');
    expect(editor()).toHaveValue('print("lua")');
  });

  it('records the chosen language in the address so a reload keeps it', async () => {
    const user = userEvent.setup();
    await renderLoadedLab();
    await user.selectOptions(picker(), 'go');
    expect(window.location.hash).toBe('#lang=go');
  });

  it('points the editor and the run panel at the chosen language', async () => {
    const user = userEvent.setup();
    await renderLoadedLab();
    await user.selectOptions(picker(), 'ruby');
    expect(editor()).toHaveAttribute('data-language', 'ruby');
    expect(screen.getByTestId('run-panel')).toHaveAttribute('data-language', 'ruby');
    expect(screen.getByTestId('run-panel')).toHaveAttribute('data-source', LANGUAGE_INFO.ruby.template);
  });
});

describe('LabClient persistence', () => {
  it('saves the code 500 ms after the last edit', async () => {
    await renderLoadedLab();
    vi.useFakeTimers();
    fireEvent.change(editor(), { target: { value: 'print(1)' } });
    fireEvent.change(editor(), { target: { value: 'print(12)' } });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(localStorage.getItem('birb-learn:lab:python')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(localStorage.getItem('birb-learn:lab:python')).toBe('print(12)');
  });

  it('does not lose a pending edit when the language changes', async () => {
    await renderLoadedLab();
    fireEvent.change(editor(), { target: { value: 'print(3)' } });
    fireEvent.change(picker(), { target: { value: 'lua' } });
    expect(localStorage.getItem('birb-learn:lab:python')).toBe('print(3)');
    expect(localStorage.getItem('birb-learn:lab:lua')).toBeNull();
  });

  it('does not save the template or a handed-over snippet until the student edits', async () => {
    sessionStorage.setItem('birb-learn:lab:incoming', JSON.stringify({ language: 'lua', code: 'print(9)' }));
    await renderLoadedLab();
    expect(localStorage.length).toBe(0);
  });
});

describe('LabClient reset', () => {
  it('restores the template once the student confirms', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await renderLoadedLab();
    fireEvent.change(editor(), { target: { value: 'print("mine")' } });

    await user.click(screen.getByRole('button', { name: ptBR.lab.reset }));

    expect(confirm).toHaveBeenCalledWith(ptBR.lab.resetConfirm.replace('{language}', 'Python'));
    expect(editor()).toHaveValue(LANGUAGE_INFO.python.template);
    expect(localStorage.getItem('birb-learn:lab:python')).toBe(LANGUAGE_INFO.python.template);
  });

  it('keeps the code when the student declines', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await renderLoadedLab();
    fireEvent.change(editor(), { target: { value: 'print("mine")' } });

    await user.click(screen.getByRole('button', { name: ptBR.lab.reset }));

    expect(editor()).toHaveValue('print("mine")');
  });
});

describe('LabClient engines', () => {
  it('shows the Compiler Explorer notice for a remote language only', async () => {
    const user = userEvent.setup();
    await renderLoadedLab();
    expect(screen.queryByText(ptBR.code.run.remoteNotice)).toBeNull();
    await user.selectOptions(picker(), 'c');
    expect(screen.getByText(ptBR.code.run.remoteNotice)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ptBR.code.run.run })).toBeInTheDocument();
  });

  it('offers OneCompiler instead of Run for MySQL', async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await renderLoadedLab();
    await user.selectOptions(picker(), 'mysql');

    expect(screen.queryByTestId('run-panel')).toBeNull();
    expect(screen.queryByRole('button', { name: ptBR.code.run.run })).toBeNull();
    await user.click(screen.getByRole('button', { name: ptBR.code.oneCompiler }));

    expect(open).toHaveBeenCalledWith('https://onecompiler.com/mysql', '_blank', 'noopener,noreferrer');
    expect(writeText).toHaveBeenCalledWith(LANGUAGE_INFO.mysql.template);
  });

  it('shows an editable SQL setup for SQL languages only, and hands it to the run panel', async () => {
    const user = userEvent.setup();
    await renderLoadedLab();
    expect(screen.queryByRole('textbox', { name: ptBR.lab.setupLabel })).toBeNull();

    await user.selectOptions(picker(), 'sqlite');
    fireEvent.change(screen.getByRole('textbox', { name: ptBR.lab.setupLabel }), { target: { value: 'CREATE TABLE t (a INT);' } });

    const panel = screen.getByTestId('run-panel');
    expect(panel).toHaveAttribute('data-sql-setup', 'CREATE TABLE t (a INT);');
    // The editor is the one place the setup is shown.
    expect(panel).toHaveAttribute('data-show-sql-setup', 'false');
  });

  it('opens a handed-over SQL snippet with its setup', async () => {
    sessionStorage.setItem(
      'birb-learn:lab:incoming',
      JSON.stringify({ language: 'postgresql', code: 'SELECT * FROM t;', sqlSetup: 'CREATE TABLE t (a INT);' }),
    );
    await renderLoadedLab();
    expect(screen.getByRole('textbox', { name: ptBR.lab.setupLabel })).toHaveValue('CREATE TABLE t (a INT);');
  });

  it('offers the stdin input to the run panel for every runnable language', async () => {
    await renderLoadedLab();
    expect(screen.getByTestId('run-panel')).toHaveAttribute('data-show-stdin', 'true');
  });
});

describe('LabClient before it is ready', () => {
  it('renders the language picker disabled, so a choice cannot be overridden by the start-up', () => {
    const html = renderToString(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <LabClient runner={runner} />
      </NextIntlClientProvider>,
    );
    expect(html).toMatch(/<select[^>]*disabled/);
  });
});

describe('LabClient previous code', () => {
  const restore = () => screen.queryByRole('button', { name: ptBR.lab.restorePrevious });

  it('offers to restore the code a handed-over snippet replaced', async () => {
    const user = userEvent.setup();
    localStorage.setItem('birb-learn:lab:python', 'print("mine")');
    sessionStorage.setItem('birb-learn:lab:incoming', JSON.stringify({ language: 'python', code: 'print("lesson")' }));
    await renderLoadedLab();

    expect(editor()).toHaveValue('print("lesson")');
    // Nothing is written until the student edits.
    expect(localStorage.getItem('birb-learn:lab:python')).toBe('print("mine")');

    await user.click(restore()!);
    expect(editor()).toHaveValue('print("mine")');
    expect(localStorage.getItem('birb-learn:lab:python')).toBe('print("mine")');
    expect(localStorage.getItem('birb-learn:lab:python:previous')).toBeNull();
    expect(restore()).toBeNull();
  });

  it('stashes the saved code before the first save of the handed-over code', async () => {
    localStorage.setItem('birb-learn:lab:python', 'print("mine")');
    sessionStorage.setItem('birb-learn:lab:incoming', JSON.stringify({ language: 'python', code: 'print("lesson")' }));
    await renderLoadedLab();
    vi.useFakeTimers();
    fireEvent.change(editor(), { target: { value: 'print("lesson 2")' } });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(localStorage.getItem('birb-learn:lab:python')).toBe('print("lesson 2")');
    expect(localStorage.getItem('birb-learn:lab:python:previous')).toBe('print("mine")');
    expect(restore()).not.toBeNull();
  });

  it('keeps the first stash when the student keeps editing', async () => {
    localStorage.setItem('birb-learn:lab:python', 'print("mine")');
    sessionStorage.setItem('birb-learn:lab:incoming', JSON.stringify({ language: 'python', code: 'print("lesson")' }));
    await renderLoadedLab();
    vi.useFakeTimers();
    fireEvent.change(editor(), { target: { value: 'a' } });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.change(editor(), { target: { value: 'ab' } });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(localStorage.getItem('birb-learn:lab:python:previous')).toBe('print("mine")');
  });

  it('shows the button on a later visit while the stash exists', async () => {
    localStorage.setItem('birb-learn:lab:python', 'print("lesson")');
    localStorage.setItem('birb-learn:lab:python:previous', 'print("mine")');
    await renderLoadedLab();
    expect(restore()).not.toBeNull();
  });

  it('has no button when nothing was replaced', async () => {
    sessionStorage.setItem('birb-learn:lab:incoming', JSON.stringify({ language: 'python', code: 'print("lesson")' }));
    await renderLoadedLab();
    expect(restore()).toBeNull();
  });

  it('has no button when the handed-over code is what was already saved', async () => {
    localStorage.setItem('birb-learn:lab:python', 'print("lesson")');
    sessionStorage.setItem('birb-learn:lab:incoming', JSON.stringify({ language: 'python', code: 'print("lesson")' }));
    await renderLoadedLab();
    expect(restore()).toBeNull();
  });

  it('follows the language: the button belongs to the language whose code was replaced', async () => {
    const user = userEvent.setup();
    localStorage.setItem('birb-learn:lab:python', 'print("mine")');
    sessionStorage.setItem('birb-learn:lab:incoming', JSON.stringify({ language: 'python', code: 'print("lesson")' }));
    await renderLoadedLab();
    await user.selectOptions(picker(), 'lua');
    expect(restore()).toBeNull();
    await user.selectOptions(picker(), 'python');
    expect(restore()).not.toBeNull();
  });
});

describe('LabClient hash changes', () => {
  it('switches language when #lang= is edited on a loaded lab, keeping the pending edit', async () => {
    await renderLoadedLab();
    fireEvent.change(editor(), { target: { value: 'print(5)' } });

    act(() => {
      window.history.replaceState(null, '', '/pt-BR/lab/#lang=lua');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(picker()).toHaveValue('lua');
    expect(editor()).toHaveValue(LANGUAGE_INFO.lua.template);
    expect(localStorage.getItem('birb-learn:lab:python')).toBe('print(5)');
  });

  it('ignores a hash that names no language', async () => {
    await renderLoadedLab();
    act(() => {
      window.history.replaceState(null, '', '/pt-BR/lab/#lang=cobol');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(picker()).toHaveValue('python');
  });
});
