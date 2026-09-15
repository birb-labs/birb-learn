import {
  type AnySQLiteColumn,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core';

export const LOCALES = ['pt-BR', 'en-US', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Runtime guard for `Locale` — the Drizzle `text(..., { enum: LOCALES })`
 * option is TypeScript-only and is not enforced by a database constraint,
 * so a bogus locale key (e.g. `"en"` instead of `"en-US"`) coming from an
 * untyped request body would otherwise silently write to the `locale`
 * column and be invisible to every reader (`resolveTranslation` only ever
 * looks up `'pt-BR'` or the requested `Locale`). Use this to validate keys
 * of an incoming translation map before writing them.
 */
export function isValidLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const subjects = sqliteTable('subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  order: integer('order').notNull(),
});

export const subjectTranslations = sqliteTable(
  'subject_translations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectId: integer('subject_id')
      .notNull()
      .references(() => subjects.id),
    locale: text('locale', { enum: LOCALES }).notNull(),
    name: text('name').notNull(),
  },
  (table) => [unique().on(table.subjectId, table.locale)],
);

export const topics = sqliteTable('topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subjectId: integer('subject_id')
    .notNull()
    .references(() => subjects.id),
  slug: text('slug').notNull().unique(),
  order: integer('order').notNull(),
});

export const topicTranslations = sqliteTable(
  'topic_translations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    topicId: integer('topic_id')
      .notNull()
      .references(() => topics.id),
    locale: text('locale', { enum: LOCALES }).notNull(),
    name: text('name').notNull(),
  },
  (table) => [unique().on(table.topicId, table.locale)],
);

export const sections = sqliteTable('sections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topicId: integer('topic_id')
    .notNull()
    .references(() => topics.id),
  slug: text('slug').notNull().unique(),
  order: integer('order').notNull(),
});

export const sectionTranslations = sqliteTable(
  'section_translations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sectionId: integer('section_id')
      .notNull()
      .references(() => sections.id),
    locale: text('locale', { enum: LOCALES }).notNull(),
    name: text('name').notNull(),
  },
  (table) => [unique().on(table.sectionId, table.locale)],
);

export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sectionId: integer('section_id')
    .notNull()
    .references(() => sections.id),
  slug: text('slug').notNull().unique(),
  order: integer('order').notNull(),
});

export const lessonTranslations = sqliteTable(
  'lesson_translations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id),
    locale: text('locale', { enum: LOCALES }).notNull(),
    title: text('title').notNull(),
  },
  (table) => [unique().on(table.lessonId, table.locale)],
);

export const LESSON_BLOCK_TYPES = [
  'text',
  'curiosity',
  'real_world_application',
  'solved_exercise',
  'simulator',
] as const;
export type LessonBlockType = (typeof LESSON_BLOCK_TYPES)[number];

export const lessonBlocks = sqliteTable('lesson_blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id),
  order: integer('order').notNull(),
  type: text('type', { enum: LESSON_BLOCK_TYPES }).notNull(),
  // Only set (and only meaningful) when type === 'simulator': which
  // registered component to render, and its freeform JSON configuration.
  // Both are structural (shared across locales) -- see the design doc's
  // "Data model" section.
  simulatorKey: text('simulator_key'),
  simulatorParams: text('simulator_params'),
});

export const lessonBlockTranslations = sqliteTable(
  'lesson_block_translations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    blockId: integer('block_id')
      .notNull()
      .references(() => lessonBlocks.id),
    locale: text('locale', { enum: LOCALES }).notNull(),
    // Nullable because each block `type` only uses a subset -- see
    // `validateLessonBlockTranslation` in apps/admin/src/worker/routes/lessons.ts
    // for which columns each type requires to be non-null/non-blank.
    title: text('title'),
    bodyMdx: text('body_mdx'),
    promptMdx: text('prompt_mdx'),
    resolutionMdx: text('resolution_mdx'),
    caption: text('caption'),
  },
  (table) => [unique().on(table.blockId, table.locale)],
);

export const questions = sqliteTable('questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', {
    enum: [
      'multiple_choice',
      'multiple_response',
      'numeric',
      'true_false',
      'short_text',
      'ordering',
      'matching',
    ],
  }).notNull(),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }).notNull(),
  correctAnswer: text('correct_answer'),
  answerFormat: text('answer_format', { enum: ['text', 'math'] }).notNull().default('text'),
});

export const questionTranslations = sqliteTable(
  'question_translations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id),
    locale: text('locale', { enum: LOCALES }).notNull(),
    promptMdx: text('prompt_mdx').notNull(),
    resolutionMdx: text('resolution_mdx').notNull(),
  },
  (table) => [unique().on(table.questionId, table.locale)],
);

export const questionOptions = sqliteTable('question_options', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  order: integer('order').notNull(),
});

export const questionOptionTranslations = sqliteTable(
  'question_option_translations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    optionId: integer('option_id')
      .notNull()
      .references(() => questionOptions.id),
    locale: text('locale', { enum: LOCALES }).notNull(),
    textMdx: text('text_mdx').notNull(),
  },
  (table) => [unique().on(table.optionId, table.locale)],
);

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  parentTagId: integer('parent_tag_id').references((): AnySQLiteColumn => tags.id),
  // `.notNull()` here is enforced at the app layer (see the tag write
  // routes in apps/admin/src/worker/routes/questions.ts), not by SQLite:
  // the migration backfilling this column onto pre-existing rows can't
  // add a NOT NULL constraint without a full table rebuild, the same
  // tradeoff already made for `isValidLocale` above.
  subjectId: integer('subject_id')
    .notNull()
    .references(() => subjects.id),
});

export const tagTranslations = sqliteTable(
  'tag_translations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id),
    locale: text('locale', { enum: LOCALES }).notNull(),
    name: text('name').notNull(),
  },
  (table) => [unique().on(table.tagId, table.locale)],
);

export const questionTags = sqliteTable(
  'question_tags',
  {
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (table) => [primaryKey({ columns: [table.questionId, table.tagId] })],
);

export const questionAcceptedAnswers = sqliteTable('question_accepted_answers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id),
  text: text('text').notNull(),
  locale: text('locale', { enum: LOCALES }),
});

export const questionMatchingPairs = sqliteTable('question_matching_pairs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id),
  order: integer('order').notNull(),
});

export const questionMatchingPairTranslations = sqliteTable(
  'question_matching_pair_translations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    pairId: integer('pair_id')
      .notNull()
      .references(() => questionMatchingPairs.id),
    locale: text('locale', { enum: LOCALES }).notNull(),
    leftMdx: text('left_mdx').notNull(),
    rightMdx: text('right_mdx').notNull(),
  },
  (table) => [unique().on(table.pairId, table.locale)],
);
