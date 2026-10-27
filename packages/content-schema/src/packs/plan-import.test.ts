import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { checkPack } from './check-pack';
import { loadPacks } from './load-pack';
import { ImportRequestSchema, type PackBundle } from './pack-schemas';
import {
  ID_TABLES,
  SLUG_TABLES,
  UnknownReplaceTargetError,
  emptyExistingState,
  planImport,
  plannedRowSql,
  type ExistingState,
  type ImportPlan,
  type PlannedRow,
} from './plan-import';

const VALID = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../test-fixtures/packs/valid');

const LESSON = 'counting-in-binary';
const QUESTION = 'binary-matching';

// Every column that points at another table, so a test can check that the
// referenced row exists (or was inserted earlier in the plan).
const FOREIGN_KEYS: Record<string, Record<string, string>> = {
  discipline_translations: { discipline_id: 'disciplines' },
  subjects: { discipline_id: 'disciplines' },
  subject_translations: { subject_id: 'subjects' },
  topics: { subject_id: 'subjects' },
  topic_translations: { topic_id: 'topics' },
  sections: { topic_id: 'topics' },
  section_translations: { section_id: 'sections' },
  lessons: { section_id: 'sections' },
  lesson_translations: { lesson_id: 'lessons' },
  lesson_blocks: { lesson_id: 'lessons' },
  lesson_block_translations: { block_id: 'lesson_blocks' },
  tags: { subject_id: 'subjects', parent_tag_id: 'tags' },
  tag_translations: { tag_id: 'tags' },
  question_translations: { question_id: 'questions' },
  question_options: { question_id: 'questions' },
  question_option_translations: { option_id: 'question_options' },
  question_matching_pairs: { question_id: 'questions' },
  question_matching_pair_translations: { pair_id: 'question_matching_pairs' },
  question_accepted_answers: { question_id: 'questions' },
  question_tags: { question_id: 'questions', tag_id: 'tags' },
};

function inserts(plan: ImportPlan, table: string): PlannedRow[] {
  return plan.statements.filter((row) => row.op === 'insert' && row.table === table);
}

/** The state a database would be in after applying `plan` on an empty one. */
function stateAfter(plan: ImportPlan): ExistingState {
  const state = emptyExistingState();
  for (const row of plan.statements) {
    if (row.op !== 'insert' || !row.values) continue;
    const id = row.values.id;
    if (typeof id !== 'number') continue;
    if ((SLUG_TABLES as readonly string[]).includes(row.table)) {
      state.slugs[row.table as (typeof SLUG_TABLES)[number]][row.values.slug as string] = id;
    }
    if (row.table === 'questions') state.questionKeys[row.values.key as string] = id;
    const table = row.table as (typeof ID_TABLES)[number];
    state.maxIds[table] = Math.max(state.maxIds[table], id);
  }
  return state;
}

