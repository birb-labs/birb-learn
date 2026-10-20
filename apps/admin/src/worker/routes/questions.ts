import { Hono } from 'hono';
import { eq, inArray } from 'drizzle-orm';
import {
  getD1Db,
  getQuestionForAdminEdit,
  getQuestionsForExport,
  getTagTree,
  isValidNumericCorrectAnswer,
  questionAcceptedAnswers,
  questionMatchingPairs,
  questionMatchingPairTranslations,
  questionOptions,
  questionOptionTranslations,
  questions,
  questionTags,
  questionTranslations,
  subjects,
  tags,
  tagTranslations,
  type CodeKind,
  type Language,
  type Locale,
} from '@birb-learn/content-schema';
import type { Env } from '../env';
import { validateCodeKindAndLanguage, validateTaskPayloadText } from './codeValidation';
import { validateTranslationLocales } from './translationInput';

interface QuestionInput {
  type:
    | 'multiple_choice'
    | 'multiple_response'
    | 'numeric'
    | 'true_false'
    | 'short_text'
    | 'ordering'
    | 'matching'
    | 'code';
  difficulty: 'easy' | 'medium' | 'hard';
  promptMdx: string;
  resolutionMdx: string;
  correctAnswer: string | null;
  answerFormat: 'text' | 'math';
  options: { textMdx: string; isCorrect: boolean }[];
  acceptedAnswers: string[];
  matchingPairs: { leftMdx: string; rightMdx: string }[];
  tagIds: number[];
}

function validateQuestionInput(body: QuestionInput): string | null {
  if (body.type === 'numeric') {
    if (body.correctAnswer === null || !isValidNumericCorrectAnswer(body.correctAnswer)) {
      return 'Questões numéricas precisam de uma resposta correta válida (ex.: "1.5", não "1,5").';
    }
    return null;
  }

  if (body.type === 'true_false') {
    if (body.correctAnswer !== 'true' && body.correctAnswer !== 'false') {
      return 'Questões de verdadeiro ou falso precisam de uma resposta correta "true" ou "false".';
    }
    return null;
  }

  if (body.type === 'short_text') {
    if (body.answerFormat !== 'text' && body.answerFormat !== 'math') {
      return 'Questões de texto curto precisam de um modo de resposta "text" ou "math".';
    }
    if (body.acceptedAnswers.length < 1 || body.acceptedAnswers.some((answer) => answer.trim() === '')) {
      return 'Questões de texto curto precisam de pelo menos 1 resposta aceita, sem entradas em branco.';
    }
    return null;
  }

  if (body.type === 'matching') {
    if (body.matchingPairs.length < 2) {
      return 'Questões de associação precisam de pelo menos 2 pares.';
    }
    return null;
  }

  // multiple_choice, multiple_response, and ordering all store their content in `options`.
  if (body.options.length < 2) {
    return 'Questões de múltipla escolha, múltipla resposta ou ordenação precisam de pelo menos 2 alternativas.';
  }

  const correctCount = body.options.filter((option) => option.isCorrect).length;
  if (body.type === 'multiple_choice' && correctCount !== 1) {
    return 'Questões de múltipla escolha (uma correta) precisam de exatamente 1 alternativa correta.';
  }
  if (body.type === 'multiple_response' && correctCount < 1) {
    return 'Questões de múltipla resposta precisam de pelo menos 1 alternativa correta.';
  }

  return null;
}

interface QuestionTranslationInput {
  promptMdx: string;
  resolutionMdx: string;
  codeJson?: string | null;
  options: { id?: number; textMdx: string; isCorrect: boolean }[];
  matchingPairs: { id?: number; leftMdx: string; rightMdx: string }[];
}

interface QuestionStructuralInput {
  type: QuestionInput['type'];
  difficulty: QuestionInput['difficulty'];
  correctAnswer: string | null;
  answerFormat: 'text' | 'math';
  codeKind?: CodeKind | null;
  codeLanguage?: Language | null;
  key?: string | null;
  tagIds: number[];
  translations: Partial<Record<Locale, QuestionTranslationInput>>;
  acceptedAnswersShared: string[];
  acceptedAnswersByLocale: Partial<Record<Locale, string[]>>;
}

