import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import {
  getD1Db,
  getContentTree,
  disciplines,
  disciplineTranslations,
  subjects,
  subjectTranslations,
  topics,
  topicTranslations,
  sections,
  sectionTranslations,
  lessons,
  lessonTranslations,
  getLessonForAdminEdit,
  lessonBlocks,
  lessonBlockTranslations,
  type CodeKind,
  type Language,
  type LessonBlockType,
  LESSON_BLOCK_TYPES,
  type Locale,
} from '@birb-learn/content-schema';
import type { Env } from '../env';
import { validateCodeKindAndLanguage, validateSnippetPayloadText, validateTaskPayloadText } from './codeValidation';
import { validateTranslationLocales } from './translationInput';

export const lessonsRoutes = new Hono<{ Bindings: Env }>();

lessonsRoutes.get('/tree', async (c) => {
  const db = getD1Db(c.env.DB);
  const tree = await getContentTree(db, 'pt-BR');
  const allLessons = await db.select({ id: lessons.id, slug: lessons.slug }).from(lessons).all();
  const idBySlug = new Map(allLessons.map((lesson) => [lesson.slug, lesson.id]));

  return c.json(
    tree.map((discipline) => ({
      ...discipline,
      subjects: discipline.subjects.map((subject) => ({
        ...subject,
        topics: subject.topics.map((topic) => ({
          ...topic,
          sections: topic.sections.map((section) => ({
            ...section,
            lessons: section.lessons.map((lesson) => ({ ...lesson, id: idBySlug.get(lesson.slug) })),
          })),
        })),
      })),
    })),
  );
});

lessonsRoutes.post('/disciplines', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

  const [row] = await db.insert(disciplines).values({ slug: body.slug, order: body.order }).returning();
  await db
    .insert(disciplineTranslations)
    .values(locales.map((locale) => ({ disciplineId: row.id, locale, name: body.translations[locale]!.name })))
    .run();
  return c.json(row, 201);
});

lessonsRoutes.patch('/disciplines/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<{ slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>>();
  const { translations, ...structuralFields } = body;
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
  if (Object.keys(structuralFields).length > 0) {
    await db.update(disciplines).set(structuralFields).where(eq(disciplines.id, id)).run();
  }
  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      await db
        .insert(disciplineTranslations)
        .values({ disciplineId: id, locale, name: translations[locale]!.name })
        .onConflictDoUpdate({
          target: [disciplineTranslations.disciplineId, disciplineTranslations.locale],
          set: { name: translations[locale]!.name },
        })
        .run();
    }
  }
  return c.json({ ok: true });
});

lessonsRoutes.post('/subjects', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ disciplineId: number; slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>();
  // `subjects.discipline_id` is nullable in SQLite (see migration 0007), so
  // this route is what keeps every subject attached to a discipline.
  if (typeof body.disciplineId !== 'number') return c.json({ error: 'disciplineId is required' }, 400);
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

  const [row] = await db
    .insert(subjects)
    .values({ disciplineId: body.disciplineId, slug: body.slug, order: body.order })
    .returning();
  await db
    .insert(subjectTranslations)
    .values(locales.map((locale) => ({ subjectId: row.id, locale, name: body.translations[locale]!.name })))
    .run();
  return c.json(row, 201);
});

lessonsRoutes.patch('/subjects/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<{ disciplineId: number; slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>>();
  const { translations, ...structuralFields } = body;
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
  if (Object.keys(structuralFields).length > 0) {
    await db.update(subjects).set(structuralFields).where(eq(subjects.id, id)).run();
  }
  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      await db
        .insert(subjectTranslations)
        .values({ subjectId: id, locale, name: translations[locale]!.name })
        .onConflictDoUpdate({
          target: [subjectTranslations.subjectId, subjectTranslations.locale],
          set: { name: translations[locale]!.name },
        })
        .run();
    }
  }
  return c.json({ ok: true });
});

lessonsRoutes.post('/topics', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ subjectId: number; slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

  const [row] = await db.insert(topics).values({ subjectId: body.subjectId, slug: body.slug, order: body.order }).returning();
  await db
    .insert(topicTranslations)
    .values(locales.map((locale) => ({ topicId: row.id, locale, name: body.translations[locale]!.name })))
    .run();
  return c.json(row, 201);
});

