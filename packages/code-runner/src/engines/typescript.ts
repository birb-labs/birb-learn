import type * as TS from 'typescript';
import { createSystem, createVirtualTypeScriptEnvironment, type VirtualTypeScriptEnvironment } from '@typescript/vfs';
import { runJavaScript } from './javascript';
import { TS_GLOBALS_DTS } from './typescript-globals';
import type { EngineEnv, EngineFactory } from './types';

const MAIN_FILE = '/main.ts';
const GLOBALS_FILE = '/globals.d.ts';

// `moduleDetection: force` treats the program as a module, which allows
// top-level `await` like the JavaScript engine does.
function compilerOptions(ts: typeof TS): TS.CompilerOptions {
  return {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    lib: ['es2022'],
    moduleDetection: ts.ModuleDetectionKind.Force,
    strict: true,
    noEmit: false,
  };
}

const LIB_REFERENCE = /\/\/\/\s*<reference\s+lib\s*=\s*["']([^"']+)["']\s*\/>/g;

/**
 * Downloads `lib.<root>.d.ts` and, transitively, every lib file it references
 * (`/// <reference lib="..." />`), keyed by `/<file name>`. Fetching exactly
 * the needed set lets any failed download abort the load: a missing or
 * error-page lib file would otherwise produce bogus type errors.
 */
export async function fetchLibFiles(root: string, fetchText: (file: string) => Promise<string>): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  let pending = [`lib.${root}.d.ts`];
  while (pending.length > 0) {
    const batch = [...new Set(pending)].filter((file) => !files.has(`/${file}`));
    const texts = await Promise.all(batch.map((file) => fetchText(file)));
    pending = [];
    batch.forEach((file, index) => {
      files.set(`/${file}`, texts[index]);
      for (const match of texts[index].matchAll(LIB_REFERENCE)) pending.push(`lib.${match[1].toLowerCase()}.d.ts`);
    });
  }
  return files;
}

async function readLibText(env: EngineEnv, file: string): Promise<string> {
  try {
    return new TextDecoder().decode(await env.readAsset('typescript', `lib/${file}`));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not load the TypeScript standard library: ${reason}`);
  }
}

/** Lib files (`/lib.es5.d.ts`, ...) of the installed TypeScript version. */
function loadLibFiles(env: EngineEnv): Promise<Map<string, string>> {
  return fetchLibFiles('es2022', (file) => readLibText(env, file));
}

function flatten(ts: typeof TS, message: string | TS.DiagnosticMessageChain): string {
  return ts.flattenDiagnosticMessageText(message, '\n').replace(/\s*\n\s*/g, ' ');
}

function formatDiagnostic(ts: typeof TS, diagnostic: TS.Diagnostic): string {
  const message = `error TS${diagnostic.code}: ${flatten(ts, diagnostic.messageText)}`;
  const { file, start } = diagnostic;
  if (!file || start === undefined) return message;
  const { line, character } = file.getLineAndCharacterOfPosition(start);
  return `main.ts:${line + 1}:${character + 1} - ${message}`;
}

// With `module: ESNext` TypeScript ends a program without imports or exports
// with `export {};`, which is a syntax error in the function body the program
// runs in. Programs with their own exports are rejected before this point.
// TypeScript puts it first, last or before trailing comments, always on a line
// of its own, so the first such line is removed.
const EMPTY_EXPORT = /^export \{\};(\n|$)/m;

// The virtual file system treats an empty file as missing.
const normalize = (source: string): string => (source === '' ? '\n' : source);

/** One diagnostic line per top-level `export`: the program runs as a function body, not as a module. */
function exportDiagnostics(ts: typeof TS, file: TS.SourceFile | undefined): string[] {
  if (!file) return [];
  const isExport = (statement: TS.Statement): boolean =>
    ts.isExportDeclaration(statement) ||
    ts.isExportAssignment(statement) ||
    (ts.canHaveModifiers(statement) &&
      (ts.getModifiers(statement) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
  return file.statements.filter(isExport).map((statement) => {
    const { line, character } = file.getLineAndCharacterOfPosition(statement.getStart(file));
    return `main.ts:${line + 1}:${character + 1} - error: export statements are not supported in this lab`;
  });
}

export const createTypeScriptEngine: EngineFactory = async (env) => {
  // The `typescript` package is a large CommonJS bundle: load it on demand.
  const loaded = (await import('typescript')) as typeof TS & { default?: typeof TS };
  const ts = loaded.default ?? loaded;
  const options = compilerOptions(ts);

  const files = await loadLibFiles(env);
  files.set(MAIN_FILE, '\n');
  files.set(GLOBALS_FILE, TS_GLOBALS_DTS);
  const vfs: VirtualTypeScriptEnvironment = createVirtualTypeScriptEnvironment(
    createSystem(files),
    [MAIN_FILE, GLOBALS_FILE],
    ts,
    options,
  );

  // Parse the standard library now, so that the first compile is not charged for it.
  vfs.languageService.getSemanticDiagnostics(MAIN_FILE);

  function transpile(source: string): string {
    vfs.updateFile(MAIN_FILE, normalize(source));
    const output = vfs.languageService.getEmitOutput(MAIN_FILE).outputFiles.find((file) => file.name.endsWith('.js'));
    if (!output) throw new Error('TypeScript produced no output');
    return output.text.replace(EMPTY_EXPORT, '');
  }

  // The JavaScript of the last program that compiled cleanly: `runCase` runs
  // once per case after a single `compile`.
  let compiled: { source: string; js: string } | undefined;

  return {
    async compile(source) {
      vfs.updateFile(MAIN_FILE, normalize(source));
      const { languageService } = vfs;
      const lines = [
        ...languageService.getSyntacticDiagnostics(MAIN_FILE),
        ...languageService.getSemanticDiagnostics(MAIN_FILE),
      ].map((diagnostic) => formatDiagnostic(ts, diagnostic));
      lines.push(...exportDiagnostics(ts, languageService.getProgram()?.getSourceFile(MAIN_FILE)));
      if (lines.length > 0) return lines.join('\n');
      compiled = { source, js: transpile(source) };
      return null;
    },
    runCase(input, emit) {
      const js = compiled?.source === input.source ? compiled.js : transpile(input.source);
      return runJavaScript(js, input.stdin, emit);
    },
  };
};
