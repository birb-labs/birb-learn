import type { PGlite } from '@electric-sql/pglite';
import { toCell } from '../output';
import { runSqlCase } from './sql-case';
import type { EngineEnv, EngineFactory } from './types';

/** Reads a file of the PGlite distribution: from disk in Node, from the CDN in browsers. */
async function readAsset(env: EngineEnv, file: string): Promise<ArrayBuffer> {
  const url = env.assetUrl('@electric-sql/pglite', `dist/${file}`);
  if (env.isNode) {
    const [{ readFile }, { fileURLToPath }] = await Promise.all([import('node:fs/promises'), import('node:url')]);
    const bytes = await readFile(fileURLToPath(url));
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${file}: HTTP ${response.status}`);
  return response.arrayBuffer();
}

/** The message of a database error as `psql` shows it: the message, then its detail and hint. */
function databaseErrorMessage(error: Error & { detail?: string; hint?: string }): string {
  const lines = [error.message];
  if (error.detail) lines.push(`DETAIL: ${error.detail}`);
  if (error.hint) lines.push(`HINT: ${error.hint}`);
  return lines.join('\n');
}

export const createPostgresqlEngine: EngineFactory = async (env) => {
  const { PGlite, parse, protocol, types } = await import('@electric-sql/pglite');
  // Download and compile the runtime once; every case then starts from these.
  const [pgliteWasmModule, initdbWasmModule, fsBundle] = await Promise.all([
    readAsset(env, 'pglite.wasm').then((bytes) => WebAssembly.compile(bytes)),
    readAsset(env, 'initdb.wasm').then((bytes) => WebAssembly.compile(bytes)),
    readAsset(env, 'pglite.data').then((bytes) => new Blob([bytes])),
  ]);
  const options = { pgliteWasmModule, initdbWasmModule, fsBundle };

  // Initializing a database (initdb) takes over a second, which would eat the student's time
  // budget in every case. Do it once, now, within the engine load budget (it also fails fast
  // when the runtime is broken), and start every case from a copy of this pristine data directory.
  const seed = await PGlite.create(options);
  // initdb picks the server time zone from the machine's; pin it, so `timestamptz` prints the same everywhere.
  await seed.exec("ALTER SYSTEM SET timezone = 'UTC'");
  const snapshot = await seed.dumpDataDir('none');
  await seed.close();

  // Dates and times are shown as the server prints them. PGlite would turn them into
  // JavaScript dates, which render in the time zone of the machine the code runs on.
  const textTypes = [types.DATE, types.TIME, types.TIMETZ, types.TIMESTAMP, types.TIMESTAMPTZ, types.INTERVAL];

  return {
    runCase: (input, emit) =>
      runSqlCase(input, emit, async () => {
        const database: PGlite = await PGlite.create({ ...options, loadDataDir: snapshot });
        // `parsers` is undocumented PGlite API, pinned by the exact version in package.json. The array
        // parsers of the instance call these entries, so arrays of these types become text as well.
        for (const type of textTypes) database.parsers[type] = (value: string) => value;
        return {
          async exec(sql, onResultSet) {
            // The raw protocol keeps the messages of the statements that ran before an error.
            const { messages } = await database.execProtocol(protocol.serialize.query(sql), { throwOnError: false });
            const errorAt = messages.findIndex((message) => message.name === 'error');
            const completed = errorAt < 0 ? messages : messages.slice(0, errorAt);
            for (const result of parse.parseResults(completed, database.parsers, { rowMode: 'array' })) {
              if (result.fields.length === 0) continue;
              onResultSet({
                columns: result.fields.map((field) => field.name),
                rows: (result.rows as unknown[][]).map((row) => row.map(toCell)),
              });
            }
            if (errorAt >= 0) throw new Error(databaseErrorMessage(messages[errorAt] as unknown as Error));
          },
          close: () => database.close(),
        };
      }),
  };
};
