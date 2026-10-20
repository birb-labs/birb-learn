import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeTaskPayload, validateCodeTask } from '@birb-learn/content-schema/src/code-payloads';
import { QuestionEditorPage } from './QuestionEditorPage';

vi.mock('@birb-learn/code-ui/editor', async () => ({ CodeEditor: (await import('../code/test-support')).FakeCodeEditor }));
vi.mock('../components/MdxEditor', async () => ({ MdxEditor: (await import('../code/test-support')).FakeMdxEditor }));

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

const tagsGet: Handler = { match: (url) => url === '/api/tags', body: [] };
const questionPost: Handler = {
  match: (url, init) => url === '/api/questions' && init?.method === 'POST',
  body: { id: 9 },
  status: 201,
};
const questionPatch: Handler = {
  match: (url, init) => url === '/api/questions/7' && init?.method === 'PATCH',
  body: { ok: true },
};

function savedBody(fetchSpy: ReturnType<typeof mockFetch>, method: string, url: string) {
  const call = fetchSpy.mock.calls.find(([u, init]) => u === url && (init as RequestInit)?.method === method);
  expect(call).toBeDefined();
  return JSON.parse((call![1] as RequestInit).body as string);
}

const codeQuestion = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  type: 'code',
  difficulty: 'medium',
  correctAnswer: null,
  answerFormat: 'text',
  codeKind: 'write',
  codeLanguage: 'python',
  key: 'dobro',
  tagIds: [],
  translations: {
    'pt-BR': { promptMdx: 'Dobre.', resolutionMdx: 'Imprima.', codeJson: TASK_JSON, options: [], matchingPairs: [] },
  },
  acceptedAnswersShared: [],
  acceptedAnswersByLocale: {},
  ...overrides,
});

const questionGet = (question: unknown): Handler => ({
  match: (url, init) => url === '/api/questions/7' && (init?.method ?? 'GET') === 'GET',
  body: question,
});