/**
 * The `pt-BR` translation is the structural authority: option/pair counts and
 * `isCorrect` flags live on the shared `questionOptions`/`questionMatchingPairs`
 * rows, and `pt-BR` is the one locale guaranteed to exist for every question, so
 * reading structure from it keeps validation and the subsequent writes agreeing
 * regardless of which locale tab the editor happened to be on.
 */
function structuralTranslation(
  translations: Partial<Record<Locale, QuestionTranslationInput>>,
): QuestionTranslationInput | undefined {
  return translations['pt-BR'] ?? Object.values(translations)[0];
}

function duplicateKeyMessage(key: string): string {
  return `Já existe uma questão com a chave "${key}".`;
}

const QUESTION_KEY_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** `key` is an optional stable identifier; `null` clears it. */
function validateQuestionKey(key: string | null | undefined): string | null {
  if (key === undefined || key === null) return null;
  if (typeof key !== 'string' || !QUESTION_KEY_PATTERN.test(key)) {
    return 'A chave da questão deve usar apenas letras minúsculas, números e hifens, começando por letra ou número.';
  }
  return null;
}

/**
 * True when `error` (or any error in its `cause` chain) is SQLite rejecting a
 * duplicate `questions.key`. The unique index is the only race-free check, so
 * the routes rely on it instead of a read-then-write lookup.
 */
function isDuplicateKeyError(error: unknown): boolean {
  for (let current: unknown = error; current instanceof Error; current = current.cause) {
    if (/UNIQUE constraint failed:.*questions\.key/i.test(current.message)) return true;
  }
  return false;
}

/**
 * Code questions are graded by running code, so clients may omit everything
 * the other types need (options, pairs, answers, tags). Default those so the
 * shared write paths never see `undefined`.
 */
function withCodeDefaults(body: QuestionStructuralInput): QuestionStructuralInput {
  if (body.type !== 'code') return body;
  return {
    ...body,
    correctAnswer: body.correctAnswer ?? null,
    answerFormat: body.answerFormat ?? 'text',
    tagIds: body.tagIds ?? [],
    acceptedAnswersShared: body.acceptedAnswersShared ?? [],
    acceptedAnswersByLocale: body.acceptedAnswersByLocale ?? {},
    translations: withTranslationDefaults(body.translations ?? {}),
  };
}

function withTranslationDefaults(
  translations: Partial<Record<Locale, QuestionTranslationInput>>,
): Partial<Record<Locale, QuestionTranslationInput>> {
  return Object.fromEntries(
    Object.entries(translations).map(([locale, t]) => [
      locale,
      { ...t, options: t.options ?? [], matchingPairs: t.matchingPairs ?? [] },
    ]),
  );
}

/**
 * Validates the code fields of a `code` question for the given locales: the
 * structural kind and language, then per locale the prompt, resolution and the
 * `codeJson` task payload.
 */
function validateCodeQuestion(body: QuestionStructuralInput, localesToCheck: Locale[]): string | null {
  const kindError = validateCodeKindAndLanguage(body.codeKind, body.codeLanguage);
  if (kindError) return kindError;

  for (const locale of localesToCheck) {
    const translation = body.translations[locale];
    if (!translation) continue;
    if (!translation.promptMdx?.trim() || !translation.resolutionMdx?.trim()) {
      return `${locale}: questões de código precisam de enunciado e resolução.`;
    }
    const payloadError = validateTaskPayloadText(
      locale,
      body.codeKind as CodeKind,
      body.codeLanguage as Language,
      translation.codeJson,
    );
    if (payloadError) return payloadError;
  }
  return null;
}

/**
 * `localesToCheck` are the locales whose code payload must be validated; it
 * defaults to every locale in the body (creation), while a PATCH narrows it to
 * the locales it writes unless the type or code target changed.
 */
