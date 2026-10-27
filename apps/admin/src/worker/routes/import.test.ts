import { describe, expect, it, beforeAll, beforeEach, vi } from 'vitest';
import { env, applyD1Migrations, SELF } from 'cloudflare:test';
import { emptyBundle, type PackBundle } from '@birb-learn/content-schema/src/packs/pack-schemas';

const SECRET = 'test-import-secret';
const URL = 'https://admin.test/api/import';

// Children first, so deleting in this order never breaks a foreign key.
const TABLES = [
  'question_tags',
  'question_accepted_answers',
  'question_matching_pair_translations',
  'question_matching_pairs',
  'question_option_translations',
  'question_options',
  'question_translations',
  'questions',
  'tag_translations',
  'tags',
  'lesson_block_translations',
  'lesson_blocks',
  'lesson_translations',
  'lessons',
  'section_translations',
  'sections',
  'topic_translations',
  'topics',
  'subject_translations',
  'subjects',
  'discipline_translations',
  'disciplines',
];

const NAMES = { 'pt-BR': 'Nome', 'en-US': 'Name', es: 'Nombre' };
const SOURCE = { file: 'demo/_tree.yaml', line: 1 };

function blockTranslation(fields: { title?: string; bodyMdx?: string; caption?: string }) {
  return {
    lines: {},
    title: fields.title ?? null,
    bodyMdx: fields.bodyMdx ?? null,
    promptMdx: null,
    resolutionMdx: null,
    caption: fields.caption ?? null,
    payloadJson: null,
  };
}

function questionTranslation(file: string, fields: Partial<{ options: string[]; pairs: [string, string][]; accepted: string[] }>) {
  return {
    file,
    lines: {},
    promptMdx: 'Pergunta?',
    resolutionMdx: 'Resolução.',
    codeJson: null,
    options: (fields.options ?? []).map((textMdx) => ({ textMdx })),
    matchingPairs: (fields.pairs ?? []).map(([leftMdx, rightMdx]) => ({ leftMdx, rightMdx })),
    acceptedAnswers: fields.accepted ?? [],
  };
}

