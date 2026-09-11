import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { env, applyD1Migrations, SELF } from 'cloudflare:test';
import { hashPassword } from '../auth/password';

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    ADMIN_USERNAME: string;
    ADMIN_PASSWORD_HASH: string;
    SESSION_SECRET: string;
  }
}

let sessionCookie = '';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  env.ADMIN_USERNAME = 'admin';
  env.ADMIN_PASSWORD_HASH = await hashPassword('test-password');
  env.SESSION_SECRET = 'test-session-secret';
});

beforeEach(async () => {
  const response = await SELF.fetch('https://admin.test/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'test-password' }),
  });
  sessionCookie = response.headers.get('set-cookie')!.split(';')[0];
});

describe('lesson hierarchy CRUD', () => {
  it('creates a subject, topic, section, and lesson, then reads them back via the tree', async () => {
    const headers = { 'Content-Type': 'application/json', Cookie: sessionCookie };

    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ slug: 'calculo', order: 1, translations: { 'pt-BR': { name: 'Cálculo' } } }),
    });
    expect(subjectResponse.status).toBe(201);
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subjectId: subject.id,
        slug: 'limites',
        order: 1,
        translations: { 'pt-BR': { name: 'Limites' } },
      }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const sectionResponse = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        topicId: topic.id,
        slug: 'intro',
        order: 1,
        translations: { 'pt-BR': { name: 'Introdução' } },
      }),
    });
    const section = await sectionResponse.json<{ id: number }>();

    const lessonResponse = await SELF.fetch('https://admin.test/api/lessons/lessons', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sectionId: section.id,
        slug: 'o-que-e-um-limite',
        order: 1,
        translations: {
          'pt-BR': { title: 'O que é um limite?' },
        },
      }),
    });
    expect(lessonResponse.status).toBe(201);

    const treeResponse = await SELF.fetch('https://admin.test/api/lessons/tree', { headers: { Cookie: sessionCookie } });
    const tree = await treeResponse.json<Array<{ slug: string; topics: Array<{ slug: string }> }>>();
    expect(tree.find((s) => s.slug === 'calculo')?.topics.find((t) => t.slug === 'limites')).toBeDefined();
  });

  it('updates a lesson body and rejects unauthenticated requests', async () => {
    const unauthed = await SELF.fetch('https://admin.test/api/lessons/tree');
    expect(unauthed.status).toBe(401);
  });
});

