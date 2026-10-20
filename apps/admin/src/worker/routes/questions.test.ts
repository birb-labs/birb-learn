import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { env, applyD1Migrations, SELF } from 'cloudflare:test';
import { hashPassword } from '../auth/password';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  env.ADMIN_USERNAME = 'admin';
  env.ADMIN_PASSWORD_HASH = await hashPassword('test-password');
  env.SESSION_SECRET = 'test-session-secret';
});

let cookie = '';

beforeEach(async () => {
  const response = await SELF.fetch('https://admin.test/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'test-password' }),
  });
  cookie = response.headers.get('set-cookie')!.split(';')[0];
});

function authed(body: unknown, method = 'POST') {
  return {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  };
}

function pt(translation: {
  promptMdx: string;
  resolutionMdx: string;
  options?: { textMdx: string; isCorrect: boolean }[];
  matchingPairs?: { leftMdx: string; rightMdx: string }[];
}) {
  return {
    'pt-BR': {
      promptMdx: translation.promptMdx,
      resolutionMdx: translation.resolutionMdx,
      options: translation.options ?? [],
      matchingPairs: translation.matchingPairs ?? [],
    },
  };
}

// D1 storage in this test file is cumulative across `it` blocks (not reset
// per test), and the admin's `GET /api/tags` route defaults to the
// lowest-`order` subject -- so every test in this file must share the SAME
// subject rather than each creating its own, or a later test's tags would
// silently attach to an earlier test's subject instead of the one it just
// created.
let cachedSubjectId: number | undefined;
async function createSubject(): Promise<number> {
  if (cachedSubjectId !== undefined) return cachedSubjectId;
  const disciplineResponse = await SELF.fetch(
    'https://admin.test/api/lessons/disciplines',
    authed({ slug: 'matematica', order: 1, translations: { 'pt-BR': { name: 'Matemática' } } }),
  );
  const { id: disciplineId } = await disciplineResponse.json<{ id: number }>();
  const response = await SELF.fetch(
    'https://admin.test/api/lessons/subjects',
    authed({ disciplineId, slug: 'calculo', order: 1, translations: { 'pt-BR': { name: 'Cálculo' } } }),
  );
  const { id } = await response.json<{ id: number }>();
  cachedSubjectId = id;
  return id;
}

