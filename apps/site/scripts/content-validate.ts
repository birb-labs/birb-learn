import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  createCompilerExplorerRunner,
  createRunner,
  verifyCodeSnippet,
  verifyCodeTask,
  type RunOptions,
  type RunResult,
  type Runner,
  type VerifyReport,
} from '@birb-learn/code-runner';
import { highlightCode } from '@birb-learn/code-ui/highlight';
import type { Language } from '@birb-learn/content-schema/src/code-languages';
import { CodeSnippetPayload, CodeTaskPayload } from '@birb-learn/content-schema/src/code-payloads';
import { checkPack } from '@birb-learn/content-schema/src/packs/check-pack';
import { loadPacks } from '@birb-learn/content-schema/src/packs/load-pack';
import { lookupLine, type PackProblem, type PackQuestion } from '@birb-learn/content-schema/src/packs/pack-schemas';
import { LOCALES } from '@birb-learn/content-schema/src/schema';
import { createDiskRunCache } from './lib/disk-run-cache';

// `pnpm content:validate [path]`: everything that can be checked about a
// content root without a database (spec §11.3). Loading and the cross-checks
// come from content-schema; this adds that every MDX field compiles, that
// every code sample highlights, and that the code does what it claims.

/** Retries of one item that Compiler Explorer rate-limited, before giving up. */
const MAX_RATE_LIMIT_RETRIES = 10;
/** Wait when a rate-limited run came without a `retryAfterMs` hint. */
const DEFAULT_RETRY_WAIT_MS = 5000;
const MAX_MDX_ERROR_CHARS = 300;

export interface ValidateOptions {
  /** Runs the code samples; browser languages and Compiler Explorer are routed by `createRunner`. */
  runner: Runner;
  /** Rejects when the MDX source does not compile. */
  compileMdx: (source: string) => Promise<unknown>;
  onProgress?: (message: string) => void;
  /** Waits `ms` between rate-limit retries; defaults to a timer (tests inject their own). */
  sleep?: (ms: number) => Promise<void>;
}

export interface ValidateResult {
  problems: PackProblem[];
  /** `file: path` of code that could not be executed at all (MySQL is read-only). */
  notVerified: string[];
}

/** Where the fields of one translation sit in its file, for problem lines and messages. */
interface FieldContext {
  file: string;
  /** Path of the payload's container in the file ("blocks[2]"), or "" when it is the file itself. */
  prefix: string;
  /** Lines indexed relative to `prefix`. */
  lines: Record<string, number>;
  /** Used when no line is recorded for a path. */
  fallbackLine: number | undefined;
}

function errorText(error: unknown): string {
  const text = (error instanceof Error ? error.message : String(error)).trim();
  return text.length > MAX_MDX_ERROR_CHARS ? `${text.slice(0, MAX_MDX_ERROR_CHARS)}...` : text;
}