lessonsRoutes.patch('/topics/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<{ subjectId: number; slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>>();
  const { translations, ...structuralFields } = body;
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
  if (Object.keys(structuralFields).length > 0) {
    await db.update(topics).set(structuralFields).where(eq(topics.id, id)).run();
  }
  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      await db
        .insert(topicTranslations)
        .values({ topicId: id, locale, name: translations[locale]!.name })
        .onConflictDoUpdate({
          target: [topicTranslations.topicId, topicTranslations.locale],
          set: { name: translations[locale]!.name },
        })
        .run();
    }
  }
  return c.json({ ok: true });
});

lessonsRoutes.post('/sections', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ topicId: number; slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

  const [row] = await db.insert(sections).values({ topicId: body.topicId, slug: body.slug, order: body.order }).returning();
  await db
    .insert(sectionTranslations)
    .values(locales.map((locale) => ({ sectionId: row.id, locale, name: body.translations[locale]!.name })))
    .run();
  return c.json(row, 201);
});

lessonsRoutes.patch('/sections/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<{ topicId: number; slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>>();
  const { translations, ...structuralFields } = body;
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
  if (Object.keys(structuralFields).length > 0) {
    await db.update(sections).set(structuralFields).where(eq(sections.id, id)).run();
  }
  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      await db
        .insert(sectionTranslations)
        .values({ sectionId: id, locale, name: translations[locale]!.name })
        .onConflictDoUpdate({
          target: [sectionTranslations.sectionId, sectionTranslations.locale],
          set: { name: translations[locale]!.name },
        })
        .run();
    }
  }
  return c.json({ ok: true });
});

interface LessonBlockTranslationInput {
  title?: string;
  bodyMdx?: string;
  promptMdx?: string;
  resolutionMdx?: string;
  caption?: string;
  payloadJson?: string;
}

interface LessonBlockInput {
  type: LessonBlockType;
  simulatorKey?: string;
  simulatorParams?: string;
  codeKind?: CodeKind | null;
  codeLanguage?: Language | null;
  translations: Partial<Record<Locale, LessonBlockTranslationInput>>;
}

/**
 * Which fields each block `type` requires to be present and non-blank, for
 * every locale being written. Enforced per-locale (not just pt-BR) so a
 * later translation into en-US/es can't silently save empty content.
 */
function validateLessonBlockTranslation(
  type: LessonBlockType,
  locale: Locale,
  t: LessonBlockTranslationInput,
  codeKind: CodeKind | null | undefined,
  codeLanguage: Language | null | undefined,
): string | null {
  if (type === 'text' && !t.bodyMdx?.trim()) {
    return 'Blocos de texto precisam de conteúdo.';
  }
  if ((type === 'curiosity' || type === 'real_world_application') && (!t.title?.trim() || !t.bodyMdx?.trim())) {
    return 'Blocos de curiosidade ou aplicação real precisam de título e conteúdo.';
  }
  if (type === 'solved_exercise' && (!t.promptMdx?.trim() || !t.resolutionMdx?.trim())) {
    return 'Blocos de exercício resolvido precisam de enunciado e resolução.';
  }
  if (type === 'code_snippet') {
    return validateSnippetPayloadText(locale, t.payloadJson);
  }
  if (type === 'code_exercise') {
    if (!t.promptMdx?.trim() || !t.resolutionMdx?.trim()) {
      return `${locale}: blocos de exercício de código precisam de enunciado e resolução.`;
    }
    // The kind and language were checked before any locale, so they are valid here.
    return validateTaskPayloadText(locale, codeKind as CodeKind, codeLanguage as Language, t.payloadJson);
  }
  return null;
}

function isCodeBlockType(type: LessonBlockType): boolean {
  return type === 'code_snippet' || type === 'code_exercise';
}

/**
 * `simulatorParams` is stored as a raw JSON string, so this is the one check
 * that must run on every write that includes the field -- not just writes
 * that also touch `translations` -- otherwise a structural-only PATCH can
 * persist malformed JSON with no validation at all.
 */