describe('planImport on the valid fixture', () => {
  let bundle: PackBundle;
  let fresh: ImportPlan;

  beforeAll(async () => {
    const loaded = await loadPacks(VALID);
    expect(loaded.problems).toEqual([]);
    expect(checkPack(loaded.bundle)).toEqual([]);
    bundle = loaded.bundle;
    fresh = planImport(bundle, emptyExistingState(), { replace: [] });
  });

  describe('with an empty database', () => {
    it('creates every item and skips nothing', () => {
      expect(fresh.report.skipped).toEqual([]);
      expect(fresh.report.replaced).toEqual([]);
      expect(fresh.report.created).toEqual([
        'discipline:computer-science',
        'subject:programming',
        'topic:programming-basics',
        'section:first-steps',
        'tag:binary',
        'tag:binary-conversion',
        `lesson:${LESSON}`,
        ...bundle.questions.map((question) => `question:${question.key}`),
      ]);
    });

    it('only inserts, with contiguous explicit ids from 1 in every table', () => {
      expect(fresh.statements.every((row) => row.op === 'insert')).toBe(true);
      for (const table of ID_TABLES) {
        const ids = inserts(fresh, table).map((row) => row.values?.id);
        expect(ids, table).toEqual(ids.map((_, index) => index + 1));
      }
      expect(inserts(fresh, 'lesson_blocks')).toHaveLength(7);
      expect(inserts(fresh, 'lesson_block_translations')).toHaveLength(14);
      expect(inserts(fresh, 'questions')).toHaveLength(bundle.questions.length);
    });

    it('inserts every row after the rows it references', () => {
      const inserted = new Map<string, Set<number>>();
      for (const row of fresh.statements) {
        for (const [column, target] of Object.entries(FOREIGN_KEYS[row.table] ?? {})) {
          const value = row.values?.[column];
          if (value === null || value === undefined) continue;
          expect(inserted.get(target)?.has(value as number), `${row.table}.${column} = ${String(value)}`).toBe(true);
        }
        const id = row.values?.id;
        if (typeof id === 'number') inserted.set(row.table, (inserted.get(row.table) ?? new Set()).add(id));
      }
    });

    it('links a child tag to its parent and stores options and accepted answers like the admin', () => {
      const [binary, conversion] = inserts(fresh, 'tags');
      expect(binary.values).toMatchObject({ slug: 'binary', parent_tag_id: null, subject_id: 1 });
      expect(conversion.values).toMatchObject({ slug: 'binary-conversion', parent_tag_id: binary.values?.id });

      const choice = inserts(fresh, 'questions').find((row) => row.values?.key === 'binary-multiple-choice')!;
      const options = inserts(fresh, 'question_options').filter((row) => row.values?.question_id === choice.values?.id);
      expect(options.map((row) => row.values?.order)).toEqual(options.map((_, index) => index + 1));
      expect(options.every((row) => row.values?.is_correct === 0 || row.values?.is_correct === 1)).toBe(true);

      const math = inserts(fresh, 'questions').find((row) => row.values?.key === 'binary-short-math')!;
      const answers = inserts(fresh, 'question_accepted_answers').filter((row) => row.values?.question_id === math.values?.id);
      expect(answers.map((row) => row.values)).toEqual([expect.objectContaining({ text: '2^3', locale: null })]);
    });
  });

  it('plans nothing and skips every item when everything already exists', () => {
    const plan = planImport(bundle, stateAfter(fresh), { replace: [] });
    expect(plan.statements).toEqual([]);
    expect(plan.report.created).toEqual([]);
    expect(plan.report.replaced).toEqual([]);
    expect(plan.report.skipped).toEqual(fresh.report.created);
  });

  it('links a new lesson to the existing section id', () => {
    const existing = stateAfter(fresh);
    existing.slugs.sections['first-steps'] = 40;
    delete existing.slugs.lessons[LESSON];

    const plan = planImport(bundle, existing, { replace: [] });
    expect(plan.report.created).toEqual([`lesson:${LESSON}`]);
    expect(inserts(plan, 'sections')).toEqual([]);
    const [lesson] = inserts(plan, 'lessons');
    expect(lesson.values).toMatchObject({ slug: LESSON, section_id: 40, id: existing.maxIds.lessons + 1 });
    expect(inserts(plan, 'lesson_blocks').every((row) => row.values?.lesson_id === lesson.values?.id)).toBe(true);
  });

  it('links a new subject to the existing discipline id', () => {
    const existing = emptyExistingState();
    existing.slugs.disciplines['computer-science'] = 7;
    existing.maxIds.disciplines = 9;

    const plan = planImport(bundle, existing, { replace: [] });
    expect(plan.report.skipped).toEqual(['discipline:computer-science']);
    expect(inserts(plan, 'disciplines')).toEqual([]);
    expect(inserts(plan, 'discipline_translations')).toEqual([]);
    expect(inserts(plan, 'subjects')[0].values).toMatchObject({ discipline_id: 7 });
  });

  describe('replace', () => {
    it('keeps the lesson row, deletes its blocks and translations, then inserts them again', () => {
      const existing = stateAfter(fresh);
      const lessonId = existing.slugs.lessons[LESSON];
      const plan = planImport(bundle, existing, { replace: [LESSON] });

      expect(plan.report.replaced).toEqual([`lesson:${LESSON}`]);
      expect(plan.report.created).toEqual([]);
      expect(plan.statements.slice(0, 4)).toEqual([
        { op: 'update', table: 'lessons', values: { section_id: 1, order: 1 }, where: { id: lessonId } },
        {
          op: 'delete',
          table: 'lesson_block_translations',
          where: { block_id: { in: { select: 'id', from: 'lesson_blocks', where: { lesson_id: lessonId } } } },
        },
        { op: 'delete', table: 'lesson_blocks', where: { lesson_id: lessonId } },
        { op: 'delete', table: 'lesson_translations', where: { lesson_id: lessonId } },
      ]);
      const rest = plan.statements.slice(4);
      expect(rest.every((row) => row.op === 'insert')).toBe(true);
      expect(inserts(plan, 'lessons')).toEqual([]);
      expect(inserts(plan, 'lesson_translations').map((row) => row.values?.lesson_id)).toEqual([lessonId, lessonId]);
      // New ids above the old ones; the old rows were deleted.
      expect(inserts(plan, 'lesson_blocks').map((row) => row.values?.id)).toEqual([8, 9, 10, 11, 12, 13, 14]);
      expect(inserts(plan, 'lesson_block_translations')).toHaveLength(14);
    });

    it('keeps the question row, updates it and replaces every child table', () => {
      const existing = stateAfter(fresh);
      const questionId = existing.questionKeys[QUESTION];
      const plan = planImport(bundle, existing, { replace: [QUESTION] });

      expect(plan.report.replaced).toEqual([`question:${QUESTION}`]);
      const deletes = plan.statements.filter((row) => row.op === 'delete');
      expect(deletes.map((row) => row.table).sort()).toEqual(
        [
          'question_accepted_answers',
          'question_matching_pair_translations',
          'question_matching_pairs',
          'question_option_translations',
          'question_options',
          'question_tags',
          'question_translations',
        ].sort(),
      );
      expect(plan.statements[0]).toEqual({
        op: 'update',
        table: 'questions',
        values: {
          type: 'matching',
          difficulty: 'hard',
          correct_answer: null,
          answer_format: 'text',
          code_kind: null,
          code_language: null,
        },
        where: { id: questionId },
      });
      const firstInsert = plan.statements.findIndex((row) => row.op === 'insert');
      expect(plan.statements.slice(firstInsert).every((row) => row.op === 'insert')).toBe(true);
      expect(firstInsert).toBe(1 + deletes.length);
      expect(inserts(plan, 'questions')).toEqual([]);
      expect(inserts(plan, 'question_matching_pairs')).toHaveLength(2);
      expect(inserts(plan, 'question_tags')).toEqual([
        { op: 'insert', table: 'question_tags', values: { question_id: questionId, tag_id: existing.slugs.tags['binary-conversion'] } },
      ]);
    });

    it('creates a replace target that does not exist yet', () => {
      const plan = planImport(bundle, emptyExistingState(), { replace: [LESSON] });
      expect(plan.report.created).toContain(`lesson:${LESSON}`);
      expect(plan.report.replaced).toEqual([]);
    });

    it('throws on a replace target that names no lesson or question of the bundle', () => {
      expect(() => planImport(bundle, emptyExistingState(), { replace: [LESSON, 'no-such-thing', 'programming'] })).toThrow(
        UnknownReplaceTargetError,
      );
      try {
        planImport(bundle, emptyExistingState(), { replace: ['no-such-thing'] });
      } catch (error) {
        expect((error as UnknownReplaceTargetError).targets).toEqual(['no-such-thing']);
      }
    });
  });

  it('looks up slugs as own keys only (a slug named "constructor" is new)', () => {
    const custom = structuredClone(bundle);
    custom.disciplines[0].slug = 'constructor';
    for (const subject of custom.subjects) subject.disciplineSlug = 'constructor';
    const plan = planImport(custom, emptyExistingState(), { replace: [] });
    expect(plan.report.created[0]).toBe('discipline:constructor');
  });
});