/** A small bundle that passes `checkPack`: one of each level, two tags and three questions. */
function makeBundle(): PackBundle {
  const bundle = emptyBundle();
  bundle.disciplines.push({ slug: 'demo', order: 1, names: NAMES, source: SOURCE });
  bundle.subjects.push({ slug: 'basics', disciplineSlug: 'demo', order: 1, names: NAMES, source: SOURCE });
  bundle.topics.push({ slug: 'intro', subjectSlug: 'basics', order: 1, names: NAMES, source: SOURCE });
  bundle.sections.push({ slug: 'start', topicSlug: 'intro', order: 1, names: NAMES, source: SOURCE });
  bundle.tags.push(
    { slug: 'alpha', subjectSlug: 'basics', parentSlug: null, names: NAMES, source: SOURCE },
    { slug: 'beta', subjectSlug: 'basics', parentSlug: 'alpha', names: NAMES, source: SOURCE },
  );
  bundle.lessons.push({
    slug: 'first-lesson',
    order: 1,
    disciplineSlug: 'demo',
    subjectSlug: 'basics',
    topicSlug: 'intro',
    sectionSlug: 'start',
    blocks: [
      { type: 'text', simulatorKey: null, simulatorParams: null, codeKind: null, codeLanguage: null },
      { type: 'simulator', simulatorKey: 'grapher', simulatorParams: '{"a":1}', codeKind: null, codeLanguage: null },
    ],
    translations: {
      'pt-BR': {
        file: 'demo/basics/intro/start/01-first-lesson.pt-BR.yaml',
        title: 'Primeira lição',
        blocks: [blockTranslation({ bodyMdx: 'Olá' }), blockTranslation({ caption: 'Veja' })],
      },
      'en-US': {
        file: 'demo/basics/intro/start/01-first-lesson.en-US.yaml',
        title: 'First lesson',
        blocks: [blockTranslation({ bodyMdx: 'Hello' }), blockTranslation({ caption: 'Look' })],
      },
    },
  });
  const questionBase = { disciplineSlug: 'demo', subjectSlug: 'basics', codeKind: null, codeLanguage: null } as const;
  bundle.questions.push(
    {
      ...questionBase,
      key: 'q-choice',
      type: 'multiple_choice',
      difficulty: 'easy',
      correctAnswer: null,
      answerFormat: 'text',
      tagSlugs: ['beta'],
      options: [{ isCorrect: true }, { isCorrect: false }],
      matchingPairCount: 0,
      acceptedAnswersShared: [],
      translations: { 'pt-BR': questionTranslation('demo/basics/questions/q-choice.pt-BR.yaml', { options: ['Sim', 'Não'] }) },
    },
    {
      ...questionBase,
      key: 'q-math',
      type: 'short_text',
      difficulty: 'medium',
      correctAnswer: null,
      answerFormat: 'math',
      tagSlugs: [],
      options: [],
      matchingPairCount: 0,
      acceptedAnswersShared: ['2^3'],
      translations: { 'pt-BR': questionTranslation('demo/basics/questions/q-math.pt-BR.yaml', {}) },
    },
    {
      ...questionBase,
      key: 'q-pairs',
      type: 'matching',
      difficulty: 'hard',
      correctAnswer: null,
      answerFormat: 'text',
      tagSlugs: ['alpha', 'beta'],
      options: [],
      matchingPairCount: 2,
      acceptedAnswersShared: [],
      translations: {
        'pt-BR': questionTranslation('demo/basics/questions/q-pairs.pt-BR.yaml', {
          pairs: [
            ['1', 'um'],
            ['2', 'dois'],
          ],
        }),
      },
    },
  );
  return bundle;
}

function post(body: unknown, token = SECRET): Promise<Response> {
  return SELF.fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function counts(): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const table of TABLES) {
    const row = await env.DB.prepare(`SELECT count(*) AS n FROM "${table}"`).first<{ n: number }>();
    result[table] = row!.n;
  }
  return result;
}

function allZero(values: Record<string, number>): boolean {
  return Object.values(values).every((count) => count === 0);
}

interface Report {
  created: string[];
  skipped: string[];
  replaced: string[];
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  env.IMPORT_SECRET = SECRET;
});

beforeEach(async () => {
  await env.DB.batch(TABLES.map((table) => env.DB.prepare(`DELETE FROM "${table}"`)));
});

