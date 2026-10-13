import type { RubyVM } from '@ruby/wasm-wasi';
import { streamWriter } from './stream-writer';
import type { Emit, EngineEnv, EngineFactory } from './types';

const PROGRAM_NAME = 'main.rb';
/** Package that ships the Ruby build; keep it in sync with the Ruby version taught. */
const RUBY_PACKAGE = '@ruby/4.0-wasm-wasi';

// The student's source is never part of this code: it is passed to the lambdas
// below through the VM global `$__src`, which they read and clear before the
// program starts. They are evaluated once per VM and kept by the host, so the
// program cannot reach their locals.

const COMPILE_SCRIPT = String.raw`
lambda do |sink|
  source = $__src
  $__src = nil
  begin
    RubyVM::InstructionSequence.compile(source, 'main.rb')
    sink.call(:done, nil, nil)
  rescue SyntaxError => error
    sink.call(:done, nil, error.detailed_message(highlight: false))
  end
end
`;

// The program may redefine almost anything: core methods, exception classes,
// the standard streams. Everything this code needs after the program ran is
// therefore captured first (classes in locals, methods as unbound methods), and
// it only reaches back to the host through the JS object `sink`. Frames and
// message are sent as they are; the host picks the frames of the program.
const RUN_SCRIPT = String.raw`
lambda do |sink|
  source = $__src
  $__src = nil

  base_error = Exception
  exit_error = SystemExit
  main_binding = TOPLEVEL_BINDING
  stdout = $stdout
  stderr = $stderr
  flush = IO.instance_method(:flush)
  set_sync = IO.instance_method(:sync=)
  status_of = SystemExit.instance_method(:status)
  detail_of = Exception.instance_method(:detailed_message)
  backtrace_of = Exception.instance_method(:backtrace)
  each_item = Array.instance_method(:each)

  # Nothing may wait in a buffer when the program ends abruptly (exit!, a crash).
  set_sync.bind_call(stdout, true)
  set_sync.bind_call(stderr, true)
  $0 = 'main.rb'

  code = 0
  failure = nil
  begin
    eval(source, main_binding, 'main.rb')
  rescue exit_error => error
    code = status_of.bind_call(error)
  rescue base_error => error
    code = 1
    failure = error
  end

  begin
    flush.bind_call(stdout)
  rescue base_error
  end
  begin
    flush.bind_call(stderr)
  rescue base_error
  end

  message = nil
  if failure
    begin
      message = detail_of.bind_call(failure, highlight: false)
      frames = backtrace_of.bind_call(failure)
      each_item.bind_call(frames) { |frame| sink.call(:frame, frame) } if frames
    rescue base_error
      message = 'The error could not be described'
    end
  end
  sink.call(:done, code, message)
end
`;

/** Where the bytes of the Ruby module are read from: the file in Node, the CDN in browsers. */
async function fetchModuleBytes(env: EngineEnv): Promise<ArrayBuffer | Uint8Array> {
  const url = env.assetUrl(RUBY_PACKAGE, 'dist/ruby+stdlib.wasm');
  if (env.isNode) {
    const [{ readFile }, { fileURLToPath }] = await Promise.all([import('node:fs/promises'), import('node:url')]);
    return readFile(fileURLToPath(url));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download the Ruby runtime (${response.status})`);
  return response.arrayBuffer();
}

type Stream = 'stdout' | 'stderr';

interface Machine {
  vm: RubyVM;
  /** Finishes the decoders of the output streams, emitting any bytes of an unfinished character. */
  finishOutput(): void;
}

/** What the lambdas report back to the host. */
interface Outcome {
  code: number | null;
  message: string | null;
  frames: string[];
}

// A deep recursion has thousands of frames; Ruby itself shows a handful.
const MAX_FRAMES = 20;

// WASI reports the output streams as terminals, so Ruby colors the code frames
// of its syntax errors. The student sees plain text.
const COLOR_CODES = /\u001b\[[0-9;]*m/g;

function plainText(text: string): string {
  return text.replace(COLOR_CODES, '').trimEnd();
}

/** Formats an uncaught exception like the `ruby` command, with the frames of the program only. */
function formatFailure(rawMessage: string, frames: string[]): string {
  const message = plainText(rawMessage);
  const own = frames.filter((frame) => frame.startsWith(`${PROGRAM_NAME}:`));
  if (own.length === 0) return message;
  const shown = own.slice(0, MAX_FRAMES);
  const [first, ...rest] = shown;
  const lines = [`${first}: ${message}`, ...rest.map((frame) => `\tfrom ${frame}`)];
  if (own.length > shown.length) lines.push(`\t ... ${own.length - shown.length} levels...`);
  return lines.join('\n');
}

export const createRubyEngine: EngineFactory = async (env) => {
  const [{ RubyVM }, { WASI, WASIProcExit, OpenFile, File: WasiFile, ConsoleStdout }, bytes] = await Promise.all([
    import('@ruby/wasm-wasi'),
    import('@bjorn3/browser_wasi_shim'),
    fetchModuleBytes(env),
  ]);
  // Compiled once; every VM is an instance of this module.
  const module = await WebAssembly.compile(bytes as BufferSource);

  async function startMachine(stdin: string, emit: Emit | null): Promise<Machine> {
    const writers = (['stdout', 'stderr'] as const).map((stream: Stream) => (emit ? streamWriter(emit, stream) : null));
    const output = writers.map((writer) => new ConsoleStdout((chunk) => void writer?.write(chunk)));
    const wasi = new WASI(
      [PROGRAM_NAME],
      [],
      [new OpenFile(new WasiFile(new TextEncoder().encode(stdin))), output[0], output[1]],
      { debug: false },
    );
    const { vm } = await RubyVM.instantiateModule({ module, wasip1: wasi });
    return { vm, finishOutput: () => writers.forEach((writer) => writer?.finish()) };
  }

  /** Runs one of the scripts above on a VM and returns what it reported. */
  function runScript(vm: RubyVM, script: string, source: string): Outcome {
    const outcome: Outcome = { code: null, message: null, frames: [] };
    const sink = {
      frame: (frame: string) => void outcome.frames.push(frame),
      done: (code: number | null, message: string | null) => {
        outcome.code = code;
        outcome.message = message;
      },
    };
    vm.eval('->(source) { $__src = source.to_s }').call('call', vm.wrap(source));
    vm.eval(script).call('call', vm.wrap(sink));
    return outcome;
  }

  // Compiling runs no program, so one VM serves every syntax check.
  let compiler: Promise<Machine> | undefined;

  return {
    async compile(source) {
      compiler ??= startMachine('', null);
      try {
        const { vm } = await compiler;
        const { message } = runScript(vm, COMPILE_SCRIPT, source);
        return message === null ? null : plainText(message);
      } catch (error) {
        // The VM may be broken (for example, out of memory): start a new one next time.
        compiler = undefined;
        throw error;
      }
    },
    async runCase(input, emit) {
      const { vm, finishOutput } = await startMachine(input.stdin, emit);
      try {
        const { code, message, frames } = runScript(vm, RUN_SCRIPT, input.source);
        if (typeof code !== 'number') return { exitCode: 1, error: 'The Ruby program ended without a result' };
        // Like a process exit status.
        const exitCode = code & 0xff;
        return message === null ? { exitCode } : { exitCode, error: formatFailure(message, frames) };
      } catch (error) {
        // `exit!` leaves the VM through the WASI exit call.
        if (error instanceof WASIProcExit) return { exitCode: error.code & 0xff };
        return { exitCode: 1, error: error instanceof Error ? error.message : String(error) };
      } finally {
        finishOutput();
      }
    },
  };
};
