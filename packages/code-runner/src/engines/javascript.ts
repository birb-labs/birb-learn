import type { Emit, EngineCaseOutput, EngineEnv, EngineFactory } from './types';

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as AsyncFunctionConstructor;

// The worker's own scheduling functions, captured before any program can replace them.
const hostSetTimeout = globalThis.setTimeout.bind(globalThis);
const hostSetInterval = globalThis.setInterval.bind(globalThis);
const hostClearTimeout = globalThis.clearTimeout.bind(globalThis);
const hostQueueMicrotask = globalThis.queueMicrotask.bind(globalThis);

type TimerHandle = ReturnType<typeof setTimeout>;

// Parameters of the wrapper function: the runtime the program sees, then the
// worker globals it should not use, which receive `undefined`. This is
// best-effort isolation: `globalThis` remains reachable.
const PROVIDED = [
  'console',
  'input',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'queueMicrotask',
];
const HIDDEN = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'importScripts',
  'postMessage',
  'self',
  // Node-only: a program using them would pass in Node and fail in browsers.
  'setImmediate',
  'clearImmediate',
];
const PARAMS = [...PROVIDED, ...HIDDEN];

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

function describeRejection(reason: unknown): string {
  return `Uncaught (in promise) ${reason instanceof Error ? `${reason.name}: ${reason.message}` : formatValue(reason)}`;
}

/** Resolves on a later task: every promise callback queued before runs first. */
function nextTask(): Promise<void> {
  return new Promise((resolve) => hostSetTimeout(resolve, 0));
}

/**
 * The asynchronous work of one case. Like Node, a case ends once its body has
 * returned and no timer of it is pending (so an endless `setInterval` runs into
 * the case timeout), and the first uncaught exception of a callback or
 * unhandled rejection ends it with that error. Closing the scope cancels its
 * timers and mutes it, so leftover work of a finished case never reaches the
 * next one. Promises waiting on anything but these timers (e.g. `Blob.text()`)
 * are not waited for.
 */
class CaseScope {
  private readonly timers = new Map<number, TimerHandle>();
  private nextTimerId = 1;
  private open = true;
  private failure: string | undefined;
  private wake: () => void = () => {};
  private reportFailure: (message: string) => void = () => {};
  /** Resolves with the message of the first failure. */
  readonly failed = new Promise<string>((resolve) => {
    this.reportFailure = resolve;
  });

  /** False once the case has ended or failed: its callbacks no longer run and its output is dropped. */
  get live(): boolean {
    return this.open && this.failure === undefined;
  }

  fail(message: string): void {
    if (!this.live) return;
    this.failure = message;
    this.reportFailure(message);
    this.wake();
  }

  /** Runs a callback of the program; an exception it throws ends the case. */
  private invoke(callback: (...args: unknown[]) => unknown, args: unknown[]): void {
    try {
      callback(...args);
    } catch (error) {
      this.fail(describeThrown(error));
    }
  }

  schedule(repeat: boolean, callback: unknown, delay: unknown, args: unknown[]): number {
    if (typeof callback !== 'function') throw new TypeError('The callback must be a function');
    const id = this.nextTimerId++;
    if (!this.live) return id;
    const run = () => {
      if (!this.live) return;
      if (!repeat) this.timers.delete(id);
      this.invoke(callback as (...args: unknown[]) => unknown, args);
      this.wake();
    };
    const ms = Number(delay) || 0;
    this.timers.set(id, repeat ? hostSetInterval(run, ms) : hostSetTimeout(run, ms));
    return id;
  }

  /** `clearTimeout` and `clearInterval`: like in browsers, either clears both kinds. */
  clear(id: unknown): void {
    const handle = this.timers.get(id as number);
    if (handle === undefined) return;
    this.timers.delete(id as number);
    hostClearTimeout(handle);
    this.wake();
  }

  enqueueMicrotask(callback: unknown): void {
    if (typeof callback !== 'function') throw new TypeError('The callback must be a function');
    hostQueueMicrotask(() => {
      if (this.live) this.invoke(callback as () => unknown, []);
    });
  }

  /** Waits until no timer is pending or the case failed; returns the failure, if any. */
  async settle(): Promise<string | undefined> {
    for (;;) {
      // Two task boundaries: queued promise callbacks run and unhandled
      // rejections are reported (browsers report them in a task of their own).
      await nextTask();
      await nextTask();
      if (this.failure !== undefined || this.timers.size === 0) return this.failure;
      await new Promise<void>((resolve) => {
        this.wake = resolve;
      });
      this.wake = () => {};
    }
  }

  close(): void {
    this.open = false;
    for (const handle of this.timers.values()) hostClearTimeout(handle);
    this.timers.clear();
    this.wake();
  }
}

function createConsole(scope: CaseScope, emit: Emit) {
  const writer =
    (stream: 'stdout' | 'stderr') =>
    (...args: unknown[]) => {
      if (scope.live) emit(stream, `${args.map(formatValue).join(' ')}\n`);
    };
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

/** The values of `PROVIDED`, in order. */
function runtimeFor(scope: CaseScope, stdin: string, emit: Emit): unknown[] {
  return [
    createConsole(scope, emit),
    createInput(stdin),
    (callback: unknown, delay?: unknown, ...args: unknown[]) => scope.schedule(false, callback, delay, args),
    (callback: unknown, delay?: unknown, ...args: unknown[]) => scope.schedule(true, callback, delay, args),
    (id: unknown) => scope.clear(id),
    (id: unknown) => scope.clear(id),
    (callback: unknown) => scope.enqueueMicrotask(callback),
  ];
}

export type JavaScriptRunner = (source: string, stdin: string, emit: Emit) => Promise<EngineCaseOutput>;

/**
 * Returns the function that runs a JavaScript program (top-level `await`
 * allowed) with `console`, `input()` and timers. Cases run one at a time.
 */
export function createJavaScriptRunner(env: EngineEnv): JavaScriptRunner {
  let active: CaseScope | undefined;
  // A rejection reported while no case runs belongs to a finished case: drop it.
  env.onUnhandledRejection((reason) => active?.fail(describeRejection(reason)));

  return async (source, stdin, emit) => {
    const scope = new CaseScope();
    active = scope;
    try {
      const program = new AsyncFunction(...PARAMS, source);
      const hidden = HIDDEN.map(() => undefined);
      const finished = program(...runtimeFor(scope, stdin, emit), ...hidden).then(
        () => scope.settle(),
        (error: unknown) => describeThrown(error),
      );
      // A failing callback ends the case even while the body still awaits.
      const error = await Promise.race([finished, scope.failed]);
      return error === undefined ? { exitCode: 0 } : { exitCode: 1, error };
    } catch (error) {
      return { exitCode: 1, error: describeThrown(error) };
    } finally {
      scope.close();
      if (active === scope) active = undefined;
    }
  };
}

export const createJavaScriptEngine: EngineFactory = async (env) => {
  const run = createJavaScriptRunner(env);
  return {
    async compile(source) {
      try {
        new AsyncFunction(...PARAMS, source);
        return null;
      } catch (error) {
        if (error instanceof SyntaxError) return `SyntaxError: ${error.message}`;
        throw error;
      }
    },
    runCase: (input, emit) => run(input.source, input.stdin, emit),
  };
};