describe('question-bank CRUD', () => {
  it('rejects a multiple_choice question without exactly one correct option', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'multiple_choice',
        difficulty: 'easy',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'P?',
          resolutionMdx: 'R.',
          options: [
            { textMdx: 'A', isCorrect: true },
            { textMdx: 'B', isCorrect: true },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a multiple_response question with 2 correct options and reads it back', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'multiple_response',
        difficulty: 'hard',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Quais são verdadeiras?',
          resolutionMdx: 'A e C.',
          options: [
            { textMdx: 'A', isCorrect: true },
            { textMdx: 'B', isCorrect: false },
            { textMdx: 'C', isCorrect: true },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ translations: Record<string, { options: { isCorrect: boolean }[] }> }>();
    expect(question.translations['pt-BR'].options.filter((o) => o.isCorrect)).toHaveLength(2);
  });

  it('rejects a numeric question with a comma-formatted correctAnswer', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'numeric',
        difficulty: 'medium',
        correctAnswer: '1,5',
        answerFormat: 'text',
        translations: pt({ promptMdx: 'Quanto é 3/2?', resolutionMdx: '1.5.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a tag and a subtopic under it', async () => {
    const subjectId = await createSubject();

    const topicResponse = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({ slug: 'limites', subjectId, translations: { 'pt-BR': { name: 'Limites' } } }),
    );
    const topic = await topicResponse.json<{ id: number }>();

    const subtopicResponse = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({
        slug: 'limites-laterais',
        subjectId,
        parentTagId: topic.id,
        translations: { 'pt-BR': { name: 'Limites Laterais' } },
      }),
    );
    expect(subtopicResponse.status).toBe(201);

    const treeResponse = await SELF.fetch('https://admin.test/api/tags', { headers: { Cookie: cookie } });
    const tree = await treeResponse.json<Array<{ slug: string; subtopics: { slug: string }[] }>>();
    expect(tree.find((t) => t.slug === 'limites')?.subtopics.map((s) => s.slug)).toContain('limites-laterais');
  });

  it('rejects a true_false question without a "true"/"false" correctAnswer', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'true_false',
        difficulty: 'easy',
        correctAnswer: 'sim',
        answerFormat: 'text',
        translations: pt({ promptMdx: 'P?', resolutionMdx: 'R.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a true_false question and reads it back', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'true_false',
        difficulty: 'easy',
        correctAnswer: 'true',
        answerFormat: 'text',
        translations: pt({ promptMdx: 'O céu é azul?', resolutionMdx: 'Sim.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ correctAnswer: string }>();
    expect(question.correctAnswer).toBe('true');
  });

  it('rejects a short_text question with no accepted answers', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'medium',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({ promptMdx: 'P?', resolutionMdx: 'R.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a short_text question with multiple accepted answers and reads it back', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'medium',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Qual gás as plantas liberam na fotossíntese?',
          resolutionMdx: 'Oxigênio.',
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: { 'pt-BR': ['Oxigênio', 'O2', 'O₂'] },
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ acceptedAnswersByLocale: Record<string, string[]> }>();
    expect(question.acceptedAnswersByLocale['pt-BR']).toEqual(['Oxigênio', 'O2', 'O₂']);
  });

  it('rejects a short_text question with an invalid answerFormat', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'medium',
        correctAnswer: null,
        answerFormat: 'latex',
        translations: pt({ promptMdx: 'P?', resolutionMdx: 'R.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: { 'pt-BR': ['R'] },
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a math-mode short_text question and reads its answerFormat back', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'hard',
        correctAnswer: null,
        answerFormat: 'math',
        translations: pt({ promptMdx: 'Calcule a derivada de $x^2$.', resolutionMdx: '$2x$.' }),
        acceptedAnswersShared: ['2x'],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ answerFormat: string; acceptedAnswersShared: string[] }>();
    expect(question.answerFormat).toBe('math');
    expect(question.acceptedAnswersShared).toEqual(['2x']);
  });

  it('creates an ordering question, preserving entry order as the correct order', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'ordering',
        difficulty: 'medium',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Ordene os passos.',
          resolutionMdx: 'Ver resolução.',
          options: [
            { textMdx: 'Primeiro', isCorrect: false },
            { textMdx: 'Segundo', isCorrect: false },
            { textMdx: 'Terceiro', isCorrect: false },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ translations: Record<string, { options: { textMdx: string }[] }> }>();
    expect(question.translations['pt-BR'].options.map((o) => o.textMdx)).toEqual([
      'Primeiro',
      'Segundo',
      'Terceiro',
    ]);
  });

  it('rejects a matching question with fewer than 2 pairs', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'matching',
        difficulty: 'hard',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'P?',
          resolutionMdx: 'R.',
          matchingPairs: [{ leftMdx: 'A', rightMdx: 'B' }],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a matching question with its pairs and reads it back', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'matching',
        difficulty: 'hard',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Associe.',
          resolutionMdx: 'Ver resolução.',
          matchingPairs: [
            { leftMdx: 'Cão', rightMdx: 'Late' },
            { leftMdx: 'Gato', rightMdx: 'Mia' },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{
      translations: Record<string, { matchingPairs: { leftMdx: string; rightMdx: string }[] }>;
    }>();
    expect(
      question.translations['pt-BR'].matchingPairs.map((p) => ({ leftMdx: p.leftMdx, rightMdx: p.rightMdx })),
    ).toEqual([
      { leftMdx: 'Cão', rightMdx: 'Late' },
      { leftMdx: 'Gato', rightMdx: 'Mia' },
    ]);
  });

  it('deletes a matching question along with its pairs', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'matching',
        difficulty: 'hard',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Associe.',
          resolutionMdx: 'Ver resolução.',
          matchingPairs: [
            { leftMdx: 'A', rightMdx: 'B' },
            { leftMdx: 'C', rightMdx: 'D' },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    const created = await createResponse.json<{ id: number }>();

    const deleteResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    expect(deleteResponse.status).toBe(200);

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    expect(getResponse.status).toBe(404);
  });

  it('POST /api/tags requires at least one translation', async () => {
    const response = await SELF.fetch('https://admin.test/api/tags', authed({ slug: 'no-name', translations: {} }));
    expect(response.status).toBe(400);
  });

  it('POST /api/tags creates translation rows', async () => {
    const subjectId = await createSubject();
    const response = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({ slug: 'derivadas', subjectId, translations: { 'pt-BR': { name: 'Derivadas' } } }),
    );
    expect(response.status).toBe(201);
  });

  it('PATCH /api/tags/:id upserts a translation for a new locale', async () => {
    const subjectId = await createSubject();
    const created = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({ slug: 'integrais', subjectId, translations: { 'pt-BR': { name: 'Integrais' } } }),
    );
    const { id } = await created.json<{ id: number }>();

    const patched = await SELF.fetch(`https://admin.test/api/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ translations: { 'en-US': { name: 'Integrals' } } }),
    });
    expect(patched.status).toBe(200);
  });
});

describe('question translations', () => {
  async function createQuestion(): Promise<number> {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'multiple_choice',
        difficulty: 'easy',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Qual gás as plantas absorvem?',
          resolutionMdx: 'CO2.',
          options: [
            { textMdx: 'Oxigênio', isCorrect: false },
            { textMdx: 'Dióxido de carbono', isCorrect: true },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    const created = await response.json<{ id: number }>();
    return created.id;
  }

  it('GET /api/questions/:id returns translations keyed by locale plus shared/per-locale accepted answers', async () => {
    const questionId = await createQuestion();

    const response = await SELF.fetch(`https://admin.test/api/questions/${questionId}`, {
      headers: { Cookie: cookie },
    });
    expect(response.status).toBe(200);
    const data = await response.json<{ translations: Record<string, { promptMdx: string }> }>();
    expect(data.translations['pt-BR']).toBeDefined();
  });

  it('PATCH /api/questions/:id upserts only the given locale and leaves structural fields alone when omitted', async () => {
    const questionId = await createQuestion();

    const response = await SELF.fetch(`https://admin.test/api/questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        translations: {
          'en-US': {
            promptMdx: 'Which gas?',
            resolutionMdx: 'Oxygen.',
            options: [
              { textMdx: 'Oxygen', isCorrect: false },
              { textMdx: 'Carbon dioxide', isCorrect: true },
            ],
            matchingPairs: [],
          },
        },
      }),
    });
    expect(response.status).toBe(200);

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${questionId}`, {
      headers: { Cookie: cookie },
    });
    const data = await getResponse.json<{
      type: string;
      translations: Record<string, { promptMdx: string; options: { textMdx: string }[] }>;
    }>();
    expect(data.translations['en-US'].promptMdx).toBe('Which gas?');
    expect(data.translations['en-US'].options.map((o) => o.textMdx)).toEqual(['Oxygen', 'Carbon dioxide']);
    expect(data.translations['pt-BR']).toBeDefined();
    // Structural fields omitted from the PATCH body must be left untouched.
    expect(data.type).toBe('multiple_choice');
  });
});