function validateSimulatorParamsJson(simulatorParams: string | undefined): string | null {
  if (simulatorParams !== undefined) {
    try {
      JSON.parse(simulatorParams);
    } catch {
      return 'simulatorParams precisa ser um JSON válido.';
    }
  }
  return null;
}

function validateLessonBlockInput(body: LessonBlockInput, { requirePtBr }: { requirePtBr: boolean }): string | null {
  if (!LESSON_BLOCK_TYPES.includes(body.type)) {
    return `Tipo de bloco inválido: ${body.type}.`;
  }
  if (body.type === 'simulator' && !body.simulatorKey?.trim()) {
    return 'Blocos de simulador precisam de uma simulatorKey.';
  }
  const simulatorParamsError = validateSimulatorParamsJson(body.simulatorParams);
  if (simulatorParamsError) return simulatorParamsError;
  if (body.type === 'code_exercise') {
    const kindError = validateCodeKindAndLanguage(body.codeKind, body.codeLanguage);
    if (kindError) return kindError;
  }
  const localeError = validateTranslationLocales(body.translations, { requirePtBr });
  if (localeError) return localeError;
  for (const locale of Object.keys(body.translations) as Locale[]) {
    const fieldError = validateLessonBlockTranslation(body.type, locale, body.translations[locale]!, body.codeKind, body.codeLanguage);
    if (fieldError) return fieldError;
  }
  return null;
}

async function writeLessonBlockTranslations(
  db: ReturnType<typeof getD1Db>,
  blockId: number,
  type: LessonBlockType,
  translations: Partial<Record<Locale, LessonBlockTranslationInput>>,
) {
  for (const locale of Object.keys(translations) as Locale[]) {
    const t = translations[locale]!;
    // Only code blocks carry a payload; any other type clears it.
    const payloadJson = isCodeBlockType(type) ? (t.payloadJson ?? null) : null;
    await db
      .insert(lessonBlockTranslations)
      .values({
        blockId,
        locale,
        title: t.title ?? null,
        bodyMdx: t.bodyMdx ?? null,
        promptMdx: t.promptMdx ?? null,
        resolutionMdx: t.resolutionMdx ?? null,
        caption: t.caption ?? null,
        payloadJson,
      })
      .onConflictDoUpdate({
        target: [lessonBlockTranslations.blockId, lessonBlockTranslations.locale],
        set: {
          title: t.title ?? null,
          bodyMdx: t.bodyMdx ?? null,
          promptMdx: t.promptMdx ?? null,
          resolutionMdx: t.resolutionMdx ?? null,
          caption: t.caption ?? null,
          payloadJson,
        },
      })
      .run();
  }
}

// `lesson_block_translations` rows reference `lesson_blocks` via a foreign
// key with no ON DELETE CASCADE, so translations must be deleted before
// the block row -- same delete-children-then-parent shape used everywhere
// else in this schema.
async function deleteLessonBlock(db: ReturnType<typeof getD1Db>, blockId: number) {
  await db.delete(lessonBlockTranslations).where(eq(lessonBlockTranslations.blockId, blockId)).run();
  await db.delete(lessonBlocks).where(eq(lessonBlocks.id, blockId)).run();
}

lessonsRoutes.post('/lessons', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{
    sectionId: number;
    slug: string;
    order: number;
    translations: Partial<Record<Locale, { title: string }>>;
  }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

  const [row] = await db
    .insert(lessons)
    .values({ sectionId: body.sectionId, slug: body.slug, order: body.order })
    .returning();

  await db
    .insert(lessonTranslations)
    .values(locales.map((locale) => ({ lessonId: row.id, locale, title: body.translations[locale]!.title })))
    .run();

  return c.json(row, 201);
});

lessonsRoutes.get('/lessons/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const lesson = await getLessonForAdminEdit(db, id);
  if (!lesson) return c.json({ error: 'Not found' }, 404);
  return c.json(lesson);
});

