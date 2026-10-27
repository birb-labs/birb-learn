// Turns a checked content-pack bundle into an import plan: the exact rows to
// write, with explicit ids, so the local database and the admin D1 can each
// apply the whole plan atomically (one transaction, one batch). Pure (no I/O),
// so the admin Worker can use it. See spec §11.3.
//
// Identity: disciplines, subjects, topics, sections, lessons and tags match by
// slug, questions by key. An existing item is skipped together with its own
// rows (translations, blocks, options...), unless it is a lesson or question
// named in `replace`. Run `checkPack` first: the plan assumes a clean bundle.
import { LOCALES } from '../schema';
import type { LocaleNames, PackBundle, PackLesson, PackQuestion, PackTag } from './pack-schemas';

export type SqlValue = string | number | null;

/** `column IN (SELECT select FROM from WHERE ...)`: reaches rows two levels below a replaced item. */
export interface SubSelect {
  select: string;
  from: string;
  where: Record<string, SqlValue>;
}

export type WhereValue = SqlValue | { in: SubSelect };

/** One statement of a plan. Table and column names are the SQL ones (snake_case). */
export interface PlannedRow {
  op: 'insert' | 'delete' | 'update';
  table: string;
  values?: Record<string, SqlValue>;
  where?: Record<string, WhereValue>;
}

/** Items as `<kind>:<slug or key>`, for example `lesson:counting-in-binary`. */
export interface ImportReport {
  created: string[];
  skipped: string[];
  replaced: string[];
}

export interface ImportPlan {
  statements: PlannedRow[];
  report: ImportReport;
}

/** Tables whose rows are identified by a unique `slug`. */
export const SLUG_TABLES = ['disciplines', 'subjects', 'topics', 'sections', 'lessons', 'tags'] as const;
export type SlugTable = (typeof SLUG_TABLES)[number];

/** Every content table with an integer `id` (all but `question_tags`). */
export const ID_TABLES = [
  'disciplines',
  'discipline_translations',
  'subjects',
  'subject_translations',
  'topics',
  'topic_translations',
  'sections',
  'section_translations',
  'lessons',
  'lesson_translations',
  'lesson_blocks',
  'lesson_block_translations',
  'tags',
  'tag_translations',
  'questions',
  'question_translations',
  'question_options',
  'question_option_translations',
  'question_matching_pairs',
  'question_matching_pair_translations',
  'question_accepted_answers',
] as const;
export type IdTable = (typeof ID_TABLES)[number];

/** What the target database already holds, as far as planning needs it. */
export interface ExistingState {
  /** Per table, slug -> id. */
  slugs: Record<SlugTable, Record<string, number>>;
  /** Question key -> id (questions without a key are not listed). */
  questionKeys: Record<string, number>;
  /** Per table, the largest id in use (0 when empty). New rows get the ids after it. */
  maxIds: Record<IdTable, number>;
}

export function emptyExistingState(): ExistingState {
  return {
    slugs: Object.fromEntries(SLUG_TABLES.map((table) => [table, {}])) as ExistingState['slugs'],
    questionKeys: {},
    maxIds: Object.fromEntries(ID_TABLES.map((table) => [table, 0])) as ExistingState['maxIds'],
  };
}

/** A `replace` entry that names no lesson slug or question key of the bundle. */
export class UnknownReplaceTargetError extends Error {
  constructor(readonly targets: string[]) {
    super(
      `unknown replace target${targets.length === 1 ? '' : 's'} ${targets.map((target) => `"${target}"`).join(', ')}: ` +
        'name the slug of a lesson or the key of a question in the pack',
    );
    this.name = 'UnknownReplaceTargetError';
  }
}

// ---------------------------------------------------------------------------
// Reading the existing state
// ---------------------------------------------------------------------------

/**
 * The read-only queries `existingStateFromRows` expects, in this order. Run
 * them together (one D1 batch, or inside the import transaction) so they see
 * one snapshot.
 */
export function existingStateQueries(): string[] {
  const maxIds = ID_TABLES.map((table) => `(SELECT coalesce(max("id"), 0) FROM ${quote(table)}) AS ${quote(table)}`);
  return [
    ...SLUG_TABLES.map((table) => `SELECT "id", "slug" FROM ${quote(table)}`),
    'SELECT "id", "key" FROM "questions" WHERE "key" IS NOT NULL',
    `SELECT ${maxIds.join(', ')}`,
  ];
}