describe('saving one locale tab does not destroy the other locales', () => {
  const ptOptions = [
    { textMdx: 'Oxigênio', isCorrect: false },
    { textMdx: 'Dióxido de carbono', isCorrect: true },
  ];
  const enOptions = [
    { textMdx: 'Oxygen', isCorrect: false },
    { textMdx: 'Carbon dioxide', isCorrect: true },
  ];

  /** Creates a multiple_choice question that has option text in both pt-BR and en-US. */
  async function createBilingualQuestion(): Promise<number> {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'multiple_choice',
        difficulty: 'easy',
        correctAnswer: null,
        answerFormat: 'text',
        translations: {
          'pt-BR': { promptMdx: 'Qual gás?', resolutionMdx: 'CO2.', options: ptOptions, matchingPairs: [] },
          'en-US': { promptMdx: 'Which gas?', resolutionMdx: 'CO2.', options: enOptions, matchingPairs: [] },
        },
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const { id } = await createResponse.json<{ id: number }>();
    return id;
  }

  async function readBack(id: number) {
    const response = await SELF.fetch(`https://admin.test/api/questions/${id}`, { headers: { Cookie: cookie } });
    expect(response.status).toBe(200);
    return response.json<{
      translations: Record<string, { promptMdx: string; options: { textMdx: string; isCorrect: boolean }[] }>;
    }>();
  }

  it('keeps the other locale option text when the body carries every locale (what the editor now sends)', async () => {
    const id = await createBilingualQuestion();

    // What QuestionEditorPage sends after editing only the en-US tab: the full
    // per-locale map, with the untouched locales at their loaded values.
    const patchResponse = await SELF.fetch(
      `https://admin.test/api/questions/${id}`,
      authed(
        {
          type: 'multiple_choice',
          difficulty: 'easy',
          correctAnswer: null,
          answerFormat: 'text',
          tagIds: [],
          translations: {
            'pt-BR': { promptMdx: 'Qual gás?', resolutionMdx: 'CO2.', options: ptOptions, matchingPairs: [] },
            'en-US': {
              promptMdx: 'Which gas do plants absorb?',
              resolutionMdx: 'CO2.',
              options: enOptions,
              matchingPairs: [],
            },
          },
          acceptedAnswersShared: [],
          acceptedAnswersByLocale: {},
        },
        'PATCH',
      ),
    );
    expect(patchResponse.status).toBe(200);

    const data = await readBack(id);
    expect(data.translations['en-US'].promptMdx).toBe('Which gas do plants absorb?');
    expect(data.translations['pt-BR'].options.map((o) => o.textMdx)).toEqual(['Oxigênio', 'Dióxido de carbono']);
    expect(data.translations['en-US'].options.map((o) => o.textMdx)).toEqual(['Oxygen', 'Carbon dioxide']);

    // `GET /api/questions` is `getQuestionsForExport(db, 'pt-BR')`, the same call
    // the site's build makes — it throws if any option lost its pt-BR row.
    const listResponse = await SELF.fetch('https://admin.test/api/questions', { headers: { Cookie: cookie } });
    expect(listResponse.status).toBe(200);
    const list = await listResponse.json<{ id: number; options: { textMdx: string }[] }[]>();
    expect(list.find((question) => question.id === id)?.options.map((o) => o.textMdx)).toEqual([
      'Oxigênio',
      'Dióxido de carbono',
    ]);
  });

  it('keeps locales the PATCH body omits entirely', async () => {
    const id = await createBilingualQuestion();

    const patchResponse = await SELF.fetch(
      `https://admin.test/api/questions/${id}`,
      authed(
        {
          translations: {
            'en-US': {
              promptMdx: 'Which gas do plants absorb?',
              resolutionMdx: 'CO2.',
              options: enOptions,
              matchingPairs: [],
            },
          },
        },
        'PATCH',
      ),
    );
    expect(patchResponse.status).toBe(200);

    const data = await readBack(id);
    expect(data.translations['pt-BR'].options.map((o) => o.textMdx)).toEqual(['Oxigênio', 'Dióxido de carbono']);

    const listResponse = await SELF.fetch('https://admin.test/api/questions', { headers: { Cookie: cookie } });
    expect(listResponse.status).toBe(200);
  });
});

