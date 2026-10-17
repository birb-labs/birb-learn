import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CodeAnswer } from '@birb-learn/code-runner/src/grading';
import type { CaseResult, RunOptions, RunRequest, RunResult, Runner, UnavailableReason } from '@birb-learn/code-runner/src/protocol';
import type { CodeKind, Language } from '@birb-learn/content-schema/src/code-languages';
import type { CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { CodeTaskView, type CodeTaskViewProps } from './code-task-view';
import type { HighlightedLine } from './highlight';
import { TEST_TASK_LABELS } from './test-labels';

function toLines(code: string): HighlightedLine[] {
  return code
    .replace(/\n$/, '')
    .split('\n')
    .map((text) => (text === '' ? [] : [{ text }]));
}

function caseResult(stdout: string, overrides: Partial<CaseResult> = {}): CaseResult {
  return { status: 'ok', stdout, stderr: '', exitCode: 0, durationMs: 1, ...overrides };
}

function okRun(...stdouts: string[]): RunResult {
  return { status: 'ok', cases: stdouts.map((stdout) => caseResult(stdout)) };
}

function unavailable(reason: UnavailableReason): RunResult {
  return { status: 'unavailable', reason, cases: [] };
}

/** Answers every run with `respond`'s result; by default the run never settles. */
class FakeRunner implements Runner {
  requests: RunRequest[] = [];
  options: (RunOptions | undefined)[] = [];
  constructor(private respond: (request: RunRequest) => RunResult | undefined = () => undefined) {}

  runCode(request: RunRequest, options?: RunOptions): Promise<RunResult> {
    this.requests.push(request);
    this.options.push(options);
    const result = this.respond(request);
    return result ? Promise.resolve(result) : new Promise(() => {});
  }
}

const DOUBLE_PAYLOAD: CodeTaskPayloadData = {
  starterCode: 'n = int(input())\n',
  solution: 'n = int(input())\nprint(n * 2)\n',
  tests: [
    { name: 'double of 4', stdin: '4\n', expectedStdout: '8\n' },
    { stdin: '-3\n', expectedStdout: '-6\n' },
  ],
  blanks: [],
  hints: [],
};

const FILL_PAYLOAD: CodeTaskPayloadData = {
  starterCode: 'SELECT nome FROM alunos WHERE idade ___1___ 18 ORDER BY ___2___;',
  solution: 'SELECT nome FROM alunos WHERE idade >= 18 ORDER BY nome;',
  tests: [],
  blanks: [
    { id: 1, accepted: ['>='] },
    { id: 2, accepted: ['nome'] },
  ],
  hints: [],
};

// The markers are split across tokens on purpose: the view must still find them.
const FILL_TOKENS: HighlightedLine[] = [
  [{ text: 'SELECT nome FROM alunos WHERE idade ' }, { text: '___' }, { text: '1' }, { text: '___' }, { text: ' 18 ORDER BY ' }, { text: '___2___' }, { text: ';' }],
];

const BUG_PAYLOAD: CodeTaskPayloadData = {
  starterCode: 'total = 0\nfor i in range(4):\n    total = i\nprint(total)\n',
  solution: 'total = 0\nfor i in range(4):\n    total += i\nprint(total)\n',
  bugLines: '3',
  tests: [{ stdin: '', expectedStdout: '6\n' }],
  blanks: [],
  hints: [],
};

const PREDICT_PAYLOAD: CodeTaskPayloadData = {
  starterCode: 'let x = 2;\nx += 3;\nconsole.log(x * 2);\n',
  expectedOutput: '10',
  tests: [],
  blanks: [],
  hints: [],
};

interface SetupOptions extends Partial<CodeTaskViewProps> {
  runner?: Runner;
}

function setup(kind: CodeKind, language: Language, payload: CodeTaskPayloadData, options: SetupOptions = {}) {
  const runner = options.runner ?? new FakeRunner();
  const props: CodeTaskViewProps = {
    mode: 'practice',
    kind,
    language,
    starterTokens: toLines(payload.starterCode),
    payload,
    prompt: <p>The prompt</p>,
    runner,
    labels: TEST_TASK_LABELS,
    ...options,
  };
  const view = render(<CodeTaskView {...props} />);
  return { runner: runner as FakeRunner, ...view };
}

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

/** The live region: it carries the announcement and nothing else. */
function announcement(): HTMLElement {
  const region = document.querySelector<HTMLElement>('[data-announcement]');
  if (!region) throw new Error('no live region');
  return region;
}

/** The announcement is exactly the verdict (plus the reason), and the visible card shows the verdict too. */
async function expectVerdict(verdict: string, reason?: string) {
  await waitFor(() => expect(announcement().textContent).toBe(reason ? `${verdict} ${reason}` : verdict));
  expect(document.querySelector('[data-verdict]')?.textContent).toContain(verdict);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CodeTaskView write', () => {
  it('lists each test as passed or failed, with expected and actual for the failure', async () => {
    const runner = new FakeRunner(() => okRun('8\n', '5\n'));
    setup('write', 'python', DOUBLE_PAYLOAD, { runner });

    expect(screen.getByText('The prompt')).toBeTruthy();
    click('Check');
    await expectVerdict('Not quite');

    const items = within(screen.getByRole('list', { name: 'Tests' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('double of 4')).toBeTruthy();
    expect(within(items[0]).getByText('passed')).toBeTruthy();
    expect(within(items[0]).queryByText('Expected')).toBeNull();
    expect(within(items[1]).getByText('Test 2')).toBeTruthy();
    expect(within(items[1]).getByText('failed')).toBeTruthy();
    expect(within(items[1]).getByText('-6')).toBeTruthy();
    expect(within(items[1]).getByText('5')).toBeTruthy();
    // One run with one case per test.
    expect(runner.requests).toHaveLength(1);
    expect(runner.requests[0].cases).toHaveLength(2);
  });

  it('announces only the verdict, keeping the detail card out of the live region', async () => {
    setup('write', 'python', DOUBLE_PAYLOAD, { runner: new FakeRunner(() => okRun('8\n', '5\n')) });
    // The region exists before the check, so the verdict arrives as a change to it.
    expect(announcement().getAttribute('role')).toBe('status');
    expect(announcement().textContent).toBe('');

    click('Check');
    await expectVerdict('Not quite');

    const card = document.querySelector('[data-verdict]') as HTMLElement;
    // The card carries the details (tests, expected/actual) and is not itself live.
    expect(card.textContent).toContain('double of 4');
    expect(card.closest('[role="status"]')).toBeNull();
    expect(card.querySelector('[role="status"]')).toBeNull();
    expect(announcement().contains(card)).toBe(false);
    expect(announcement().textContent).not.toContain('double of 4');
  });

  it('reports a correct answer', async () => {
    setup('write', 'python', DOUBLE_PAYLOAD, { runner: new FakeRunner(() => okRun('8\n', '-6\n')) });
    click('Check');
    await expectVerdict('Correct!');
  });

  it('shows the compile output of a program that did not compile', async () => {
    const runner = new FakeRunner(() => ({ status: 'compile_error', compileOutput: 'SyntaxError: nope', cases: [] }));
    setup('write', 'c', DOUBLE_PAYLOAD, { runner });
    click('Check');
    expect(await screen.findByText('SyntaxError: nope')).toBeTruthy();
    expect(screen.getByText('Compile error')).toBeTruthy();
    await expectVerdict('Not quite');
  });

  it('wraps the answer in the harness when checking', async () => {
    const runner = new FakeRunner(() => okRun('8\n', '-6\n'));
    setup('write', 'python', { ...DOUBLE_PAYLOAD, harness: { prefix: 'import sys', suffix: 'print("end")' } }, { runner });
    click('Check');
    await expectVerdict('Correct!');
    expect(runner.requests[0].source).toBe('import sys\nn = int(input())\n\nprint("end")');
  });

  it('offers a free run panel next to the editor', () => {
    setup('write', 'python', DOUBLE_PAYLOAD);
    expect(screen.getByLabelText('Your code')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy();
    expect(screen.getByLabelText('Input')).toBeTruthy();
  });

  it('seeds the editor with the given answer, or else the starter code', () => {
    const { unmount } = setup('write', 'python', DOUBLE_PAYLOAD);
    expect(screen.getByLabelText('Your code').textContent).toContain('n = int(input())');
    unmount();
    setup('write', 'python', DOUBLE_PAYLOAD, { answer: { kind: 'write', code: 'print(1)' } });
    expect(screen.getByLabelText('Your code').textContent).toContain('print(1)');
  });
});

describe('CodeTaskView predict_output', () => {
  it('grades a correct answer without running anything', async () => {
    const { runner } = setup('predict_output', 'javascript', PREDICT_PAYLOAD);
    expect(screen.getByRole('region', { name: 'Code in JavaScript' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Predicted output'), { target: { value: '10\n' } });
    click('Check');
    await expectVerdict('Correct!');
    expect(runner.requests).toHaveLength(0);
  });

  it('grades a wrong answer as incorrect', async () => {
    setup('predict_output', 'javascript', PREDICT_PAYLOAD);
    fireEvent.change(screen.getByLabelText('Predicted output'), { target: { value: '5' } });
    click('Check');
    await expectVerdict('Not quite');
  });

  it('clears the verdict once the answer changes', async () => {
    setup('predict_output', 'javascript', PREDICT_PAYLOAD);
    click('Check');
    await expectVerdict('Not quite');
    fireEvent.change(screen.getByLabelText('Predicted output'), { target: { value: '1' } });
    expect(screen.queryByText('Not quite')).toBeNull();
  });
});

describe('CodeTaskView fill_blank', () => {
  it('puts an input where each marker was, even when the marker spans tokens', () => {
    const { container } = setup('fill_blank', 'sqlite', FILL_PAYLOAD, { starterTokens: FILL_TOKENS });
    const first = screen.getByLabelText('Blank 1');
    const second = screen.getByLabelText('Blank 2');
    expect(first.tagName).toBe('INPUT');
    expect(second.tagName).toBe('INPUT');
    const line = container.querySelector('[data-line="1"]') as HTMLElement;
    // The gutter number comes first; the markers are gone, replaced by the inputs.
    expect(line.textContent).toBe('1SELECT nome FROM alunos WHERE idade  18 ORDER BY ;');
    expect(line.querySelectorAll('input')).toHaveLength(2);
  });

  it('reports typed blanks', () => {
    const onAnswerChange = vi.fn();
    setup('fill_blank', 'sqlite', FILL_PAYLOAD, { starterTokens: FILL_TOKENS, onAnswerChange });
    fireEvent.change(screen.getByLabelText('Blank 1'), { target: { value: '>=' } });
    expect(onAnswerChange).toHaveBeenLastCalledWith({ kind: 'fill_blank', blanks: { 1: '>=' } });
    fireEvent.change(screen.getByLabelText('Blank 2'), { target: { value: 'nome' } });
    expect(onAnswerChange).toHaveBeenLastCalledWith({ kind: 'fill_blank', blanks: { 1: '>=', 2: 'nome' } });
    expect((screen.getByLabelText('Blank 2') as HTMLInputElement).value).toBe('nome');
  });

  it('marks which blank is wrong', async () => {
    const answer: CodeAnswer = { kind: 'fill_blank', blanks: { 1: '>=', 2: 'idade' } };
    setup('fill_blank', 'sqlite', FILL_PAYLOAD, { starterTokens: FILL_TOKENS, answer });
    click('Check');
    await expectVerdict('Not quite');
    expect(screen.getByText('Blank 1 is right')).toBeTruthy();
    expect(screen.getByText('Blank 2 is wrong')).toBeTruthy();
    expect(screen.getByLabelText('Blank 2').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Blank 1').getAttribute('aria-invalid')).toBeNull();
  });

  it('grades right blanks as correct', async () => {
    const answer: CodeAnswer = { kind: 'fill_blank', blanks: { 1: ' >= ', 2: 'nome' } };
    setup('fill_blank', 'sqlite', FILL_PAYLOAD, { starterTokens: FILL_TOKENS, answer });
    click('Check');
    await expectVerdict('Correct!');
  });
});

describe('CodeTaskView find_bug', () => {
  const rightRunner = () => new FakeRunner(() => okRun('6\n'));

  it('selects a line and reports it', () => {
    const onAnswerChange = vi.fn();
    setup('find_bug', 'python', BUG_PAYLOAD, { onAnswerChange });
    const lineButton = screen.getByRole('button', { name: 'Line 3: total = i' });
    expect(lineButton.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(lineButton);
    expect(lineButton.getAttribute('aria-pressed')).toBe('true');
    expect(onAnswerChange).toHaveBeenLastCalledWith({ kind: 'find_bug', line: 3, code: BUG_PAYLOAD.starterCode });
  });

  it('is correct for the right line with passing tests', async () => {
    setup('find_bug', 'python', BUG_PAYLOAD, { runner: rightRunner() });
    click('Line 3: total = i');
    click('Check');
    await expectVerdict('Correct!');
    expect(screen.getByText('That line has the bug')).toBeTruthy();
  });

  it('is incorrect for the wrong line even when the tests pass', async () => {
    setup('find_bug', 'python', BUG_PAYLOAD, { runner: rightRunner() });
    click('Line 1: total = 0');
    click('Check');
    await expectVerdict('Not quite');
    expect(screen.getByText('The bug is not on that line')).toBeTruthy();
  });

  it('names an empty line by its number alone', () => {
    const payload = { ...BUG_PAYLOAD, starterCode: 'a = 1\n\nprint(a)\n' };
    setup('find_bug', 'python', payload);
    expect(screen.getByRole('button', { name: 'Line 1: a = 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Line 2' })).toBeTruthy();
  });

  it('offers a fix editor only when there are tests', () => {
    setup('find_bug', 'python', BUG_PAYLOAD);
    expect(screen.getByLabelText('Fixed code')).toBeTruthy();
  });

  it('has no fix editor without tests, and grades by the line alone', async () => {
    setup('find_bug', 'python', { ...BUG_PAYLOAD, tests: [] });
    expect(screen.queryByLabelText('Fixed code')).toBeNull();
    click('Line 3: total = i');
    click('Check');
    await expectVerdict('Correct!');
  });
});

describe('CodeTaskView practice extras', () => {
  const payload: CodeTaskPayloadData = { ...PREDICT_PAYLOAD, hints: ['x'] };

  it('reveals hints one at a time', () => {
    setup('predict_output', 'javascript', payload, { hints: [<p key="1">First hint</p>, <p key="2">Second hint</p>] });
    expect(screen.queryByText('First hint')).toBeNull();
    click('Show hint 1 of 2');
    expect(screen.getByText('First hint')).toBeTruthy();
    expect(screen.queryByText('Second hint')).toBeNull();
    click('Show hint 2 of 2');
    expect(screen.getByText('Second hint')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Show hint/ })).toBeNull();
  });

  it('moves the focus to the last hint when its button goes away', () => {
    setup('predict_output', 'javascript', payload, { hints: [<p key="1">First hint</p>, <p key="2">Second hint</p>] });
    click('Show hint 1 of 2');
    // The button is still there for the next hint: the focus stays with the student's place.
    expect(screen.getByRole('button', { name: 'Show hint 2 of 2' })).toBeTruthy();
    click('Show hint 2 of 2');
    expect(screen.queryByRole('button', { name: /Show hint/ })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('group', { name: 'Hint 2' }));
  });

  it('keeps the solution hidden until requested', () => {
    setup('predict_output', 'javascript', payload, {
      resolution: <p>Because x becomes 5.</p>,
      solutionTokens: [[{ text: 'ANSWER-CODE' }]],
    });
    expect(screen.queryByText('Because x becomes 5.')).toBeNull();
    expect(screen.queryByText('ANSWER-CODE')).toBeNull();
    click('Show solution');
    expect(screen.getByText('Because x becomes 5.')).toBeTruthy();
    expect(screen.getByText('ANSWER-CODE')).toBeTruthy();
    click('Hide solution');
    expect(screen.queryByText('ANSWER-CODE')).toBeNull();
  });

  it('has no hint button when there are no hints', () => {
    setup('predict_output', 'javascript', PREDICT_PAYLOAD);
    expect(screen.queryByRole('button', { name: /Show hint/ })).toBeNull();
  });
});

describe('CodeTaskView exam mode', () => {
  it('has no check, hint or solution controls, and only reports the answer', () => {
    const onAnswerChange = vi.fn();
    setup('predict_output', 'javascript', { ...PREDICT_PAYLOAD, hints: ['x'] }, {
      mode: 'exam',
      onAnswerChange,
      hints: [<p key="1">A hint</p>],
      resolution: <p>The resolution</p>,
      solutionTokens: [[{ text: 'ANSWER-CODE' }]],
    });
    expect(screen.queryByRole('button', { name: 'Check' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Show hint/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show solution' })).toBeNull();
    expect(screen.queryByText('The resolution')).toBeNull();

    fireEvent.change(screen.getByLabelText('Predicted output'), { target: { value: '10' } });
    expect(onAnswerChange).toHaveBeenLastCalledWith({ kind: 'predict_output', output: '10' });
  });

  it('shows the answer it was given', () => {
    setup('predict_output', 'javascript', PREDICT_PAYLOAD, { mode: 'exam', answer: { kind: 'predict_output', output: '42' } });
    expect((screen.getByLabelText('Predicted output') as HTMLTextAreaElement).value).toBe('42');
  });
});

describe('CodeTaskView runner trouble', () => {
  it('shows "not graded" with the reason when the runner is unavailable', async () => {
    setup('write', 'python', DOUBLE_PAYLOAD, { runner: new FakeRunner(() => unavailable('offline')) });
    click('Check');
    await expectVerdict('Not graded', 'You are offline');
    // The visible card shows the reason as well.
    expect(document.querySelector('[data-verdict]')?.textContent).toContain('You are offline');
  });

  it('treats a runner that rejects as a failed service', async () => {
    const runner: Runner = { runCode: () => Promise.reject(new Error('boom')) };
    setup('write', 'python', DOUBLE_PAYLOAD, { runner });
    click('Check');
    await expectVerdict('Not graded', 'The runner failed');
  });

  it('disables Check while running and re-enables it afterwards', async () => {
    setup('write', 'python', DOUBLE_PAYLOAD, { runner: new FakeRunner(() => unavailable('offline')) });
    click('Check');
    expect((screen.getByRole('button', { name: 'Checking...' }) as HTMLButtonElement).disabled).toBe(true);
    await expectVerdict('Not graded', 'You are offline');
    expect((screen.getByRole('button', { name: 'Check' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('aborts a check in flight when the view unmounts, without errors', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const runner = new FakeRunner();
    const { unmount } = setup('write', 'python', DOUBLE_PAYLOAD, { runner });
    click('Check');
    const signal = runner.options[0]?.signal;
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {});
    expect(error).not.toHaveBeenCalled();
  });

  it('aborts a check in flight when the answer changes', () => {
    const runner = new FakeRunner();
    const payload = { ...FILL_PAYLOAD, tests: [{ name: 'all', sqlSetup: '', expectedRows: { columns: ['nome'], rows: [['Ana']] }, orderMatters: false }] };
    setup('fill_blank', 'sqlite', payload, { starterTokens: FILL_TOKENS, runner });
    click('Check');
    const signal = runner.options[0]?.signal;
    expect(signal?.aborted).toBe(false);
    fireEvent.change(screen.getByLabelText('Blank 1'), { target: { value: '>' } });
    expect(signal?.aborted).toBe(true);
    expect((screen.getByRole('button', { name: 'Check' }) as HTMLButtonElement).disabled).toBe(false);
  });
});
