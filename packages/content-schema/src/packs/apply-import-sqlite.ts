// Applies an import plan to a local SQLite database (content.db) with
// better-sqlite3, in one transaction. Node-only; import it by deep path, like
// src/client.ts.
import Database from 'better-sqlite3';
import type { PackBundle } from './pack-schemas';
import {
  existingStateFromRows,
  existingStateQueries,
  planImport,
  plannedRowSql,
  type ExistingState,
  type ImportPlan,
  type ImportReport,
} from './plan-import';

export function readExistingStateSqlite(db: Database.Database): ExistingState {
  return existingStateFromRows(
    existingStateQueries().map((sql) => db.prepare(sql).all() as Record<string, unknown>[]),
  );
}

/** Runs every statement of `plan` in one transaction: all of them are written, or none. */
export function applyImportSqlite(db: Database.Database, plan: ImportPlan): void {
  db.transaction(() => {
    for (const row of plan.statements) {
      const { sql, params } = plannedRowSql(row);
      db.prepare(sql).run(...params);
    }
  })();
}

/**
 * Reads the existing state, plans and applies, all inside one write
 * transaction, so nothing can change between the read and the write.
 */
export function importBundleSqlite(db: Database.Database, bundle: PackBundle, opts: { replace: string[] }): ImportReport {
  return db
    .transaction(() => {
      const plan = planImport(bundle, readExistingStateSqlite(db), opts);
      applyImportSqlite(db, plan);
      return plan.report;
    })
    .immediate();
}

/**
 * Imports into the database file at `dbPath`, which must already exist and be
 * migrated (`db:reset`); it is never created here.
 */
export function importIntoSqliteFile(dbPath: string, bundle: PackBundle, opts: { replace: string[] }): ImportReport {
  const db = new Database(dbPath, { fileMustExist: true });
  try {
    db.pragma('foreign_keys = ON');
    return importBundleSqlite(db, bundle, opts);
  } finally {
    db.close();
  }
}
