import { formatResultSets } from '../output';
import { OUTPUT_LIMIT_BYTES, type SqlResultSet } from '../protocol';
import type { Emit, EngineCaseInput, EngineCaseOutput } from './types';

/**
 * Where a database reports the rows of the statements it runs, as they come.
 * A statement's result set counts once `endSet` is called: one that fails
 * midway is dropped.
 */
export interface SqlOutput {
  /** Starts the result set of a statement that returns columns. */
  startSet(columns: string[]): void;
  /**
   * Adds a row to the current result set. Returns false once the output is over
   * the limit: the database should stop reading rows and running statements.
   */
  addRow(row: (string | null)[]): boolean;
  /** Ends the current result set. */
  endSet(): void;
}

/** A fresh database of one case, behind what the two SQL engines have in common. */
export interface SqlDatabase {
  /**
   * Runs every statement of `sql` in order and reports the rows of each one
   * that returns columns to `output`. Throws on the first error, after the
   * result sets of the statements before it were reported.
   */
  exec(sql: string, output: SqlOutput): Promise<void>;
  close(): Promise<void>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Length of a line of `formatResultSets`. */
function lineLength(cells: (string | null)[]): number {
  let length = 3 * Math.max(cells.length - 1, 0);
  for (const cell of cells) length += cell === null ? 4 : cell.length;
  return length;
}

/** Discards everything: the result sets of the setup are not shown. */
const DISCARD: SqlOutput = { startSet() {}, addRow: () => true, endSet() {} };

/**
 * Collects the result sets of the student's source while counting the size of
 * their text. As soon as the text is over the output limit, it is emitted (the
 * host then stops the worker with `output_limit`) and no more rows are kept,
 * so a huge or endless query never piles rows up in memory.
 */
class ResultCollector implements SqlOutput {
  readonly resultSets: SqlResultSet[] = [];
  private current: SqlResultSet | undefined;
  // Length in UTF-16 code units, never more than the UTF-8 size of the same text.
  private length = 0;
  private emitted = false;

  constructor(private readonly emit: Emit) {}

  get full(): boolean {
    return this.length > OUTPUT_LIMIT_BYTES;
  }

  startSet(columns: string[]): void {
    if (this.full) return;
    this.current = { columns, rows: [] };
    this.grow((this.resultSets.length > 0 ? 2 : 0) + lineLength(columns));
  }

  addRow(row: (string | null)[]): boolean {
    if (this.full || !this.current) return !this.full;
    this.current.rows.push(row);
    this.grow(1 + lineLength(row));
    return !this.full;
  }

  endSet(): void {
    if (this.current && !this.emitted) this.resultSets.push(this.current);
    this.current = undefined;
  }

  /** Emits the text of the result sets once (the unfinished one included when over the limit). */
  flush(): void {
    if (this.emitted) return;
    const sets = this.full && this.current ? [...this.resultSets, this.current] : this.resultSets;
    if (sets.length === 0) return;
    this.emitted = true;
    this.emit('stdout', `${formatResultSets(sets)}\n`);
  }

  private grow(by: number): void {
    this.length += by;
    if (this.full) this.flush();
  }
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
  const output = new ResultCollector(emit);
  const database = await open();
  try {
    if (input.sqlSetup) {
      try {
        await database.exec(input.sqlSetup, DISCARD);
      } catch (error) {
        return { exitCode: 1, error: `setup: ${errorMessage(error)}`, sql: { resultSets: [] } };
      }
    }
    let failure: string | undefined;
    try {
      await database.exec(input.source, output);
    } catch (error) {
      failure = errorMessage(error);
    }
    output.flush();
    const sql = { resultSets: output.resultSets };
    return failure === undefined ? { exitCode: 0, sql } : { exitCode: 1, error: failure, sql };
  } finally {
    await database.close().catch(() => {});
  }
}