function sleepWithTimer(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a runner to see why runs were `unavailable`: the verifier reports a
 * rate limit only as a message, and the wait has to come from `retryAfterMs`.
 */
function watchRateLimits(runner: Runner): { runner: Runner; rateLimited: () => boolean; waitMs: () => number } {
  let seen = false;
  let wait = 0;
  return {
    rateLimited: () => seen,
    waitMs: () => (wait > 0 ? wait : DEFAULT_RETRY_WAIT_MS),
    runner: {
      async runCode(request, opts?: RunOptions): Promise<RunResult> {
        const run = await runner.runCode(request, opts);
        if (run.status === 'unavailable' && run.reason === 'rate_limited') {
          seen = true;
          wait = Math.max(wait, run.retryAfterMs ?? 0);
        }
        return run;
      },
    },
  };
}

export async function validateContent(rootDir: string, opts: ValidateOptions): Promise<ValidateResult> {
  const sleep = opts.sleep ?? sleepWithTimer;
  const progress = (message: string) => opts.onProgress?.(message);

  const { bundle, problems: loadProblems } = await loadPacks(rootDir);
  const packProblems = checkPack(bundle);
  const problems: PackProblem[] = [...loadProblems, ...packProblems];
  const notVerified: string[] = [];
  // A file whose content is already reported as inconsistent is not worth running.
  const reportedFiles = new Set(packProblems.map((problem) => problem.file));

  function add(ctx: FieldContext, fieldPath: string, message: string): void {
    const line = lookupLine(ctx.lines, fieldPath) ?? ctx.fallbackLine;
    const text = `${qualify(ctx, fieldPath)}: ${message}`;
    problems.push(line === undefined ? { file: ctx.file, message: text } : { file: ctx.file, line, message: text });
  }

  async function checkMdx(ctx: FieldContext, fieldPath: string, source: string | null): Promise<void> {
    if (source === null || source === '') return;
    try {
      await opts.compileMdx(source);
    } catch (error) {
      add(ctx, fieldPath, `MDX does not compile: ${errorText(error)}`);
    }
  }

  async function checkHighlight(ctx: FieldContext, fieldPath: string, code: string, language: Language): Promise<void> {
    try {
      await highlightCode(code, language);
    } catch (error) {
      add(ctx, fieldPath, `cannot highlight ${language} code: ${errorText(error)}`);
    }
  }

  /** Runs a verification, waiting out Compiler Explorer's rate limit and retrying the whole item. */
  async function verify(run: (runner: Runner) => Promise<VerifyReport>): Promise<VerifyReport> {
    for (let retry = 0; ; retry += 1) {
      const watcher = watchRateLimits(opts.runner);
      const report = await run(watcher.runner);
      const waiting = watcher.rateLimited() && report.issues.some((issue) => issue.severity === 'warning');
      if (!waiting) return report;

      if (retry === MAX_RATE_LIMIT_RETRIES) {
        const message = `still rate limited after ${MAX_RATE_LIMIT_RETRIES} retries`;
        return {
          notVerified: report.notVerified,
          issues: report.issues.map((issue) =>
            issue.severity === 'warning' ? { ...issue, severity: 'error', message } : issue,
          ),
        };
      }
      const wait = watcher.waitMs();
      progress(`waiting ${Math.ceil(wait / 1000)}s for Compiler Explorer…`);
      await sleep(wait);
    }
  }

  function addReport(ctx: FieldContext, report: VerifyReport): void {
    for (const issue of report.issues) add(ctx, issue.path, issue.message);
    for (const entry of report.notVerified) notVerified.push(`${ctx.file}: ${qualify(ctx, entry)}`);
  }

  /** The MDX fields, highlighting and execution of a code snippet payload. */
  async function checkSnippet(ctx: FieldContext, payloadJson: string | null): Promise<void> {
    const parsed = payloadJson === null ? undefined : parseJson(CodeSnippetPayload, payloadJson);
    if (!parsed) return; // reported by checkPack

    for (const [v, variant] of parsed.variants.entries()) {
      for (const field of ['annotations', 'walkthrough'] as const) {
        for (const [n, note] of variant[field].entries()) {
          await checkMdx(ctx, `variants[${v}].${field}[${n}].mdx`, note.mdx);
        }
      }
      await checkHighlight(ctx, `variants[${v}].code`, variant.code, variant.language);
    }
    if (reportedFiles.has(ctx.file)) return;
    addReport(ctx, await verify((runner) => verifyCodeSnippet(parsed, runner)));
  }

  /** The same for a code task payload (a code exercise block or a code question). */
  async function checkTask(
    ctx: FieldContext,
    payloadJson: string | null,
    kind: PackQuestion['codeKind'],
    language: PackQuestion['codeLanguage'],
  ): Promise<void> {
    const parsed = payloadJson === null ? undefined : parseJson(CodeTaskPayload, payloadJson);
    if (!parsed || kind === null || language === null) return; // reported by checkPack

    for (const [n, hint] of parsed.hints.entries()) await checkMdx(ctx, `hints[${n}]`, hint);
    await checkHighlight(ctx, 'starterCode', parsed.starterCode, language);
    if (parsed.solution !== undefined) await checkHighlight(ctx, 'solution', parsed.solution, language);
    if (reportedFiles.has(ctx.file)) return;
    addReport(ctx, await verify((runner) => verifyCodeTask(kind, language, parsed, runner)));
  }

  for (const lesson of bundle.lessons) {
    for (const locale of LOCALES) {
      const translation = lesson.translations[locale];
      if (!translation) continue;
      progress(`checking ${translation.file}`);

      for (const [index, block] of lesson.blocks.entries()) {
        const blockTranslation = translation.blocks[index];
        if (!blockTranslation) continue; // reported by checkPack
        const ctx: FieldContext = {
          file: translation.file,
          prefix: `blocks[${index}]`,
          lines: blockTranslation.lines,
          fallbackLine: blockTranslation.line,
        };
        await checkMdx(ctx, 'body', blockTranslation.bodyMdx);
        await checkMdx(ctx, 'prompt', blockTranslation.promptMdx);
        await checkMdx(ctx, 'resolution', blockTranslation.resolutionMdx);
        if (block.type === 'code_snippet') await checkSnippet(ctx, blockTranslation.payloadJson);
        if (block.type === 'code_exercise') {
          await checkTask(ctx, blockTranslation.payloadJson, block.codeKind, block.codeLanguage);
        }
      }
    }
  }

  for (const question of bundle.questions) {
    for (const locale of LOCALES) {
      const translation = question.translations[locale];
      if (!translation) continue;
      progress(`checking ${translation.file}`);
      const ctx: FieldContext = { file: translation.file, prefix: '', lines: translation.lines, fallbackLine: undefined };

      await checkMdx(ctx, 'prompt', translation.promptMdx);
      await checkMdx(ctx, 'resolution', translation.resolutionMdx);
      for (const [index, option] of translation.options.entries()) {
        await checkMdx(ctx, optionPath(question, index), option.textMdx);
      }
      for (const [index, pair] of translation.matchingPairs.entries()) {
        await checkMdx(ctx, `pairs[${index}].left`, pair.leftMdx);
        await checkMdx(ctx, `pairs[${index}].right`, pair.rightMdx);
      }
      if (question.type === 'code') await checkTask(ctx, translation.codeJson, question.codeKind, question.codeLanguage);
    }
  }

  return { problems, notVerified };
}

/** Where an option's text sits in a question file: choices have `options[i].text`, ordering has `items[i]`. */
function optionPath(question: PackQuestion, index: number): string {
  return question.type === 'ordering' ? `items[${index}]` : `options[${index}].text`;
}

function qualify(ctx: FieldContext, fieldPath: string): string {
  if (ctx.prefix === '') return fieldPath;
  return fieldPath.startsWith('[') ? `${ctx.prefix}${fieldPath}` : `${ctx.prefix}.${fieldPath}`;
}

/** The parsed payload, or `undefined` when it is not valid JSON of that shape (checkPack reports that). */
function parseJson<T>(schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } }, json: string): T | undefined {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return undefined;
  }
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');

