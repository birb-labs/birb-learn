import { COMPILER_EXPLORER_API, COMPILER_EXPLORER_COMPILERS, type RemoteLanguage } from './compilers';

/** The service answered with a payload that is neither a build failure nor an executed program. */
export class CompilerExplorerFormatError extends Error {
  constructor(message: string) {
    super(`Unexpected Compiler Explorer response: ${message}`);
    this.name = 'CompilerExplorerFormatError';
  }
}

export interface CompileRequest {
  url: string;
  body: object;
}

export type MappedResponse =
  | { kind: 'compile_error'; compileOutput: string }
  /** The service's own limit stopped the build step: not the student's fault, nothing to grade. */
  | { kind: 'service_timeout' }
  | {
      kind: 'case';
      status: 'ok' | 'runtime_error' | 'timeout';
      stdout: string;
      stderr: string;
      exitCode: number | null;
    };

/** Builds the compile-and-execute request for one case (the service takes one stdin per request). */
export function buildCompileRequest(language: RemoteLanguage, source: string, stdin: string): CompileRequest {
  const { id, lang, flags } = COMPILER_EXPLORER_COMPILERS[language];
  return {
    url: `${COMPILER_EXPLORER_API}/compiler/${id}/compile`,
    body: {
      source,
      lang,
      // Asks Compiler Explorer not to retain the student's code.
      allowStoreCodeDebug: false,
      options: {
        userArguments: flags,
        executeParameters: { args: [], stdin },
        compilerOptions: { executorRequest: true },
        filters: { execute: true },
        tools: [],
        libraries: [],
      },
    },
  };
}

// The compilers are run with `-fdiagnostics-color=always` / `--color=always`, so the build
// output carries ANSI colour (SGR) and erase-line (`ESC [ K`) sequences.
const ANSI_ESCAPE = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `[{ text }]` lines to text. `terminate` ends every line with `\n`, otherwise lines are joined with `\n`. */
function readLines(value: unknown, where: string, terminate: boolean): string {
  if (!Array.isArray(value)) throw new CompilerExplorerFormatError(`${where} is not a list`);
  const lines = value.map((line: unknown) => {
    if (!isObject(line) || typeof line.text !== 'string') throw new CompilerExplorerFormatError(`${where} has a line without text`);
    return line.text;
  });
  return terminate ? lines.map((line) => `${line}\n`).join('') : lines.join('\n');
}

function compileError(output: string): MappedResponse {
  return { kind: 'compile_error', compileOutput: output.replace(ANSI_ESCAPE, '') };
}

/**
 * Maps a Compiler Explorer compile-and-execute response (recorded shapes live in
 * `./fixtures`). Throws `CompilerExplorerFormatError` for anything else.
 *
 * - Build failure: `buildResult.code` is non-zero and `didExecute` is false. The
 *   top-level `code` is -1 and the top-level `stderr` only says "Build failed";
 *   the compiler output is in `buildResult.stderr`.
 * - Executed program: top-level `code` is the exit code, `stdout`/`stderr` are the
 *   program's lines.
 * - Time limit (20 s on the service): top-level `timedOut: true` with `code: 143`
 *   (SIGKILL) and "Killed - processing time exceeded" on stderr.
 * - Build time limit: `buildResult.timedOut: true` (a cold Go build can take long).
 *   This is the service being slow, not a compile error, so it maps to
 *   `service_timeout` and is checked before the build exit code.
 */
export function mapCompilerExplorerResponse(json: unknown): MappedResponse {
  if (!isObject(json)) throw new CompilerExplorerFormatError('the payload is not an object');
  const build = json.buildResult;

  if (build !== undefined) {
    if (isObject(build) && build.timedOut === true) return { kind: 'service_timeout' };
    if (!isObject(build) || typeof build.code !== 'number') throw new CompilerExplorerFormatError('buildResult has no numeric code');
    if (build.code !== 0) {
      const output = readLines(build.stderr, 'buildResult.stderr', false);
      // An empty build stderr would leave the student with a blank error.
      return compileError(output === '' ? readLines(json.stderr, 'stderr', false) : output);
    }
  } else if (json.didExecute === false) {
    return compileError(readLines(json.stderr, 'stderr', false));
  }

  if (json.didExecute !== true) throw new CompilerExplorerFormatError('the program was not executed');
  const stdout = readLines(json.stdout, 'stdout', true);
  const stderr = readLines(json.stderr, 'stderr', true);

  // Checked before the exit code: a killed program does not need to report one.
  if (json.timedOut === true) return { kind: 'case', status: 'timeout', stdout, stderr, exitCode: null };
  if (typeof json.code !== 'number') throw new CompilerExplorerFormatError('the exit code is not a number');
  return { kind: 'case', status: json.code === 0 ? 'ok' : 'runtime_error', stdout, stderr, exitCode: json.code };
}
