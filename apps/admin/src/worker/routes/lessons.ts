import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import {
  getD1Db,
  getContentTree,
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
  type LessonBlockType,
  LESSON_BLOCK_TYPES,
  type Locale,
} from '@birb-math/content-schema';
import type { Env } from '../env';
import { validateTranslationLocales } from './translationInput';

export const lessonsRoutes = new Hono<{ Bindings: Env }>();

lessonsRoutes.get('/tree', async (c) => {
  const db = getD1Db(c.env.DB);
  const tree = await getContentTree(db, 'pt-BR');
  const allLessons = await db.select({ id: lessons.id, slug: lessons.slug }).from(lessons).all();
  const idBySlug = new Map(allLessons.map((lesson) => [lesson.slug, lesson.id]));

  return c.json(
    tree.map((subject) => ({
      ...subject,
      topics: subject.topics.map((topic) => ({
        ...topic,
        sections: topic.sections.map((section) => ({
          ...section,
          lessons: section.lessons.map((lesson) => ({ ...lesson, id: idBySlug.get(lesson.slug) })),
        })),
      })),
    })),
  );
});

lessonsRoutes.post('/subjects', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

  const [row] = await db.insert(subjects).values({ slug: body.slug, order: body.order }).returning();
  await db
    .insert(subjectTranslations)
    .values(locales.map((locale) => ({ subjectId: row.id, locale, name: body.translations[locale]!.name })))
    .run();
  return c.json(row, 201);
});

lessonsRoutes.patch('/subjects/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<{ slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>>();
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
}

interface LessonBlockInput {
  type: LessonBlockType;
  simulatorKey?: string;
  simulatorParams?: string;
  translations: Partial<Record<Locale, LessonBlockTranslationInput>>;
}

/**
 * Which fields each block `type` requires to be present and non-blank, for
 * every locale being written. Enforced per-locale (not just pt-BR) so a
 * later translation into en-US/es can't silently save empty content.
 */
function validateLessonBlockTranslation(type: LessonBlockType, t: LessonBlockTranslationInput): string | null {
  if (type === 'text' && !t.bodyMdx?.trim()) {
    return 'Blocos de texto precisam de conteúdo.';
  }
  if ((type === 'curiosity' || type === 'real_world_application') && (!t.title?.trim() || !t.bodyMdx?.trim())) {
    return 'Blocos de curiosidade ou aplicação real precisam de título e conteúdo.';
  }
  if (type === 'solved_exercise' && (!t.promptMdx?.trim() || !t.resolutionMdx?.trim())) {
    return 'Blocos de exercício resolvido precisam de enunciado e resolução.';
  }
  return null;
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
  const localeError = validateTranslationLocales(body.translations, { requirePtBr });
  if (localeError) return localeError;
  for (const locale of Object.keys(body.translations) as Locale[]) {
    const fieldError = validateLessonBlockTranslation(body.type, body.translations[locale]!);
    if (fieldError) return fieldError;
  }
  return null;
}

async function writeLessonBlockTranslations(
  db: ReturnType<typeof getD1Db>,
  blockId: number,
  translations: Partial<Record<Locale, LessonBlockTranslationInput>>,
) {
  for (const locale of Object.keys(translations) as Locale[]) {
    const t = translations[locale]!;
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
      })
      .onConflictDoUpdate({
        target: [lessonBlockTranslations.blockId, lessonBlockTranslations.locale],
        set: {
          title: t.title ?? null,
          bodyMdx: t.bodyMdx ?? null,
          promptMdx: t.promptMdx ?? null,
          resolutionMdx: t.resolutionMdx ?? null,
          caption: t.caption ?? null,
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
    })
    .returning();

  await writeLessonBlockTranslations(db, block.id, body.translations);

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
    Partial<{ simulatorKey: string; simulatorParams: string; translations: Partial<Record<Locale, LessonBlockTranslationInput>>; type?: unknown }>
  >();

  const existing = await db.select().from(lessonBlocks).where(eq(lessonBlocks.id, blockId)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const { translations, type: _ignoredType, ...structuralFields } = body;

  // This must run whenever `simulatorParams` is present, independent of
  // `translations` -- otherwise a structural-only PATCH (no `translations`
  // key) skips JSON validation entirely and persists malformed JSON.
  const simulatorParamsError = validateSimulatorParamsJson(body.simulatorParams);
  if (simulatorParamsError) return c.json({ error: simulatorParamsError }, 400);

  if (translations) {
    const validationError = validateLessonBlockInput(
      { type: existing.type, simulatorKey: body.simulatorKey ?? existing.simulatorKey ?? undefined, simulatorParams: body.simulatorParams ?? existing.simulatorParams ?? undefined, translations },
      { requirePtBr: false },
    );
    if (validationError) return c.json({ error: validationError }, 400);
  }

  if (Object.keys(structuralFields).length > 0) {
    await db.update(lessonBlocks).set(structuralFields).where(eq(lessonBlocks.id, blockId)).run();
  }
  if (translations) {
    await writeLessonBlockTranslations(db, blockId, translations);
  }

  return c.json({ ok: true });
});

lessonsRoutes.delete('/lessons/:id/blocks/:blockId', async (c) => {
  const db = getD1Db(c.env.DB);
  const blockId = Number(c.req.param('blockId'));
  await deleteLessonBlock(db, blockId);
  return c.json({ ok: true });
});

// Every subject/topic/section/lesson has at least one `*_translations` child row
// pointing at it through a foreign key declared with `ON DELETE no action`, so the
// child rows must be deleted before the parent or D1 rejects the delete with a
// foreign-key-constraint error — same delete-children-then-parent shape as
// `deleteOptionsAndPairs` in `questions.ts`.
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
