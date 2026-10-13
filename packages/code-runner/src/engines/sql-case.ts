import { formatResultSets } from '../output';
import type { SqlResultSet } from '../protocol';
import type { Emit, EngineCaseInput, EngineCaseOutput } from './types';

/** A fresh database of one case, behind what the two SQL engines have in common. */
export interface SqlDatabase {
  /**
   * Runs every statement of `sql` in order and passes the result set of each
   * statement that returns columns to `onResultSet`. Throws on the first error,
   * after the result sets of the statements before it were reported.
   */
  exec(sql: string, onResultSet: (resultSet: SqlResultSet) => void): Promise<void>;
  close(): Promise<void>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Runs one case in a database of its own: the setup first (its result sets are
 * dropped), then the student's source. Only the message of a database error is
 * returned, never its stack.
 */
export async function runSqlCase(
  input: EngineCaseInput,
  emit: Emit,
  open: () => Promise<SqlDatabase>,
): Promise<EngineCaseOutput> {
  const resultSets: SqlResultSet[] = [];
  const database = await open();
  try {
    if (input.sqlSetup) {
      try {
        await database.exec(input.sqlSetup, () => {});
      } catch (error) {
        return { exitCode: 1, error: `setup: ${errorMessage(error)}`, sql: { resultSets } };
      }
    }
    let failure: string | undefined;
    try {
      await database.exec(input.source, (resultSet) => resultSets.push(resultSet));
    } catch (error) {
      failure = errorMessage(error);
    }
    if (resultSets.length > 0) emit('stdout', `${formatResultSets(resultSets)}\n`);
    return failure === undefined
      ? { exitCode: 0, sql: { resultSets } }
      : { exitCode: 1, error: failure, sql: { resultSets } };
  } finally {
    await database.close().catch(() => {});
  }
}
