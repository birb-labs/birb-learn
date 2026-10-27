import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CaseOutcome } from '@birb-learn/code-runner';
import { createDiskRunCache } from './disk-run-cache';

const OUTCOME: CaseOutcome = {
  kind: 'case',
  cacheable: true,
  result: { status: 'ok', stdout: '42\n', stderr: '', exitCode: 0, durationMs: 3 },
};

describe('createDiskRunCache', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'birb-run-cache-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('round-trips a stored outcome', async () => {
    const cache = createDiskRunCache(dir);
    await cache.set('some key', OUTCOME);
    expect(await cache.get('some key')).toEqual(OUTCOME);
  });

  it('survives a new cache instance on the same directory', async () => {
    await createDiskRunCache(dir).set('some key', OUTCOME);
    expect(await createDiskRunCache(dir).get('some key')).toEqual(OUTCOME);
  });

  it('misses on an unknown key', async () => {
    expect(await createDiskRunCache(dir).get('nothing here')).toBeUndefined();
  });

  it('creates the directory on the first write', async () => {
    const nested = path.join(dir, 'a', 'b');
    await createDiskRunCache(nested).set('k', OUTCOME);
    expect(await readdir(nested)).toHaveLength(1);
  });

  it('keeps one file per key, named by the sha256 of the key', async () => {
    const cache = createDiskRunCache(dir);
    await cache.set('first', OUTCOME);
    await cache.set('second', OUTCOME);
    await cache.set('first', OUTCOME);
    const files = await readdir(dir);
    expect(files).toHaveLength(2);
    for (const file of files) expect(file).toMatch(/^[0-9a-f]{64}\.json$/);
  });

  it('treats a corrupt file as a miss and replaces it on the next write', async () => {
    const cache = createDiskRunCache(dir);
    await cache.set('k', OUTCOME);
    const [file] = await readdir(dir);
    await writeFile(path.join(dir, file), '{ not json');
    expect(await cache.get('k')).toBeUndefined();

    await cache.set('k', OUTCOME);
    expect(await cache.get('k')).toEqual(OUTCOME);
  });

  it('round-trips compile errors and unavailable outcomes', async () => {
    const cache = createDiskRunCache(dir);
    const compileError: CaseOutcome = { kind: 'compile_error', compileOutput: 'error: expected ;' };
    const unavailable: CaseOutcome = { kind: 'unavailable', reason: 'rate_limited', message: 'slow down', retryAfterMs: 500 };
    await cache.set('compile', compileError);
    await cache.set('busy', unavailable);
    expect(await cache.get('compile')).toEqual(compileError);
    expect(await cache.get('busy')).toEqual(unavailable);
  });

  it.each([
    ['an object without a kind', { hello: 'world' }],
    ['null', null],
    ['an array', [OUTCOME]],
    ['an unknown kind', { kind: 'other' }],
    ['a case without its result', { kind: 'case', cacheable: true }],
    ['a case whose result has no status', { kind: 'case', cacheable: true, result: { stdout: '', stderr: '' } }],
    ['a case whose result is not an object', { kind: 'case', cacheable: true, result: 'ok' }],
    ['a case without cacheable', { kind: 'case', result: { status: 'ok', stdout: '', stderr: '' } }],
    ['a compile error without its output', { kind: 'compile_error' }],
    ['a compile error with a non-text output', { kind: 'compile_error', compileOutput: 3 }],
    ['an unavailable outcome without a reason', { kind: 'unavailable', message: 'x' }],
    ['an unavailable outcome with a non-numeric wait', { kind: 'unavailable', reason: 'offline', message: 'x', retryAfterMs: 'soon' }],
  ])('treats %s as a miss', async (_label, content) => {
    const cache = createDiskRunCache(dir);
    await cache.set('k', OUTCOME);
    const [file] = await readdir(dir);
    await writeFile(path.join(dir, file), JSON.stringify(content));
    expect(await cache.get('k')).toBeUndefined();
  });

  it('leaves no temporary file behind', async () => {
    const cache = createDiskRunCache(dir);
    await Promise.all([cache.set('k', OUTCOME), cache.set('k', OUTCOME), cache.set('other', OUTCOME)]);
    for (const file of await readdir(dir)) expect(file.endsWith('.json')).toBe(true);
  });
});
