import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeSnippetPayload, CodeTaskPayload, validateCodeSnippet, validateCodeTask } from '@birb-learn/content-schema/src/code-payloads';
import { LessonEditorPage } from './LessonEditorPage';

vi.mock('@birb-learn/code-ui/editor', async () => ({ CodeEditor: (await import('../code/test-support')).FakeCodeEditor }));
vi.mock('../components/MdxEditor', async () => ({ MdxEditor: (await import('../code/test-support')).FakeMdxEditor }));

const SNIPPET_JSON = JSON.stringify({
  variants: [{ language: 'python', code: 'print(1)\n', annotations: [], walkthrough: [], runnable: true }],
});
const TASK_JSON = JSON.stringify({
  starterCode: 'n = int(input())\n',
  solution: 'n = int(input())\nprint(n)\n',
  tests: [{ stdin: '4\n', expectedStdout: '4\n' }],
  blanks: [],
  hints: [],
});

interface Handler {
  match: (url: string, init?: RequestInit) => boolean;
  body: unknown;
  status?: number;
}

function mockFetch(handlers: Handler[]) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = typeof input === 'string' ? input : input.toString();
    const handler = handlers.find((h) => h.match(url, init as RequestInit));
    if (!handler) throw new Error(`Unexpected fetch: ${(init as RequestInit | undefined)?.method ?? 'GET'} ${url}`);
    return Promise.resolve(new Response(JSON.stringify(handler.body), { status: handler.status ?? 200 }));
  });
}

const lessonGet = (blocks: unknown[]): Handler => ({
  match: (url, init) => url === '/api/lessons/lessons/1' && (init?.method ?? 'GET') === 'GET',
  body: { translations: { 'pt-BR': { title: 'Lição' } }, blocks },
});
const blockPost: Handler = {
  match: (url, init) => url === '/api/lessons/lessons/1/blocks' && init?.method === 'POST',
  body: { id: 5 },
  status: 201,
};
const blockPatch: Handler = {
  match: (url, init) => url === '/api/lessons/lessons/1/blocks/1' && init?.method === 'PATCH',
  body: { ok: true },
};

function bodyOf(fetchSpy: ReturnType<typeof mockFetch>, method: string, url: string) {
  const calls = fetchSpy.mock.calls.filter(([u, init]) => u === url && (init as RequestInit)?.method === method);
  expect(calls.length).toBeGreaterThan(0);
  return JSON.parse((calls[calls.length - 1][1] as RequestInit).body as string);
}

const snippetBlock = (translations: Record<string, unknown>) => ({
  id: 1,
  order: 1,
  type: 'code_snippet',
  simulatorKey: null,
  simulatorParams: null,
  codeKind: null,
  codeLanguage: null,
  translations,
});
const exerciseBlock = (translations: Record<string, unknown>, codeKind = 'write', codeLanguage = 'python') => ({
  id: 1,
  order: 1,
  type: 'code_exercise',
  simulatorKey: null,
  simulatorParams: null,
  codeKind,
  codeLanguage,
  translations,
});

