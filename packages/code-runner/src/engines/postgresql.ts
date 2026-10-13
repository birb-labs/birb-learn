import type { messages, PGlite } from '@electric-sql/pglite';
import { toCell } from '../output';
import { runSqlCase } from './sql-case';
import type { EngineEnv, EngineFactory } from './types';

/** Reads a file of the PGlite distribution: from disk in Node, from the CDN in browsers. */
function readAsset(env: EngineEnv, file: string): Promise<Uint8Array<ArrayBuffer>> {
  return env.readAsset('@electric-sql/pglite', `dist/${file}`) as Promise<Uint8Array<ArrayBuffer>>;
}

/** The message of a database error as `psql` shows it: the message, then its detail and hint. */
function databaseErrorMessage(error: Error & { detail?: string; hint?: string }): string {
  const lines = [error.message];
  if (error.detail) lines.push(`DETAIL: ${error.detail}`);
  if (error.hint) lines.push(`HINT: ${error.hint}`);
  return lines.join('\n');
}

export const createPostgresqlEngine: EngineFactory = async (env) => {
  const { PGlite, protocol, types } = await import('@electric-sql/pglite');
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
          async exec(sql, output) {
            // The raw stream hands over the server's messages while the query runs, so rows are
            // counted (and dropped once the output is over the limit) as they come: PGlite's
            // `execProtocol` would hold every message of the query until it ends. The query itself
            // cannot be interrupted from here; the output, emitted as soon as it is over the limit,
            // makes the host stop the worker. PostgreSQL's own send buffer is the only other copy.
            const parser = new protocol.Parser();
            let typeIds: number[] | undefined;
            let full = false;
            let failure: (Error & { detail?: string; hint?: string }) | undefined;
            const onMessage = (message: messages.BackendMessage) => {
              if (failure || full) return;
              switch (message.name) {
                case 'rowDescription': {
                  const { fields } = message as messages.RowDescriptionMessage;
                  // A statement without columns (`SELECT;`) has no result set.
                  typeIds = fields.length > 0 ? fields.map((field) => field.dataTypeID) : undefined;
                  if (typeIds) output.startSet(fields.map((field) => field.name));
                  break;
                }
                case 'dataRow': {
                  if (!typeIds) break;
                  const ids = typeIds;
                  const row = (message as messages.DataRowMessage).fields.map((value, index) =>
                    toCell(types.parseType(value, ids[index], database.parsers)),
                  );
                  full = !output.addRow(row);
                  break;
                }
                case 'commandComplete':
                  if (typeIds) output.endSet();
                  typeIds = undefined;
                  break;
                case 'error':
                  // Like `psql`, the statement that failed shows no rows.
                  failure = message as unknown as Error;
                  break;
              }
            };
            await database.execProtocolRawStream(protocol.serialize.query(sql), {
              onRawData: (bytes) => parser.parse(bytes, onMessage),
            });
            if (failure) throw new Error(databaseErrorMessage(failure));
          },
          close: () => database.close(),
        };
      }),
  };
};
