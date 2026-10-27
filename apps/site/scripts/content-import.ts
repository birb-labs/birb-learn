import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { DB_PATH } from '@birb-learn/content-schema/src/client';
import { importIntoSqliteFile } from '@birb-learn/content-schema/src/packs/apply-import-sqlite';
import { checkPack } from '@birb-learn/content-schema/src/packs/check-pack';
import { loadPacks } from '@birb-learn/content-schema/src/packs/load-pack';
import type { PackBundle, PackProblem } from '@birb-learn/content-schema/src/packs/pack-schemas';
import { UnknownReplaceTargetError, type ImportReport } from '@birb-learn/content-schema/src/packs/plan-import';

// `pnpm content:import --target local|admin [--replace a,b] [path]`: imports a
// content root into the local content.db or, through POST /api/import, into the
// admin D1. Create-only unless an item is named in --replace; all-or-nothing.
// It checks the packs with loadPacks + checkPack only: run `pnpm
// content:validate` first, which also executes the code (spec §11.3).

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');
const USAGE = 'usage: pnpm content:import --target local|admin [--replace <slug|key>[,...]] [path]';
const RESET_COMMAND = 'pnpm --filter @birb-learn/content-schema run db:reset';

export type ImportTarget = 'local' | 'admin';

export interface ImportArgs {
  target: ImportTarget;
  replace: string[];
  path: string | undefined;
}

/** Parses the arguments after the script name. `--replace` takes comma-separated values and may repeat. */
export function parseImportArgs(args: string[]): ImportArgs | { error: string } {
  let parsed;
  try {
    parsed = parseArgs({
      args,
      options: { target: { type: 'string' }, replace: { type: 'string', multiple: true } },
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    return { error: (error as Error).message };
  }

  const { target, replace = [] } = parsed.values;
  if (target === undefined) return { error: '--target local|admin is required' };
  if (target !== 'local' && target !== 'admin') return { error: `--target must be local or admin, got "${target}"` };
  if (parsed.positionals.length > 1) return { error: `only one path can be imported at a time, got ${parsed.positionals.length}` };

  return {
    target,
    replace: replace.flatMap((value) => value.split(',')).map((value) => value.trim()).filter((value) => value !== ''),
    path: parsed.positionals[0],
  };
}

export interface ImportCliOptions {
  /** The command-line arguments after the script name. */
  args: string[];
  /** Directory a relative path is resolved against. */
  baseDir: string;
  /** Prints a result line (the report, or the problems found in the pack). */
  out: (line: string) => void;
  /** Prints an error line. */
  err: (line: string) => void;
  /** Where ADMIN_IMPORT_URL and ADMIN_IMPORT_SECRET are read; defaults to process.env. */
  env?: Record<string, string | undefined>;
  /** Defaults to the global fetch (tests inject a fake). */
  fetch?: typeof fetch;
  /** The local database; defaults to content-schema's content.db. */
  dbPath?: string;
  /** The content root used when no path is given; defaults to <repo>/content. */
  defaultRoot?: string;
}

function formatProblem(rootArg: string, problem: PackProblem): string {
  const file = path.join(rootArg, problem.file);
  return problem.line === undefined ? `${file} ${problem.message}` : `${file}:${problem.line} ${problem.message}`;
}

function printReport(report: ImportReport, out: (line: string) => void): void {
  for (const item of report.created) out(`created ${item}`);
  for (const item of report.replaced) out(`replaced ${item}`);
  for (const item of report.skipped) out(`skipped ${item}`);
  out(`${report.created.length} created, ${report.replaced.length} replaced, ${report.skipped.length} skipped`);
}

function importLocal(dbPath: string, bundle: PackBundle, replace: string[], options: ImportCliOptions): number {
  if (!existsSync(dbPath)) {
    options.err(`${dbPath} does not exist; run \`${RESET_COMMAND}\` first`);
    return 1;
  }
  try {
    printReport(importIntoSqliteFile(dbPath, bundle, { replace }), options.out);
    return 0;
  } catch (error) {
    if (error instanceof UnknownReplaceTargetError) {
      options.err(error.message);
    } else {
      options.err(`the import failed and nothing was written: ${(error as Error).message}`);
    }
    return 1;
  }
}

async function importAdmin(
  rootArg: string,
  url: string,
  secret: string,
  bundle: PackBundle,
  replace: string[],
  options: ImportCliOptions,
): Promise<number> {
  const send = options.fetch ?? fetch;
  const response = await send(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ bundle, replace }),
  });

  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }

  if (response.ok && body && typeof body === 'object' && 'created' in body) {
    printReport(body as ImportReport, options.out);
    return 0;
  }

  const answer = body as { error?: unknown; problems?: PackProblem[] } | undefined;
  const reason = typeof answer?.error === 'string' ? answer.error : text.slice(0, 500);
  options.err(`the admin refused the import (HTTP ${response.status}): ${reason}`);
  for (const problem of Array.isArray(answer?.problems) ? answer.problems : []) {
    options.err(formatProblem(rootArg, problem));
  }
  return 1;
}

/** Runs `pnpm content:import`; resolves to the process exit code. */
export async function runCli(options: ImportCliOptions): Promise<number> {
  const args = parseImportArgs(options.args);
  if ('error' in args) {
    options.err(args.error);
    options.err(USAGE);
    return 1;
  }

  const env = options.env ?? process.env;
  const adminUrl = env.ADMIN_IMPORT_URL;
  const adminSecret = env.ADMIN_IMPORT_SECRET;
  if (args.target === 'admin' && (!adminUrl || !adminSecret)) {
    options.err('ADMIN_IMPORT_URL and ADMIN_IMPORT_SECRET must be set to import into the admin');
    return 1;
  }

  const rootArg = args.path ? path.resolve(options.baseDir, args.path) : (options.defaultRoot ?? path.join(REPO_ROOT, 'content'));
  if (!existsSync(rootArg)) {
    // `db:reset` runs this without a path, before any content exists.
    if (!args.path) {
      options.out(`nothing to import: ${rootArg} does not exist`);
      return 0;
    }
    options.err(`${rootArg} does not exist`);
    return 1;
  }

  const { bundle, problems: loadProblems } = await loadPacks(rootArg);
  const problems = [...loadProblems, ...checkPack(bundle)];
  if (problems.length > 0) {
    for (const problem of problems) options.out(formatProblem(rootArg, problem));
    options.out(`${problems.length} problems; nothing was imported`);
    return 1;
  }

  if (args.target === 'local') return importLocal(options.dbPath ?? DB_PATH, bundle, args.replace, options);
  return importAdmin(rootArg, adminUrl!, adminSecret!, bundle, args.replace, options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli({
    args: process.argv.slice(2),
    // `pnpm --filter site exec` runs in apps/site; a relative path is meant from where pnpm was started.
    baseDir: process.env.INIT_CWD ?? process.cwd(),
    out: (line) => console.log(line),
    err: (line) => console.error(line),
  }).then(
    (code) => process.exit(code),
    (error: unknown) => {
      console.error(error);
      process.exit(2);
    },
  );
}