/** Builds the state from the rows of `existingStateQueries()`, one result list per query. */
export function existingStateFromRows(results: Record<string, unknown>[][]): ExistingState {
  const state = emptyExistingState();
  SLUG_TABLES.forEach((table, index) => {
    for (const row of results[index]) state.slugs[table][String(row.slug)] = Number(row.id);
  });
  for (const row of results[SLUG_TABLES.length]) state.questionKeys[String(row.key)] = Number(row.id);
  const maxRow = results[SLUG_TABLES.length + 1][0];
  for (const table of ID_TABLES) state.maxIds[table] = Number(maxRow[table] ?? 0);
  return state;
}

// ---------------------------------------------------------------------------
// Planning
// ---------------------------------------------------------------------------

function own(record: Record<string, number>, key: string): number | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

class Planner {
  readonly statements: PlannedRow[] = [];
  readonly report: ImportReport = { created: [], skipped: [], replaced: [] };
  private readonly nextIds: Record<IdTable, number>;
  /** Slug (or key) -> id of every bundle item, existing or new. */
  private readonly resolved: Record<SlugTable | 'questions', Map<string, number>> = {
    disciplines: new Map(),
    subjects: new Map(),
    topics: new Map(),
    sections: new Map(),
    lessons: new Map(),
    tags: new Map(),
    questions: new Map(),
  };

  constructor(
    private readonly existing: ExistingState,
    private readonly replace: Set<string>,
  ) {
    this.nextIds = { ...existing.maxIds };
  }

  private nextId(table: IdTable): number {
    this.nextIds[table] += 1;
    return this.nextIds[table];
  }

  private insert(table: IdTable, values: Record<string, SqlValue>): number {
    const id = this.nextId(table);
    this.statements.push({ op: 'insert', table, values: { id, ...values } });
    return id;
  }

  /** The id of a parent item; the bundle defines every parent (checkPack). */
  parentId(table: SlugTable, slug: string): number {
    const id = this.resolved[table].get(slug) ?? own(this.existing.slugs[table], slug);
    if (id === undefined) throw new Error(`${table} "${slug}" is neither in the pack nor in the database`);
    return id;
  }

  /** Disciplines, subjects, topics and sections: create-only. */
  treeItem(
    table: 'disciplines' | 'subjects' | 'topics' | 'sections',
    translationTable: IdTable,
    foreignKey: string,
    item: { slug: string; order: number; names: LocaleNames },
    parent: Record<string, SqlValue>,
  ): void {
    const label = `${table.slice(0, -1)}:${item.slug}`;
    const existingId = own(this.existing.slugs[table], item.slug);
    if (existingId !== undefined) {
      this.resolved[table].set(item.slug, existingId);
      this.report.skipped.push(label);
      return;
    }
    const id = this.insert(table, { ...parent, slug: item.slug, order: item.order });
    this.resolved[table].set(item.slug, id);
    this.names(translationTable, foreignKey, id, item.names);
    this.report.created.push(label);
  }

  private names(table: IdTable, foreignKey: string, id: number, names: LocaleNames): void {
    for (const locale of LOCALES) this.insert(table, { [foreignKey]: id, locale, name: names[locale] });
  }

  /** Tags, parents first so `parent_tag_id` always points at an earlier row. */
  tags(tags: PackTag[]): void {
    const bySlug = new Map(tags.map((tag) => [tag.slug, tag]));
    const visiting = new Set<string>();
    const visit = (tag: PackTag): void => {
      if (this.resolved.tags.has(tag.slug)) return;
      if (visiting.has(tag.slug)) throw new Error(`tag "${tag.slug}": its parents loop back to itself`);
      visiting.add(tag.slug);
      const parent = tag.parentSlug === null ? undefined : bySlug.get(tag.parentSlug);
      if (parent) visit(parent);
      this.tag(tag);
    };
    for (const tag of tags) visit(tag);
  }

  private tag(tag: PackTag): void {
    const label = `tag:${tag.slug}`;
    const existingId = own(this.existing.slugs.tags, tag.slug);
    if (existingId !== undefined) {
      this.resolved.tags.set(tag.slug, existingId);
      this.report.skipped.push(label);
      return;
    }
    const id = this.insert('tags', {
      slug: tag.slug,
      parent_tag_id: tag.parentSlug === null ? null : this.parentId('tags', tag.parentSlug),
      subject_id: this.parentId('subjects', tag.subjectSlug),
    });
    this.resolved.tags.set(tag.slug, id);
    this.names('tag_translations', 'tag_id', id, tag.names);
    this.report.created.push(label);
  }