describe('plannedRowSql', () => {
  it('quotes identifiers and binds every value', () => {
    expect(plannedRowSql({ op: 'insert', table: 'lessons', values: { id: 3, section_id: 1, slug: 'a', order: 2 } })).toEqual({
      sql: 'INSERT INTO "lessons" ("id", "section_id", "slug", "order") VALUES (?, ?, ?, ?)',
      params: [3, 1, 'a', 2],
    });
    expect(plannedRowSql({ op: 'update', table: 'lessons', values: { order: 2 }, where: { id: 3 } })).toEqual({
      sql: 'UPDATE "lessons" SET "order" = ? WHERE "id" = ?',
      params: [2, 3],
    });
  });

  it('turns a sub-select into IN (SELECT ...)', () => {
    expect(
      plannedRowSql({
        op: 'delete',
        table: 'lesson_block_translations',
        where: { block_id: { in: { select: 'id', from: 'lesson_blocks', where: { lesson_id: 4 } } } },
      }),
    ).toEqual({
      sql: 'DELETE FROM "lesson_block_translations" WHERE "block_id" IN (SELECT "id" FROM "lesson_blocks" WHERE "lesson_id" = ?)',
      params: [4],
    });
  });

  it('refuses a delete or update without a where clause, and an unsafe identifier', () => {
    expect(() => plannedRowSql({ op: 'delete', table: 'lessons' })).toThrow();
    expect(() => plannedRowSql({ op: 'update', table: 'lessons', values: { order: 1 }, where: {} })).toThrow();
    expect(() => plannedRowSql({ op: 'insert', table: 'lessons"; DROP TABLE x; --', values: { id: 1 } })).toThrow();
  });
});

describe('ImportRequestSchema', () => {
  it('accepts a loaded bundle sent as JSON and returns it unchanged', async () => {
    const { bundle } = await loadPacks(VALID);
    const sent = JSON.parse(JSON.stringify({ bundle, replace: ['x'] })) as unknown;
    const parsed = ImportRequestSchema.safeParse(sent);
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual(sent);
  });

  it('rejects a bundle with a missing table or a bad slug', async () => {
    const { bundle } = await loadPacks(VALID);
    expect(ImportRequestSchema.safeParse({ bundle: { ...bundle, lessons: undefined }, replace: [] }).success).toBe(false);
    const badSlug = structuredClone(bundle);
    badSlug.questions[0].key = 'Not A Key';
    expect(ImportRequestSchema.safeParse({ bundle: badSlug, replace: [] }).success).toBe(false);
  });
});