function validateStructuralInput(body: QuestionStructuralInput, localesToCheck?: Locale[]): string | null {
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return localeError;

  const acceptedAnswersLocaleError = validateTranslationLocales(body.acceptedAnswersByLocale, { requirePtBr: false });
  if (acceptedAnswersLocaleError) return acceptedAnswersLocaleError;

  if (body.type === 'code') {
    return validateCodeQuestion(body, localesToCheck ?? (Object.keys(body.translations) as Locale[]));
  }

  const anyTranslation = structuralTranslation(body.translations)!;
  return validateQuestionInput({
    type: body.type,
    difficulty: body.difficulty,
    promptMdx: anyTranslation.promptMdx,
    resolutionMdx: anyTranslation.resolutionMdx,
    correctAnswer: body.correctAnswer,
    answerFormat: body.answerFormat,
    options: anyTranslation.options,
    acceptedAnswers:
      body.answerFormat === 'math' ? body.acceptedAnswersShared : Object.values(body.acceptedAnswersByLocale).flat(),
    matchingPairs: anyTranslation.matchingPairs,
    tagIds: body.tagIds,
  });
}

export const questionsRoutes = new Hono<{ Bindings: Env }>();

questionsRoutes.get('/', async (c) => {
  const db = getD1Db(c.env.DB);
  return c.json(await getQuestionsForExport(db, 'pt-BR'));
});

questionsRoutes.get('/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const question = await getQuestionForAdminEdit(db, id);
  if (!question) return c.json({ error: 'Not found' }, 404);
  return c.json(question);
});

questionsRoutes.post('/', async (c) => {
  const body = withCodeDefaults(await c.req.json<QuestionStructuralInput>());
  const validationError = validateStructuralInput(body) ?? validateQuestionKey(body.key);
  if (validationError) return c.json({ error: validationError }, 400);

  const db = getD1Db(c.env.DB);
  const key = body.key ?? null;
  const isCode = body.type === 'code';
  let question;
  try {
    [question] = await db
      .insert(questions)
      .values({
        type: body.type,
        difficulty: body.difficulty,
        correctAnswer: body.correctAnswer,
        answerFormat: body.answerFormat,
        // Only code questions have a kind and language; any other type clears them.
        codeKind: isCode ? body.codeKind! : null,
        codeLanguage: isCode ? body.codeLanguage! : null,
        key,
      })
      .returning();
  } catch (error) {
    if (key !== null && isDuplicateKeyError(error)) return c.json({ error: duplicateKeyMessage(key) }, 409);
    throw error;
  }

  const structural = structuralTranslation(body.translations)!;
  if (structural.options.length > 0) {
    await db.insert(questionOptions).values(
      structural.options.map((option, index) => ({ questionId: question.id, isCorrect: option.isCorrect, order: index + 1 })),
    ).run();
  }
  if (structural.matchingPairs.length > 0) {
    await db.insert(questionMatchingPairs).values(
      structural.matchingPairs.map((_, index) => ({ questionId: question.id, order: index + 1 })),
    ).run();
  }

  await writeQuestionTranslations(db, question.id, body.type, body.translations);
  await writeAcceptedAnswers(db, question.id, body.answerFormat, body.acceptedAnswersShared, body.acceptedAnswersByLocale);

  if (body.tagIds.length > 0) {
    await db.insert(questionTags).values(body.tagIds.map((tagId) => ({ questionId: question.id, tagId }))).run();
  }

  return c.json(question, 201);
});

questionsRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<QuestionStructuralInput>>();

  const db = getD1Db(c.env.DB);

  const current = await getQuestionForAdminEdit(db, id);
  if (!current) return c.json({ error: 'Not found' }, 404);

  const {
    translations,
    acceptedAnswersShared,
    acceptedAnswersByLocale,
    tagIds,
    codeKind: bodyCodeKind,
    codeLanguage: bodyCodeLanguage,
    key: bodyKey,
    ...otherStructuralFields
  } = body;
  const structuralFields: Record<string, unknown> = { ...otherStructuralFields };

  const effectiveType = body.type ?? current.type;
  const effectiveCodeKind = bodyCodeKind !== undefined ? bodyCodeKind : current.codeKind;
  const effectiveCodeLanguage = bodyCodeLanguage !== undefined ? bodyCodeLanguage : current.codeLanguage;

  // A PATCH body carries only the locales it wants to change, but the writes
  // below rebuild the shared option/pair rows from scratch with new ids, which
  // orphans every locale whose text is not re-written in the same request —
  // including `pt-BR`, whose absence makes `resolveTranslation` throw on every
  // subsequent read (the admin question list and the site build both read
  // `pt-BR`). Merging the incoming locales over the stored ones keeps the
  // per-locale wholesale-replace semantics while never dropping a locale that
  // simply was not mentioned.
  const mergedTranslations: Partial<Record<Locale, QuestionTranslationInput>> = {
    ...current.translations,
    ...(effectiveType === 'code' && translations ? withTranslationDefaults(translations) : translations),
  };

  // PATCH bodies are partial, so validate the *effective* post-patch state
  // rather than the body alone: without this a PATCH could set a
  // multiple_choice question to zero correct options or a short_text question
  // to zero accepted answers, and the failure would only surface much later as
  // a thrown error during the site's production question export.
  // A PATCH normally re-checks only the code payloads it writes. A new type or
  // a new kind/language can invalidate payloads it leaves alone, so then every
  // stored locale is re-checked too.
  const codeTargetChanged =
    effectiveType === 'code' &&
    (current.type !== 'code' || effectiveCodeKind !== current.codeKind || effectiveCodeLanguage !== current.codeLanguage);
  const localesToCheck = (codeTargetChanged ? Object.keys(mergedTranslations) : Object.keys(translations ?? {})) as Locale[];

  const validationError = validateStructuralInput({
    type: effectiveType,
    difficulty: body.difficulty ?? current.difficulty,
    correctAnswer: body.correctAnswer !== undefined ? body.correctAnswer : current.correctAnswer,
    answerFormat: body.answerFormat ?? current.answerFormat,
    tagIds: tagIds ?? current.tagIds,
    translations: mergedTranslations,
    acceptedAnswersShared: acceptedAnswersShared ?? current.acceptedAnswersShared,
    acceptedAnswersByLocale: acceptedAnswersByLocale ?? current.acceptedAnswersByLocale,
    codeKind: effectiveCodeKind,
    codeLanguage: effectiveCodeLanguage,
  }, localesToCheck);
  if (validationError) return c.json({ error: validationError }, 400);

  if (bodyKey !== undefined) {
    const keyError = validateQuestionKey(bodyKey);
    if (keyError) return c.json({ error: keyError }, 400);
    structuralFields.key = bodyKey;
  }

  if (effectiveType === 'code') {
    if (bodyCodeKind !== undefined) structuralFields.codeKind = bodyCodeKind;
    if (bodyCodeLanguage !== undefined) structuralFields.codeLanguage = bodyCodeLanguage;
  } else {
    // Only code questions have a kind, language and code payload; any other type clears them.
    structuralFields.codeKind = null;
    structuralFields.codeLanguage = null;
  }

  // This is the first write, so a duplicate `key` rejected by the unique index
  // leaves the question exactly as it was.
  if (Object.keys(structuralFields).length > 0) {
    try {
      await db.update(questions).set(structuralFields).where(eq(questions.id, id)).run();
    } catch (error) {
      if (typeof bodyKey === 'string' && isDuplicateKeyError(error)) return c.json({ error: duplicateKeyMessage(bodyKey) }, 409);
      throw error;
    }
  }

  if (effectiveType !== 'code' && current.type === 'code') {
    await db.update(questionTranslations).set({ codeJson: null }).where(eq(questionTranslations.questionId, id)).run();
  }

  if (translations) {
    const structural = structuralTranslation(mergedTranslations)!;

    await deleteOptionsAndPairs(db, id);

    if (structural.options.length > 0) {
      await db.insert(questionOptions).values(
        structural.options.map((option, index) => ({ questionId: id, isCorrect: option.isCorrect, order: index + 1 })),
      ).run();
    }

    if (structural.matchingPairs.length > 0) {
      await db.insert(questionMatchingPairs).values(
        structural.matchingPairs.map((_, index) => ({ questionId: id, order: index + 1 })),
      ).run();
    }

    await writeQuestionTranslations(db, id, effectiveType, mergedTranslations);
  }

  if (acceptedAnswersShared !== undefined || acceptedAnswersByLocale !== undefined) {
    await writeAcceptedAnswers(
      db,
      id,
      body.answerFormat ?? current.answerFormat,
      acceptedAnswersShared ?? current.acceptedAnswersShared,
      acceptedAnswersByLocale ?? current.acceptedAnswersByLocale,
    );
  }

  if (tagIds) {
    await db.delete(questionTags).where(eq(questionTags.questionId, id)).run();
    if (tagIds.length > 0) {
      await db.insert(questionTags).values(tagIds.map((tagId) => ({ questionId: id, tagId }))).run();
    }
  }

  return c.json({ ok: true });
});

