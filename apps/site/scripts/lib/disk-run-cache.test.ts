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

  it('treats valid JSON of the wrong shape as a miss', async () => {
    const cache = createDiskRunCache(dir);
    await cache.set('k', OUTCOME);
    const [file] = await readdir(dir);
    await writeFile(path.join(dir, file), JSON.stringify({ hello: 'world' }));
    expect(await cache.get('k')).toBeUndefined();
  });

  it('leaves no temporary file behind', async () => {
    const cache = createDiskRunCache(dir);
    await Promise.all([cache.set('k', OUTCOME), cache.set('k', OUTCOME), cache.set('other', OUTCOME)]);
    for (const file of await readdir(dir)) expect(file.endsWith('.json')).toBe(true);
  });
});
