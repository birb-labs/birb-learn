import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createNodeRunner } from '../node';

const runner = createNodeRunner();

afterAll(() => {
  runner.dispose();
});

// Load the WASM runtime once, before the tests that need it.
beforeAll(async () => {
  await runner.runCode({ language: 'ruby', source: '_ = 1' });
}, 120_000);

async function run(source: string, stdin = '') {
  const result = await runner.runCode({ language: 'ruby', source, cases: [{ stdin }] });
  return result.cases[0];
}

// Names of the engine's own code, which must never reach the student.
const INTERNAL_NAME = /(^|\s)-e:|(^|\s)eval:\d|ruby\.wasm|harness|support|\/usr\/|\/lib\/ruby|<internal|__src/;

describe('Ruby engine (Node worker)', () => {
  it('reads a number from stdin', async () => {
    const result = await runner.runCode({ language: 'ruby', source: 'puts gets.to_i * 2', cases: [{ stdin: '21' }] });
    expect(result.status).toBe('ok');
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: '42\n', stderr: '', exitCode: 0 });
  });

  it('keeps the newline in gets only when the input has one', async () => {
    expect((await run('p gets\np gets', 'a')).stdout).toBe('"a"\nnil\n');
    expect((await run('p gets\np gets\np gets', 'a\nb\n')).stdout).toBe('"a\\n"\n"b\\n"\nnil\n');
  });

  it('reads standard input in every usual way', async () => {
    expect((await run('p STDIN.read', 'a\nb')).stdout).toBe('"a\\nb"\n');
    expect((await run('p $stdin.each_line.map(&:chomp)', 'a\nb\n')).stdout).toBe('["a", "b"]\n');
    expect((await run('p readlines.size', 'a\nb\nc')).stdout).toBe('3\n');
    expect((await run('p gets', '')).stdout).toBe('nil\n');
  });

  it('echoes non-ASCII stdin exactly', async () => {
    const text = 'Olá, ñ, ç, 🙂';
    expect((await run('puts gets', text)).stdout).toBe(`${text}\n`);
    expect((await run('p gets.encoding, gets', `${text}\n`)).stdout).toBe('#<Encoding:UTF-8>\nnil\n');
  });

  it('writes non-ASCII output exactly', async () => {
    const text = 'Olá, ñ, ç, 🙂';
    expect((await run(`puts '${text}'`)).stdout).toBe(`${text}\n`);
  });

  it('does not corrupt a character split across two writes', async () => {
    const source = "$stdout.write(\"\\xc3\".b); $stdout.write(\"\\xa7\".b); $stdout.write(\"\\xf0\\x9f\".b); $stdout.write(\"\\x99\\x82\".b)";
    expect((await run(source)).stdout).toBe('ç🙂');
  });

  it('writes to stdout and stderr through every usual way', async () => {
    const source = "print 'a'; $stdout << 'b'; STDOUT.puts 'c'; $stderr.puts 'd'; warn 'e'; STDERR.print 'f'";
    const result = await run(source);
    expect(result).toMatchObject({ status: 'ok', stdout: 'abc\n', stderr: 'd\ne\nf' });
  });

  it('keeps output that was not flushed by the program', async () => {
    const result = await run("$stdout.sync = false\n$stderr.sync = false\nprint 'a'\n$stderr.print 'b'");
    expect(result).toMatchObject({ status: 'ok', stdout: 'a', stderr: 'b' });
  });

  it('runs the standard library', async () => {
    const source = "require 'json'\nrequire 'set'\nrequire 'stringio'\nputs JSON.generate([1, Set.new([2]).to_a]) + StringIO.new('x').read";
    expect((await run(source)).stdout).toBe('[1,[2]]x\n');
  });

  it('reports syntax errors as compile_error naming the program', async () => {
    const result = await runner.runCode({ language: 'ruby', source: 'def x(' });
    expect(result.status).toBe('compile_error');
    expect(result.compileOutput).toContain('main.rb');
    expect(result.compileOutput).not.toContain('\u001b');
  });

  it('shows the runtime syntax errors of eval as plain text', async () => {
    const result = await run('eval("1 +")');
    expect(result.status).toBe('runtime_error');
    expect(result.stderr).toContain('(SyntaxError)');
    expect(result.stderr).not.toContain('\u001b');
  });

  it('runs the program as the main script', async () => {
    expect((await run('puts __FILE__, $0, __FILE__ == $0, $PROGRAM_NAME')).stdout).toBe('main.rb\nmain.rb\ntrue\nmain.rb\n');
    expect((await run('p ARGV')).stdout).toBe('[]\n');
  });

  it('accepts a program that is valid but warns while compiling', async () => {
    const result = await runner.runCode({ language: 'ruby', source: 'x = 1\nx == 2\nputs "ok"' });
    expect(result.status).toBe('ok');
    expect(result.cases[0].stdout).toBe('ok\n');
  });

  it('accepts source text without interpolating it into Ruby code', async () => {
    const source = 'puts "\\" \'; end } =begin \\\\ #{1 + 1} $__src"\n__END__\nignored';
    expect((await run(source)).stdout).toBe('" \'; end } =begin \\ 2 $__src\n');
  });

  it('reports uncaught exceptions with the message, the class and the program position', async () => {
    const result = await run("puts 'before'\ndef boom\n  raise ArgumentError, 'bad'\nend\nboom");
    expect(result).toMatchObject({ status: 'runtime_error', exitCode: 1, stdout: 'before\n' });
    expect(result.stderr).toContain("main.rb:3:in 'Object#boom': bad (ArgumentError)");
    expect(result.stderr).toContain("from main.rb:5:in '<main>'");
  });

  it('reports errors raised by the runtime', async () => {
    const nilCall = await run('x = nil\nx.upcase');
    expect(nilCall).toMatchObject({ status: 'runtime_error', exitCode: 1 });
    expect(nilCall.stderr).toContain('main.rb:2');
    expect(nilCall.stderr).toContain("undefined method 'upcase' for nil (NoMethodError)");
    expect((await run('1 / 0')).stderr).toContain('divided by 0 (ZeroDivisionError)');
  });

  it('reports errors from a block with the frames of the program only', async () => {
    const result = await run("[1].each do |n|\n  raise 'in block'\nend");
    expect(result.stderr).toContain("main.rb:2:in 'block in <main>': in block (RuntimeError)");
    expect(result.stderr).toContain("from main.rb:1:in 'Array#each'");
  });

  it('keeps multi-line messages readable', async () => {
    const result = await run("raise \"first\\nsecond\"");
    expect(result.stderr).toContain('first (RuntimeError)\nsecond');
  });

  it('truncates the backtrace of a runaway recursion', async () => {
    const result = await run('def f(n)\n  f(n + 1)\nend\nf(0)');
    expect(result).toMatchObject({ status: 'runtime_error', exitCode: 1 });
    expect(result.stderr).toContain('stack level too deep (SystemStackError)');
    expect(result.stderr.split('\n').length).toBeLessThan(60);
  });

  it('maps exit to the exit code', async () => {
    expect(await run('exit')).toMatchObject({ status: 'ok', exitCode: 0 });
    expect(await run('exit(true)')).toMatchObject({ status: 'ok', exitCode: 0 });
    expect(await run('exit(false)')).toMatchObject({ status: 'runtime_error', exitCode: 1 });
    expect(await run('exit(3)')).toMatchObject({ status: 'runtime_error', exitCode: 3 });
    expect(await run('exit(256)')).toMatchObject({ status: 'ok', exitCode: 0 });
    expect(await run('exit(-1)')).toMatchObject({ status: 'runtime_error', exitCode: 255 });
    expect(await run('exit(3.0)')).toMatchObject({ exitCode: 3 });
    expect(await run("Process.exit(4)")).toMatchObject({ exitCode: 4 });
  });

  it('keeps output written before exit and nothing after it', async () => {
    const result = await run("puts 'a'\nexit(2)\nputs 'b'");
    expect(result).toMatchObject({ stdout: 'a\n', exitCode: 2, stderr: '' });
  });

  it('runs ensure blocks and lets rescue => e ignore exit', async () => {
    const source = "begin\n  begin\n    exit(2)\n  rescue => e\n    puts 'rescued'\n  ensure\n    puts 'ensured'\n  end\nend";
    expect(await run(source)).toMatchObject({ stdout: 'ensured\n', exitCode: 2 });
  });

  it('lets a program swallow SystemExit and keep going', async () => {
    const source = "begin\n  exit(2)\nrescue SystemExit => e\n  puts \"status #{e.status}\"\nend\nputs 'after'";
    expect(await run(source)).toMatchObject({ status: 'ok', stdout: 'status 2\nafter\n', exitCode: 0 });
  });

  it('handles exit! and abort', async () => {
    expect(await run("puts 'a'\nexit!(3)\nputs 'b'")).toMatchObject({ stdout: 'a\n', exitCode: 3 });
    expect(await run('exit!(true)')).toMatchObject({ status: 'ok', exitCode: 0 });
    expect(await run('exit!')).toMatchObject({ status: 'runtime_error', exitCode: 1 });
    expect(await run("puts 'a'\nabort('giving up')\nputs 'b'")).toMatchObject({
      status: 'runtime_error',
      stdout: 'a\n',
      stderr: 'giving up\n',
      exitCode: 1,
    });
    expect(await run('abort')).toMatchObject({ exitCode: 1, stderr: '' });
  });

  it('does not leak constants, globals or monkeypatches between cases', async () => {
    const source = [
      "if gets.chomp == 'define'",
      '  X = 1',
      '  $leak = true',
      '  class Integer; def double = self * 2; end',
      "  class Greeter; def hi = 'hi'; end",
      '  def helper = 1',
      "  ENV['LEAK'] = '1'",
      'end',
      'puts [defined?(X).inspect, $leak.inspect, 1.respond_to?(:double), defined?(Greeter).inspect, respond_to?(:helper, true), ENV.key?("LEAK")].join(" ")',
    ].join('\n');
    const result = await runner.runCode({
      language: 'ruby',
      source,
      cases: [{ stdin: 'define' }, { stdin: 'skip' }],
    });
    expect(result.cases[0].stdout).toBe('"constant" true true "constant" true true\n');
    expect(result.cases[1].stdout).toBe('nil nil false nil false false\n');
  });

  it('isolates two cases with a defined constant', async () => {
    const source = "if gets.chomp == 'define'\n  X = 1\nelse\n  puts defined?(X).inspect\nend";
    const result = await runner.runCode({
      language: 'ruby',
      source,
      cases: [{ stdin: 'define' }, { stdin: 'check' }],
    });
    expect(result.cases[0].stdout).toBe('');
    expect(result.cases[1].stdout).toBe('nil\n');
  });

  it('does not let a rebound $stdout reach the next case', async () => {
    const source = [
      "if gets.chomp == 'hide'",
      "  require 'stringio'",
      '  $stdout = StringIO.new',
      '  $stderr = StringIO.new',
      "  puts 'hidden'",
      "  warn 'hidden too'",
      'else',
      "  puts 'visible'",
      "  warn 'visible too'",
      'end',
    ].join('\n');
    const result = await runner.runCode({
      language: 'ruby',
      source,
      cases: [{ stdin: 'hide' }, { stdin: 'show' }],
    });
    expect(result.cases[0]).toMatchObject({ stdout: '', stderr: '', exitCode: 0 });
    expect(result.cases[1]).toMatchObject({ stdout: 'visible\n', stderr: 'visible too\n', exitCode: 0 });
  });

  it('does not expose the source or the support code to the program', async () => {
    const source = [
      'p $__src',
      'p global_variables.grep(/__|support|harness/i)',
      'p local_variables',
      'p Object.constants.grep(/support|harness|birb/i)',
    ].join('\n');
    expect((await run(source)).stdout).toBe('nil\n[:$__src]\n[]\n[]\n');
  });

  describe('insulation from the program', () => {
    const variants: [string, string][] = [
      ['redefines Kernel#puts and print', 'module Kernel\n  def puts(*) = raise("no puts")\n  def print(*) = raise("no print")\nend'],
      ['redefines IO methods', 'class IO\n  def write(*) = nil\n  def flush = raise("no flush")\n  def sync=(value)\n    nil\n  end\n  def <<(*) = self\nend'],
      ['rebinds the standard streams', 'sink = Object.new\ndef sink.write(*) = 0\n$stdout = sink\n$stderr = sink\n$stdin = 5'],
      ['redefines String methods', 'class String\n  def force_encoding(*) = raise("no")\n  def start_with?(*) = false\n  def +(*) = raise("no")\n  def to_s = "x"\n  def lines = []\nend'],
      ['redefines Exception#backtrace and #full_message', 'class Exception\n  def backtrace = nil\n  def full_message(**) = raise("no")\nend'],
      ['makes Exception#message fail', 'class Exception\n  def message = raise("no")\n  def detailed_message(**) = raise("no")\nend'],
      ['redefines SystemExit#status', 'class SystemExit\n  def status = 77\n  def success? = false\nend'],
      ['redefines Integer, Array and Object methods', 'class Integer\n  def to_s(*) = "x"\n  def &(_) = 99\nend\nclass Array\n  def first = nil\n  def join(*) = ""\n  def each = nil\n  def select = []\nend\nclass Object\n  def nil? = false\n  def class = String\nend'],
      ['redefines Proc and Module methods', 'class Proc\n  def call(*) = nil\n  def to_proc = nil\nend\nclass Module\n  def instance_method(*) = nil\n  def name = "x"\nend'],
      ['redefines JS::Object#call', 'class JS::Object\n  def call(*) = nil\nend'],
      ['redefines Module#=== to never match', 'class Module\n  def ===(other) = false\nend'],
      ['redefines Module#=== to fail', 'class Module\n  def ===(other) = raise("no")\nend'],
      ['redefines Kernel#eval', 'module Kernel\n  def eval(*) = raise("no eval")\nend'],
      ['redefines raise, exit and abort', 'module Kernel\n  def raise(*) = nil\n  def exit(*) = nil\n  def abort(*) = nil\n  def loop = nil\nend'],
    ];

    it.each(variants)('keeps the exit code when the program %s', async (_title, tamper) => {
      const result = await run(`puts 'hi'\n${tamper}\nProcess.exit(0)`);
      expect(result).toMatchObject({ status: 'ok', stdout: 'hi\n', stderr: '', exitCode: 0 });
    });

    it.each(variants)('keeps the exit status when the program %s', async (_title, tamper) => {
      const result = await run(`puts 'hi'\n${tamper}\nProcess.exit(4)`);
      expect(result).toMatchObject({ status: 'runtime_error', stdout: 'hi\n', exitCode: 4 });
    });

    it.each(variants)('still reports an uncaught error when the program %s', async (_title, tamper) => {
      const result = await run(`puts 'hi'\n${tamper}\nObject.new.undefined_thing`);
      expect(result).toMatchObject({ status: 'runtime_error', stdout: 'hi\n', exitCode: 1 });
      expect(result.stderr).not.toMatch(INTERNAL_NAME);
      // A message that cannot be read cannot be shown, but the exit code still holds.
      if (!tamper.includes('def message')) expect(result.stderr).toMatch(/main\.rb:\d+:in '<main>': undefined method 'undefined_thing'/);
    });

    it('reports a generic error, never the support frames, when the runner cannot recover', async () => {
      const result = await run("puts 'hi'\nclass UnboundMethod\n  def bind_call(*) = raise('no')\nend\nProcess.exit(0)");
      expect(result).toMatchObject({ status: 'runtime_error', stdout: 'hi\n', exitCode: 1 });
      expect(result.stderr).toContain('the program interfered with the runner');
      expect(result.stderr).not.toMatch(INTERNAL_NAME);
      expect(result.stderr).not.toMatch(/-e|eval|RbError/);
    });

    it('reports a program that returns normally after tampering as ok', async () => {
      const result = await run("puts 'hi'\nclass IO; def flush = raise('no'); end\nclass Exception; def message = raise('no'); end");
      expect(result).toMatchObject({ status: 'ok', stdout: 'hi\n', stderr: '', exitCode: 0 });
    });
  });

  it('never shows the engine code in error output', async () => {
    const failing = [
      "raise 'x'",
      'undefined_local',
      'nil.foo',
      '1 / 0',
      'Integer("x")',
      '[1].fetch(5)',
      'def f = f\nf',
      "eval('1 +')",
      "eval('raise \"inner\"')",
      "require 'definitely_missing_library'",
      "require 'json'\nJSON.parse('{')",
      'throw :nobody',
      "raise Class.new(StandardError), 'anonymous'",
      "[1, 2].each { |n| [3].map { raise 'nested' } }",
      "Thread.new { raise 'in thread' }.join",
      "raise Exception, 'base'",
      "class Foo; def to_s = raise('in to_s'); end\nputs Foo.new",
      'File.read("/etc/passwd")',
      "Float('x')",
      "x = 5\nx.fetch",
    ];
    for (const source of failing) {
      const result = await run(source);
      expect([source, result.status]).toEqual([source, 'runtime_error']);
      expect([source, result.stderr]).toEqual([source, expect.not.stringMatching(INTERNAL_NAME)]);
      for (const line of result.stderr.split('\n')) {
        if (/:\d+:in /.test(line)) expect([source, line]).toEqual([source, expect.stringMatching(/main\.rb:\d+:in /)]);
      }
    }
  });

  it('times out an infinite loop and recovers for the next run', async () => {
    const hung = await runner.runCode({ language: 'ruby', source: 'loop {}', timeoutMs: 1000 });
    expect(hung.cases[0].status).toBe('timeout');
    const next = await runner.runCode({ language: 'ruby', source: 'puts 1' });
    expect(next.status).toBe('ok');
    expect(next.cases[0]).toMatchObject({ status: 'ok', stdout: '1\n' });
  }, 130_000);
});
