import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createNodeRunner } from '../node';
import { OUTPUT_LIMIT_BYTES } from '../protocol';

// Dates must not depend on the machine's time zone: the whole file runs the
// worker under a zone that is neither UTC nor the one of a typical CI machine.
process.env.TZ = 'Asia/Tokyo';

const runner = createNodeRunner();

afterAll(() => {
  runner.dispose();
});

// Load the WASM runtime once, before the tests that need it.
beforeAll(async () => {
  await runner.runCode({ language: 'postgresql', source: 'SELECT 1;' });
}, 120_000);

async function run(source: string, sqlSetup?: string) {
  const result = await runner.runCode({ language: 'postgresql', source, sqlSetup });
  return result.cases[0];
}

const SETUP = "CREATE TABLE t(a INTEGER, b TEXT); INSERT INTO t VALUES (1,'Olá'),(2,NULL);";

describe('PostgreSQL engine (Node worker)', () => {
  it('returns the result set of a query run on the setup data', async () => {
    const result = await run('SELECT a, b FROM t ORDER BY a;', SETUP);
    expect(result).toMatchObject({ status: 'ok', exitCode: 0, stdout: 'a | b\n1 | Olá\n2 | NULL\n', stderr: '' });
    expect(result.sql?.resultSets[0]).toEqual({ columns: ['a', 'b'], rows: [['1', 'Olá'], ['2', null]] });
  });

  it('collects the result set of every statement that returns columns', async () => {
    const result = await run('SELECT 1 AS x; CREATE TABLE u(c int); SELECT 2 AS y, 3 AS z;');
    expect(result.status).toBe('ok');
    expect(result.sql?.resultSets).toEqual([
      { columns: ['x'], rows: [['1']] },
      { columns: ['y', 'z'], rows: [['2', '3']] },
    ]);
    expect(result.stdout).toBe('x\n1\n\ny | z\n2 | 3\n');
  });

  it('keeps a result set that has columns but no rows', async () => {
    const result = await run('SELECT a FROM t WHERE a > 100;', SETUP);
    expect(result.sql?.resultSets).toEqual([{ columns: ['a'], rows: [] }]);
    expect(result.stdout).toBe('a\n');
  });

  it('accepts a source with only DDL', async () => {
    const result = await run('CREATE TABLE v(a int); INSERT INTO v VALUES (1);');
    expect(result).toMatchObject({ status: 'ok', exitCode: 0, stdout: '' });
    expect(result.sql).toEqual({ resultSets: [] });
  });

  it('does not report the result sets of the setup', async () => {
    const result = await run('SELECT 2 AS two;', 'SELECT 1 AS one;');
    expect(result.sql?.resultSets).toEqual([{ columns: ['two'], rows: [['2']] }]);
  });

  it('keeps duplicate column names', async () => {
    const result = await run('SELECT 1 AS a, 2 AS a;');
    expect(result.sql?.resultSets).toEqual([{ columns: ['a', 'a'], rows: [['1', '2']] }]);
  });

  it('turns booleans and numerics into strings', async () => {
    const result = await run('SELECT true AS t, 1.5::numeric AS n');
    expect(result.sql?.resultSets[0].rows).toEqual([['true', '1.5']]);
  });

  it('turns bytes and big integers into strings', async () => {
    const result = await run("SELECT '\\x01ff'::bytea AS b, 9007199254740993::bigint AS big, NULL::text AS n;");
    expect(result.sql?.resultSets[0].rows).toEqual([['\\x01ff', '9007199254740993', null]]);
  });

  it('prints date and time values as the server does, whatever the time zone of the machine', async () => {
    const result = await run(
      `SELECT TIMESTAMP '2020-01-02 03:04:05' AS ts, DATE '2020-01-02' AS d, TIME '03:04:05' AS t,
              TIMESTAMPTZ '2020-01-02 03:04:05+00' AS tz, TIMETZ '03:04:05+00' AS ttz, INTERVAL '1 day 2 hours' AS i;`,
    );
    expect(result.sql?.resultSets[0].rows).toEqual([
      ['2020-01-02 03:04:05', '2020-01-02', '03:04:05', '2020-01-02 03:04:05+00', '03:04:05+00', '1 day 02:00:00'],
    ]);
  });

  it('keeps the server time zone at UTC, even after a RESET', async () => {
    const result = await run("RESET ALL; SELECT current_setting('TimeZone') AS zone, TIMESTAMPTZ '2020-01-02 03:04:05+09' AS at;");
    expect(result.sql?.resultSets[0].rows).toEqual([['UTC', '2020-01-01 18:04:05+00']]);
  });

  it('prints arrays of dates and times as JSON text of the server values', async () => {
    const result = await run(
      "SELECT ARRAY[DATE '2020-01-02'] AS ds, ARRAY[TIMESTAMP '2020-01-02 03:04:05'] AS tss, ARRAY[INTERVAL '1 day'] AS iv;",
    );
    expect(result.sql?.resultSets[0].rows).toEqual([['["2020-01-02"]', '["2020-01-02 03:04:05"]', '["1 day"]']]);
  });

  it('prints infinite dates as the server does', async () => {
    const result = await run("SELECT 'infinity'::timestamp AS a, '-infinity'::date AS b;");
    expect(result.status).toBe('ok');
    expect(result.sql?.resultSets[0].rows).toEqual([['infinity', '-infinity']]);
  });

  it('turns json, jsonb and array columns into JSON text', async () => {
    const result = await run(
      `CREATE TABLE docs(id int, j json, jb jsonb, nums int[], words text[]);
       INSERT INTO docs VALUES (1, '{"a": [1, 2]}', '{"b": null}', ARRAY[1, 2, 3], ARRAY['x', 'y']);
       SELECT j, jb, nums, words FROM docs;`,
    );
    expect(result.status).toBe('ok');
    expect(result.sql?.resultSets[0]).toEqual({
      columns: ['j', 'jb', 'nums', 'words'],
      rows: [['{"a":[1,2]}', '{"b":null}', '[1,2,3]', '["x","y"]']],
    });
    expect(result.stdout).toBe('j | jb | nums | words\n{"a":[1,2]} | {"b":null} | [1,2,3] | ["x","y"]\n');
  });

  it('reports a syntax error as a runtime error with the database message', async () => {
    const result = await run('SELEC 1;');
    expect(result.status).toBe('runtime_error');
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('syntax error');
    expect(result.stdout).toBe('');
  });

  it('keeps the result sets collected before the error', async () => {
    const result = await run('SELECT 1 AS x; SELECT 1 / 0;');
    expect(result.status).toBe('runtime_error');
    expect(result.stderr).toContain('division by zero');
    expect(result.sql?.resultSets).toEqual([{ columns: ['x'], rows: [['1']] }]);
    expect(result.stdout).toBe('x\n1\n');
  });

  it('drops the rows of a statement that fails midway', async () => {
    const result = await run('SELECT 1 AS x; SELECT 1 / (3 - g) AS y FROM generate_series(1, 5) AS g;');
    expect(result.status).toBe('runtime_error');
    expect(result.stderr).toContain('division by zero');
    expect(result.sql?.resultSets).toEqual([{ columns: ['x'], rows: [['1']] }]);
    expect(result.stdout).toBe('x\n1\n');
  });

  it('stops a large finite query early with output_limit', async () => {
    const result = await run('SELECT g FROM generate_series(1, 3000000) AS g;');
    // Counted from engine_ready: a respawned worker's engine reload is not part of it.
    expect(result.durationMs).toBeLessThan(3000);
    expect(result.status).toBe('output_limit');
    expect(new TextEncoder().encode(result.stdout).length).toBeLessThanOrEqual(OUTPUT_LIMIT_BYTES);
    expect(result.stdout.startsWith('g\n1\n2\n3\n')).toBe(true);
  });

  it('stops an unbounded query early with output_limit', async () => {
    const result = await run('WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT x FROM c;');
    // Counted from engine_ready: a respawned worker's engine reload is not part of it.
    expect(result.durationMs).toBeLessThan(3000);
    expect(result.status).toBe('output_limit');
    const next = await run('SELECT 1 AS ok;');
    expect(next).toMatchObject({ status: 'ok', stdout: 'ok\n1\n' });
  });

  it('adds the DETAIL line of the database error', async () => {
    const result = await run('CREATE TABLE u(a int PRIMARY KEY); INSERT INTO u VALUES (1); INSERT INTO u VALUES (1);');
    expect(result.status).toBe('runtime_error');
    expect(result.stderr).toContain('duplicate key value violates unique constraint');
    expect(result.stderr).toContain('\nDETAIL: Key (a)=(1) already exists.');
  });

  it('adds the HINT line of the database error', async () => {
    const result = await run('SELECT bb FROM t;', SETUP);
    expect(result.status).toBe('runtime_error');
    expect(result.stderr).toContain('column "bb" does not exist');
    expect(result.stderr).toContain('\nHINT: Perhaps you meant to reference the column "t.b".');
  });

  it('adds nothing when the database error has neither detail nor hint', async () => {
    const result = await run('SELECT 1 / 0;');
    expect(result.stderr).toContain('division by zero');
    expect(result.stderr).not.toMatch(/DETAIL|HINT/);
  });

  it('prefixes an error in the setup with "setup:"', async () => {
    const result = await run('SELECT 1;', 'CREATE TABEL t(a int);');
    expect(result.status).toBe('runtime_error');
    expect(result.exitCode).toBe(1);
    expect(result.stderr.startsWith('setup:')).toBe(true);
    expect(result.stderr).toContain('syntax error');
    expect(result.stdout).toBe('');
  });

  it('never exposes engine internals in an error', async () => {
    const result = await run('SELECT * FROM missing;');
    expect(result.stderr).toContain('relation "missing" does not exist');
    expect(result.stderr).not.toMatch(/\bat\s|node_modules|\.js|\.wasm|file:|\/home\//);
  });

  it('gives every case a fresh database', async () => {
    const first = await run('CREATE TABLE leak(a int); INSERT INTO leak VALUES (1);');
    expect(first.status).toBe('ok');
    const second = await run('SELECT * FROM leak;');
    expect(second.status).toBe('runtime_error');
    expect(second.stderr).toContain('relation "leak" does not exist');
  });

  it('does not leak schemas, settings or sequences between cases', async () => {
    const first = await run(
      "CREATE SCHEMA mine; CREATE SEQUENCE mine.s; SELECT nextval('mine.s'); SET search_path TO mine; CREATE TABLE kept(a int);",
    );
    expect(first.status).toBe('ok');
    const second = await run(
      "SELECT (SELECT COUNT(*) FROM pg_namespace WHERE nspname = 'mine') AS schemas, current_setting('search_path') AS path;",
    );
    expect(second.sql?.resultSets[0].rows).toEqual([['0', 'public']]);
  });

  it('runs setup and source in the same database', async () => {
    const result = await run('INSERT INTO t VALUES (3, NULL); SELECT COUNT(*) AS n FROM t;', SETUP);
    expect(result.sql?.resultSets).toEqual([{ columns: ['n'], rows: [['3']] }]);
  });
});