// `question_option_translations`/`question_matching_pair_translations` rows
// reference `questionOptions`/`questionMatchingPairs` ids via a foreign key
// with no ON DELETE CASCADE, so the translation rows must be deleted first
// or D1 rejects the structural delete with a foreign-key-constraint error.
async function deleteOptionsAndPairs(db: ReturnType<typeof getD1Db>, questionId: number) {
  const existingOptions = await db.select({ id: questionOptions.id }).from(questionOptions).where(eq(questionOptions.questionId, questionId)).all();
  if (existingOptions.length > 0) {
    await db
      .delete(questionOptionTranslations)
      .where(inArray(questionOptionTranslations.optionId, existingOptions.map((o) => o.id)))
      .run();
  }
  await db.delete(questionOptions).where(eq(questionOptions.questionId, questionId)).run();

  const existingPairs = await db.select({ id: questionMatchingPairs.id }).from(questionMatchingPairs).where(eq(questionMatchingPairs.questionId, questionId)).all();
  if (existingPairs.length > 0) {
    await db
      .delete(questionMatchingPairTranslations)
      .where(inArray(questionMatchingPairTranslations.pairId, existingPairs.map((p) => p.id)))
      .run();
  }
  await db.delete(questionMatchingPairs).where(eq(questionMatchingPairs.questionId, questionId)).run();
}

async function writeQuestionTranslations(
  db: ReturnType<typeof getD1Db>,
  questionId: number,
  type: QuestionInput['type'],
  translations: Partial<Record<Locale, QuestionTranslationInput>>,
) {
  for (const locale of Object.keys(translations) as Locale[]) {
    const t = translations[locale]!;
    // Only code questions carry a payload; any other type clears it.
    const codeJson = type === 'code' ? (t.codeJson ?? null) : null;
    await db
      .insert(questionTranslations)
      .values({ questionId, locale, promptMdx: t.promptMdx, resolutionMdx: t.resolutionMdx, codeJson })
      .onConflictDoUpdate({
        target: [questionTranslations.questionId, questionTranslations.locale],
        set: { promptMdx: t.promptMdx, resolutionMdx: t.resolutionMdx, codeJson },
      })
      .run();

    // Options and matching pairs are replaced wholesale per locale, same
    // rationale as the pre-existing wholesale-replace approach: simplest
    // correct approach at this data scale, sidesteps matching incoming rows
    // back to existing ids.
    const existingOptions = await db.select().from(questionOptions).where(eq(questionOptions.questionId, questionId)).orderBy(questionOptions.order).all();
    for (let i = 0; i < t.options.length && i < existingOptions.length; i++) {
      await db
        .insert(questionOptionTranslations)
        .values({ optionId: existingOptions[i].id, locale, textMdx: t.options[i].textMdx })
        .onConflictDoUpdate({
          target: [questionOptionTranslations.optionId, questionOptionTranslations.locale],
          set: { textMdx: t.options[i].textMdx },
        })
        .run();
    }

    const existingPairs = await db.select().from(questionMatchingPairs).where(eq(questionMatchingPairs.questionId, questionId)).orderBy(questionMatchingPairs.order).all();
    for (let i = 0; i < t.matchingPairs.length && i < existingPairs.length; i++) {
      await db
        .insert(questionMatchingPairTranslations)
        .values({ pairId: existingPairs[i].id, locale, leftMdx: t.matchingPairs[i].leftMdx, rightMdx: t.matchingPairs[i].rightMdx })
        .onConflictDoUpdate({
          target: [questionMatchingPairTranslations.pairId, questionMatchingPairTranslations.locale],
          set: { leftMdx: t.matchingPairs[i].leftMdx, rightMdx: t.matchingPairs[i].rightMdx },
        })
        .run();
    }
  }
}

