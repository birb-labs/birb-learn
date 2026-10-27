import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CaseOutcome, RemoteResultCache } from '@birb-learn/code-runner';

type Fields = Record<string, unknown>;

function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True when `value` has the shape of a `CaseOutcome` of its `kind`; anything else in a cache file is a miss. */
function isOutcome(value: unknown): value is CaseOutcome {
  if (!isFields(value)) return false;
  switch (value.kind) {
    case 'case': {
      const { result } = value;
      return (
        typeof value.cacheable === 'boolean' &&
        isFields(result) &&
        typeof result.status === 'string' &&
        typeof result.stdout === 'string' &&
        typeof result.stderr === 'string'
      );
    }
    case 'compile_error':
      return typeof value.compileOutput === 'string';
    case 'unavailable':
      return (
        typeof value.reason === 'string' &&
        typeof value.message === 'string' &&
        (value.retryAfterMs === undefined || typeof value.retryAfterMs === 'number')
      );
    default:
      return false;
  }
}

/**
 * A `RemoteResultCache` kept on disk, one JSON file per key (named by the
 * sha256 of the key) so that Compiler Explorer is asked once per program
 * across validation runs. A missing, unreadable or corrupt file is a miss; a
 * write goes to a temporary file first and is renamed into place, so a
 * crashed run never leaves a half-written entry.
 */
export function createDiskRunCache(dir: string): RemoteResultCache {
  const fileFor = (key: string) => path.join(dir, `${createHash('sha256').update(key).digest('hex')}.json`);

  return {
    async get(key) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await readFile(fileFor(key), 'utf8'));
      } catch {
        return undefined;
      }
      return isOutcome(parsed) ? parsed : undefined;
    },

    async set(key, value) {
      await mkdir(dir, { recursive: true });
      const target = fileFor(key);
      const temporary = `${target}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify(value));
        await rename(temporary, target);
      } catch (error) {
        await rm(temporary, { force: true });
        throw error;
      }
    },
  };
}
