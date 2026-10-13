import type { Emit, EngineCaseOutput, EngineFactory } from './types';

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as AsyncFunctionConstructor;

// Parameters of the wrapper function. Everything after `input` receives
// `undefined`, shadowing the worker globals the program should not use. This is
// best-effort isolation: `globalThis` remains reachable.
const PARAMS = [
  'console',
  'input',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'importScripts',
  'postMessage',
  'self',
];

/** Formats a `console` argument like browsers: strings raw, objects as JSON. */
function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value) ?? String(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function describeThrown(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  return `Uncaught ${formatValue(value)}`;
}

function createConsole(emit: Emit) {
  const writer =
    (stream: 'stdout' | 'stderr') =>
    (...args: unknown[]) =>
      emit(stream, `${args.map(formatValue).join(' ')}\n`);
  return {
    log: writer('stdout'),
    info: writer('stdout'),
    debug: writer('stdout'),
    error: writer('stderr'),
    warn: writer('stderr'),
  };
}

/** `input()` returns the next stdin line, or `null` once stdin is exhausted. */
function createInput(stdin: string): () => string | null {
  const lines = stdin.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  let next = 0;
  return () => (next < lines.length ? lines[next++] : null);
}

/** Runs a JavaScript program (top-level `await` allowed) with `console` and `input()`. */
export async function runJavaScript(source: string, stdin: string, emit: Emit): Promise<EngineCaseOutput> {
  try {
    const program = new AsyncFunction(...PARAMS, source);
    const hidden = PARAMS.slice(2).map(() => undefined);
    await program(createConsole(emit), createInput(stdin), ...hidden);
    return { exitCode: 0 };
  } catch (error) {
    return { exitCode: 1, error: describeThrown(error) };
  }
}

export const createJavaScriptEngine: EngineFactory = async () => ({
  async compile(source) {
    try {
      new AsyncFunction(...PARAMS, source);
      return null;
    } catch (error) {
      if (error instanceof SyntaxError) return `SyntaxError: ${error.message}`;
      throw error;
    }
  },
  runCase: (input, emit) => runJavaScript(input.source, input.stdin, emit),
});