async function writeAcceptedAnswers(
  db: ReturnType<typeof getD1Db>,
  questionId: number,
  answerFormat: 'text' | 'math',
  acceptedAnswersShared: string[],
  acceptedAnswersByLocale: Partial<Record<Locale, string[]>>,
) {
  await db.delete(questionAcceptedAnswers).where(eq(questionAcceptedAnswers.questionId, questionId)).run();

  if (answerFormat === 'math') {
    if (acceptedAnswersShared.length > 0) {
      await db.insert(questionAcceptedAnswers).values(acceptedAnswersShared.map((text) => ({ questionId, text, locale: null }))).run();
    }
    return;
  }

  const rows = (Object.keys(acceptedAnswersByLocale) as Locale[]).flatMap((locale) =>
    (acceptedAnswersByLocale[locale] ?? []).map((text) => ({ questionId, text, locale })),
  );
  if (rows.length > 0) {
    await db.insert(questionAcceptedAnswers).values(rows).run();
  }
}

questionsRoutes.delete('/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(questionTags).where(eq(questionTags.questionId, id)).run();
  await db.delete(questionAcceptedAnswers).where(eq(questionAcceptedAnswers.questionId, id)).run();
  await db.delete(questionTranslations).where(eq(questionTranslations.questionId, id)).run();
  await deleteOptionsAndPairs(db, id);
  await db.delete(questions).where(eq(questions.id, id)).run();
  return c.json({ ok: true });
});

export const tagsRoutes = new Hono<{ Bindings: Env }>();

tagsRoutes.get('/', async (c) => {
  const db = getD1Db(c.env.DB);
  // Tags are scoped per subject (see the `subjectId` column added in
  // migration 0006), but there is no subject-picker UI here yet -- only
  // one subject exists in practice, so default to it until this route
  // grows a subject filter.
  const [firstSubject] = await db.select().from(subjects).orderBy(subjects.order).limit(1);
  if (!firstSubject) return c.json([]);
  return c.json(await getTagTree(db, 'pt-BR', firstSubject.id));
});

tagsRoutes.post('/', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{
    slug: string;
    subjectId: number;
    parentTagId?: number;
    translations: Partial<Record<Locale, { name: string }>>;
  }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  if (!body.subjectId) return c.json({ error: 'subjectId is required' }, 400);
  const locales = Object.keys(body.translations) as Locale[];

  const [row] = await db
    .insert(tags)
    .values({ slug: body.slug, subjectId: body.subjectId, parentTagId: body.parentTagId })
    .returning();
  await db
    .insert(tagTranslations)
    .values(locales.map((locale) => ({ tagId: row.id, locale, name: body.translations[locale]!.name })))
    .run();
  return c.json(row, 201);
});

tagsRoutes.patch('/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<
    Partial<{
      slug: string;
      subjectId: number;
      parentTagId: number;
      translations: Partial<Record<Locale, { name: string }>>;
    }>
  >();
  const { translations, ...structuralFields } = body;
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
  if (Object.keys(structuralFields).length > 0) {
    await db.update(tags).set(structuralFields).where(eq(tags.id, id)).run();
  }
  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      await db
        .insert(tagTranslations)
        .values({ tagId: id, locale, name: translations[locale]!.name })
        .onConflictDoUpdate({
          target: [tagTranslations.tagId, tagTranslations.locale],
          set: { name: translations[locale]!.name },
        })
        .run();
    }
  }
  return c.json({ ok: true });
});