  lesson(lesson: PackLesson): void {
    const label = `lesson:${lesson.slug}`;
    const sectionId = this.parentId('sections', lesson.sectionSlug);
    let lessonId = own(this.existing.slugs.lessons, lesson.slug);
    if (lessonId !== undefined && !this.replace.has(lesson.slug)) {
      this.resolved.lessons.set(lesson.slug, lessonId);
      this.report.skipped.push(label);
      return;
    }

    if (lessonId !== undefined) {
      // Keep the row (and its id); rewrite everything below it.
      this.statements.push(
        { op: 'update', table: 'lessons', values: { section_id: sectionId, order: lesson.order }, where: { id: lessonId } },
        {
          op: 'delete',
          table: 'lesson_block_translations',
          where: { block_id: { in: { select: 'id', from: 'lesson_blocks', where: { lesson_id: lessonId } } } },
        },
        { op: 'delete', table: 'lesson_blocks', where: { lesson_id: lessonId } },
        { op: 'delete', table: 'lesson_translations', where: { lesson_id: lessonId } },
      );
      this.report.replaced.push(label);
    } else {
      lessonId = this.insert('lessons', { section_id: sectionId, slug: lesson.slug, order: lesson.order });
      this.report.created.push(label);
    }
    this.resolved.lessons.set(lesson.slug, lessonId);

    for (const locale of LOCALES) {
      const translation = lesson.translations[locale];
      if (translation) this.insert('lesson_translations', { lesson_id: lessonId, locale, title: translation.title });
    }
    lesson.blocks.forEach((block, index) => {
      const blockId = this.insert('lesson_blocks', {
        lesson_id: lessonId,
        order: index + 1,
        type: block.type,
        simulator_key: block.simulatorKey,
        simulator_params: block.simulatorParams,
        code_kind: block.codeKind,
        code_language: block.codeLanguage,
      });
      for (const locale of LOCALES) {
        const translation = lesson.translations[locale]?.blocks[index];
        if (!translation) continue;
        this.insert('lesson_block_translations', {
          block_id: blockId,
          locale,
          title: translation.title,
          body_mdx: translation.bodyMdx,
          prompt_mdx: translation.promptMdx,
          resolution_mdx: translation.resolutionMdx,
          caption: translation.caption,
          payload_json: translation.payloadJson,
        });
      }
    });
  }

  question(question: PackQuestion): void {
    const label = `question:${question.key}`;
    let questionId = own(this.existing.questionKeys, question.key);
    if (questionId !== undefined && !this.replace.has(question.key)) {
      this.resolved.questions.set(question.key, questionId);
      this.report.skipped.push(label);
      return;
    }

    const columns = {
      type: question.type,
      difficulty: question.difficulty,
      correct_answer: question.correctAnswer,
      answer_format: question.answerFormat,
      code_kind: question.codeKind,
      code_language: question.codeLanguage,
    };
    if (questionId !== undefined) {
      const byQuestion = { question_id: questionId };
      this.statements.push(
        { op: 'update', table: 'questions', values: columns, where: { id: questionId } },
        { op: 'delete', table: 'question_translations', where: byQuestion },
        {
          op: 'delete',
          table: 'question_option_translations',
          where: { option_id: { in: { select: 'id', from: 'question_options', where: byQuestion } } },
        },
        { op: 'delete', table: 'question_options', where: byQuestion },
        {
          op: 'delete',
          table: 'question_matching_pair_translations',
          where: { pair_id: { in: { select: 'id', from: 'question_matching_pairs', where: byQuestion } } },
        },
        { op: 'delete', table: 'question_matching_pairs', where: byQuestion },
        { op: 'delete', table: 'question_accepted_answers', where: byQuestion },
        { op: 'delete', table: 'question_tags', where: byQuestion },
      );
      this.report.replaced.push(label);
    } else {
      questionId = this.insert('questions', { ...columns, key: question.key });
      this.report.created.push(label);
    }
    this.resolved.questions.set(question.key, questionId);
    this.questionRows(questionId, question);
  }

  private questionRows(questionId: number, question: PackQuestion): void {
    const present = LOCALES.flatMap((locale) => {
      const translation = question.translations[locale];
      return translation ? [{ locale, translation }] : [];
    });

    for (const { locale, translation } of present) {
      this.insert('question_translations', {
        question_id: questionId,
        locale,
        prompt_mdx: translation.promptMdx,
        resolution_mdx: translation.resolutionMdx,
        code_json: translation.codeJson,
      });
    }
    question.options.forEach((option, index) => {
      const optionId = this.insert('question_options', {
        question_id: questionId,
        is_correct: option.isCorrect ? 1 : 0,
        order: index + 1,
      });
      for (const { locale, translation } of present) {
        this.insert('question_option_translations', { option_id: optionId, locale, text_mdx: translation.options[index].textMdx });
      }
    });
    for (let index = 0; index < question.matchingPairCount; index += 1) {
      const pairId = this.insert('question_matching_pairs', { question_id: questionId, order: index + 1 });
      for (const { locale, translation } of present) {
        const pair = translation.matchingPairs[index];
        this.insert('question_matching_pair_translations', {
          pair_id: pairId,
          locale,
          left_mdx: pair.leftMdx,
          right_mdx: pair.rightMdx,
        });
      }
    }
    // Shared answers (math) have no locale; text answers belong to their locale.
    for (const text of question.acceptedAnswersShared) {
      this.insert('question_accepted_answers', { question_id: questionId, text, locale: null });
    }
    for (const { locale, translation } of present) {
      for (const text of translation.acceptedAnswers) {
        this.insert('question_accepted_answers', { question_id: questionId, text, locale });
      }
    }
    for (const slug of new Set(question.tagSlugs)) {
      this.statements.push({
        op: 'insert',
        table: 'question_tags',
        values: { question_id: questionId, tag_id: this.parentId('tags', slug) },
      });
    }
  }
}

