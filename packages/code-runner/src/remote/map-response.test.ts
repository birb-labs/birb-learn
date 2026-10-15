import { describe, expect, it } from 'vitest';
import { LANGUAGE_INFO, REMOTE_LANGUAGES } from '../languages';
import { COMPILER_EXPLORER_COMPILERS } from './compilers';
import { buildCompileRequest, CompilerExplorerFormatError, mapCompilerExplorerResponse } from './map-response';
import cCompileError from './fixtures/c-compile-error.json';
import cExit3 from './fixtures/c-exit-3.json';
import cHello from './fixtures/c-hello.json';
import cppTimeout from './fixtures/cpp-timeout.json';
import goRuntimePanic from './fixtures/go-runtime-panic.json';
import javaHello from './fixtures/java-hello.json';
import javaPublicClassError from './fixtures/java-public-class-error.json';
import rustStdinUnicode from './fixtures/rust-stdin-unicode.json';

// The fixtures are real Compiler Explorer responses recorded once (volatile
// timing fields stripped). These tests never touch the network.

describe('COMPILER_EXPLORER_COMPILERS', () => {
  it('pins one compiler for every remote language', () => {
    const remote = REMOTE_LANGUAGES as string[];
    expect(Object.keys(COMPILER_EXPLORER_COMPILERS).sort()).toEqual([...remote].sort());
  });

  it('uses the Compiler Explorer language ids and the agreed flags', () => {
    expect(COMPILER_EXPLORER_COMPILERS.c).toMatchObject({ lang: 'c', flags: '-std=c17 -O0 -Wall' });
    expect(COMPILER_EXPLORER_COMPILERS.cpp).toMatchObject({ lang: 'c++', flags: '-std=c++20 -O0 -Wall' });
    expect(COMPILER_EXPLORER_COMPILERS.go).toMatchObject({ lang: 'go', flags: '' });
    expect(COMPILER_EXPLORER_COMPILERS.java).toMatchObject({ lang: 'java', flags: '' });
    expect(COMPILER_EXPLORER_COMPILERS.rust).toMatchObject({ lang: 'rust', flags: '--edition 2021 -C opt-level=0' });
  });

  it('pins released compilers, never trunk, beta or nightly', () => {
    for (const { id } of Object.values(COMPILER_EXPLORER_COMPILERS)) {
      expect(id).not.toMatch(/trunk|beta|nightly|tip|snapshot|master/i);
    }
  });
});

describe('Java template', () => {
  it('declares a non-public class: the executor compiles the source as example.java', () => {
    expect(LANGUAGE_INFO.java.template).toContain('class Main');
    expect(LANGUAGE_INFO.java.template).not.toMatch(/\bpublic\s+class\b/);
  });
});

describe('buildCompileRequest', () => {
  it.each(['c', 'cpp', 'go', 'java', 'rust'] as const)('builds the %s request from the pinned compiler', (language) => {
    const { id, lang, flags } = COMPILER_EXPLORER_COMPILERS[language];
    const { url, body } = buildCompileRequest(language, 'SOURCE', 'line one\nline two\n');
    expect(url).toBe(`https://godbolt.org/api/compiler/${id}/compile`);
    expect(body).toEqual({
      source: 'SOURCE',
      lang,
      // Asks Compiler Explorer not to keep the student's code.
      allowStoreCodeDebug: false,
      options: {
        userArguments: flags,
        executeParameters: { args: [], stdin: 'line one\nline two\n' },
        compilerOptions: { executorRequest: true },
        filters: { execute: true },
        tools: [],
        libraries: [],
      },
    });
  });

  it('sends an empty stdin as an empty string', () => {
    const { body } = buildCompileRequest('c', 'int main(void) { return 0; }', '');
    expect(body).toMatchObject({ options: { executeParameters: { stdin: '' } } });
  });
});

