import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseImportArgs, runCli, type ImportCliOptions } from './content-import';

const REPO = path.resolve(import.meta.dirname, '../../..');
const FIXTURES = path.join(REPO, 'packages/content-schema/test-fixtures/packs');
const VALID = path.join(FIXTURES, 'valid');

const ADMIN_ENV = { ADMIN_IMPORT_URL: 'https://admin.example/api/import', ADMIN_IMPORT_SECRET: 's3cret' };

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return { out, err, options: { out: (line: string) => out.push(line), err: (line: string) => err.push(line) } };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('parseImportArgs', () => {
  it('reads the target, the replace list (comma-separated or repeated) and the path', () => {
    expect(parseImportArgs(['--target', 'local', '--replace', 'a,b', '--replace=c', 'content'])).toEqual({
      target: 'local',
      replace: ['a', 'b', 'c'],
      path: 'content',
    });
    expect(parseImportArgs(['--target=admin', '--replace', ' a , ,b '])).toEqual({ target: 'admin', replace: ['a', 'b'], path: undefined });
    expect(parseImportArgs(['--target', 'admin'])).toEqual({ target: 'admin', replace: [], path: undefined });
  });

  it.each([
    [[], /--target local\|admin is required/],
    [['--target', 'prod'], /--target must be local or admin, got "prod"/],
    [['--target', 'local', 'a', 'b'], /only one path/],
    [['--target', 'local', '--force'], /Unknown option/],
  ])('rejects %j', (args, message) => {
    const parsed = parseImportArgs(args);
    expect('error' in parsed && parsed.error).toMatch(message);
  });
});

describe('runCli', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn(async () => jsonResponse(200, { created: [], skipped: [], replaced: [] }));
  });

  function run(args: string[], extra: Partial<ImportCliOptions> = {}) {
    const io = capture();
    const result = runCli({ args, baseDir: REPO, env: {}, fetch: fetchSpy as unknown as typeof fetch, ...io.options, ...extra });
    return { ...io, result };
  }

  it('refuses --target admin without ADMIN_IMPORT_URL and ADMIN_IMPORT_SECRET', async () => {
    for (const env of [{}, { ADMIN_IMPORT_URL: ADMIN_ENV.ADMIN_IMPORT_URL }, { ADMIN_IMPORT_SECRET: 'x' }]) {
      const { err, result } = run(['--target', 'admin', VALID], { env });
      expect(await result).toBe(1);
      expect(err.join('\n')).toMatch(/ADMIN_IMPORT_URL and ADMIN_IMPORT_SECRET must be set/);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('prints the usage and exits 1 on bad arguments', async () => {
    const { err, result } = run(['--target', 'prod']);
    expect(await result).toBe(1);
    expect(err.join('\n')).toMatch(/usage: pnpm content:import --target local\|admin/);
  });

  it('posts the bundle and the replace list to the admin, then prints its report', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, { created: ['lesson:a'], skipped: ['discipline:computer-science'], replaced: ['question:q'] }),
    );
    const { out, result } = run(['--target', 'admin', '--replace', 'counting-in-binary', VALID], { env: ADMIN_ENV });
    expect(await result).toBe(0);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(ADMIN_ENV.ADMIN_IMPORT_URL);
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer s3cret');
    const body = JSON.parse(init.body as string) as { bundle: { lessons: { slug: string }[] }; replace: string[] };
    expect(body.replace).toEqual(['counting-in-binary']);
    expect(body.bundle.lessons.map((lesson) => lesson.slug)).toEqual(['counting-in-binary']);

    expect(out).toEqual([
      'created lesson:a',
      'replaced question:q',
      'skipped discipline:computer-science',
      '1 created, 1 replaced, 1 skipped',
    ]);
  });

  it('prints the problems the admin answered with and exits 1', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(400, { error: 'O pacote tem problemas; nada foi importado.', problems: [{ file: 'a.yaml', line: 3, message: 'bad' }] }),
    );
    const { err, result } = run(['--target', 'admin', VALID], { env: ADMIN_ENV });
    expect(await result).toBe(1);
    expect(err).toEqual(['the admin refused the import (HTTP 400): O pacote tem problemas; nada foi importado.', `${path.join(VALID, 'a.yaml')}:3 bad`]);
  });

  it('validates the pack first and sends nothing when it has problems', async () => {
    const { out, result } = run(['--target', 'admin', path.join(FIXTURES, 'invalid/collect')], { env: ADMIN_ENV });
    expect(await result).toBe(1);
    expect(out.at(-1)).toMatch(/^\d+ problems; nothing was imported$/);
    expect(out[0]).toMatch(/invalid\/collect\/demo\/_tree\.yaml:\d+ /);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('resolves a relative path against the directory pnpm was started in', async () => {
    const { result } = run(['--target', 'admin', 'valid'], { env: ADMIN_ENV, baseDir: FIXTURES });
    expect(await result).toBe(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  describe('paths', () => {
    let dir: string;

    beforeEach(async () => {
      dir = await mkdtemp(path.join(tmpdir(), 'birb-import-cli-'));
    });

    afterEach(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    it('does nothing when no path is given and the default content directory is missing', async () => {
      const { out, result } = run(['--target', 'local'], { defaultRoot: path.join(dir, 'content'), dbPath: path.join(dir, 'x.db') });
      expect(await result).toBe(0);
      expect(out).toEqual([`nothing to import: ${path.join(dir, 'content')} does not exist`]);
    });

    it('fails when the given path does not exist', async () => {
      const { err, result } = run(['--target', 'local', path.join(dir, 'nope')], { dbPath: path.join(dir, 'x.db') });
      expect(await result).toBe(1);
      expect(err).toEqual([`${path.join(dir, 'nope')} does not exist`]);
    });

    it('fails with a hint when the local database does not exist', async () => {
      const { err, result } = run(['--target', 'local', VALID], { dbPath: path.join(dir, 'missing.db') });
      expect(await result).toBe(1);
      expect(err.join('\n')).toMatch(/run `pnpm --filter @birb-learn\/content-schema run db:reset` first/);
    });
  });

  it('runs as a script: --target admin without the variables exits 1', async () => {
    const env: NodeJS.ProcessEnv = { ...process.env, INIT_CWD: REPO };
    delete env.ADMIN_IMPORT_URL;
    delete env.ADMIN_IMPORT_SECRET;
    const result = await new Promise<{ code: number | null; stderr: string }>((resolve) => {
      execFile(
        process.execPath,
        ['--import', 'tsx', 'scripts/content-import.ts', '--target', 'admin'],
        { cwd: path.resolve(import.meta.dirname, '..'), env, timeout: 60_000 },
        (error, _stdout, stderr) => resolve({ code: error ? (error.code as number) : 0, stderr }),
      );
    });
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/ADMIN_IMPORT_URL and ADMIN_IMPORT_SECRET must be set/);
  });
});