function formatProblem(rootArg: string, problem: PackProblem): string {
  const file = path.join(rootArg, problem.file);
  return problem.line === undefined ? `${file} ${problem.message}` : `${file}:${problem.line} ${problem.message}`;
}

async function main(): Promise<number> {
  // `pnpm --filter site exec` runs in apps/site; a relative path is meant from where pnpm was started.
  const base = process.env.INIT_CWD ?? process.cwd();
  const rootArg = process.argv[2] ? path.resolve(base, process.argv[2]) : path.join(REPO_ROOT, 'content');

  // Loaded here so that importing this module (the tests) does not start the Node engines.
  const { createNodeRunner } = await import('@birb-learn/code-runner/src/node');
  const { compileLessonMdx } = await import('../src/lib/compile-lesson-mdx');

  const runner = createRunner({
    browser: createNodeRunner(),
    remote: createCompilerExplorerRunner({ cache: createDiskRunCache(path.join(REPO_ROOT, '.cache', 'code-runner')) }),
  });
  const { problems, notVerified } = await validateContent(rootArg, {
    runner,
    compileMdx: compileLessonMdx,
    onProgress: (message) => console.error(message),
  });

  for (const problem of problems) console.log(formatProblem(rootArg, problem));
  for (const entry of notVerified) console.log(`not verified: ${path.join(rootArg, entry)}`);
  console.log(`${problems.length} problems, ${notVerified.length} not verified`);
  return problems.length > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => process.exit(code),
    (error: unknown) => {
      console.error(error);
      process.exit(2);
    },
  );
}