describe('POST /api/import', () => {
  it('rejects a missing or wrong bearer token with 401', async () => {
    const missing = await SELF.fetch(URL, { method: 'POST', body: JSON.stringify({ bundle: makeBundle(), replace: [] }) });
    expect(missing.status).toBe(401);
    const wrong = await post({ bundle: makeBundle(), replace: [] }, 'not-the-secret');
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({ error: 'Não autorizado.' });
    expect(allZero(await counts())).toBe(true);
  });

  it('rejects every request while IMPORT_SECRET is not configured', async () => {
    env.IMPORT_SECRET = '';
    try {
      const response = await post({ bundle: makeBundle(), replace: [] }, '');
      expect(response.status).toBe(401);
    } finally {
      env.IMPORT_SECRET = SECRET;
    }
  });

  it('imports a valid bundle: 200 with the report, and the rows are present', async () => {
    const response = await post({ bundle: makeBundle(), replace: [] });
    expect(response.status).toBe(200);
    const report = await response.json<Report>();
    expect(report).toEqual({
      created: [
        'discipline:demo',
        'subject:basics',
        'topic:intro',
        'section:start',
        'tag:alpha',
        'tag:beta',
        'lesson:first-lesson',
        'question:q-choice',
        'question:q-math',
        'question:q-pairs',
      ],
      skipped: [],
      replaced: [],
    });

    const after = await counts();
    expect(after).toMatchObject({
      disciplines: 1,
      discipline_translations: 3,
      lessons: 1,
      lesson_translations: 2,
      lesson_blocks: 2,
      lesson_block_translations: 4,
      tags: 2,
      questions: 3,
      question_options: 2,
      question_option_translations: 2,
      question_matching_pairs: 2,
      question_matching_pair_translations: 2,
      question_accepted_answers: 1,
      question_tags: 3,
    });
    const lesson = await env.DB.prepare(
      'SELECT l.slug, s.slug AS section FROM lessons l JOIN sections s ON s.id = l.section_id',
    ).first();
    expect(lesson).toEqual({ slug: 'first-lesson', section: 'start' });
    const beta = await env.DB.prepare(
      'SELECT p.slug AS parent FROM tags t JOIN tags p ON p.id = t.parent_tag_id WHERE t.slug = ?',
    )
      .bind('beta')
      .first();
    expect(beta).toEqual({ parent: 'alpha' });
    const answer = await env.DB.prepare('SELECT text, locale FROM question_accepted_answers').first();
    expect(answer).toEqual({ text: '2^3', locale: null });
  });

  it('creates nothing on a second identical import (Review Focus 1)', async () => {
    await post({ bundle: makeBundle(), replace: [] });
    const before = await counts();
    const maxBlockId = await env.DB.prepare('SELECT max(id) AS id FROM lesson_blocks').first('id');

    const response = await post({ bundle: makeBundle(), replace: [] });
    expect(response.status).toBe(200);
    const report = await response.json<Report>();
    expect(report.created).toEqual([]);
    expect(report.replaced).toEqual([]);
    expect(report.skipped).toHaveLength(10);
    expect(await counts()).toEqual(before);
    expect(await env.DB.prepare('SELECT max(id) AS id FROM lesson_blocks').first('id')).toBe(maxBlockId);
  });

  it('adds a new lesson under an existing section', async () => {
    await post({ bundle: makeBundle(), replace: [] });
    const bundle = makeBundle();
    const second = structuredClone(bundle.lessons[0]);
    second.slug = 'second-lesson';
    second.order = 2;
    bundle.lessons.push(second);

    const report = await (await post({ bundle, replace: [] })).json<Report>();
    expect(report.created).toEqual(['lesson:second-lesson']);
    const rows = await env.DB.prepare('SELECT DISTINCT section_id FROM lessons').all();
    expect(rows.results).toHaveLength(1);
  });

  it('replaces the named lesson and question, keeping their ids and the row counts', async () => {
    await post({ bundle: makeBundle(), replace: [] });
    const before = await counts();
    const lessonId = await env.DB.prepare('SELECT id FROM lessons').first('id');
    const questionId = await env.DB.prepare("SELECT id FROM questions WHERE key = 'q-pairs'").first('id');

    const bundle = makeBundle();
    bundle.lessons[0].translations['pt-BR']!.title = 'Título novo';
    bundle.questions[2].difficulty = 'easy';
    const response = await post({ bundle, replace: ['first-lesson', 'q-pairs'] });
    expect(response.status).toBe(200);
    expect(await response.json<Report>()).toMatchObject({ replaced: ['lesson:first-lesson', 'question:q-pairs'], created: [] });

    expect(await counts()).toEqual(before);
    expect(await env.DB.prepare('SELECT id FROM lessons').first('id')).toBe(lessonId);
    expect(await env.DB.prepare("SELECT title FROM lesson_translations WHERE locale = 'pt-BR'").first('title')).toBe('Título novo');
    expect(await env.DB.prepare("SELECT id, difficulty FROM questions WHERE key = 'q-pairs'").first()).toEqual({
      id: questionId,
      difficulty: 'easy',
    });
  });

  it('rejects an unknown replace target with 400, writing nothing', async () => {
    const response = await post({ bundle: makeBundle(), replace: ['nope'] });
    expect(response.status).toBe(400);
    expect((await response.json<{ error: string }>()).error).toContain('"nope"');
    expect(allZero(await counts())).toBe(true);
  });

  it('writes nothing when the batch fails halfway (Review Focus 2)', async () => {
    // The last question of the bundle fails to insert, after every row before it ran.
    await env.DB.prepare(
      "CREATE TRIGGER fail_import BEFORE INSERT ON questions WHEN NEW.key = 'q-pairs' BEGIN SELECT RAISE(ABORT, 'forced failure'); END",
    ).run();
    try {
      const response = await post({ bundle: makeBundle(), replace: [] });
      expect(response.status).toBe(500);
      expect((await response.json<{ error: string }>()).error).toMatch(/^A importação falhou e nada foi gravado/);
      expect(allZero(await counts())).toBe(true);
    } finally {
      await env.DB.prepare('DROP TRIGGER fail_import').run();
    }
  });

  it('answers a failing database read with a pt-BR JSON 500, writing nothing', async () => {
    const batch = vi.spyOn(env.DB, 'batch').mockRejectedValueOnce(new Error('D1 is down'));
    try {
      const response = await post({ bundle: makeBundle(), replace: [] });
      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toMatch(/application\/json/);
      expect(await response.json()).toEqual({
        error: 'Não foi possível preparar a importação; nada foi gravado: D1 is down',
      });
      // Only the read was attempted; the write batch never ran.
      expect(batch).toHaveBeenCalledTimes(1);
    } finally {
      batch.mockRestore();
    }
    expect(allZero(await counts())).toBe(true);
  });

  it('returns 400 with the problems when checkPack fails, writing nothing', async () => {
    const bundle = makeBundle();
    delete bundle.lessons[0].translations['pt-BR'];
    const response = await post({ bundle, replace: [] });
    expect(response.status).toBe(400);
    const body = await response.json<{ error: string; problems: { file: string; message: string }[] }>();
    expect(body.error).toBe('O pacote tem problemas; nada foi importado.');
    expect(body.problems).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('lesson "first-lesson" has no valid pt-BR file') }),
    );
    expect(allZero(await counts())).toBe(true);
  });

  it('refuses a bundle that left out a _tree.yaml entry (Ruling R4)', async () => {
    const bundle = makeBundle();
    // An unused tag whose entry had problems: nothing else in the bundle depends on it.
    bundle.treeProblems.tags.push('gamma');
    bundle.treeProblems.directories.tags.gamma = 'demo';
    const response = await post({ bundle, replace: [] });
    expect(response.status).toBe(400);
    const body = await response.json<{ problems: { file: string; message: string }[] }>();
    expect(body.problems).toContainEqual(expect.objectContaining({ file: 'demo/_tree.yaml' }));
    expect(allZero(await counts())).toBe(true);
  });

  it.each([
    ['a body that is not JSON', 'not json'],
    ['an empty bundle object', { bundle: {}, replace: [] }],
    ['a missing replace list', { bundle: makeBundle() }],
    ['a replace list that is not text', { bundle: makeBundle(), replace: [1] }],
    ['a lesson block with an unknown type', (() => {
      const bundle = makeBundle();
      (bundle.lessons[0].blocks[0] as { type: string }).type = 'video';
      return { bundle, replace: [] };
    })()],
    ['a translation in an unknown locale', (() => {
      const bundle = makeBundle();
      (bundle.lessons[0].translations as Record<string, unknown>).en = bundle.lessons[0].translations['en-US'];
      return { bundle, replace: [] };
    })()],
    ['a null body', null],
  ])('answers 400 in pt-BR, never 500, for %s', async (_label, body) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toMatch(/^(O corpo da requisição|Corpo da requisição)/);
    expect(allZero(await counts())).toBe(true);
  });
});
