import type { PyodideAPI } from 'pyodide';
import type { Emit, EngineEnv, EngineFactory } from './types';

// The student's source is never part of this code: it is passed to the
// functions below as an argument. They live in a namespace of their own, so
// the student's globals cannot reach or shadow them.
const PYTHON_SUPPORT = `
import json
import linecache
import sys
import traceback

FILE_NAME = 'main.py'


def check_syntax(source):
    try:
        compile(source, FILE_NAME, 'exec')
    except SyntaxError as exc:
        text = traceback.format_exception_only(type(exc), exc)[-1].strip()
        return f'File "{FILE_NAME}", line {exc.lineno or 1}\\n{text}'
    except Exception as exc:
        return f'{type(exc).__name__}: {exc}'
    return None


def flush_streams():
    for stream in (sys.__stdout__, sys.__stderr__, sys.stdout, sys.stderr):
        try:
            stream.flush()
        except Exception:
            pass


def run_program(source):
    # Lets tracebacks show the lines of the student's program.
    linecache.cache[FILE_NAME] = (len(source), None, source.splitlines(True), FILE_NAME)
    namespace = {'__name__': '__main__'}
    exit_code = 0
    error = None
    try:
        exec(compile(source, FILE_NAME, 'exec'), namespace)
    except SystemExit as exc:
        code = exc.code
        if code is None:
            exit_code = 0
        elif isinstance(code, int):
            exit_code = code
        else:
            print(code, file=sys.stderr)
            exit_code = 1
    except BaseException as exc:
        exit_code = 1
        # Skip this function's own frame: the traceback starts at the student's code.
        tb = exc.__traceback__.tb_next if exc.__traceback__ else None
        error = ''.join(traceback.format_exception(type(exc), exc, tb))
    finally:
        flush_streams()
    return json.dumps({'exitCode': exit_code, 'error': error})
`;

interface PythonSupport {
  checkSyntax(source: string): string | null;
  runProgram(source: string): { exitCode: number; error: string | null };
}

/** Directory of the installed `pyodide` package, with a trailing separator. */
async function nodeIndexUrl(env: EngineEnv): Promise<string> {
  const { fileURLToPath } = await import('node:url');
  return fileURLToPath(env.assetUrl('pyodide', './'));
}

function loadSupport(pyodide: PyodideAPI): PythonSupport {
  const namespace = pyodide.toPy({});
  pyodide.runPython(PYTHON_SUPPORT, { globals: namespace });
  const checkSyntax = namespace.get('check_syntax');
  const runProgram = namespace.get('run_program');
  return {
    checkSyntax: (source) => checkSyntax(source) ?? null,
    runProgram: (source) => JSON.parse(runProgram(source) as string),
  };
}

/** A line-at-a-time stdin over the UTF-8 encoded text; `null` signals the end of the input. */
function lineReader(stdin: string): () => Uint8Array | null {
  const bytes = new TextEncoder().encode(stdin);
  let position = 0;
  return () => {
    if (position >= bytes.length) return null;
    const newline = bytes.indexOf(10, position);
    const end = newline === -1 ? bytes.length : newline + 1;
    const line = bytes.slice(position, end);
    position = end;
    return line;
  };
}

/**
 * A stdout/stderr writer that decodes bytes as they arrive. The decoder is
 * streaming, so a character split across two writes is not corrupted; `finish`
 * flushes whatever it still holds.
 */
function streamWriter(emit: Emit, stream: 'stdout' | 'stderr') {
  const decoder = new TextDecoder();
  return {
    write(bytes: Uint8Array): number {
      const text = decoder.decode(bytes, { stream: true });
      if (text) emit(stream, text);
      return bytes.length;
    },
    finish(): void {
      const text = decoder.decode();
      if (text) emit(stream, text);
    },
  };
}

export const createPythonEngine: EngineFactory = async (env) => {
  const { loadPyodide } = await import('pyodide');
  // Startup output is not the student's: keep it out of the way.
  const pyodide = await loadPyodide({
    indexURL: env.isNode ? await nodeIndexUrl(env) : env.assetUrl('pyodide', ''),
    stdout: () => {},
    stderr: () => {},
  });
  const support = loadSupport(pyodide);

  return {
    async compile(source) {
      return support.checkSyntax(source);
    },
    async runCase(input, emit) {
      const stdout = streamWriter(emit, 'stdout');
      const stderr = streamWriter(emit, 'stderr');
      pyodide.setStdout({ write: (bytes) => stdout.write(bytes) });
      pyodide.setStderr({ write: (bytes) => stderr.write(bytes) });
      const nextLine = lineReader(input.stdin);
      pyodide.setStdin({ stdin: nextLine });
      try {
        const { exitCode, error } = support.runProgram(input.source);
        return error === null ? { exitCode } : { exitCode, error };
      } finally {
        stdout.finish();
        stderr.finish();
      }
    },
  };
};
