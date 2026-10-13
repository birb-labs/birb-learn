import type { PyodideAPI } from 'pyodide';
import { streamWriter } from './stream-writer';
import type { EngineFactory } from './types';

// The student's source is never part of this code: it is passed to the
// functions below as an argument. They live in a namespace of their own, so
// the student's globals cannot reach or shadow them.
const PYTHON_SUPPORT = `
import json
import linecache
import os
import shutil
import sys
import traceback

FILE_NAME = 'main.py'
DEFAULT_RECURSION_LIMIT = sys.getrecursionlimit()
case_count = 0
scratch_dir = None


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


def reset_environment():
    # A case runs in the interpreter of the previous ones: undo what they may
    # have changed. Rebound streams, a lowered recursion limit and files written
    # to the working directory must not reach the next case.
    global case_count, scratch_dir
    sys.stdin, sys.stdout, sys.stderr = sys.__stdin__, sys.__stdout__, sys.__stderr__
    sys.setrecursionlimit(DEFAULT_RECURSION_LIMIT)
    os.chdir('/')
    if scratch_dir is not None:
        shutil.rmtree(scratch_dir, ignore_errors=True)
    case_count += 1
    scratch_dir = f'/tmp/case-{case_count}'
    os.makedirs(scratch_dir)
    os.chdir(scratch_dir)


def run_program(source):
    reset_environment()
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
            # Like a process exit status; also turns a bool into a number.
            exit_code = int(code) & 0xFF
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

export const createPythonEngine: EngineFactory = async (env) => {
  const { loadPyodide } = await import('pyodide');
  // Startup output is not the student's: keep it out of the way.
  const pyodide = await loadPyodide({
    // The package directory, with a trailing separator.
    indexURL: env.assetLocation('pyodide', ''),
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
