import type { SqlJsStatic } from 'sql.js';
import { toCell } from '../output';
import { runSqlCase } from './sql-case';
import type { EngineEnv, EngineFactory } from './types';

/** Where sql.js reads a file of its distribution from: a path in Node, a URL in browsers. */
async function locateFile(env: EngineEnv, file: string): Promise<string> {
  const url = env.assetUrl('sql.js', `dist/${file}`);
  if (!env.isNode) return url;
  const { fileURLToPath } = await import('node:url');
  return fileURLToPath(url);
}

export const createSqliteEngine: EngineFactory = async (env) => {
  const { default: initSqlJs } = await import('sql.js');
  // sql.js asks for its WASM file by name, synchronously: resolve both builds' locations up front.
  const files = new Map(
    await Promise.all(
      ['sql-wasm.wasm', 'sql-wasm-browser.wasm'].map(async (file) => [file, await locateFile(env, file)] as const),
    ),
  );
  // Compiles the WASM module now, within the engine load budget.
  const SQL: SqlJsStatic = await initSqlJs({ locateFile: (file) => files.get(file) ?? file });

  return {
    runCase: (input, emit) =>
      runSqlCase(input, emit, async () => {
        const database = new SQL.Database();
        return {
          async exec(sql, onResultSet) {
            for (const statement of database.iterateStatements(sql)) {
              const columns = statement.getColumnNames();
              if (columns.length === 0) {
                statement.step();
                continue;
              }
              const rows: (string | null)[][] = [];
              while (statement.step()) rows.push(statement.get().map(toCell));
              onResultSet({ columns, rows });
            }
          },
          async close() {
            database.close();
          },
        };
      }),
  };
};
