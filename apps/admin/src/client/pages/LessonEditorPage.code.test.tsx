import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeSnippetPayload, CodeTaskPayload, validateCodeSnippet, validateCodeTask } from '@birb-learn/content-schema/src/code-payloads';
import { SAVE_DEBOUNCE_MS } from '../code/use-debounced-saver';
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
const FILL_BLANK_JSON = JSON.stringify({
  starterCode: 'x = 1\n',
  solution: 'x = 1\n',
  tests: [{ stdin: '', expectedStdout: '' }],
  blanks: [],
  hints: [],
});

type Responder = (init: RequestInit) => Promise<Response> | Response;

/** Routes the lesson page requests; PATCHes to a block go through `patch`, so a test can hold them back. */
function mockLessonApi(blocks: unknown[], options: { patch?: Responder; post?: Responder } = {}) {
  const ok = () => new Response(JSON.stringify({ ok: true }), { status: 200 });
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init as RequestInit | undefined)?.method ?? 'GET';
    if (url === '/api/lessons/lessons/1' && method === 'GET') {
      return Promise.resolve(new Response(JSON.stringify({ translations: { 'pt-BR': { title: 'Lição' } }, blocks }), { status: 200 }));
    }
    if (url === '/api/lessons/lessons/1/blocks' && method === 'POST') {
      return Promise.resolve(options.post?.(init!) ?? new Response(JSON.stringify({ id: 5 }), { status: 201 }));
    }
    if (url === '/api/lessons/lessons/1/blocks/1' && method === 'PATCH') {
      return Promise.resolve(options.patch?.(init!) ?? ok());
    }
    throw new Error(`Unexpected fetch: ${method} ${url}`);
  });
}

function sentBodies(fetchSpy: ReturnType<typeof mockLessonApi>, method: string, url: string) {
  return fetchSpy.mock.calls
    .filter(([u, init]) => u === url && (init as RequestInit)?.method === method)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string));
}
const patches = (fetchSpy: ReturnType<typeof mockLessonApi>) => sentBodies(fetchSpy, 'PATCH', '/api/lessons/lessons/1/blocks/1');

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
const PT_EXERCISE = { promptMdx: 'Dobre.', resolutionMdx: 'Imprima.', payloadJson: TASK_JSON };

/** Renders the page, waits for the blocks, then fakes the timers the save debounce runs on. */
async function renderLoaded(awaitLabel: string) {
  const view = render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
  await screen.findByLabelText(awaitLabel);
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  return view;
}

