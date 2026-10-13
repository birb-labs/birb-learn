import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createNodeRunner } from '../node';

const runner = createNodeRunner();

afterAll(() => {
  runner.dispose();
});

// Load the WASM runtime once, before the tests that need it.
beforeAll(async () => {
  await runner.runCode({ language: 'lua', source: 'local _ = 1' });
});

async function run(source: string, stdin = '') {
  const result = await runner.runCode({ language: 'lua', source, cases: [{ stdin }] });
  return result.cases[0];
}

describe('Lua engine (Node worker)', () => {
  it('reads a number from stdin', async () => {
    const result = await runner.runCode({ language: 'lua', source: "print(io.read('n') * 2)", cases: [{ stdin: '21' }] });
    expect(result.status).toBe('ok');
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: '42\n', stderr: '', exitCode: 0 });
  });

  it('prints tab-separated values and nil', async () => {
    expect((await run("print('a', 1, nil)")).stdout).toBe('a\t1\tnil\n');
  });

  it('prints with an empty argument list', async () => {
    expect((await run('print()')).stdout).toBe('\n');
  });

  it('writes without separators or newline', async () => {
    expect((await run("io.write('x', 1)")).stdout).toBe('x1');
  });

  it('chains io.write calls', async () => {
    expect((await run("io.write('a'):write('b')")).stdout).toBe('ab');
  });

  it('returns nil once stdin is exhausted', async () => {
    expect((await run('print(io.read())\nprint(io.read())', 'a')).stdout).toBe('a\nnil\n');
  });

  it('echoes non-ASCII stdin exactly', async () => {
    const text = 'Olá, ñ, ç, 🙂';
    expect((await run('print(io.read())', text)).stdout).toBe(`${text}\n`);
  });

  it('writes non-ASCII output exactly', async () => {
    const text = 'Olá, ñ, ç, 🙂';
    expect((await run(`print('${text}')`)).stdout).toBe(`${text}\n`);
  });

  it('does not corrupt a character split across two writes', async () => {
    const source = "io.write('\\xc3'); io.write('\\xa7'); io.write('\\xf0\\x9f'); io.write('\\x99\\x82')";
    expect((await run(source)).stdout).toBe('ç🙂');
  });

  it('reads lines with every line format', async () => {
    const source = [
      "print(io.read('l'))",
      "print(io.read('*l'))",
      'print(io.read())',
      "print(io.read('L'))",
      'print(io.read())',
    ].join('\n');
    const result = await run(source, 'one\ntwo\n\nfour\n');
    expect(result.stdout).toBe('one\ntwo\n\nfour\n\nnil\n');
  });

  it('keeps an empty trailing line distinct from the end of the input', async () => {
    const result = await run('print(io.read())\nprint(io.read())\nprint(io.read())', 'a\n');
    expect(result.stdout).toBe('a\nnil\nnil\n');
  });

  it('parses numbers one line at a time', async () => {
    const source = "print(io.read('n'), io.read('*n'), io.read('n'), io.read('n'))";
    expect((await run(source, '1\n2.5\nabc\n')).stdout).toBe('1\t2.5\tnil\tnil\n');
  });

  it('reads several formats in one call', async () => {
    expect((await run("print(io.read('n', 'l'))", '7\nrest')).stdout).toBe('7\trest\n');
  });

  it('reads the rest of the input', async () => {
    const source = "print(io.read())\nprint(io.read('a'))\nprint(io.read('*a') == '')\nprint(io.read())";
    expect((await run(source, 'first\nsecond\nthird')).stdout).toBe('first\nsecond\nthird\ntrue\nnil\n');
  });

  it('reads standard input through io.stdin and io.lines', async () => {
    const source = "print(io.stdin:read())\nfor line in io.lines() do print('>' .. line) end";
    expect((await run(source, 'a\nb\nc\n')).stdout).toBe('a\n>b\n>c\n');
  });

  it('writes to stderr through io.stderr', async () => {
    const result = await run("io.stdout:write('out'); io.stderr:write('err')");
    expect(result).toMatchObject({ status: 'ok', stdout: 'out', stderr: 'err' });
  });

  it('reports syntax errors as compile_error with the line', async () => {
    const result = await runner.runCode({ language: 'lua', source: 'x = = 1' });
    expect(result.status).toBe('compile_error');
    expect(result.compileOutput).toContain('main.lua:1');
  });

  it('accepts source text without interpolating it into Lua code', async () => {
    const source = 'print([==[" ]] ]=] \\ \']==])';
    expect((await run(source)).stdout).toBe('" ]] ]=] \\ \'\n');
  });

  it('reports runtime errors with the chunk name and line', async () => {
    const result = await run("print('before')\nerror('boom')");
    expect(result).toMatchObject({ status: 'runtime_error', exitCode: 1, stdout: 'before\n' });
    expect(result.stderr).toContain('main.lua:2: boom');
  });

  it('reports errors raised by the runtime', async () => {
    const result = await run('local t = nil\nprint(t.x)');
    expect(result).toMatchObject({ status: 'runtime_error', exitCode: 1 });
    expect(result.stderr).toContain('main.lua:2: attempt to index a nil value');
  });

  it('describes non-string error values', async () => {
    expect((await run('error({})')).stderr).toContain('(error object is a table value)');
    expect((await run('error(42)')).stderr).toContain('42');
    expect((await run("error(setmetatable({}, { __tostring = function() return 'custom' end }))")).stderr).toContain(
      'custom',
    );
    expect((await run('error()')).stderr).toContain('nil');
  });

  it('maps os.exit to the exit code', async () => {
    expect(await run('os.exit(3)')).toMatchObject({ status: 'runtime_error', exitCode: 3 });
    expect(await run('os.exit(0)')).toMatchObject({ status: 'ok', exitCode: 0 });
    expect(await run('os.exit(true)')).toMatchObject({ status: 'ok', exitCode: 0 });
    expect(await run('os.exit(false)')).toMatchObject({ status: 'runtime_error', exitCode: 1 });
    expect(await run('os.exit()')).toMatchObject({ status: 'ok', exitCode: 0 });
    expect(await run('os.exit(256)')).toMatchObject({ status: 'ok', exitCode: 0 });
    expect(await run('os.exit(-1)')).toMatchObject({ status: 'runtime_error', exitCode: 255 });
    expect(await run('os.exit(3.0)')).toMatchObject({ exitCode: 3 });
  });

  it('keeps output written before os.exit and nothing after it', async () => {
    const result = await run("print('a')\nos.exit(2)\nprint('b')");
    expect(result).toMatchObject({ stdout: 'a\n', exitCode: 2, stderr: '' });
  });

  it('cannot swallow os.exit with pcall, xpcall or a coroutine', async () => {
    expect(await run("pcall(os.exit, 4)\nprint('after pcall')")).toMatchObject({ stdout: '', exitCode: 4 });
    expect(await run('xpcall(os.exit, print, 5)\nprint(1)')).toMatchObject({ stdout: '', exitCode: 5 });
    expect(await run('coroutine.resume(coroutine.create(function() os.exit(6) end))\nprint(1)')).toMatchObject({
      stdout: '',
      exitCode: 6,
    });
  });

  it('does not leak globals or overridden functions between cases', async () => {
    const source = [
      "if io.read() == 'define' then",
      '  x = 1',
      '  print = function() end',
      '  io.read = function() return "hijacked" end',
      '  package.loaded.leak = true',
      'end',
      'print(x, package.loaded.leak, io.read ~= nil)',
    ].join('\n');
    const result = await runner.runCode({
      language: 'lua',
      source,
      cases: [{ stdin: 'define' }, { stdin: 'skip' }],
    });
    expect(result.cases[0].stdout).toBe('');
    expect(result.cases[1].stdout).toBe('nil\tnil\ttrue\n');
  });

  it('does not expose the support code or the source to the program', async () => {
    const source = [
      'local names = {}',
      'for name in pairs(_G) do names[#names + 1] = name end',
      'table.sort(names)',
      "print(table.concat(names, ' '))",
    ].join('\n');
    const { stdout } = await run(source);
    expect(stdout).not.toMatch(/__|support|source|emit/i);
  });

  it('refuses file system access', async () => {
    const source = "print(io.open('note.txt', 'w'))\nprint(pcall(dofile, 'x.lua'))\nprint(os.remove('x'))";
    const { stdout, status } = await run(source);
    expect(status).toBe('ok');
    expect(stdout.split('\n')[0]).toMatch(/^nil\t.*note\.txt/);
    expect(stdout).toContain('false');
  });

  it('keeps warnings out of the student output unless enabled', async () => {
    const result = await run("warn('hidden')\nwarn('@on')\nwarn('shown ', 'twice')");
    expect(result).toMatchObject({ status: 'ok', stdout: '' });
    expect(result.stderr).toBe('Lua warning: shown twice\n');
  });

  it('times out an infinite loop and recovers for the next run', async () => {
    const hung = await runner.runCode({ language: 'lua', source: 'while true do end', timeoutMs: 1000 });
    expect(hung.cases[0].status).toBe('timeout');
    const next = await runner.runCode({ language: 'lua', source: 'print(1)' });
    expect(next.status).toBe('ok');
    expect(next.cases[0]).toMatchObject({ status: 'ok', stdout: '1\n' });
  });
});