lessonsRoutes.patch('/lessons/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<
    Partial<{ sectionId: number; slug: string; order: number; translations: Partial<Record<Locale, { title: string }>> }>
  >();

  const { translations, ...structuralFields } = body;
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
  if (Object.keys(structuralFields).length > 0) {
    await db.update(lessons).set(structuralFields).where(eq(lessons.id, id)).run();
  }
  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      await db
        .insert(lessonTranslations)
        .values({ lessonId: id, locale, title: translations[locale]!.title })
        .onConflictDoUpdate({
          target: [lessonTranslations.lessonId, lessonTranslations.locale],
          set: { title: translations[locale]!.title },
        })
        .run();
    }
  }
  return c.json({ ok: true });
});

lessonsRoutes.post('/lessons/:id/blocks', async (c) => {
  const db = getD1Db(c.env.DB);
  const lessonId = Number(c.req.param('id'));
  const body = await c.req.json<LessonBlockInput>();
  const validationError = validateLessonBlockInput(body, { requirePtBr: true });
  if (validationError) return c.json({ error: validationError }, 400);

  const existingBlocks = await db.select({ order: lessonBlocks.order }).from(lessonBlocks).where(eq(lessonBlocks.lessonId, lessonId)).all();
  const nextOrder = existingBlocks.length > 0 ? Math.max(...existingBlocks.map((b) => b.order)) + 1 : 1;

  const [block] = await db
    .insert(lessonBlocks)
    .values({
      lessonId,
      order: nextOrder,
      type: body.type,
      simulatorKey: body.simulatorKey ?? null,
      simulatorParams: body.simulatorParams ?? null,
      codeKind: body.type === 'code_exercise' ? body.codeKind! : null,
      codeLanguage: body.type === 'code_exercise' ? body.codeLanguage! : null,
    })
    .returning();

  await writeLessonBlockTranslations(db, block.id, body.type, body.translations);

  return c.json(block, 201);
});

// Registered before the `:blockId` route below: Hono runs the
// first-registered handler that matches, so with `:blockId` first a PATCH to
// `.../blocks/reorder` would be swallowed by it (`Number('reorder')` is NaN,
// so it would 404) instead of reaching this one.
lessonsRoutes.patch('/lessons/:id/blocks/reorder', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ blockIds: number[] }>();
  for (let i = 0; i < body.blockIds.length; i++) {
    await db.update(lessonBlocks).set({ order: i + 1 }).where(eq(lessonBlocks.id, body.blockIds[i])).run();
  }
  return c.json({ ok: true });
});

