import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CaseOutcome, RemoteResultCache } from '@birb-learn/code-runner';

const OUTCOME_KINDS = new Set<string>(['case', 'compile_error', 'unavailable']);

function isOutcome(value: unknown): value is CaseOutcome {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { kind?: unknown }).kind === 'string' &&
    OUTCOME_KINDS.has((value as { kind: string }).kind)
  );
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
