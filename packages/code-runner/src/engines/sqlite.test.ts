import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createNodeRunner } from '../node';
import { OUTPUT_LIMIT_BYTES } from '../protocol';

const runner = createNodeRunner();

afterAll(() => {
  runner.dispose();
});

// Load the WASM runtime once, before the tests that need it.
beforeAll(async () => {
  await runner.runCode({ language: 'sqlite', source: 'SELECT 1;' });
}, 120_000);

async function run(source: string, sqlSetup?: string, timeoutMs?: number) {
  const result = await runner.runCode({ language: 'sqlite', source, sqlSetup, timeoutMs });
  return result.cases[0];
}

const SETUP = "CREATE TABLE t(a INTEGER, b TEXT); INSERT INTO t VALUES (1,'Olá'),(2,NULL);";

describe('SQLite engine (Node worker)', () => {
  it('returns the result set of a query run on the setup data', async () => {
    const result = await run('SELECT a, b FROM t ORDER BY a;', SETUP);
    expect(result).toMatchObject({ status: 'ok', exitCode: 0, stdout: 'a | b\n1 | Olá\n2 | NULL\n', stderr: '' });
    expect(result.sql?.resultSets[0]).toEqual({ columns: ['a', 'b'], rows: [['1', 'Olá'], ['2', null]] });
  });

  it('collects the result set of every statement that returns columns', async () => {
    const result = await run('SELECT 1 AS x; CREATE TABLE u(c); SELECT 2 AS y, 3 AS z;');
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
    const result = await run('CREATE TABLE v(a); INSERT INTO v VALUES (1);');
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

  it('turns every kind of value into a string or null', async () => {
    const result = await run("SELECT 1.5 AS r, x'01ff' AS b, NULL AS n, 'text' AS s, 7 AS i;");
    expect(result.sql?.resultSets[0].rows).toEqual([['1.5', '\\x01ff', null, 'text', '7']]);
  });

  it('reports a syntax error as a runtime error with the database message', async () => {
    const result = await run('SELEC 1;');
    expect(result.status).toBe('runtime_error');
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('syntax error');
    expect(result.stdout).toBe('');
  });

  it('keeps the result sets collected before the error', async () => {
    const result = await run('SELECT 1 AS x; SELECT * FROM missing;');
    expect(result.status).toBe('runtime_error');
    expect(result.stderr).toContain('no such table: missing');
    expect(result.sql?.resultSets).toEqual([{ columns: ['x'], rows: [['1']] }]);
    expect(result.stdout).toBe('x\n1\n');
  });

  it('drops the rows of a statement that fails midway', async () => {
    const result = await run(
      "SELECT 1 AS x; SELECT CASE WHEN v = 3 THEN json('bad') ELSE v END AS y FROM (SELECT 1 AS v UNION ALL SELECT 2 UNION ALL SELECT 3);",
    );
    expect(result.status).toBe('runtime_error');
    expect(result.stderr).toContain('malformed JSON');
    expect(result.sql?.resultSets).toEqual([{ columns: ['x'], rows: [['1']] }]);
    expect(result.stdout).toBe('x\n1\n');
  });

  it('stops an unbounded query early with output_limit', async () => {
    const started = performance.now();
    const result = await run('WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT x FROM c;');
    expect(performance.now() - started).toBeLessThan(3000);
    expect(result.status).toBe('output_limit');
    expect(new TextEncoder().encode(result.stdout).length).toBeLessThanOrEqual(OUTPUT_LIMIT_BYTES);
    expect(result.stdout.startsWith('x\n1\n2\n3\n')).toBe(true);
  });

  it('stops a large finite query as soon as the output is over the limit', async () => {
    const started = performance.now();
    const result = await run(
      'WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 3000000) SELECT x FROM c;',
    );
    expect(performance.now() - started).toBeLessThan(1500);
    expect(result.status).toBe('output_limit');
  });

  it('prefixes an error in the setup with "setup:"', async () => {
    const result = await run('SELECT 1;', 'CREATE TABEL t(a);');
    expect(result.status).toBe('runtime_error');
    expect(result.exitCode).toBe(1);
    expect(result.stderr.startsWith('setup:')).toBe(true);
    expect(result.stderr).toContain('syntax error');
    expect(result.stdout).toBe('');
  });

  it('never exposes engine internals in an error', async () => {
    const result = await run('SELECT * FROM missing;');
    expect(result.stderr).not.toMatch(/\bat\s|node_modules|\.js|\.wasm|file:|\/home\//);
  });

  it('gives every case a fresh database', async () => {
    const first = await run('CREATE TABLE leak(a); INSERT INTO leak VALUES (1);');
    expect(first.status).toBe('ok');
    const second = await run('SELECT * FROM leak;');
    expect(second.status).toBe('runtime_error');
    expect(second.stderr).toContain('no such table: leak');
  });

  it('runs setup and source in the same database', async () => {
    const result = await run('INSERT INTO t VALUES (3, NULL); SELECT COUNT(*) AS n FROM t;', SETUP);
    expect(result.sql?.resultSets).toEqual([{ columns: ['n'], rows: [['3']] }]);
  });

  it('times out an endless query and recovers', async () => {
    const endless = 'WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT COUNT(*) FROM c;';
    expect((await run(endless, undefined, 500)).status).toBe('timeout');
    expect((await run('SELECT 1 AS ok;')).status).toBe('ok');
  });
});