describe('LessonEditorPage code blocks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('offers the code block types with their pt-BR labels', async () => {
    mockFetch([lessonGet([])]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);

    await screen.findByDisplayValue('Lição');

    expect(screen.getByRole('button', { name: '+ Trecho de código' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Exercício de código' })).toBeInTheDocument();
  });

  it('POSTs a new code snippet block with a valid placeholder payload', async () => {
    const fetchSpy = mockFetch([lessonGet([]), blockPost]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
    await screen.findByDisplayValue('Lição');

    await userEvent.click(screen.getByRole('button', { name: '+ Trecho de código' }));

    const body = bodyOf(fetchSpy, 'POST', '/api/lessons/lessons/1/blocks');
    expect(body.type).toBe('code_snippet');
    expect(body).not.toHaveProperty('codeKind');
    const payload = CodeSnippetPayload.parse(JSON.parse(body.translations['pt-BR'].payloadJson));
    expect(validateCodeSnippet(payload)).toEqual([]);
    expect(payload.variants[0]).toMatchObject({ language: 'python', code: 'print("Hello, world!")\n' });
  });

  it('POSTs a new code exercise block with a valid write task and its kind and language', async () => {
    const fetchSpy = mockFetch([lessonGet([]), blockPost]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
    await screen.findByDisplayValue('Lição');

    await userEvent.click(screen.getByRole('button', { name: '+ Exercício de código' }));

    const body = bodyOf(fetchSpy, 'POST', '/api/lessons/lessons/1/blocks');
    expect(body).toMatchObject({ type: 'code_exercise', codeKind: 'write', codeLanguage: 'python' });
    const translation = body.translations['pt-BR'];
    expect(translation.promptMdx.trim()).not.toBe('');
    expect(translation.resolutionMdx.trim()).not.toBe('');
    const payload = CodeTaskPayload.parse(JSON.parse(translation.payloadJson));
    expect(validateCodeTask('write', 'python', payload)).toEqual([]);
    expect(payload.tests).toHaveLength(1);
  });

  it('shows the label of an existing code block and edits its code', async () => {
    const fetchSpy = mockFetch([lessonGet([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]), blockPatch]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);

    const editor = await screen.findByLabelText('Código da variante 1');
    expect(screen.getByText('Trecho de código', { exact: true })).toBeInTheDocument();

    fireEvent.change(editor, { target: { value: 'print(2)\n' } });

    const body = bodyOf(fetchSpy, 'PATCH', '/api/lessons/lessons/1/blocks/1');
    expect(Object.keys(body.translations)).toEqual(['pt-BR']);
    expect(JSON.parse(body.translations['pt-BR'].payloadJson).variants[0].code).toBe('print(2)\n');
    expect(screen.getByLabelText('Código da variante 1')).toHaveValue('print(2)\n');
  });

  it('copies the pt-BR payload into the current locale tab', async () => {
    const fetchSpy = mockFetch([lessonGet([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]), blockPatch]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
    await screen.findByLabelText('Código da variante 1');

    await userEvent.click(screen.getByRole('button', { name: 'en-US' }));
    expect(screen.queryByLabelText('Código da variante 1')).not.toBeInTheDocument();
    expect(screen.getByText('Este idioma ainda não tem código.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Copiar do pt-BR' }));

    const body = bodyOf(fetchSpy, 'PATCH', '/api/lessons/lessons/1/blocks/1');
    expect(Object.keys(body.translations)).toEqual(['en-US']);
    expect(body.translations['en-US'].payloadJson).toBe(SNIPPET_JSON);
    expect(await screen.findByLabelText('Código da variante 1')).toHaveValue('print(1)\n');
  });

  it('does not offer the copy button on the pt-BR tab', async () => {
    mockFetch([lessonGet([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })])]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
    await screen.findByLabelText('Código da variante 1');

    expect(screen.queryByRole('button', { name: 'Copiar do pt-BR' })).not.toBeInTheDocument();
  });

  it('shows the prompt, the resolution and the task of a code exercise, and PATCHes the prompt with the payload', async () => {
    const fetchSpy = mockFetch([
      lessonGet([exerciseBlock({ 'pt-BR': { promptMdx: 'Dobre.', resolutionMdx: 'Imprima.', payloadJson: TASK_JSON } })]),
      blockPatch,
    ]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);

    const prompt = await screen.findByLabelText('Enunciado');
    expect(screen.getByLabelText('Resolução')).toHaveValue('Imprima.');
    expect(screen.getByLabelText('Solução')).toHaveValue('n = int(input())\nprint(n)\n');

    fireEvent.change(prompt, { target: { value: 'Dobre o número.' } });

    const body = bodyOf(fetchSpy, 'PATCH', '/api/lessons/lessons/1/blocks/1');
    expect(body.translations['pt-BR']).toMatchObject({ promptMdx: 'Dobre o número.', resolutionMdx: 'Imprima.', payloadJson: TASK_JSON });
  });

  it('changing the kind of a code exercise PATCHes the new kind with every locale payload adapted', async () => {
    const fetchSpy = mockFetch([
      lessonGet([
        exerciseBlock({
          'pt-BR': { promptMdx: 'Dobre.', resolutionMdx: 'Imprima.', payloadJson: TASK_JSON },
          'en-US': { promptMdx: 'Double.', resolutionMdx: 'Print.', payloadJson: TASK_JSON },
        }),
      ]),
      blockPatch,
    ]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
    await screen.findByLabelText('Enunciado');

    await userEvent.selectOptions(screen.getByLabelText('Tipo de tarefa'), 'predict_output');

    const body = bodyOf(fetchSpy, 'PATCH', '/api/lessons/lessons/1/blocks/1');
    expect(body.codeKind).toBe('predict_output');
    expect(body.codeLanguage).toBe('python');
    expect(Object.keys(body.translations).sort()).toEqual(['en-US', 'pt-BR']);
    for (const locale of ['pt-BR', 'en-US']) {
      const payload = CodeTaskPayload.parse(JSON.parse(body.translations[locale].payloadJson));
      expect(validateCodeTask('predict_output', 'python', payload)).toEqual([]);
      expect(body.translations[locale].promptMdx).toBeTruthy();
    }
    expect(screen.getByLabelText('Saída esperada')).toBeInTheDocument();
  });

  it('changing the language of a code exercise to SQL swaps the tests for SQL tests', async () => {
    const fetchSpy = mockFetch([
      lessonGet([exerciseBlock({ 'pt-BR': { promptMdx: 'Dobre.', resolutionMdx: 'Imprima.', payloadJson: TASK_JSON } })]),
      blockPatch,
    ]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
    await screen.findByLabelText('Enunciado');

    await userEvent.selectOptions(screen.getByLabelText('Linguagem'), 'sqlite');

    const body = bodyOf(fetchSpy, 'PATCH', '/api/lessons/lessons/1/blocks/1');
    expect(body.codeLanguage).toBe('sqlite');
    const payload = CodeTaskPayload.parse(JSON.parse(body.translations['pt-BR'].payloadJson));
    expect(validateCodeTask('write', 'sqlite', payload)).toEqual([]);
    expect(screen.getByLabelText('Preparação SQL do teste 1')).toBeInTheDocument();
  });

  it('shows the server error when a code edit is rejected', async () => {
    mockFetch([
      lessonGet([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]),
      { ...blockPatch, body: { error: 'pt-BR: payload inválido — variants[0].code: x' }, status: 400 },
    ]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);

    fireEvent.change(await screen.findByLabelText('Código da variante 1'), { target: { value: '' } });

    expect(await screen.findByText('pt-BR: payload inválido — variants[0].code: x')).toBeInTheDocument();
  });
});