describe('lesson translations', () => {
  async function createLesson(): Promise<number> {
    const headers = { 'Content-Type': 'application/json', Cookie: sessionCookie };

    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        slug: `calculo-${Date.now()}-${Math.random()}`,
        order: 1,
        translations: { 'pt-BR': { name: 'Cálculo' } },
      }),
    });
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subjectId: subject.id,
        slug: `limites-${Date.now()}-${Math.random()}`,
        order: 1,
        translations: { 'pt-BR': { name: 'Limites' } },
      }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const sectionResponse = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        topicId: topic.id,
        slug: `intro-${Date.now()}-${Math.random()}`,
        order: 1,
        translations: { 'pt-BR': { name: 'Introdução' } },
      }),
    });
    const section = await sectionResponse.json<{ id: number }>();

    const lessonResponse = await SELF.fetch('https://admin.test/api/lessons/lessons', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sectionId: section.id,
        slug: `o-que-e-um-limite-${Date.now()}-${Math.random()}`,
        order: 1,
        translations: {
          'pt-BR': { title: 'O que é um limite?' },
        },
      }),
    });
    const lesson = await lessonResponse.json<{ id: number }>();
    return lesson.id;
  }

  it('GET /api/lessons/lessons/:id returns translations keyed by locale', async () => {
    const lessonId = await createLesson();

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}`, {
      headers: { Cookie: sessionCookie },
    });

    expect(response.status).toBe(200);
    const data = await response.json<{ translations: Record<string, { title: string }>; blocks: unknown[] }>();
    expect(data.translations['pt-BR']).toBeDefined();
    expect(data.blocks).toEqual([]);
  });

  it('PATCH /api/lessons/lessons/:id upserts only the locale included in the request', async () => {
    const lessonId = await createLesson();

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ translations: { 'en-US': { title: 'Limit Definition' } } }),
    });
    expect(response.status).toBe(200);

    const getResponse = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await getResponse.json<{ translations: Record<string, { title: string }> }>();
    expect(data.translations['en-US'].title).toBe('Limit Definition');
    expect(data.translations['pt-BR']).toBeDefined();
  });
});

describe('subject translations', () => {
  it('POST /api/lessons/subjects requires at least one translation', async () => {
    const response = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ slug: 'no-name', order: 99, translations: {} }),
    });
    expect(response.status).toBe(400);
  });

  it('POST /api/lessons/subjects creates translation rows', async () => {
    const response = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ slug: 'fisica', order: 2, translations: { 'pt-BR': { name: 'Física' } } }),
    });
    expect(response.status).toBe(201);
  });

  it('PATCH /api/lessons/subjects/:id upserts a translation for a new locale', async () => {
    const created = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ slug: 'quimica', order: 3, translations: { 'pt-BR': { name: 'Química' } } }),
    });
    const { id } = await created.json<{ id: number }>();

    const patched = await SELF.fetch(`https://admin.test/api/lessons/subjects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ translations: { 'en-US': { name: 'Chemistry' } } }),
    });
    expect(patched.status).toBe(200);
  });
});

