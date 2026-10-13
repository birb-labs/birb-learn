import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createNodeRunner } from '../node';

const runner = createNodeRunner();

afterAll(() => {
  runner.dispose();
});

// Pyodide's cold start is slow: load it once, before the tests that need it.
beforeAll(async () => {
  await runner.runCode({ language: 'python', source: 'pass' });
});

describe('Python engine (Node worker)', () => {
  it('reads stdin per case and runs every case against the same program', async () => {
    const result = await runner.runCode({
      language: 'python',
      source: 'print(int(input()) * 2)',
      cases: [{ stdin: '21' }, { stdin: '5' }],
    });
    expect(result.status).toBe('ok');
    expect(result.cases.map((c) => c.stdout)).toEqual(['42\n', '10\n']);
    expect(result.cases[0]).toMatchObject({ status: 'ok', stderr: '', exitCode: 0 });
  });

  it('does not leak globals between cases', async () => {
    const result = await runner.runCode({
      language: 'python',
      source: "if input() == 'define':\n    x = 1\nprint('x' in globals())",
      cases: [{ stdin: 'define' }, { stdin: 'skip' }],
    });
    expect(result.status).toBe('ok');
    expect(result.cases.map((c) => c.stdout)).toEqual(['True\n', 'False\n']);
  });

  it('runs the program as __main__', async () => {
    const result = await runner.runCode({
      language: 'python',
      source: "if __name__ == '__main__':\n    print('main')",
    });
    expect(result.cases[0].stdout).toBe('main\n');
  });

  it('writes non-ASCII output exactly', async () => {
    const text = 'Olá, ñ, ç, 🙂';
    const result = await runner.runCode({ language: 'python', source: `print('${text}')` });
    expect(result.status).toBe('ok');
    expect(result.cases[0].stdout).toBe(`${text}\n`);
  });

  it('round-trips non-ASCII stdin exactly', async () => {
    const text = 'Olá, ñ, ç, 🙂';
    const result = await runner.runCode({ language: 'python', source: 'print(input())', cases: [{ stdin: text }] });
    expect(result.status).toBe('ok');
    expect(result.cases[0].stdout).toBe(`${text}\n`);
  });

  it('does not corrupt multi-byte characters at chunk boundaries', async () => {
    const result = await runner.runCode({ language: 'python', source: "print('ç' * 20000)" });
    expect(result.status).toBe('ok');
    expect(result.cases[0]).toMatchObject({ status: 'ok' });
    expect(result.cases[0].stdout).toBe(`${'ç'.repeat(20000)}\n`);
  });

  it('keeps stdout and stderr apart', async () => {
    const result = await runner.runCode({
      language: 'python',
      source: "import sys\nprint('out')\nprint('err', file=sys.stderr)",
    });
    expect(result.status).toBe('ok');
    expect(result.cases[0]).toMatchObject({ stdout: 'out\n', stderr: 'err\n' });
  });

  it('raises EOFError once stdin is exhausted', async () => {
    const result = await runner.runCode({ language: 'python', source: 'input()\ninput()', cases: [{ stdin: 'a' }] });
    expect(result.status).toBe('ok');
    expect(result.cases[0].status).toBe('runtime_error');
    expect(result.cases[0].stderr).toContain('EOFError');
  });

  it('reports syntax errors as compile_error with the line', async () => {
    const result = await runner.runCode({ language: 'python', source: 'def f(:' });
    expect(result.status).toBe('compile_error');
    expect(result.compileOutput).toContain('line 1');
    expect(result.compileOutput).toContain('SyntaxError');
    expect(result.compileOutput).toMatch(/^File "main\.py", line 1\n/);
  });

  it('accepts source text without interpolating it into Python code', async () => {
    const source = "print('''\"\"\" \\\\ ' ''')";
    const result = await runner.runCode({ language: 'python', source });
    expect(result.status).toBe('ok');
    expect(result.cases[0].stdout).toBe("\"\"\" \\ ' \n");
  });

  it('reports runtime errors with a clean traceback', async () => {
    const result = await runner.runCode({ language: 'python', source: 'x = 1\n1/0' });
    expect(result.status).toBe('ok');
    const [first] = result.cases;
    expect(first).toMatchObject({ status: 'runtime_error', exitCode: 1 });
    expect(first.stderr).toContain('ZeroDivisionError');
    expect(first.stderr).toContain('main.py');
    expect(first.stderr).not.toContain('pyodide/');
    expect(first.stderr).not.toContain('_pyodide');
  });

  it('starts the traceback at the student code and shows its source lines', async () => {
    const result = await runner.runCode({ language: 'python', source: 'def g():\n    return 1/0\nprint("a")\ng()' });
    const { stderr, stdout } = result.cases[0];
    expect(stdout).toBe('a\n');
    expect(stderr).toBe(
      [
        'Traceback (most recent call last):',
        '  File "main.py", line 4, in <module>',
        '    g()',
        '    ~^^',
        '  File "main.py", line 2, in g',
        '    return 1/0',
        '           ~^~',
        'ZeroDivisionError: division by zero',
        '',
      ].join('\n'),
    );
  });

  it('reads a last stdin line that has no trailing newline', async () => {
    const result = await runner.runCode({
      language: 'python',
      source: "print(input() + '|')",
      cases: [{ stdin: 'no newline' }],
    });
    expect(result.cases[0].stdout).toBe('no newline|\n');
  });

  it('prints a non-integer sys.exit argument to stderr and exits with 1', async () => {
    const result = await runner.runCode({ language: 'python', source: "import sys; sys.exit('bye')" });
    expect(result.cases[0]).toMatchObject({ status: 'runtime_error', exitCode: 1, stderr: 'bye\n' });
  });

  it('restores the standard streams for the next case and the next run', async () => {
    const rebind = "import sys\nif input() == 'rebind':\n    sys.stdout = sys.stderr = sys.stdin = open('/dev/null', 'w')\nprint('after')\n1/0";
    const first = await runner.runCode({
      language: 'python',
      source: rebind,
      cases: [{ stdin: 'rebind' }, { stdin: 'plain' }],
    });
    // The rebound streams swallow the program's own output; the host appends the traceback.
    expect(first.cases[0].stdout).toBe('');
    expect(first.cases[1].stdout).toBe('after\n');
    expect(first.cases[1].stderr).toContain('ZeroDivisionError');
    const next = await runner.runCode({ language: 'python', source: 'print(input())\n1/0', cases: [{ stdin: 'plain' }] });
    expect(next.cases[0].stdout).toBe('plain\n');
    expect(next.cases[0].stderr).toContain('ZeroDivisionError');
  });

  it('reopens standard streams the program closed, for the next case and the next run', async () => {
    const source = [
      'import sys',
      "if input() == 'close':",
      '    with sys.stdout as out:',
      "        print('bye')",
      '    sys.stderr.close()',
      '    sys.stdin.close()',
      'else:',
      "    print('ok', input())",
      "    print('err', file=sys.stderr)",
    ].join('\n');
    const first = await runner.runCode({
      language: 'python',
      source,
      cases: [{ stdin: 'close\n' }, { stdin: 'plain\nnext line\n' }],
    });
    expect(first.cases.map((c) => [c.status, c.stdout, c.stderr])).toEqual([
      ['ok', 'bye\n', ''],
      ['ok', 'ok next line\n', 'err\n'],
    ]);
    for (let run = 0; run < 2; run += 1) {
      const next = await runner.runCode({
        language: 'python',
        source: [
          'import sys',
          'out = sys.stdout',
          'print(input(), out.name, out.mode, out.encoding, out.line_buffering, sys.stderr.errors)',
          "print('é', file=sys.stderr)",
        ].join('\n'),
        cases: [{ stdin: 'again' }],
      });
      expect(next.cases[0]).toMatchObject({
        status: 'ok',
        stdout: 'again <stdout> w utf-8 True backslashreplace\n',
        stderr: 'é\n',
      });
    }
  });

  it('gives the next case an empty working directory even if the program created it', async () => {
    const source = [
      'import os',
      "n = int(os.getcwd().rsplit('-', 1)[1])",
      "if input() == 'plant':",
      "    os.makedirs(f'/tmp/case-{n + 1}')",
      "    open(f'/tmp/case-{n + 1}/planted.txt', 'w').write('x')",
      "print(sorted(os.listdir('.')))",
    ].join('\n');
    const result = await runner.runCode({ language: 'python', source, cases: [{ stdin: 'plant' }, { stdin: 'look' }] });
    expect(result.cases.map((c) => [c.status, c.stdout])).toEqual([
      ['ok', '[]\n'],
      ['ok', '[]\n'],
    ]);
  });

  it('restores the recursion limit for the next case', async () => {
    const source = "import sys\nif input() == 'lower':\n    sys.setrecursionlimit(50)\nprint(sys.getrecursionlimit())";
    const result = await runner.runCode({ language: 'python', source, cases: [{ stdin: 'lower' }, { stdin: 'keep' }] });
    const [lowered, kept] = result.cases;
    expect(lowered.stdout).toBe('50\n');
    expect(kept.stdout).not.toBe('50\n');
    const next = await runner.runCode({ language: 'python', source: 'import sys; print(sys.getrecursionlimit())' });
    expect(next.cases[0].stdout).toBe(kept.stdout);
  });

  it('gives every case an empty working directory', async () => {
    const source = [
      'import os',
      "if input() == 'write':",
      "    open('note.txt', 'w').write('data')",
      "print(sorted(os.listdir('.')))",
    ].join('\n');
    const result = await runner.runCode({ language: 'python', source, cases: [{ stdin: 'write' }, { stdin: 'read' }] });
    expect(result.cases.map((c) => c.stdout)).toEqual(["['note.txt']\n", '[]\n']);
    const next = await runner.runCode({ language: 'python', source: "import os; print(os.listdir('.'))" });
    expect(next.cases[0].stdout).toBe('[]\n');
  });

  it('always reports a numeric exit code', async () => {
    const run = async (arg: string) =>
      (await runner.runCode({ language: 'python', source: `import sys; sys.exit(${arg})` })).cases[0];
    expect(await run('True')).toMatchObject({ status: 'runtime_error', exitCode: 1 });
    expect(await run('256')).toMatchObject({ status: 'ok', exitCode: 0 });
    expect(await run('-1')).toMatchObject({ status: 'runtime_error', exitCode: 255 });
  });

  it('maps sys.exit codes to the exit code', async () => {
    const failing = await runner.runCode({ language: 'python', source: 'import sys; sys.exit(3)' });
    expect(failing.cases[0]).toMatchObject({ status: 'runtime_error', exitCode: 3 });
    const succeeding = await runner.runCode({ language: 'python', source: 'import sys; sys.exit(0)' });
    expect(succeeding.cases[0]).toMatchObject({ status: 'ok', exitCode: 0 });
    const bare = await runner.runCode({ language: 'python', source: 'import sys; sys.exit()' });
    expect(bare.cases[0]).toMatchObject({ status: 'ok', exitCode: 0 });
  });

  it('times out an infinite loop and recovers for the next run', async () => {
    const hung = await runner.runCode({ language: 'python', source: 'while True: pass', timeoutMs: 1000 });
    expect(hung.cases[0].status).toBe('timeout');
    const next = await runner.runCode({ language: 'python', source: 'print(1)' });
    expect(next.status).toBe('ok');
    expect(next.cases[0]).toMatchObject({ status: 'ok', stdout: '1\n' });
  });
});
