import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  applyImportSqlite,
  importBundleSqlite,
  importIntoSqliteFile,
  readExistingStateSqlite,
} from './apply-import-sqlite';
import { loadPacks } from './load-pack';
import type { PackBundle } from './pack-schemas';
import { ID_TABLES, UnknownReplaceTargetError, planImport } from './plan-import';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VALID = path.resolve(HERE, '../../test-fixtures/packs/valid');
const MIGRATIONS = path.resolve(HERE, '../../drizzle');

const ALL_TABLES = [...ID_TABLES, 'question_tags'];

function openMigrated(file = ':memory:'): Database.Database {
  const sqlite = new Database(file);
  sqlite.pragma('foreign_keys = ON');
  migrate(drizzle(sqlite), { migrationsFolder: MIGRATIONS });
  return sqlite;
}

function counts(db: Database.Database): Record<string, number> {
  return Object.fromEntries(
    ALL_TABLES.map((table) => [table, (db.prepare(`SELECT count(*) AS n FROM "${table}"`).get() as { n: number }).n]),
  );
}

function dump(db: Database.Database): Record<string, unknown[]> {
  return Object.fromEntries(ALL_TABLES.map((table) => [table, db.prepare(`SELECT * FROM "${table}"`).all()]));
}

let bundle: PackBundle;

beforeAll(async () => {
  const loaded = await loadPacks(VALID);
  expect(loaded.problems).toEqual([]);
  bundle = loaded.bundle;
});

describe('importing into SQLite', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openMigrated();
  });

  afterEach(() => {
    db.close();
  });

  it('writes every row, with foreign keys enforced', () => {
    const report = importBundleSqlite(db, bundle, { replace: [] });
    expect(report.skipped).toEqual([]);
    expect(report.created).toHaveLength(7 + bundle.questions.length);
    expect(db.pragma('foreign_key_check')).toEqual([]);

    const after = counts(db);
    expect(after.lessons).toBe(1);
    expect(after.lesson_blocks).toBe(7);
    expect(after.lesson_block_translations).toBe(14);
    expect(after.questions).toBe(bundle.questions.length);
    expect(after.question_matching_pair_translations).toBe(2);

    const lesson = db.prepare('SELECT * FROM lessons').get() as { slug: string; section_id: number };
    const section = db.prepare('SELECT id FROM sections WHERE slug = ?').get('first-steps') as { id: number };
    expect(lesson).toMatchObject({ slug: 'counting-in-binary', section_id: section.id });
  });

  it('changes nothing when the same bundle is imported twice (Review Focus 1)', () => {
    importBundleSqlite(db, bundle, { replace: [] });
    const before = dump(db);

    const report = importBundleSqlite(db, bundle, { replace: [] });
    expect(report.created).toEqual([]);
    expect(report.replaced).toEqual([]);
    expect(report.skipped).toHaveLength(7 + bundle.questions.length);
    expect(dump(db)).toEqual(before);
  });

  it('writes nothing when a statement fails halfway (Review Focus 2)', () => {
    const plan = planImport(bundle, readExistingStateSqlite(db), { replace: [] });
    // The first question again, with the same key: the unique index rejects it
    // after every other row of the plan was already written.
    const firstQuestion = plan.statements.find((row) => row.table === 'questions')!;
    plan.statements.push({ ...firstQuestion, values: { ...firstQuestion.values, id: 999 } });

    expect(() => applyImportSqlite(db, plan)).toThrow(/UNIQUE constraint failed: questions\.key/);
    expect(Object.values(counts(db)).every((count) => count === 0)).toBe(true);
  });

  it('writes nothing when a row references a missing parent', () => {
    const plan = planImport(bundle, readExistingStateSqlite(db), { replace: [] });
    plan.statements.push({ op: 'insert', table: 'lesson_translations', values: { id: 99, lesson_id: 4242, locale: 'es', title: 'x' } });

    expect(() => applyImportSqlite(db, plan)).toThrow(/FOREIGN KEY/);
    expect(Object.values(counts(db)).every((count) => count === 0)).toBe(true);
  });

  it('replaces a lesson: same lesson id, new blocks, the same row counts', () => {
    importBundleSqlite(db, bundle, { replace: [] });
    const before = counts(db);
    const lessonId = (db.prepare('SELECT id FROM lessons').get() as { id: number }).id;

    const edited = structuredClone(bundle);
    edited.lessons[0].translations['pt-BR']!.title = 'Título novo';
    const report = importBundleSqlite(db, edited, { replace: ['counting-in-binary'] });

    expect(report.replaced).toEqual(['lesson:counting-in-binary']);
    expect(counts(db)).toEqual(before);
    expect(db.prepare('SELECT id FROM lessons').all()).toEqual([{ id: lessonId }]);
    expect(db.prepare("SELECT title FROM lesson_translations WHERE locale = 'pt-BR'").get()).toEqual({ title: 'Título novo' });
    expect((db.prepare('SELECT min(id) AS id FROM lesson_blocks').get() as { id: number }).id).toBe(8);
    expect(db.pragma('foreign_key_check')).toEqual([]);
  });

  it('replaces a question: every child table is rewritten, nothing is left over', () => {
    importBundleSqlite(db, bundle, { replace: [] });
    const before = counts(db);
    const keys = bundle.questions.map((question) => question.key);

    const report = importBundleSqlite(db, bundle, { replace: keys });
    expect(report.replaced).toEqual(keys.map((key) => `question:${key}`));
    expect(counts(db)).toEqual(before);
    expect(db.pragma('foreign_key_check')).toEqual([]);
  });

  it('rejects an unknown replace target before writing anything', () => {
    expect(() => importBundleSqlite(db, bundle, { replace: ['nope'] })).toThrow(UnknownReplaceTargetError);
    expect(Object.values(counts(db)).every((count) => count === 0)).toBe(true);
  });
});

describe('importIntoSqliteFile', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'birb-import-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('opens the file, imports and closes it', () => {
    const file = path.join(dir, 'content.db');
    openMigrated(file).close();

    expect(importIntoSqliteFile(file, bundle, { replace: [] }).created).toHaveLength(7 + bundle.questions.length);
    expect(importIntoSqliteFile(file, bundle, { replace: [] }).created).toEqual([]);
  });

  it('refuses a database file that does not exist instead of creating an empty one', () => {
    expect(() => importIntoSqliteFile(path.join(dir, 'missing.db'), bundle, { replace: [] })).toThrow();
  });
});