describe('PATCH /api/questions/:id validates the effective post-patch state', () => {
  it('rejects a PATCH that leaves a multiple_choice question with no correct option', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'multiple_choice',
        difficulty: 'easy',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'P?',
          resolutionMdx: 'R.',
          options: [
            { textMdx: 'A', isCorrect: false },
            { textMdx: 'B', isCorrect: true },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    const { id } = await createResponse.json<{ id: number }>();

    const patchResponse = await SELF.fetch(
      `https://admin.test/api/questions/${id}`,
      authed(
        {
          translations: pt({
            promptMdx: 'P?',
            resolutionMdx: 'R.',
            options: [
              { textMdx: 'A', isCorrect: false },
              { textMdx: 'B', isCorrect: false },
            ],
          }),
        },
        'PATCH',
      ),
    );
    expect(patchResponse.status).toBe(400);

    // The rejected PATCH must not have written anything.
    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${id}`, { headers: { Cookie: cookie } });
    const data = await getResponse.json<{ translations: Record<string, { options: { isCorrect: boolean }[] }> }>();
    expect(data.translations['pt-BR'].options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it('rejects a PATCH that leaves a short_text question with no accepted answers', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'medium',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({ promptMdx: 'Qual gás?', resolutionMdx: 'Oxigênio.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: { 'pt-BR': ['Oxigênio'] },
        tagIds: [],
      }),
    );
    const { id } = await createResponse.json<{ id: number }>();

    const patchResponse = await SELF.fetch(
      `https://admin.test/api/questions/${id}`,
      authed({ acceptedAnswersByLocale: {} }, 'PATCH'),
    );
    expect(patchResponse.status).toBe(400);
  });

  it('rejects a PATCH that sets an invalid numeric correctAnswer', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'numeric',
        difficulty: 'medium',
        correctAnswer: '1.5',
        answerFormat: 'text',
        translations: pt({ promptMdx: 'Quanto é 3/2?', resolutionMdx: '1.5.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    const { id } = await createResponse.json<{ id: number }>();

    const patchResponse = await SELF.fetch(
      `https://admin.test/api/questions/${id}`,
      authed({ correctAnswer: '1,5' }, 'PATCH'),
    );
    expect(patchResponse.status).toBe(400);

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${id}`, { headers: { Cookie: cookie } });
    const data = await getResponse.json<{ correctAnswer: string }>();
    expect(data.correctAnswer).toBe('1.5');
  });

  it('rejects a PATCH that drops a matching question below 2 pairs', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'matching',
        difficulty: 'hard',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Associe.',
          resolutionMdx: 'Ver resolução.',
          matchingPairs: [
            { leftMdx: 'Cão', rightMdx: 'Late' },
            { leftMdx: 'Gato', rightMdx: 'Mia' },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    const { id } = await createResponse.json<{ id: number }>();

    const patchResponse = await SELF.fetch(
      `https://admin.test/api/questions/${id}`,
      authed(
        {
          translations: pt({
            promptMdx: 'Associe.',
            resolutionMdx: 'Ver resolução.',
            matchingPairs: [{ leftMdx: 'Cão', rightMdx: 'Late' }],
          }),
        },
        'PATCH',
      ),
    );
    expect(patchResponse.status).toBe(400);

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${id}`, { headers: { Cookie: cookie } });
    const data = await getResponse.json<{ translations: Record<string, { matchingPairs: unknown[] }> }>();
    expect(data.translations['pt-BR'].matchingPairs).toHaveLength(2);
  });

  it('returns 404 for a question that does not exist', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions/999999',
      authed({ difficulty: 'hard' }, 'PATCH'),
    );
    expect(response.status).toBe(404);
  });
});

describe('question and tag locale-key validation', () => {
  it('POST /api/questions rejects a body without a pt-BR translation', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'true_false',
        difficulty: 'easy',
        correctAnswer: 'true',
        answerFormat: 'text',
        translations: {
          'en-US': { promptMdx: 'Is the sky blue?', resolutionMdx: 'Yes.', options: [], matchingPairs: [] },
        },
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toBe('A pt-BR translation is required.');
  });

  it('POST /api/questions rejects an unrecognised locale key', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'true_false',
        difficulty: 'easy',
        correctAnswer: 'true',
        answerFormat: 'text',
        translations: {
          ...pt({ promptMdx: 'O céu é azul?', resolutionMdx: 'Sim.' }),
          en: { promptMdx: 'Is the sky blue?', resolutionMdx: 'Yes.', options: [], matchingPairs: [] },
        },
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toContain('Unsupported locale');
  });

  it('POST /api/questions rejects an unrecognised acceptedAnswersByLocale key', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'easy',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({ promptMdx: 'Qual gás?', resolutionMdx: 'Oxigênio.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: { pt: ['Oxigênio'] },
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toContain('Unsupported locale');
  });

  it('PATCH /api/questions/:id rejects an unrecognised locale key', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'true_false',
        difficulty: 'easy',
        correctAnswer: 'true',
        answerFormat: 'text',
        translations: pt({ promptMdx: 'O céu é azul?', resolutionMdx: 'Sim.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    const { id } = await createResponse.json<{ id: number }>();

    const patchResponse = await SELF.fetch(
      `https://admin.test/api/questions/${id}`,
      authed(
        {
          translations: {
            en: { promptMdx: 'Is the sky blue?', resolutionMdx: 'Yes.', options: [], matchingPairs: [] },
          },
        },
        'PATCH',
      ),
    );
    expect(patchResponse.status).toBe(400);
  });

  it('POST /api/tags rejects a body without a pt-BR translation', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({ slug: 'no-pt-br-tag', translations: { 'en-US': { name: 'Limits' } } }),
    );
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toBe('A pt-BR translation is required.');
  });

  it('PATCH /api/tags/:id rejects an unrecognised locale key without writing anything', async () => {
    const subjectId = await createSubject();
    const created = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({ slug: 'bad-locale-tag', subjectId, translations: { 'pt-BR': { name: 'Original' } } }),
    );
    const { id } = await created.json<{ id: number }>();

    const patched = await SELF.fetch(
      `https://admin.test/api/tags/${id}`,
      authed({ slug: 'changed-slug', translations: { en: { name: 'Bogus locale' } } }, 'PATCH'),
    );
    expect(patched.status).toBe(400);

    const treeResponse = await SELF.fetch('https://admin.test/api/tags', { headers: { Cookie: cookie } });
    const tree = await treeResponse.json<{ slug: string }[]>();
    expect(tree.map((tag) => tag.slug)).toContain('bad-locale-tag');
  });
});