lessonsRoutes.patch('/lessons/:id/blocks/:blockId', async (c) => {
  const db = getD1Db(c.env.DB);
  const blockId = Number(c.req.param('blockId'));
  // `type` is intentionally omitted here: block type is structural and
  // immutable once created. It is also explicitly stripped below (rather
  // than relying solely on this annotation) so a caller can't smuggle a
  // `type` field into `structuralFields` at runtime, since `c.req.json<T>()`
  // is only a type assertion and performs no runtime validation.
  const body = await c.req.json<
    Partial<{
      simulatorKey: string;
      simulatorParams: string;
      codeKind: CodeKind | null;
      codeLanguage: Language | null;
      translations: Partial<Record<Locale, LessonBlockTranslationInput>>;
      type?: unknown;
    }>
  >();

  const existing = await db.select().from(lessonBlocks).where(eq(lessonBlocks.id, blockId)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const { translations, type: _ignoredType, codeKind: _bodyCodeKind, codeLanguage: _bodyCodeLanguage, ...otherStructuralFields } = body;
  const structuralFields: Record<string, unknown> = { ...otherStructuralFields };

  // This must run whenever `simulatorParams` is present, independent of
  // `translations` -- otherwise a structural-only PATCH (no `translations`
  // key) skips JSON validation entirely and persists malformed JSON.
  const simulatorParamsError = validateSimulatorParamsJson(body.simulatorParams);
  if (simulatorParamsError) return c.json({ error: simulatorParamsError }, 400);

  const isCodeExercise = existing.type === 'code_exercise';
  const effectiveCodeKind = body.codeKind !== undefined ? body.codeKind : existing.codeKind;
  const effectiveCodeLanguage = body.codeLanguage !== undefined ? body.codeLanguage : existing.codeLanguage;

  if (isCodeExercise) {
    const kindError = validateCodeKindAndLanguage(effectiveCodeKind, effectiveCodeLanguage);
    if (kindError) return c.json({ error: kindError }, 400);
    if (body.codeKind !== undefined) structuralFields.codeKind = body.codeKind;
    if (body.codeLanguage !== undefined) structuralFields.codeLanguage = body.codeLanguage;
  } else if (body.codeKind !== undefined || body.codeLanguage !== undefined) {
    // Only code exercises have a kind and language; any other type clears them.
    structuralFields.codeKind = null;
    structuralFields.codeLanguage = null;
  }

  if (translations) {
    const validationError = validateLessonBlockInput(
      {
        type: existing.type,
        simulatorKey: body.simulatorKey ?? existing.simulatorKey ?? undefined,
        simulatorParams: body.simulatorParams ?? existing.simulatorParams ?? undefined,
        codeKind: effectiveCodeKind,
        codeLanguage: effectiveCodeLanguage,
        translations,
      },
      { requirePtBr: false },
    );
    if (validationError) return c.json({ error: validationError }, 400);
  }

  // Changing the kind or language can invalidate payloads this request does
  // not rewrite, so every other stored locale is re-checked against the new pair.
  const codeTargetChanged =
    isCodeExercise && (effectiveCodeKind !== existing.codeKind || effectiveCodeLanguage !== existing.codeLanguage);
  if (codeTargetChanged) {
    const storedRows = await db
      .select({ locale: lessonBlockTranslations.locale, payloadJson: lessonBlockTranslations.payloadJson })
      .from(lessonBlockTranslations)
      .where(eq(lessonBlockTranslations.blockId, blockId))
      .all();
    for (const row of storedRows) {
      if (translations && row.locale in translations) continue;
      const payloadError = validateTaskPayloadText(
        row.locale as Locale,
        effectiveCodeKind as CodeKind,
        effectiveCodeLanguage as Language,
        row.payloadJson,
      );
      if (payloadError) return c.json({ error: payloadError }, 400);
    }
  }

  if (Object.keys(structuralFields).length > 0) {
    await db.update(lessonBlocks).set(structuralFields).where(eq(lessonBlocks.id, blockId)).run();
  }
  if (translations) {
    await writeLessonBlockTranslations(db, blockId, existing.type, translations);
  }

  return c.json({ ok: true });
});

lessonsRoutes.delete('/lessons/:id/blocks/:blockId', async (c) => {
  const db = getD1Db(c.env.DB);
  const blockId = Number(c.req.param('blockId'));
  await deleteLessonBlock(db, blockId);
  return c.json({ ok: true });
});

// Every discipline/subject/topic/section/lesson has at least one `*_translations` child row
// pointing at it through a foreign key declared with `ON DELETE no action`, so the
// child rows must be deleted before the parent or D1 rejects the delete with a
// foreign-key-constraint error — same delete-children-then-parent shape as
// `deleteOptionsAndPairs` in `questions.ts`.
lessonsRoutes.delete('/disciplines/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(disciplineTranslations).where(eq(disciplineTranslations.disciplineId, id)).run();
  await db.delete(disciplines).where(eq(disciplines.id, id)).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/subjects/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(subjectTranslations).where(eq(subjectTranslations.subjectId, id)).run();
  await db.delete(subjects).where(eq(subjects.id, id)).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/topics/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(topicTranslations).where(eq(topicTranslations.topicId, id)).run();
  await db.delete(topics).where(eq(topics.id, id)).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/sections/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(sectionTranslations).where(eq(sectionTranslations.sectionId, id)).run();
  await db.delete(sections).where(eq(sections.id, id)).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/lessons/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const blocksToDelete = await db.select({ id: lessonBlocks.id }).from(lessonBlocks).where(eq(lessonBlocks.lessonId, id)).all();
  for (const block of blocksToDelete) {
    await deleteLessonBlock(db, block.id);
  }
  await db.delete(lessonTranslations).where(eq(lessonTranslations.lessonId, id)).run();
  await db.delete(lessons).where(eq(lessons.id, id)).run();
  return c.json({ ok: true });
});