async function settle(ms = SAVE_DEBOUNCE_MS + 100) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function edit(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('LessonEditorPage code blocks', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('offers the code block types with their pt-BR labels', async () => {
    mockLessonApi([]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
    await screen.findByDisplayValue('Lição');

    expect(screen.getByRole('button', { name: '+ Trecho de código' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Exercício de código' })).toBeInTheDocument();
  });

  it('POSTs a new code snippet block with a valid placeholder payload', async () => {
    const fetchSpy = mockLessonApi([]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
    await screen.findByDisplayValue('Lição');

    await userEvent.click(screen.getByRole('button', { name: '+ Trecho de código' }));

    const [body] = sentBodies(fetchSpy, 'POST', '/api/lessons/lessons/1/blocks');
    expect(body.type).toBe('code_snippet');
    expect(body).not.toHaveProperty('codeKind');
    const payload = CodeSnippetPayload.parse(JSON.parse(body.translations['pt-BR'].payloadJson));
    expect(validateCodeSnippet(payload)).toEqual([]);
    expect(payload.variants[0]).toMatchObject({ language: 'python', code: 'print("Hello, world!")\n' });
  });

  it('POSTs a new code exercise block with a valid write task and its kind and language', async () => {
    const fetchSpy = mockLessonApi([]);
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
    await screen.findByDisplayValue('Lição');

    await userEvent.click(screen.getByRole('button', { name: '+ Exercício de código' }));

    const [body] = sentBodies(fetchSpy, 'POST', '/api/lessons/lessons/1/blocks');
    expect(body).toMatchObject({ type: 'code_exercise', codeKind: 'write', codeLanguage: 'python' });
    const translation = body.translations['pt-BR'];
    expect(translation.promptMdx.trim()).not.toBe('');
    expect(translation.resolutionMdx.trim()).not.toBe('');
    const payload = CodeTaskPayload.parse(JSON.parse(translation.payloadJson));
    expect(validateCodeTask('write', 'python', payload)).toEqual([]);
    expect(payload.tests).toHaveLength(1);
  });

  describe('saving', () => {
    it('shows the label of an existing code block and saves one PATCH with the final draft after rapid edits', async () => {
      const fetchSpy = mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]);
      await renderLoaded('Código da variante 1');
      expect(screen.getByText('Trecho de código', { exact: true })).toBeInTheDocument();

      edit('Código da variante 1', 'print(2)\n');
      await settle(200);
      edit('Código da variante 1', 'print(23)\n');
      await settle(200);
      edit('Código da variante 1', 'print(234)\n');
      expect(patches(fetchSpy)).toHaveLength(0);
      expect(screen.getByLabelText('Código da variante 1')).toHaveValue('print(234)\n');

      await settle();

      const bodies = patches(fetchSpy);
      expect(bodies).toHaveLength(1);
      expect(Object.keys(bodies[0].translations)).toEqual(['pt-BR']);
      expect(JSON.parse(bodies[0].translations['pt-BR'].payloadJson).variants[0].code).toBe('print(234)\n');
    });

    it('saves right away when the focus leaves the block', async () => {
      const fetchSpy = mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]);
      await renderLoaded('Código da variante 1');

      edit('Código da variante 1', 'print(2)\n');
      fireEvent.blur(screen.getByLabelText('Código da variante 1'));

      expect(patches(fetchSpy)).toHaveLength(1);
    });

    it('saves the pending edits when the page unmounts', async () => {
      const fetchSpy = mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]);
      const { unmount } = await renderLoaded('Código da variante 1');

      edit('Código da variante 1', 'print(2)\n');
      unmount();

      expect(patches(fetchSpy)).toHaveLength(1);
    });

    it('does not let a slow, older response decide what is shown', async () => {
      const resolvers: Array<(response: Response) => void> = [];
      const fetchSpy = mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })], {
        patch: () => new Promise<Response>((resolve) => resolvers.push(resolve)),
      });
      await renderLoaded('Código da variante 1');

      edit('Código da variante 1', 'print(2)\n');
      await settle();
      expect(patches(fetchSpy)).toHaveLength(1);

      // Still typing while the first request is in flight: nothing else is sent yet.
      edit('Código da variante 1', 'print(3)\n');
      await settle();
      expect(patches(fetchSpy)).toHaveLength(1);

      // The first request fails late; its error is about an older draft and must not show.
      await act(async () => resolvers[0](new Response(JSON.stringify({ error: 'Erro antigo.' }), { status: 400 })));
      expect(screen.queryByText('Erro antigo.')).not.toBeInTheDocument();
      expect(patches(fetchSpy)).toHaveLength(2);
      expect(JSON.parse(patches(fetchSpy)[1].translations['pt-BR'].payloadJson).variants[0].code).toBe('print(3)\n');

      await act(async () => resolvers[1](new Response(JSON.stringify({ ok: true }), { status: 200 })));
      expect(screen.queryByText('Erro antigo.')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Código da variante 1')).toHaveValue('print(3)\n');
    });

    it('shows the server error of the latest save', async () => {
      mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })], {
        patch: () => new Response(JSON.stringify({ error: 'pt-BR: payload inválido — x' }), { status: 400 }),
      });
      await renderLoaded('Código da variante 1');

      edit('Código da variante 1', 'print(2)\n');
      await settle();

      expect(screen.getByText('pt-BR: payload inválido — x')).toBeInTheDocument();
    });

    it('shows what is wrong with a draft that is not valid yet and sends nothing', async () => {
      const fetchSpy = mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]);
      await renderLoaded('Código da variante 1');

      fireEvent.click(screen.getByRole('button', { name: 'Adicionar anotação' }));
      edit('Variante 1: linhas da anotação 1', '9');
      await settle();

      expect(patches(fetchSpy)).toHaveLength(0);
      const problem = screen.getByText(/past the end of the code/);
      expect(problem).toHaveStyle({ whiteSpace: 'pre-wrap' });
      expect(screen.getByText(/ainda não é válido/)).toBeInTheDocument();
      // The author's draft is untouched.
      expect(screen.getByLabelText('Variante 1: linhas da anotação 1')).toHaveValue('9');

      edit('Variante 1: linhas da anotação 1', '1');
      await settle();

      expect(patches(fetchSpy)).toHaveLength(1);
      expect(screen.queryByText(/past the end of the code/)).not.toBeInTheDocument();
    });
  });

  describe('keeping the draft', () => {
    it('keeps the code of a fill_blank exercise when a blank without answers makes it invalid, and saves it once valid', async () => {
      const fetchSpy = mockLessonApi([
        exerciseBlock({ 'pt-BR': { ...PT_EXERCISE, payloadJson: FILL_BLANK_JSON } }, 'fill_blank'),
      ]);
      await renderLoaded('Código com lacunas');

      edit('Código com lacunas', 'x = ___2___\n');
      await settle();

      // Not the placeholder, not the stored text: what the author typed.
      expect(screen.getByLabelText('Código com lacunas')).toHaveValue('x = ___2___\n');
      expect(screen.getByLabelText('Respostas aceitas da lacuna 2 (1)')).toBeInTheDocument();
      expect(screen.getByLabelText('Solução')).toHaveValue('x = 1\n');
      expect(patches(fetchSpy)).toHaveLength(0);

      edit('Código com lacunas', 'x = ___2___ + 1\n');
      edit('Respostas aceitas da lacuna 2 (1)', '1');
      await settle();

      expect(screen.getByLabelText('Código com lacunas')).toHaveValue('x = ___2___ + 1\n');
      const [body] = patches(fetchSpy);
      const saved = JSON.parse(body.translations['pt-BR'].payloadJson);
      expect(saved.starterCode).toBe('x = ___2___ + 1\n');
      expect(saved.blanks).toEqual([{ id: 2, accepted: ['1'] }]);
      expect(saved.solution).toBe('x = 1\n');
    });

    it('keeps an annotation whose lines were cleared and an emptied hint', async () => {
      const stored = JSON.stringify({
        variants: [{ language: 'python', code: 'print(1)\n', annotations: [{ lines: '1', mdx: 'A' }], walkthrough: [], runnable: false }],
      });
      mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: stored } })]);
      await renderLoaded('Código da variante 1');

      edit('Variante 1: linhas da anotação 1', '');
      edit('Variante 1: texto da anotação 1', '');
      await settle();

      expect(screen.getByLabelText('Variante 1: linhas da anotação 1')).toHaveValue('');
      expect(screen.getByLabelText('Variante 1: texto da anotação 1')).toHaveValue('');
      expect(screen.getByLabelText('Código da variante 1')).toHaveValue('print(1)\n');
    });

    it('keeps an emptied variant code', async () => {
      const fetchSpy = mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]);
      await renderLoaded('Código da variante 1');

      edit('Código da variante 1', '');
      await settle();
      edit('Código da variante 1', 'x');
      await settle();

      expect(screen.getByLabelText('Código da variante 1')).toHaveValue('x');
      const bodies = patches(fetchSpy);
      expect(bodies).toHaveLength(1);
      expect(JSON.parse(bodies[0].translations['pt-BR'].payloadJson).variants[0].code).toBe('x');
    });

    it('shows a stored payload that does not pass the schema as it is, never as the placeholder', async () => {
      const invalid = JSON.stringify({ starterCode: 'x = ___1___', solution: 'x = 1', tests: [], blanks: [{ id: 1, accepted: [] }], hints: [] });
      const fetchSpy = mockLessonApi([exerciseBlock({ 'pt-BR': { ...PT_EXERCISE, payloadJson: invalid } }, 'fill_blank')]);
      await renderLoaded('Código com lacunas');
      await settle();

      expect(screen.getByLabelText('Código com lacunas')).toHaveValue('x = ___1___');
      expect(patches(fetchSpy)).toHaveLength(0);
    });

    it('shows stored text it cannot read as it is, editable, and never replaces it', async () => {
      const broken = '{"variants": [';
      const fetchSpy = mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: broken } })]);
      render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);

      expect(await screen.findByLabelText('JSON salvo do código')).toHaveValue(broken);
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      await settle();

      expect(screen.queryByLabelText('Código da variante 1')).not.toBeInTheDocument();
      expect(patches(fetchSpy)).toHaveLength(0);

      // Fixed by hand, it turns into the structured form.
      edit('JSON salvo do código', SNIPPET_JSON);
      await settle();
      expect(screen.getByLabelText('Código da variante 1')).toHaveValue('print(1)\n');
      expect(patches(fetchSpy)).toHaveLength(1);
    });

    it('keeps the drafts of the other locale tabs when switching tabs', async () => {
      mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]);
      await renderLoaded('Código da variante 1');
      edit('Código da variante 1', 'print(99)\n');
      vi.useRealTimers();

      await userEvent.click(screen.getByRole('button', { name: 'en-US' }));
      await userEvent.click(screen.getByRole('button', { name: 'pt-BR' }));

      expect(screen.getByLabelText('Código da variante 1')).toHaveValue('print(99)\n');
    });
  });

  describe('locales', () => {
    it('copies the pt-BR payload into the current locale tab and saves it', async () => {
      const fetchSpy = mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]);
      await renderLoaded('Código da variante 1');
      vi.useRealTimers();

      await userEvent.click(screen.getByRole('button', { name: 'en-US' }));
      expect(screen.queryByLabelText('Código da variante 1')).not.toBeInTheDocument();
      expect(screen.getByText('Este idioma ainda não tem código.')).toBeInTheDocument();

      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      fireEvent.click(screen.getByRole('button', { name: 'Copiar do pt-BR' }));
      await settle();

      const [body] = patches(fetchSpy);
      expect(Object.keys(body.translations)).toEqual(['en-US']);
      expect(JSON.parse(body.translations['en-US'].payloadJson)).toEqual(JSON.parse(SNIPPET_JSON));
      expect(screen.getByLabelText('Código da variante 1')).toHaveValue('print(1)\n');
    });

    it('does not offer the copy button on the pt-BR tab', async () => {
      mockLessonApi([snippetBlock({ 'pt-BR': { payloadJson: SNIPPET_JSON } })]);
      render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
      await screen.findByLabelText('Código da variante 1');

      expect(screen.queryByRole('button', { name: 'Copiar do pt-BR' })).not.toBeInTheDocument();
    });

    it('copies the prompt and the resolution too on an untranslated code exercise tab', async () => {
      const fetchSpy = mockLessonApi([exerciseBlock({ 'pt-BR': PT_EXERCISE })]);
      await renderLoaded('Solução');
      vi.useRealTimers();
      await userEvent.click(screen.getByRole('button', { name: 'en-US' }));
      expect(screen.getByLabelText('Enunciado')).toHaveValue('');

      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      fireEvent.click(screen.getByRole('button', { name: 'Copiar do pt-BR' }));
      await settle();

      expect(screen.getByLabelText('Enunciado')).toHaveValue('Dobre.');
      expect(screen.getByLabelText('Resolução')).toHaveValue('Imprima.');
      const [body] = patches(fetchSpy);
      expect(body.translations['en-US']).toMatchObject({ promptMdx: 'Dobre.', resolutionMdx: 'Imprima.' });
      expect(JSON.parse(body.translations['en-US'].payloadJson)).toEqual(JSON.parse(TASK_JSON));
    });

    it('does not overwrite prose the translator already wrote when copying the code', async () => {
      mockLessonApi([exerciseBlock({ 'pt-BR': PT_EXERCISE })]);
      await renderLoaded('Solução');
      vi.useRealTimers();
      await userEvent.click(screen.getByRole('button', { name: 'en-US' }));
      fireEvent.change(screen.getByLabelText('Enunciado'), { target: { value: 'Double it.' } });

      await userEvent.click(screen.getByRole('button', { name: 'Copiar do pt-BR' }));

      expect(screen.getByLabelText('Enunciado')).toHaveValue('Double it.');
      expect(screen.getByLabelText('Resolução')).toHaveValue('Imprima.');
    });
  });

  describe('code exercises', () => {
    it('shows the prompt, the resolution and the task, and saves the prompt together with the payload', async () => {
      const fetchSpy = mockLessonApi([exerciseBlock({ 'pt-BR': PT_EXERCISE })]);
      await renderLoaded('Enunciado');
      expect(screen.getByLabelText('Resolução')).toHaveValue('Imprima.');
      expect(screen.getByLabelText('Solução')).toHaveValue('n = int(input())\nprint(n)\n');

      edit('Enunciado', 'Dobre o número.');
      await settle();

      const [body] = patches(fetchSpy);
      expect(body).toMatchObject({ codeKind: 'write', codeLanguage: 'python' });
      expect(body.translations['pt-BR']).toMatchObject({ promptMdx: 'Dobre o número.', resolutionMdx: 'Imprima.', payloadJson: TASK_JSON });
    });

    it('does not send a prompt that was blanked, which the server would reject', async () => {
      const fetchSpy = mockLessonApi([exerciseBlock({ 'pt-BR': PT_EXERCISE })]);
      await renderLoaded('Enunciado');

      edit('Enunciado', '');
      await settle();

      expect(patches(fetchSpy)).toHaveLength(0);
      expect(screen.getByText(/ainda não é válido/)).toBeInTheDocument();
      expect(screen.getByLabelText('Enunciado')).toHaveValue('');
    });

    it('changing the kind PATCHes the new kind with every locale payload adapted', async () => {
      const fetchSpy = mockLessonApi([
        exerciseBlock({
          'pt-BR': PT_EXERCISE,
          'en-US': { promptMdx: 'Double.', resolutionMdx: 'Print.', payloadJson: TASK_JSON },
        }),
      ]);
      await renderLoaded('Enunciado');

      fireEvent.change(screen.getByLabelText('Tipo de tarefa'), { target: { value: 'predict_output' } });
      await settle();

      const [body] = patches(fetchSpy);
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

    it('moves a read-only language to sqlite when the kind starts running code', async () => {
      const mysqlTask = JSON.stringify({ starterCode: 'SELECT 1;', expectedOutput: '1', tests: [], blanks: [], hints: [] });
      const fetchSpy = mockLessonApi([exerciseBlock({ 'pt-BR': { ...PT_EXERCISE, payloadJson: mysqlTask } }, 'predict_output', 'mysql')]);
      await renderLoaded('Enunciado');
      expect(screen.getByLabelText('Linguagem')).toHaveValue('mysql');

      fireEvent.change(screen.getByLabelText('Tipo de tarefa'), { target: { value: 'write' } });
      await settle();

      expect(screen.getByLabelText('Linguagem')).toHaveValue('sqlite');
      const [body] = patches(fetchSpy);
      expect(body).toMatchObject({ codeKind: 'write', codeLanguage: 'sqlite' });
      const payload = CodeTaskPayload.parse(JSON.parse(body.translations['pt-BR'].payloadJson));
      expect(validateCodeTask('write', 'sqlite', payload)).toEqual([]);
    });

    it('changing the language to SQL swaps the tests for SQL tests', async () => {
      const fetchSpy = mockLessonApi([exerciseBlock({ 'pt-BR': PT_EXERCISE })]);
      await renderLoaded('Enunciado');

      fireEvent.change(screen.getByLabelText('Linguagem'), { target: { value: 'sqlite' } });
      await settle();

      const [body] = patches(fetchSpy);
      expect(body.codeLanguage).toBe('sqlite');
      const payload = CodeTaskPayload.parse(JSON.parse(body.translations['pt-BR'].payloadJson));
      expect(validateCodeTask('write', 'sqlite', payload)).toEqual([]);
      expect(screen.getByLabelText('Preparação SQL do teste 1')).toBeInTheDocument();
    });
  });
});