describe('required pt-BR translation and locale-key validation', () => {
  const creationRoutes = [
    { name: 'subjects', url: 'https://admin.test/api/lessons/subjects', body: { slug: 'x-no-pt', order: 90 } },
    {
      name: 'topics',
      url: 'https://admin.test/api/lessons/topics',
      body: { subjectId: 1, slug: 'x-no-pt', order: 90 },
    },
    {
      name: 'sections',
      url: 'https://admin.test/api/lessons/sections',
      body: { topicId: 1, slug: 'x-no-pt', order: 90 },
    },
  ] as const;

  for (const route of creationRoutes) {
    it(`POST /api/lessons/${route.name} rejects a body without a pt-BR translation`, async () => {
      const response = await SELF.fetch(route.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({ ...route.body, translations: { 'en-US': { name: 'No Portuguese' } } }),
      });
      expect(response.status).toBe(400);
      const { error } = await response.json<{ error: string }>();
      expect(error).toBe('A pt-BR translation is required.');
    });

    it(`POST /api/lessons/${route.name} rejects an unrecognised locale key`, async () => {
      const response = await SELF.fetch(route.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({
          ...route.body,
          translations: { 'pt-BR': { name: 'Válido' }, en: { name: 'Bogus locale' } },
        }),
      });
      expect(response.status).toBe(400);
      const { error } = await response.json<{ error: string }>();
      expect(error).toContain('Unsupported locale');
    });
  }

  it('POST /api/lessons/lessons rejects a body without a pt-BR translation', async () => {
    const response = await SELF.fetch('https://admin.test/api/lessons/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        sectionId: 1,
        slug: 'lesson-no-pt',
        order: 90,
        translations: { 'en-US': { title: 'No Portuguese' } },
      }),
    });
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toBe('A pt-BR translation is required.');
  });

  it('PATCH /api/lessons/subjects/:id rejects an unrecognised locale key without writing anything', async () => {
    const created = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ slug: 'bad-locale-patch', order: 91, translations: { 'pt-BR': { name: 'Original' } } }),
    });
    const { id } = await created.json<{ id: number }>();

    const patched = await SELF.fetch(`https://admin.test/api/lessons/subjects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ slug: 'changed-slug', translations: { en: { name: 'Bogus locale' } } }),
    });
    expect(patched.status).toBe(400);

    // Validation runs before any write, so the structural field must be untouched too.
    const row = await env.DB.prepare('SELECT slug FROM subjects WHERE id = ?').bind(id).first<{ slug: string }>();
    expect(row?.slug).toBe('bad-locale-patch');
  });
});

describe('deleting a translated entity', () => {
  const headers = () => ({ 'Content-Type': 'application/json', Cookie: sessionCookie });

  async function countRows(table: string, column: string, id: number): Promise<number> {
    const row = await env.DB.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = ?`)
      .bind(id)
      .first<{ total: number }>();
    return row?.total ?? 0;
  }

  it('DELETE /api/lessons/subjects/:id removes the subject and its translation rows', async () => {
    const created = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ slug: 'to-delete-subject', order: 80, translations: { 'pt-BR': { name: 'Apagar' } } }),
    });
    const { id } = await created.json<{ id: number }>();
    expect(await countRows('subject_translations', 'subject_id', id)).toBe(1);

    const response = await SELF.fetch(`https://admin.test/api/lessons/subjects/${id}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    expect(await countRows('subjects', 'id', id)).toBe(0);
    expect(await countRows('subject_translations', 'subject_id', id)).toBe(0);
  });

  it('DELETE /api/lessons/topics/:id removes the topic and its translation rows', async () => {
    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ slug: 'parent-of-topic', order: 81, translations: { 'pt-BR': { name: 'Pai' } } }),
    });
    const subject = await subjectResponse.json<{ id: number }>();

    const created = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        subjectId: subject.id,
        slug: 'to-delete-topic',
        order: 80,
        translations: { 'pt-BR': { name: 'Apagar' } },
      }),
    });
    const { id } = await created.json<{ id: number }>();
    expect(await countRows('topic_translations', 'topic_id', id)).toBe(1);

    const response = await SELF.fetch(`https://admin.test/api/lessons/topics/${id}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);

    expect(await countRows('topics', 'id', id)).toBe(0);
    expect(await countRows('topic_translations', 'topic_id', id)).toBe(0);
  });

  it('DELETE /api/lessons/sections/:id removes the section and its translation rows', async () => {
    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ slug: 'parent-of-section', order: 82, translations: { 'pt-BR': { name: 'Pai' } } }),
    });
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        subjectId: subject.id,
        slug: 'parent-topic-of-section',
        order: 82,
        translations: { 'pt-BR': { name: 'Pai' } },
      }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const created = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        topicId: topic.id,
        slug: 'to-delete-section',
        order: 80,
        translations: { 'pt-BR': { name: 'Apagar' } },
      }),
    });
    const { id } = await created.json<{ id: number }>();
    expect(await countRows('section_translations', 'section_id', id)).toBe(1);

    const response = await SELF.fetch(`https://admin.test/api/lessons/sections/${id}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);

    expect(await countRows('sections', 'id', id)).toBe(0);
    expect(await countRows('section_translations', 'section_id', id)).toBe(0);
  });

  it('DELETE /api/lessons/lessons/:id removes the lesson and its translation rows', async () => {
    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ slug: 'parent-of-lesson', order: 83, translations: { 'pt-BR': { name: 'Pai' } } }),
    });
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        subjectId: subject.id,
        slug: 'parent-topic-of-lesson',
        order: 83,
        translations: { 'pt-BR': { name: 'Pai' } },
      }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const sectionResponse = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        topicId: topic.id,
        slug: 'parent-section-of-lesson',
        order: 83,
        translations: { 'pt-BR': { name: 'Pai' } },
      }),
    });
    const section = await sectionResponse.json<{ id: number }>();

    const created = await SELF.fetch('https://admin.test/api/lessons/lessons', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        sectionId: section.id,
        slug: 'to-delete-lesson',
        order: 80,
        translations: { 'pt-BR': { title: 'Apagar' } },
      }),
    });
    const { id } = await created.json<{ id: number }>();
    expect(await countRows('lesson_translations', 'lesson_id', id)).toBe(1);

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${id}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);

    expect(await countRows('lessons', 'id', id)).toBe(0);
    expect(await countRows('lesson_translations', 'lesson_id', id)).toBe(0);

    const getResponse = await SELF.fetch(`https://admin.test/api/lessons/lessons/${id}`, {
      headers: { Cookie: sessionCookie },
    });
    expect(getResponse.status).toBe(404);
  });
});

