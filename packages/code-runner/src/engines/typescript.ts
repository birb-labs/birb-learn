import type * as TS from 'typescript';
import {
  createDefaultMapFromCDN,
  createDefaultMapFromNodeModules,
  createSystem,
  createVirtualTypeScriptEnvironment,
  type VirtualTypeScriptEnvironment,
} from '@typescript/vfs';
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

// The editor-only libraries pulled in by the default target are never needed:
// the programs run with the ES2022 lib plus `TS_GLOBALS_DTS`.
const SKIPPED_LIBS = /^lib\.(dom|webworker|scripthost)\b/;

/** Lib files (`/lib.es5.d.ts`, ...) of the installed TypeScript version. */
async function loadLibFiles(env: EngineEnv, ts: typeof TS, options: TS.CompilerOptions): Promise<Map<string, string>> {
  let files: Map<string, string>;
  if (env.isNode) {
    const { fileURLToPath } = await import('node:url');
    files = createDefaultMapFromNodeModules(options, ts, fileURLToPath(env.assetUrl('typescript', 'lib')));
  } else {
    files = await createDefaultMapFromCDN(options, ts.version, false, ts, undefined, async (url) => {
      const name = url.slice(url.lastIndexOf('/') + 1);
      if (SKIPPED_LIBS.test(name)) return new Response('');
      return fetch(env.assetUrl('typescript', `lib/${name}`));
    });
  }
  // `createDefaultMapFromCDN` silently drops files that fail to download.
  if (!files.get('/lib.es5.d.ts')) throw new Error('Could not load the TypeScript standard library');
  return files;
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
// with `export {};`, which is a syntax error in the function body the program runs in.
const EMPTY_EXPORT = /\nexport \{\};\n?$/;

export const createTypeScriptEngine: EngineFactory = async (env) => {
  // The `typescript` package is a large CommonJS bundle: load it on demand.
  const loaded = (await import('typescript')) as typeof TS & { default?: typeof TS };
  const ts = loaded.default ?? loaded;
  const options = compilerOptions(ts);

  const files = await loadLibFiles(env, ts, options);
  // The virtual file system treats an empty file as missing.
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
    vfs.updateFile(MAIN_FILE, source);
    const output = vfs.languageService.getEmitOutput(MAIN_FILE).outputFiles.find((file) => file.name.endsWith('.js'));
    if (!output) throw new Error('TypeScript produced no output');
    return output.text.replace(EMPTY_EXPORT, '\n');
  }

  // The JavaScript of the last program that compiled cleanly: `runCase` runs
  // once per case after a single `compile`.
  let compiled: { source: string; js: string } | undefined;

  return {
    async compile(source) {
      vfs.updateFile(MAIN_FILE, source);
      const { languageService } = vfs;
      const diagnostics = [
        ...languageService.getSyntacticDiagnostics(MAIN_FILE),
        ...languageService.getSemanticDiagnostics(MAIN_FILE),
      ];
      if (diagnostics.length > 0) return diagnostics.map((diagnostic) => formatDiagnostic(ts, diagnostic)).join('\n');
      compiled = { source, js: transpile(source) };
      return null;
    },
    runCase(input, emit) {
      const js = compiled?.source === input.source ? compiled.js : transpile(input.source);
      return runJavaScript(js, input.stdin, emit);
    },
  };
};