describe('QuestionEditorPage code questions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('offers the "Código" type, which shows the task form and the key', async () => {
    mockFetch([tagsGet]);
    render(<QuestionEditorPage questionId={null} onDone={vi.fn()} />);

    await userEvent.selectOptions(await screen.findByLabelText('Tipo'), 'code');

    expect(screen.getByRole('option', { name: 'Código' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de tarefa')).toHaveValue('write');
    expect(screen.getByLabelText('Linguagem')).toHaveValue('python');
    expect(screen.getByLabelText('Chave (opcional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Solução')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verificar' })).toBeInTheDocument();
  });

  it('does not show the code fields for the other types', async () => {
    mockFetch([tagsGet]);
    render(<QuestionEditorPage questionId={null} onDone={vi.fn()} />);

    await userEvent.selectOptions(await screen.findByLabelText('Tipo'), 'numeric');

    expect(screen.queryByLabelText('Chave (opcional)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tipo de tarefa')).not.toBeInTheDocument();
  });

  it('saves a new code question with its key, kind, language and a valid codeJson', async () => {
    const fetchSpy = mockFetch([tagsGet, questionPost]);
    const onDone = vi.fn();
    render(<QuestionEditorPage questionId={null} onDone={onDone} />);

    await userEvent.selectOptions(await screen.findByLabelText('Tipo'), 'code');
    fireEvent.change(screen.getByLabelText('Enunciado'), { target: { value: 'Dobre o número.' } });
    fireEvent.change(screen.getByLabelText('Resolução'), { target: { value: 'Imprima o dobro.' } });
    fireEvent.change(screen.getByLabelText('Chave (opcional)'), { target: { value: 'dobro-1' } });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onDone).toHaveBeenCalledOnce();
    const body = savedBody(fetchSpy, 'POST', '/api/questions');
    expect(body).toMatchObject({ type: 'code', codeKind: 'write', codeLanguage: 'python', key: 'dobro-1', tagIds: [] });
    expect(Object.keys(body.translations)).toEqual(['pt-BR']);
    const translation = body.translations['pt-BR'];
    expect(translation).toMatchObject({ promptMdx: 'Dobre o número.', resolutionMdx: 'Imprima o dobro.', options: [], matchingPairs: [] });
    const payload = CodeTaskPayload.parse(JSON.parse(translation.codeJson));
    expect(validateCodeTask('write', 'python', payload)).toEqual([]);
  });

  it('sends a null key when the key is left empty, and no code fields for other types', async () => {
    const fetchSpy = mockFetch([tagsGet, questionPost]);
    render(<QuestionEditorPage questionId={null} onDone={vi.fn()} />);

    await userEvent.selectOptions(await screen.findByLabelText('Tipo'), 'code');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(savedBody(fetchSpy, 'POST', '/api/questions').key).toBeNull();
  });

  it('does not send the code fields for a non-code question', async () => {
    const fetchSpy = mockFetch([tagsGet, questionPost]);
    render(<QuestionEditorPage questionId={null} onDone={vi.fn()} />);

    await userEvent.selectOptions(await screen.findByLabelText('Tipo'), 'numeric');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const body = savedBody(fetchSpy, 'POST', '/api/questions');
    for (const field of ['codeKind', 'codeLanguage', 'key']) expect(body).not.toHaveProperty(field);
    expect(body.translations['pt-BR']).not.toHaveProperty('codeJson');
  });

  it('loads an existing code question into the form and saves the edits with PATCH', async () => {
    const fetchSpy = mockFetch([tagsGet, questionGet(codeQuestion()), questionPatch]);
    render(<QuestionEditorPage questionId={7} onDone={vi.fn()} />);

    expect(await screen.findByLabelText('Chave (opcional)')).toHaveValue('dobro');
    expect(await screen.findByLabelText('Solução')).toHaveValue('n = int(input())\nprint(n)\n');
    expect(screen.getByLabelText('Tipo de tarefa')).toHaveValue('write');

    fireEvent.change(screen.getByLabelText('Solução'), { target: { value: 'print(1)' } });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const body = savedBody(fetchSpy, 'PATCH', '/api/questions/7');
    expect(body.key).toBe('dobro');
    expect(JSON.parse(body.translations['pt-BR'].codeJson).solution).toBe('print(1)');
  });

  it('copies the pt-BR payload into the current locale tab and saves it', async () => {
    const fetchSpy = mockFetch([tagsGet, questionGet(codeQuestion()), questionPatch]);
    render(<QuestionEditorPage questionId={7} onDone={vi.fn()} />);
    await screen.findByLabelText('Solução');

    await userEvent.click(screen.getByRole('button', { name: 'en-US' }));
    expect(screen.queryByLabelText('Solução')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Copiar do pt-BR' }));
    expect(screen.getByLabelText('Solução')).toHaveValue('n = int(input())\nprint(n)\n');

    fireEvent.change(screen.getByLabelText('Enunciado'), { target: { value: 'Double it.' } });
    fireEvent.change(screen.getByLabelText('Resolução'), { target: { value: 'Print it.' } });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const body = savedBody(fetchSpy, 'PATCH', '/api/questions/7');
    expect(Object.keys(body.translations).sort()).toEqual(['en-US', 'pt-BR']);
    expect(JSON.parse(body.translations['en-US'].codeJson)).toEqual(JSON.parse(body.translations['pt-BR'].codeJson));
    expect(body.translations['en-US']).toMatchObject({ promptMdx: 'Double it.', resolutionMdx: 'Print it.' });
  });

  it('saves a copied payload even when the prose of that tab is not edited and the tab is left', async () => {
    const fetchSpy = mockFetch([tagsGet, questionGet(codeQuestion()), questionPatch]);
    render(<QuestionEditorPage questionId={7} onDone={vi.fn()} />);
    await screen.findByLabelText('Solução');

    await userEvent.click(screen.getByRole('button', { name: 'en-US' }));
    await userEvent.click(screen.getByRole('button', { name: 'Copiar do pt-BR' }));
    // The copy brings the pt-BR prose along as a starting text.
    expect(screen.getByLabelText('Enunciado')).toHaveValue('Dobre.');
    expect(screen.getByLabelText('Resolução')).toHaveValue('Imprima.');
    await userEvent.click(screen.getByRole('button', { name: 'pt-BR' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const body = savedBody(fetchSpy, 'PATCH', '/api/questions/7');
    expect(Object.keys(body.translations).sort()).toEqual(['en-US', 'pt-BR']);
    expect(JSON.parse(body.translations['en-US'].codeJson)).toEqual(JSON.parse(TASK_JSON));
    expect(body.translations['en-US']).toMatchObject({ promptMdx: 'Dobre.', resolutionMdx: 'Imprima.' });
  });

  it('keeps the prose a translator already wrote when copying the code', async () => {
    mockFetch([tagsGet, questionGet(codeQuestion()), questionPatch]);
    render(<QuestionEditorPage questionId={7} onDone={vi.fn()} />);
    await screen.findByLabelText('Solução');

    await userEvent.click(screen.getByRole('button', { name: 'en-US' }));
    fireEvent.change(screen.getByLabelText('Enunciado'), { target: { value: 'Double it.' } });
    await userEvent.click(screen.getByRole('button', { name: 'Copiar do pt-BR' }));

    expect(screen.getByLabelText('Enunciado')).toHaveValue('Double it.');
    expect(screen.getByLabelText('Resolução')).toHaveValue('Imprima.');
  });

  it('shows a stored payload that does not pass the schema as it is, never as the placeholder', async () => {
    const invalid = JSON.stringify({ starterCode: 'x = ___1___', solution: 'x = 1', tests: [], blanks: [{ id: 1, accepted: [] }], hints: [] });
    mockFetch([
      tagsGet,
      questionGet(
        codeQuestion({
          codeKind: 'fill_blank',
          translations: { 'pt-BR': { promptMdx: 'P', resolutionMdx: 'R', codeJson: invalid, options: [], matchingPairs: [] } },
        }),
      ),
    ]);
    render(<QuestionEditorPage questionId={7} onDone={vi.fn()} />);

    expect(await screen.findByLabelText('Código com lacunas')).toHaveValue('x = ___1___');
  });

  it('moves a read-only language to sqlite when the kind starts running code', async () => {
    const mysqlTask = JSON.stringify({ starterCode: 'SELECT 1;', expectedOutput: '1', tests: [], blanks: [], hints: [] });
    const fetchSpy = mockFetch([
      tagsGet,
      questionGet(
        codeQuestion({
          codeKind: 'predict_output',
          codeLanguage: 'mysql',
          translations: { 'pt-BR': { promptMdx: 'P', resolutionMdx: 'R', codeJson: mysqlTask, options: [], matchingPairs: [] } },
        }),
      ),
      questionPatch,
    ]);
    render(<QuestionEditorPage questionId={7} onDone={vi.fn()} />);
    expect(await screen.findByLabelText('Linguagem')).toHaveValue('mysql');

    await userEvent.selectOptions(screen.getByLabelText('Tipo de tarefa'), 'write');
    expect(screen.getByLabelText('Linguagem')).toHaveValue('sqlite');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const body = savedBody(fetchSpy, 'PATCH', '/api/questions/7');
    expect(body).toMatchObject({ codeKind: 'write', codeLanguage: 'sqlite' });
    const payload = CodeTaskPayload.parse(JSON.parse(body.translations['pt-BR'].codeJson));
    expect(validateCodeTask('write', 'sqlite', payload)).toEqual([]);
  });

  it('does not send an untouched empty locale tab', async () => {
    const fetchSpy = mockFetch([tagsGet, questionGet(codeQuestion()), questionPatch]);
    render(<QuestionEditorPage questionId={7} onDone={vi.fn()} />);
    await screen.findByLabelText('Solução');

    await userEvent.click(screen.getByRole('button', { name: 'es' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(Object.keys(savedBody(fetchSpy, 'PATCH', '/api/questions/7').translations)).toEqual(['pt-BR']);
  });

  it('reshapes the payload of every locale when the kind changes', async () => {
    const fetchSpy = mockFetch([
      tagsGet,
      questionGet(
        codeQuestion({
          translations: {
            'pt-BR': { promptMdx: 'Dobre.', resolutionMdx: 'Imprima.', codeJson: TASK_JSON, options: [], matchingPairs: [] },
            'en-US': { promptMdx: 'Double.', resolutionMdx: 'Print.', codeJson: TASK_JSON, options: [], matchingPairs: [] },
          },
        }),
      ),
      questionPatch,
    ]);
    render(<QuestionEditorPage questionId={7} onDone={vi.fn()} />);
    await screen.findByLabelText('Solução');

    await userEvent.selectOptions(screen.getByLabelText('Tipo de tarefa'), 'predict_output');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const body = savedBody(fetchSpy, 'PATCH', '/api/questions/7');
    expect(body.codeKind).toBe('predict_output');
    for (const locale of ['pt-BR', 'en-US']) {
      const payload = CodeTaskPayload.parse(JSON.parse(body.translations[locale].codeJson));
      expect(validateCodeTask('predict_output', 'python', payload)).toEqual([]);
    }
  });

  it('shows the server error when the save is rejected', async () => {
    mockFetch([
      tagsGet,
      { ...questionPost, body: { error: 'Já existe uma questão com a chave "dobro".' }, status: 409 },
    ]);
    const onDone = vi.fn();
    render(<QuestionEditorPage questionId={null} onDone={onDone} />);

    await userEvent.selectOptions(await screen.findByLabelText('Tipo'), 'code');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Já existe uma questão com a chave "dobro".')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