describe('code questions', () => {
  const writePayload = (stdout: string) =>
    JSON.stringify({ starterCode: '', solution: 'print(1)', tests: [{ stdin: '', expectedStdout: stdout }] });

  function codeTranslation(codeJson?: string) {
    return { promptMdx: 'Imprima 1.', resolutionMdx: 'print(1)', options: [], matchingPairs: [], ...(codeJson === undefined ? {} : { codeJson }) };
  }

  function codeBody(overrides: Record<string, unknown> = {}) {
    return {
      type: 'code',
      difficulty: 'easy',
      correctAnswer: null,
      answerFormat: 'text',
      codeKind: 'write',
      codeLanguage: 'python',
      translations: { 'pt-BR': codeTranslation(writePayload('1\n')) },
      acceptedAnswersShared: [],
      acceptedAnswersByLocale: {},
      tagIds: [],
      ...overrides,
    };
  }

  interface QuestionRead {
    difficulty: string;
    codeKind: string | null;
    codeLanguage: string | null;
    key: string | null;
    translations: Record<string, { codeJson: string | null }>;
  }

  async function readQuestion(id: number): Promise<QuestionRead> {
    const response = await SELF.fetch(`https://admin.test/api/questions/${id}`, { headers: { Cookie: cookie } });
    expect(response.status).toBe(200);
    return response.json<QuestionRead>();
  }

  it('creates a code question and reads its kind, language, key and code back', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed(codeBody({ key: 'code-create-ok' })),
    );
    expect(response.status).toBe(201);
    const { id } = await response.json<{ id: number }>();

    const data = await readQuestion(id);
    expect(data.codeKind).toBe('write');
    expect(data.codeLanguage).toBe('python');
    expect(data.key).toBe('code-create-ok');
    expect(data.translations['pt-BR'].codeJson).toBe(writePayload('1\n'));
  });

  it('rejects a code question without codeKind or codeLanguage', async () => {
    const withoutKind = await SELF.fetch('https://admin.test/api/questions', authed(codeBody({ codeKind: undefined })));
    expect(withoutKind.status).toBe(400);
    const withoutLanguage = await SELF.fetch('https://admin.test/api/questions', authed(codeBody({ codeLanguage: undefined })));
    expect(withoutLanguage.status).toBe(400);
  });

  it('rejects a code question locale without codeJson, naming the locale', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed(
        codeBody({
          translations: { 'pt-BR': codeTranslation(writePayload('1\n')), 'en-US': codeTranslation() },
        }),
      ),
    );
    expect(response.status).toBe(400);
    expect((await response.json<{ error: string }>()).error).toContain('en-US');
  });

  it('rejects a code question without a prompt or resolution', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed(codeBody({ translations: { 'pt-BR': { ...codeTranslation(writePayload('1\n')), resolutionMdx: '  ' } } })),
    );
    expect(response.status).toBe(400);
  });

  it('rejects an invalid task payload with the validator message', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed(codeBody({ translations: { 'pt-BR': codeTranslation(JSON.stringify({ starterCode: '', solution: 'x', tests: [] })) } })),
    );
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toContain('pt-BR: payload inválido');
    expect(error).toContain('tests: a write task needs at least 1 test');
  });

  it('rejects a mysql write question because mysql is read-only', async () => {
    const codeJson = JSON.stringify({
      starterCode: '',
      solution: 'SELECT 1',
      tests: [{ sqlSetup: '', expectedRows: { columns: ['1'], rows: [['1']] } }],
    });
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed(codeBody({ codeLanguage: 'mysql', translations: { 'pt-BR': codeTranslation(codeJson) } })),
    );
    expect(response.status).toBe(400);
    expect((await response.json<{ error: string }>()).error).toContain('read-only');
  });

  it('rejects a duplicate key with 409', async () => {
    const first = await SELF.fetch('https://admin.test/api/questions', authed(codeBody({ key: 'code-duplicate' })));
    expect(first.status).toBe(201);

    const second = await SELF.fetch('https://admin.test/api/questions', authed(codeBody({ key: 'code-duplicate' })));
    expect(second.status).toBe(409);
    expect((await second.json<{ error: string }>()).error).toBe('Já existe uma questão com a chave "code-duplicate".');
  });

  it('rejects a key outside the allowed pattern with 400', async () => {
    for (const key of ['Upper', '-leading', 'has space', 'under_score', '']) {
      const response = await SELF.fetch('https://admin.test/api/questions', authed(codeBody({ key })));
      expect(response.status, `key "${key}"`).toBe(400);
    }
  });

  it('lets a question keep its own key on PATCH but not take another question key', async () => {
    const a = await (await SELF.fetch('https://admin.test/api/questions', authed(codeBody({ key: 'code-key-a' })))).json<{ id: number }>();
    await SELF.fetch('https://admin.test/api/questions', authed(codeBody({ key: 'code-key-b' })));

    const own = await SELF.fetch(`https://admin.test/api/questions/${a.id}`, authed({ key: 'code-key-a' }, 'PATCH'));
    expect(own.status).toBe(200);
    const taken = await SELF.fetch(`https://admin.test/api/questions/${a.id}`, authed({ key: 'code-key-b' }, 'PATCH'));
    expect(taken.status).toBe(409);
  });

  it('keeps code_json when a PATCH only changes the difficulty', async () => {
    const created = await SELF.fetch('https://admin.test/api/questions', authed(codeBody({ key: 'code-patch-difficulty' })));
    const { id } = await created.json<{ id: number }>();

    const response = await SELF.fetch(`https://admin.test/api/questions/${id}`, authed({ difficulty: 'hard' }, 'PATCH'));
    expect(response.status).toBe(200);

    const data = await readQuestion(id);
    expect(data.difficulty).toBe('hard');
    expect(data.translations['pt-BR'].codeJson).toBe(writePayload('1\n'));
    expect(data.codeKind).toBe('write');
  });

  it('rejects a PATCH that changes the kind when a stored payload no longer fits, naming the locale', async () => {
    const created = await SELF.fetch(
      'https://admin.test/api/questions',
      authed(
        codeBody({
          translations: { 'pt-BR': codeTranslation(writePayload('1\n')), 'en-US': codeTranslation(writePayload('1\n')) },
        }),
      ),
    );
    const { id } = await created.json<{ id: number }>();

    const response = await SELF.fetch(`https://admin.test/api/questions/${id}`, authed({ codeKind: 'predict_output' }, 'PATCH'));
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toContain('payload inválido');
    expect(error).toContain('expectedOutput');

    expect((await readQuestion(id)).codeKind).toBe('write');
  });

  it('accepts a kind change when every locale carries a payload that fits it', async () => {
    const created = await SELF.fetch('https://admin.test/api/questions', authed(codeBody()));
    const { id } = await created.json<{ id: number }>();
    const predict = JSON.stringify({ starterCode: 'print(1)', expectedOutput: '1' });

    const response = await SELF.fetch(
      `https://admin.test/api/questions/${id}`,
      authed({ codeKind: 'predict_output', translations: { 'pt-BR': codeTranslation(predict) } }, 'PATCH'),
    );
    expect(response.status).toBe(200);
    const data = await readQuestion(id);
    expect(data.codeKind).toBe('predict_output');
    expect(data.translations['pt-BR'].codeJson).toBe(predict);
  });

  it('keeps the code columns null for non-code questions and ignores code fields sent with them', async () => {
    const created = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'true_false',
        difficulty: 'easy',
        correctAnswer: 'true',
        answerFormat: 'text',
        codeKind: 'write',
        codeLanguage: 'python',
        translations: { 'pt-BR': { ...codeTranslation(writePayload('1\n')) } },
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(created.status).toBe(201);
    const { id } = await created.json<{ id: number }>();

    const patched = await SELF.fetch(
      `https://admin.test/api/questions/${id}`,
      authed({ difficulty: 'medium', codeKind: 'write', translations: { 'pt-BR': codeTranslation(writePayload('1\n')) } }, 'PATCH'),
    );
    expect(patched.status).toBe(200);

    const data = await readQuestion(id);
    expect(data.codeKind).toBeNull();
    expect(data.codeLanguage).toBeNull();
    expect(data.translations['pt-BR'].codeJson).toBeNull();
  });
});