describe('mapCompilerExplorerResponse', () => {
  it('maps a successful run to ok', () => {
    expect(mapCompilerExplorerResponse(cHello)).toEqual({
      kind: 'case',
      status: 'ok',
      stdout: 'Hello, world!\n',
      stderr: '',
      exitCode: 0,
    });
  });

  it('maps the Java hello world to ok', () => {
    expect(mapCompilerExplorerResponse(javaHello)).toEqual({
      kind: 'case',
      status: 'ok',
      stdout: 'Hello, world!\n',
      stderr: '',
      exitCode: 0,
    });
  });

  it('keeps non-ASCII stdout intact', () => {
    expect(mapCompilerExplorerResponse(rustStdinUnicode)).toEqual({
      kind: 'case',
      status: 'ok',
      stdout: 'Olá, ñ, ç, 🙂\n',
      stderr: '',
      exitCode: 0,
    });
  });

  it('maps a build failure to compile_error with the build stderr, without colour codes', () => {
    const mapped = mapCompilerExplorerResponse(cCompileError);
    expect(mapped.kind).toBe('compile_error');
    if (mapped.kind !== 'compile_error') return;
    expect(mapped.compileOutput).not.toContain('\u001b');
    expect(mapped.compileOutput.split('\n')).toEqual([
      "<source>: In function 'main':",
      "<source>:4:30: error: expected ';' before 'return'",
      '    4 |     printf("Hello, world!\\n")',
      '      |                              ^',
      '      |                              ;',
      '    5 |     return 0;',
      '      |     ~~~~~~                    ',
    ]);
  });

  it('reports the Java rule about public classes as a compile error', () => {
    const mapped = mapCompilerExplorerResponse(javaPublicClassError);
    expect(mapped.kind).toBe('compile_error');
    if (mapped.kind !== 'compile_error') return;
    expect(mapped.compileOutput).toContain('class Main is public, should be declared in a file named Main.java');
  });

  it('maps a non-zero exit code to runtime_error and keeps both streams', () => {
    expect(mapCompilerExplorerResponse(cExit3)).toEqual({
      kind: 'case',
      status: 'runtime_error',
      stdout: 'about to exit\n',
      stderr: 'fatal: exiting with 3\n',
      exitCode: 3,
    });
  });

  it('maps a Go panic to runtime_error with the panic text on stderr', () => {
    const mapped = mapCompilerExplorerResponse(goRuntimePanic);
    expect(mapped).toMatchObject({ kind: 'case', status: 'runtime_error', stdout: 'before panic\n', exitCode: 2 });
    if (mapped.kind !== 'case') return;
    expect(mapped.stderr.startsWith('panic: runtime error: index out of range [3] with length 0\n\ngoroutine 1 [running]:\n')).toBe(true);
  });

  it('maps the service time limit (top-level timedOut) to timeout, without an exit code', () => {
    const mapped = mapCompilerExplorerResponse(cppTimeout);
    expect(mapped).toMatchObject({ kind: 'case', status: 'timeout', stdout: 'start\n', exitCode: null });
    if (mapped.kind !== 'case') return;
    expect(mapped.stderr).toContain('Killed - processing time exceeded');
  });

  it('maps a timed-out response that carries no exit code to timeout', () => {
    expect(
      mapCompilerExplorerResponse({
        timedOut: true,
        didExecute: true,
        stdout: [{ text: 'partial' }],
        stderr: [{ text: 'Killed - processing time exceeded' }],
        buildResult: { code: 0, stdout: [], stderr: [] },
      }),
    ).toEqual({
      kind: 'case',
      status: 'timeout',
      stdout: 'partial\n',
      stderr: 'Killed - processing time exceeded\n',
      exitCode: null,
    });
  });

  it('tolerates unknown extra top-level fields', () => {
    expect(
      mapCompilerExplorerResponse({
        ...cHello,
        somethingNew: { nested: [1, 2, 3] },
        anotherField: 'x',
      }),
    ).toEqual(mapCompilerExplorerResponse(cHello));
  });

  it('falls back to the top-level stderr when buildResult is absent', () => {
    expect(
      mapCompilerExplorerResponse({ code: -1, didExecute: false, stdout: [], stderr: [{ text: 'Build failed' }] }),
    ).toEqual({ kind: 'compile_error', compileOutput: 'Build failed' });
  });

  it('treats a non-zero build code as a compile error even without an executable', () => {
    expect(
      mapCompilerExplorerResponse({
        code: -1,
        didExecute: false,
        buildResult: { code: 2, stdout: [], stderr: [{ text: 'first' }, { text: 'second' }] },
        stdout: [],
        stderr: [{ text: 'Build failed' }],
      }),
    ).toEqual({ kind: 'compile_error', compileOutput: 'first\nsecond' });
  });

  it('maps a build step that hit the service time limit to service_timeout, not a compile error', () => {
    const timedOutBuild = { ...cCompileError, buildResult: { ...cCompileError.buildResult, timedOut: true } };
    expect(mapCompilerExplorerResponse(timedOutBuild)).toEqual({ kind: 'service_timeout' });
    // Also when the killed build carries no usable exit code.
    expect(
      mapCompilerExplorerResponse({ ...cCompileError, buildResult: { timedOut: true, stdout: [], stderr: [] } }),
    ).toEqual({ kind: 'service_timeout' });
  });

  it.each([
    ['null', null],
    ['a string', 'oops'],
    ['an array', []],
    ['an empty object', {}],
    ['an unrelated object', { error: 'Compiler not found' }],
    ['a stdout that is not a list', { code: 0, didExecute: true, stdout: 'text', stderr: [] }],
    ['an exit code that is not a number', { code: 'zero', didExecute: true, stdout: [], stderr: [] }],
    ['a stdout line without text', { code: 0, didExecute: true, stdout: [{}], stderr: [] }],
    ['a successful build that never ran', { code: 0, didExecute: false, buildResult: { code: 0, stdout: [], stderr: [] }, stdout: [], stderr: [] }],
  ])('throws CompilerExplorerFormatError on %s', (_label, payload) => {
    expect(() => mapCompilerExplorerResponse(payload)).toThrow(CompilerExplorerFormatError);
  });
});
