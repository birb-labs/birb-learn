import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonEditorPage } from './LessonEditorPage';

// Generic responder used across tests: routes on URL + method so it doesn't
// matter in what order requests actually fire (MdxEditor's own debounced
// /api/preview request races the assertions under real timers, same
// footgun documented in QuestionEditorPage.test.tsx).
function mockFetch(handlers: { match: (url: string, init?: RequestInit) => boolean; body: unknown; status?: number }[]) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init as RequestInit | undefined)?.method ?? 'GET';
    const handler = handlers.find((h) => h.match(url, init as RequestInit));
    if (!handler) {
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    }
    return Promise.resolve(new Response(JSON.stringify(handler.body), { status: handler.status ?? 200 }));
  });
}

const previewHandler = {
  match: (url: string) => url === '/api/preview',
  body: { html: '' },
};

describe('LessonEditorPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders block cards with the right type labels', async () => {
    mockFetch([
      {
        match: (url, init) => url === '/api/lessons/lessons/1' && (init?.method ?? 'GET') === 'GET',
        body: {
          translations: { 'pt-BR': { title: 'Lição de limites' } },
          blocks: [
            {
              id: 1,
              order: 1,
              type: 'text',
              simulatorKey: null,
              simulatorParams: null,
              translations: { 'pt-BR': { bodyMdx: 'Corpo original' } },
            },
            {
              id: 2,
              order: 2,
              type: 'solved_exercise',
              simulatorKey: null,
              simulatorParams: null,
              translations: { 'pt-BR': { promptMdx: 'Calcule o limite.', resolutionMdx: 'Resolução aqui.' } },
            },
          ],
        },
      },
      previewHandler,
    ]);

    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);

    expect(await screen.findByDisplayValue('Lição de limites')).toBeInTheDocument();
    expect(screen.getByText('Texto', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Exercício resolvido', { exact: true })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Corpo original')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Calcule o limite.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Resolução aqui.')).toBeInTheDocument();
  });

  it('clicking "+ Texto" POSTs a new text block', async () => {
    const fetchSpy = mockFetch([
      {
        match: (url, init) => url === '/api/lessons/lessons/1' && (init?.method ?? 'GET') === 'GET',
        body: { translations: { 'pt-BR': { title: 'Lição' } }, blocks: [] },
      },
      {
        match: (url, init) => url === '/api/lessons/lessons/1/blocks' && init?.method === 'POST',
        body: { id: 5 },
        status: 201,
      },
      previewHandler,
    ]);

    const user = userEvent.setup();
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);

    await screen.findByDisplayValue('Lição');
    await user.click(screen.getByRole('button', { name: '+ Texto' }));

    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/lessons/lessons/1/blocks' && (init as RequestInit)?.method === 'POST',
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.type).toBe('text');
    expect(body.translations['pt-BR']).toEqual({ bodyMdx: 'Novo bloco de texto.' });
  });

  it('clicking "+ Simulador" POSTs a new simulator block with a non-blank simulatorKey', async () => {
    const fetchSpy = mockFetch([
      {
        match: (url, init) => url === '/api/lessons/lessons/1' && (init?.method ?? 'GET') === 'GET',
        body: { translations: { 'pt-BR': { title: 'Lição' } }, blocks: [] },
      },
      {
        match: (url, init) => url === '/api/lessons/lessons/1/blocks' && init?.method === 'POST',
        body: { id: 5 },
        status: 201,
      },
      previewHandler,
    ]);

    const user = userEvent.setup();
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);

    await screen.findByDisplayValue('Lição');
    await user.click(screen.getByRole('button', { name: '+ Simulador' }));

    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/lessons/lessons/1/blocks' && (init as RequestInit)?.method === 'POST',
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.type).toBe('simulator');
    expect(body.translations['pt-BR']).toEqual({ caption: '' });
    expect(typeof body.simulatorKey).toBe('string');
    expect(body.simulatorKey.trim().length).toBeGreaterThan(0);
  });

  it('shows the server error message when adding a block fails', async () => {
    mockFetch([
      {
        match: (url, init) => url === '/api/lessons/lessons/1' && (init?.method ?? 'GET') === 'GET',
        body: { translations: { 'pt-BR': { title: 'Lição' } }, blocks: [] },
      },
      {
        match: (url, init) => url === '/api/lessons/lessons/1/blocks' && init?.method === 'POST',
        body: { error: 'Blocos de texto precisam de conteúdo.' },
        status: 400,
      },
      previewHandler,
    ]);

    const user = userEvent.setup();
    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);

    await screen.findByDisplayValue('Lição');
    await user.click(screen.getByRole('button', { name: '+ Texto' }));

    expect(await screen.findByText('Blocos de texto precisam de conteúdo.')).toBeInTheDocument();
  });

  it("editing a block's content field PATCHes just that locale's translation", async () => {
    const fetchSpy = mockFetch([
      {
        match: (url, init) => url === '/api/lessons/lessons/1' && (init?.method ?? 'GET') === 'GET',
        body: {
          translations: { 'pt-BR': { title: 'Lição' } },
          blocks: [
            {
              id: 1,
              order: 1,
              type: 'text',
              simulatorKey: null,
              simulatorParams: null,
              translations: { 'pt-BR': { bodyMdx: 'Corpo original' } },
            },
          ],
        },
      },
      {
        match: (url, init) => url === '/api/lessons/lessons/1/blocks/1' && init?.method === 'PATCH',
        body: { ok: true },
      },
      previewHandler,
    ]);

    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);

    const textarea = await screen.findByDisplayValue('Corpo original');
    fireEvent.change(textarea, { target: { value: 'Corpo editado' } });

    const patchCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/lessons/lessons/1/blocks/1' && (init as RequestInit)?.method === 'PATCH',
    );
    expect(patchCall).toBeDefined();
    const body = JSON.parse((patchCall![1] as RequestInit).body as string);
    expect(body).toEqual({ translations: { 'pt-BR': { bodyMdx: 'Corpo editado' } } });
  });

  it('keeps the latest keystroke even when an older PATCH response resolves after a newer one', async () => {
    // Regression test: MdxEditor's textarea is fully controlled and every
    // keystroke fires its own independent PATCH. If the optimistic
    // setLesson(...) update ever moves to run only after an awaited
    // response, two concurrent requests resolving out of order can let a
    // stale response overwrite newer local state -- silently reverting the
    // author's most recent typing. This reproduces exactly that ordering:
    // the FIRST keystroke's PATCH resolves AFTER the SECOND keystroke's.
    const patchResolvers: Array<() => void> = [];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = (init as RequestInit | undefined)?.method ?? 'GET';

      if (url === '/api/lessons/lessons/1' && method === 'GET') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              translations: { 'pt-BR': { title: 'Lição' } },
              blocks: [
                {
                  id: 1,
                  order: 1,
                  type: 'text',
                  simulatorKey: null,
                  simulatorParams: null,
                  translations: { 'pt-BR': { bodyMdx: 'Corpo original' } },
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }
      if (url === '/api/preview') {
        return Promise.resolve(new Response(JSON.stringify({ html: '' }), { status: 200 }));
      }
      if (url === '/api/lessons/lessons/1/blocks/1' && method === 'PATCH') {
        return new Promise<Response>((resolve) => {
          patchResolvers.push(() => resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
        });
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    render(<LessonEditorPage lessonId={1} onDone={vi.fn()} />);
    const textarea = await screen.findByDisplayValue('Corpo original');

    // Two rapid keystrokes, neither PATCH has resolved yet.
    fireEvent.change(textarea, { target: { value: 'Corpo A' } });
    fireEvent.change(textarea, { target: { value: 'Corpo AB' } });

    // The textarea must reflect the latest typed value immediately -- it
    // never waits on a network response.
    expect(screen.getByDisplayValue('Corpo AB')).toBeInTheDocument();
    expect(fetchSpy.mock.calls.filter(([url, init]) => url === '/api/lessons/lessons/1/blocks/1' && (init as RequestInit)?.method === 'PATCH')).toHaveLength(2);
    expect(patchResolvers).toHaveLength(2);

    // Resolve out of order: the OLDER keystroke's ("Corpo A") response
    // arrives after the NEWER keystroke's ("Corpo AB") response.
    await act(async () => {
      patchResolvers[1]();
      await Promise.resolve();
    });
    await act(async () => {
      patchResolvers[0]();
      await Promise.resolve();
    });

    // The latest typed content must still be displayed -- not reverted to
    // the stale value from the older, later-resolving response.
    expect(screen.getByDisplayValue('Corpo AB')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Corpo A')).not.toBeInTheDocument();
  });
});
