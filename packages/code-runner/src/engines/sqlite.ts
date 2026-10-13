import type { SqlJsStatic } from 'sql.js';
import { toCell } from '../output';
import { runSqlCase } from './sql-case';
import type { EngineFactory } from './types';

export const createSqliteEngine: EngineFactory = async (env) => {
  const { default: initSqlJs } = await import('sql.js');
  // Compiles the WASM module now, within the engine load budget. sql.js asks for
  // the WASM file of its build (Node or browser) by name: a path in Node, a URL in browsers.
  const SQL: SqlJsStatic = await initSqlJs({ locateFile: (file) => env.assetLocation('sql.js', `dist/${file}`) });

  return {
    runCase: (input, emit) =>
      runSqlCase(input, emit, async () => {
        const database = new SQL.Database();
        return {
          async exec(sql, output) {
            for (const statement of database.iterateStatements(sql)) {
              const columns = statement.getColumnNames();
              if (columns.length === 0) {
                statement.step();
                continue;
              }
              output.startSet(columns);
              // Row by row: stop as soon as the output is over the limit (`close` frees the statement).
              while (statement.step()) {
                if (!output.addRow(statement.get().map(toCell))) return;
              }
              output.endSet();
            }
          },
          async close() {
            database.close();
          },
        };
      }),
  };
};