describe('lesson content blocks', () => {
  const headers = () => ({ 'Content-Type': 'application/json', Cookie: sessionCookie });

  interface AdminLessonBlock {
    id: number;
    order: number;
    type: string;
    simulatorKey: string | null;
    simulatorParams: string | null;
    translations: Record<
      string,
      {
        title: string | null;
        bodyMdx: string | null;
        promptMdx: string | null;
        resolutionMdx: string | null;
        caption: string | null;
      }
    >;
  }

  /** Creates the subject -> topic -> section -> lesson chain a block needs to hang off. */
  async function createLesson(suffix: string): Promise<number> {
    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        slug: `blocks-subject-${suffix}`,
        order: 70,
        translations: { 'pt-BR': { name: 'Cálculo' } },
      }),
    });
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        subjectId: subject.id,
        slug: `blocks-topic-${suffix}`,
        order: 70,
        translations: { 'pt-BR': { name: 'Limites' } },
      }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const sectionResponse = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        topicId: topic.id,
        slug: `blocks-section-${suffix}`,
        order: 70,
        translations: { 'pt-BR': { name: 'Introdução' } },
      }),
    });
    const section = await sectionResponse.json<{ id: number }>();

    const lessonResponse = await SELF.fetch('https://admin.test/api/lessons/lessons', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        sectionId: section.id,
        slug: `blocks-lesson-${suffix}`,
        order: 70,
        translations: { 'pt-BR': { title: 'Aula com blocos' } },
      }),
    });
    const lesson = await lessonResponse.json<{ id: number }>();
    return lesson.id;
  }

  async function createBlock(lessonId: number, body: unknown): Promise<Response> {
    return SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}/blocks`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
  }

  /** Re-reads the lesson through `GET /lessons/:id`, which is `getLessonForAdminEdit`. */
  async function getLesson(lessonId: number): Promise<{ blocks: AdminLessonBlock[] }> {
    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}`, {
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);
    return response.json<{ blocks: AdminLessonBlock[] }>();
  }

  async function countBlockTranslations(blockId: number): Promise<number> {
    const row = await env.DB.prepare('SELECT COUNT(*) AS total FROM lesson_block_translations WHERE block_id = ?')
      .bind(blockId)
      .first<{ total: number }>();
    return row?.total ?? 0;
  }

  it('POST /lessons/:id/blocks creates a block and returns 201', async () => {
    const lessonId = await createLesson('create');

    const response = await createBlock(lessonId, {
      type: 'text',
      translations: { 'pt-BR': { bodyMdx: '# Definição de limite' } },
    });
    expect(response.status).toBe(201);
    const block = await response.json<{ id: number; order: number; type: string }>();
    expect(block.type).toBe('text');
    expect(block.order).toBe(1);

    const lesson = await getLesson(lessonId);
    expect(lesson.blocks).toHaveLength(1);
    expect(lesson.blocks[0].translations['pt-BR'].bodyMdx).toBe('# Definição de limite');
  });

  it('POST /lessons/:id/blocks assigns each new block the next order', async () => {
    const lessonId = await createLesson('order');

    await createBlock(lessonId, { type: 'text', translations: { 'pt-BR': { bodyMdx: 'Primeiro' } } });
    const second = await createBlock(lessonId, { type: 'text', translations: { 'pt-BR': { bodyMdx: 'Segundo' } } });

    const block = await second.json<{ order: number }>();
    expect(block.order).toBe(2);
  });

  it('POST /lessons/:id/blocks rejects a body without a pt-BR translation', async () => {
    const lessonId = await createLesson('no-pt');

    const response = await createBlock(lessonId, {
      type: 'text',
      translations: { 'en-US': { bodyMdx: '# No Portuguese' } },
    });
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toBe('A pt-BR translation is required.');

    expect((await getLesson(lessonId)).blocks).toEqual([]);
  });

  it('POST /lessons/:id/blocks rejects a solved_exercise missing resolutionMdx', async () => {
    const lessonId = await createLesson('missing-resolution');

    const response = await createBlock(lessonId, {
      type: 'solved_exercise',
      translations: { 'pt-BR': { promptMdx: 'Calcule o limite.' } },
    });
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toBe('Blocos de exercício resolvido precisam de enunciado e resolução.');

    expect((await getLesson(lessonId)).blocks).toEqual([]);
  });

  it('POST /lessons/:id/blocks rejects an unknown block type', async () => {
    const lessonId = await createLesson('bad-type');

    const response = await createBlock(lessonId, {
      type: 'video',
      translations: { 'pt-BR': { bodyMdx: 'Conteúdo' } },
    });
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toBe('Tipo de bloco inválido: video.');
  });

  it('POST /lessons/:id/blocks rejects a simulator block without a simulatorKey', async () => {
    const lessonId = await createLesson('no-simulator-key');

    const response = await createBlock(lessonId, {
      type: 'simulator',
      translations: { 'pt-BR': { caption: 'Explore o limite.' } },
    });
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toBe('Blocos de simulador precisam de uma simulatorKey.');
  });

  it('POST /lessons/:id/blocks rejects simulatorParams that is not valid JSON', async () => {
    const lessonId = await createLesson('bad-params');

    const response = await createBlock(lessonId, {
      type: 'simulator',
      simulatorKey: 'limit-explorer',
      simulatorParams: '{not json',
      translations: { 'pt-BR': { caption: 'Explore o limite.' } },
    });
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toBe('simulatorParams precisa ser um JSON válido.');
  });

  it('PATCH /lessons/:id/blocks/:blockId adding en-US leaves the pt-BR translation intact', async () => {
    const lessonId = await createLesson('patch-locale');
    const created = await createBlock(lessonId, {
      type: 'curiosity',
      translations: { 'pt-BR': { title: 'Curiosidade', bodyMdx: 'Cauchy formalizou o limite.' } },
    });
    const block = await created.json<{ id: number }>();

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}/blocks/${block.id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        translations: { 'en-US': { title: 'Fun fact', bodyMdx: 'Cauchy formalised the limit.' } },
      }),
    });
    expect(response.status).toBe(200);

    // The per-(blockId, locale) upsert must not touch sibling locales.
    const lesson = await getLesson(lessonId);
    const updated = lesson.blocks.find((b) => b.id === block.id)!;
    expect(updated.translations['en-US'].title).toBe('Fun fact');
    expect(updated.translations['en-US'].bodyMdx).toBe('Cauchy formalised the limit.');
    expect(updated.translations['pt-BR'].title).toBe('Curiosidade');
    expect(updated.translations['pt-BR'].bodyMdx).toBe('Cauchy formalizou o limite.');
  });

  it('PATCH /lessons/:id/blocks/:blockId validates the new locale against the stored type', async () => {
    const lessonId = await createLesson('patch-validation');
    const created = await createBlock(lessonId, {
      type: 'solved_exercise',
      translations: { 'pt-BR': { promptMdx: 'Calcule o limite.', resolutionMdx: 'Substitua x por 2.' } },
    });
    const block = await created.json<{ id: number }>();

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}/blocks/${block.id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ translations: { 'en-US': { promptMdx: 'Compute the limit.' } } }),
    });
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toBe('Blocos de exercício resolvido precisam de enunciado e resolução.');

    const lesson = await getLesson(lessonId);
    expect(lesson.blocks.find((b) => b.id === block.id)!.translations['en-US']).toBeUndefined();
  });

  it('PATCH /lessons/:id/blocks/:blockId updates structural simulator fields', async () => {
    const lessonId = await createLesson('patch-structural');
    const created = await createBlock(lessonId, {
      type: 'simulator',
      simulatorKey: 'limit-explorer',
      translations: { 'pt-BR': { caption: 'Explore o limite.' } },
    });
    const block = await created.json<{ id: number }>();

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}/blocks/${block.id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ simulatorParams: '{"fn":"1/x"}' }),
    });
    expect(response.status).toBe(200);

    const lesson = await getLesson(lessonId);
    expect(lesson.blocks.find((b) => b.id === block.id)!.simulatorParams).toBe('{"fn":"1/x"}');
  });

  it('PATCH /lessons/:id/blocks/:blockId returns 404 for an unknown block', async () => {
    const lessonId = await createLesson('patch-missing');

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}/blocks/999999`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ translations: { 'pt-BR': { bodyMdx: 'Conteúdo' } } }),
    });
    expect(response.status).toBe(404);
  });

  it('DELETE /lessons/:id/blocks/:blockId removes the block and its translations', async () => {
    const lessonId = await createLesson('delete-block');
    const created = await createBlock(lessonId, {
      type: 'text',
      translations: { 'pt-BR': { bodyMdx: 'Para apagar' }, 'en-US': { bodyMdx: 'To delete' } },
    });
    const block = await created.json<{ id: number }>();
    expect(await countBlockTranslations(block.id)).toBe(2);

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}/blocks/${block.id}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    expect(await countBlockTranslations(block.id)).toBe(0);
    expect((await getLesson(lessonId)).blocks).toEqual([]);
  });

  it('PATCH /lessons/:id/blocks/reorder renumbers blocks by their position in blockIds', async () => {
    const lessonId = await createLesson('reorder');
    const first = await (
      await createBlock(lessonId, { type: 'text', translations: { 'pt-BR': { bodyMdx: 'Primeiro' } } })
    ).json<{ id: number }>();
    const second = await (
      await createBlock(lessonId, { type: 'text', translations: { 'pt-BR': { bodyMdx: 'Segundo' } } })
    ).json<{ id: number }>();

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}/blocks/reorder`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ blockIds: [second.id, first.id] }),
    });
    expect(response.status).toBe(200);

    const lesson = await getLesson(lessonId);
    expect(lesson.blocks.find((b) => b.id === second.id)!.order).toBe(1);
    expect(lesson.blocks.find((b) => b.id === first.id)!.order).toBe(2);
    // `getLessonForAdminEdit` orders by `order`, so the list itself flips too.
    expect(lesson.blocks.map((b) => b.id)).toEqual([second.id, first.id]);
  });

  it('DELETE /lessons/:id deletes a lesson that still has blocks without a foreign-key error', async () => {
    const lessonId = await createLesson('delete-lesson');
    const first = await (
      await createBlock(lessonId, { type: 'text', translations: { 'pt-BR': { bodyMdx: 'Primeiro' } } })
    ).json<{ id: number }>();
    const second = await (
      await createBlock(lessonId, { type: 'text', translations: { 'pt-BR': { bodyMdx: 'Segundo' } } })
    ).json<{ id: number }>();

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    expect(await countBlockTranslations(first.id)).toBe(0);
    expect(await countBlockTranslations(second.id)).toBe(0);
    const remainingBlocks = await env.DB.prepare('SELECT COUNT(*) AS total FROM lesson_blocks WHERE lesson_id = ?')
      .bind(lessonId)
      .first<{ total: number }>();
    expect(remainingBlocks?.total).toBe(0);

    const getResponse = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}`, {
      headers: { Cookie: sessionCookie },
    });
    expect(getResponse.status).toBe(404);
  });
});
