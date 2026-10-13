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

export const createPostgresqlEngine: EngineFactory = async (env) => {
  const { PGlite, parse, protocol } = await import('@electric-sql/pglite');
  // Download and compile the runtime once; every case then starts from these.
  const [pgliteWasmModule, initdbWasmModule, fsBundle] = await Promise.all([
    readAsset(env, 'pglite.wasm').then((bytes) => WebAssembly.compile(bytes)),
    readAsset(env, 'initdb.wasm').then((bytes) => WebAssembly.compile(bytes)),
    readAsset(env, 'pglite.data').then((bytes) => new Blob([bytes])),
  ]);
  // Fail now, within the engine load budget, rather than in the first case.
  await (await PGlite.create({ pgliteWasmModule, initdbWasmModule, fsBundle })).close();

  return {
    runCase: (input, emit) =>
      runSqlCase(input, emit, async () => {
        const database: PGlite = await PGlite.create({ pgliteWasmModule, initdbWasmModule, fsBundle });
        return {
          async exec(sql, onResultSet) {
            // The raw protocol keeps the messages of the statements that ran before an error;
            // `database.parsers` also knows the array types, which the default parsers do not.
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
            if (errorAt >= 0) throw messages[errorAt];
          },
          close: () => database.close(),
        };
      }),
  };
};