/**
 * Plans the import of `bundle` into a database holding `existing`. Creates
 * what is missing, skips what exists and rewrites the lessons and questions
 * named in `opts.replace` (slugs or keys). Throws `UnknownReplaceTargetError`
 * when a `replace` entry names nothing in the bundle.
 */
export function planImport(bundle: PackBundle, existing: ExistingState, opts: { replace: string[] }): ImportPlan {
  const known = new Set([...bundle.lessons.map((lesson) => lesson.slug), ...bundle.questions.map((question) => question.key)]);
  const unknown = [...new Set(opts.replace.filter((target) => !known.has(target)))];
  if (unknown.length > 0) throw new UnknownReplaceTargetError(unknown);

  // One namespace for lesson slugs and question keys: a name that matches both replaces both.
  const planner = new Planner(existing, new Set(opts.replace));
  for (const discipline of bundle.disciplines) {
    planner.treeItem('disciplines', 'discipline_translations', 'discipline_id', discipline, {});
  }
  for (const subject of bundle.subjects) {
    planner.treeItem('subjects', 'subject_translations', 'subject_id', subject, {
      discipline_id: planner.parentId('disciplines', subject.disciplineSlug),
    });
  }
  for (const topic of bundle.topics) {
    planner.treeItem('topics', 'topic_translations', 'topic_id', topic, {
      subject_id: planner.parentId('subjects', topic.subjectSlug),
    });
  }
  for (const section of bundle.sections) {
    planner.treeItem('sections', 'section_translations', 'section_id', section, {
      topic_id: planner.parentId('topics', section.topicSlug),
    });
  }
  planner.tags(bundle.tags);
  for (const lesson of bundle.lessons) planner.lesson(lesson);
  for (const question of bundle.questions) planner.question(question);
  return { statements: planner.statements, report: planner.report };
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

const IDENTIFIER = /^[a-z_]+$/;

function quote(identifier: string): string {
  if (!IDENTIFIER.test(identifier)) throw new Error(`unsafe SQL identifier: ${JSON.stringify(identifier)}`);
  return `"${identifier}"`;
}

function whereSql(where: Record<string, WhereValue> | undefined, params: SqlValue[]): string {
  const entries = Object.entries(where ?? {});
  if (entries.length === 0) throw new Error('a delete or update needs a where clause');
  return entries
    .map(([column, value]) => {
      if (value === null) return `${quote(column)} IS NULL`;
      if (typeof value === 'object') {
        const inner = whereSql(value.in.where, params);
        return `${quote(column)} IN (SELECT ${quote(value.in.select)} FROM ${quote(value.in.from)} WHERE ${inner})`;
      }
      params.push(value);
      return `${quote(column)} = ?`;
    })
    .join(' AND ');
}

/** The parameterized SQL of one planned row. */
export function plannedRowSql(row: PlannedRow): { sql: string; params: SqlValue[] } {
  const table = quote(row.table);
  const params: SqlValue[] = [];
  const values = Object.entries(row.values ?? {});

  if (row.op === 'insert') {
    if (values.length === 0) throw new Error('an insert needs values');
    params.push(...values.map(([, value]) => value));
    const columns = values.map(([column]) => quote(column)).join(', ');
    return { sql: `INSERT INTO ${table} (${columns}) VALUES (${values.map(() => '?').join(', ')})`, params };
  }
  if (row.op === 'update') {
    if (values.length === 0) throw new Error('an update needs values');
    params.push(...values.map(([, value]) => value));
    const set = values.map(([column]) => `${quote(column)} = ?`).join(', ');
    return { sql: `UPDATE ${table} SET ${set} WHERE ${whereSql(row.where, params)}`, params };
  }
  return { sql: `DELETE FROM ${table} WHERE ${whereSql(row.where, params)}`, params };
}
