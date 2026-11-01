/**
 * Rebuilds the local `packages/content-schema/content.db` from a
 * `wrangler d1 export` dump of production and then applies generated SQL
 * files, so the site can be built locally against exactly what production
 * will contain.
 *
 * Usage (from packages/content-schema):
 *   tsx ../../content-sources/load-local.ts <dump.sql> [apply.sql ...]
 */
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { DB_PATH } from '../packages/content-schema/src/client';

const [dump, ...applyFiles] = process.argv.slice(2);
if (!dump) {
  console.error('Usage: tsx content-sources/load-local.ts <dump.sql> [apply.sql ...]');
  process.exit(2);
}

for (const suffix of ['', '-wal', '-shm']) fs.rmSync(DB_PATH + suffix, { force: true });
const db = new Database(DB_PATH);
// Exports are not foreign-key ordered (see apps/admin/README.md).
db.pragma('foreign_keys = OFF');
db.exec(fs.readFileSync(path.resolve(dump), 'utf8'));
db.pragma('foreign_keys = ON');
for (const file of applyFiles) {
  const apply = db.transaction(() => db.exec(fs.readFileSync(path.resolve(file), 'utf8')));
  apply();
  console.log(`applied ${file}`);
}
const violations = db.pragma('foreign_key_check') as unknown[];
if (violations.length > 0) {
  console.error('foreign key violations:', violations);
  process.exit(1);
}
const counts = db
  .prepare(
    `SELECT (SELECT count(*) FROM lessons) AS lessons, (SELECT count(*) FROM lesson_blocks) AS blocks, (SELECT count(*) FROM questions) AS questions, (SELECT count(*) FROM tags) AS tags`,
  )
  .get();
console.log(DB_PATH, counts);
db.close();
