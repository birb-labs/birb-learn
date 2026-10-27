import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCompilerExplorerRunner,
  createRunner,
  type RunRequest,
  type RunResult,
  type Runner,
} from '@birb-learn/code-runner';
import { highlightCode } from '@birb-learn/code-ui/highlight';
import { compileLessonMdx } from '../src/lib/compile-lesson-mdx';
import { validateContent } from './content-validate';
import { createDiskRunCache } from './lib/disk-run-cache';

// Real highlighting, except where a test makes it fail.
vi.mock('@birb-learn/code-ui/highlight', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@birb-learn/code-ui/highlight')>();
  return { ...actual, highlightCode: vi.fn(actual.highlightCode) };
});

const VALID_PACK = path.resolve(import.meta.dirname, '../../../packages/content-schema/test-fixtures/packs/valid');
const PROGRAMMING = 'computer-science/programming';
const LESSON = `${PROGRAMMING}/programming-basics/first-steps/01-counting-in-binary.pt-BR.yaml`;
const CODE_QUESTION = `${PROGRAMMING}/questions/binary-code.pt-BR.yaml`;

/** Whatever the student program in the fixtures prints: binary for `bin`/`toString(2)`, else the input. */
function fakeStdout(source: string, stdin: string): string {
  if (source.includes('range(3)')) {
    return `${[0, 1, 2].map((n) => (source.includes('bin(') ? n.toString(2) : String(n))).join('\n')}\n`;
  }
  if (source.includes('bin(n)[2:])') || source.includes('toString(2)')) return `${Number(stdin).toString(2)}\n`;
  if (source.includes('print(n)')) return `${stdin}\n`;
  return '';
}

/** Runs the fixtures' programs without any engine; `calls` counts the requests it got. */
function createFakeRunner(): Runner & { calls: RunRequest[] } {
  const calls: RunRequest[] = [];
  return {
    calls,
    async runCode(request): Promise<RunResult> {
      calls.push(request);
      const cases = (request.cases ?? [{}]).map((testCase) => ({
        status: 'ok' as const,
        stdout: fakeStdout(request.source, testCase.stdin ?? ''),
        stderr: '',
        exitCode: 0,
        durationMs: 1,
      }));
      return { status: 'ok', cases };
    },
  };
}

const compileMdx = async (source: string): Promise<unknown> => compileLessonMdx(source);
const noMdx = async (): Promise<unknown> => undefined;

describe('validateContent', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'birb-validate-'));
    await cp(VALID_PACK, root, { recursive: true });
  });

  afterEach(async () => {
    vi.useRealTimers();
    await rm(root, { recursive: true, force: true });
  });

  async function editFile(file: string, edit: (text: string) => string): Promise<void> {
    const target = path.join(root, file);
    await writeFile(target, edit(await readFile(target, 'utf8')));
  }

  it('finds nothing wrong with the valid pack and runs its code', async () => {
    const runner = createFakeRunner();
    const result = await validateContent(root, { runner, compileMdx });
    expect(result).toEqual({ problems: [], notVerified: [] });
    // The snippet, the exercise (solution), the code question (solution), in each locale that has them.
    expect(runner.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('reports broken MDX with the file, the line and the field', async () => {
    await editFile(LESSON, (text) =>
      text.replace('Existe uma função pronta em Python', 'Existe uma <Broken função pronta em Python'),
    );
    const { problems } = await validateContent(root, { runner: createFakeRunner(), compileMdx });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ file: LESSON, line: 69 });
    expect(problems[0].message).toMatch(/^blocks\[6\]\.hints\[0\]: /);
  });

  it('compiles every MDX field of a lesson block, a code payload and a question', async () => {
    const seen: string[] = [];
    await validateContent(root, {
      runner: createFakeRunner(),
      compileMdx: async (source) => {
        seen.push(source);
      },
    });
    const joined = seen.join('\n');
    expect(joined).toContain('A **bit** is the smallest unit'); // text body
    expect(joined).toContain('We add 4 + 0 + 1'); // solved_exercise resolution
    expect(joined).toContain('`range(3)` yields 0, 1 and 2.'); // annotation
    expect(joined).toContain('which we cut off'); // walkthrough
    expect(joined).toContain('built-in function that converts to binary'); // hint
    expect(joined).toContain('Ordene os números binários'); // question prompt
    expect(joined).toContain('Em decimal eles valem 1, 2, 3 e 4.'); // question resolution
    expect(joined).toContain('Quanto vale o número binário 10'); // choice prompt
    expect(joined).toContain('O dígito 1 está na casa do 2'); // choice resolution
  });

  it('names the option, ordering item and matching pair that fail to compile', async () => {
    const failOn = (marker: string) => async (source: string) => {
      if (source.includes(marker)) throw new Error('boom');
    };

    const optionFile = `${PROGRAMMING}/questions/binary-multiple-choice.pt-BR.yaml`;
    await editFile(optionFile, (text) => text.replace('text: "10"', 'text: "BAD-OPTION"'));
    let result = await validateContent(root, { runner: createFakeRunner(), compileMdx: failOn('BAD-OPTION') });
    expect(result.problems).toEqual([{ file: optionFile, line: 11, message: 'options[2].text: MDX does not compile: boom' }]);

    const orderingFile = `${PROGRAMMING}/questions/binary-ordering.pt-BR.yaml`;
    await editFile(orderingFile, (text) => text.replace('- "11"', '- "BAD-ITEM"'));
    result = await validateContent(root, { runner: createFakeRunner(), compileMdx: failOn('BAD-ITEM') });
    expect(result.problems).toEqual([{ file: orderingFile, line: 10, message: 'items[2]: MDX does not compile: boom' }]);
  });

  it('reports code that cannot be highlighted as a problem naming the field', async () => {
    vi.mocked(highlightCode).mockRejectedValueOnce(new Error('no grammar'));
    const { problems } = await validateContent(root, { runner: createFakeRunner(), compileMdx: noMdx });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ file: LESSON });
    expect(problems[0].message).toMatch(/^blocks\[5\]\.variants\[0\]\.code: cannot highlight python code: no grammar$/);
  });

  it('reports a write solution that fails its test, on the line of the solution', async () => {
    await editFile(CODE_QUESTION, (text) => text.replace('console.log(n.toString(2));', 'print(n)'));
    const { problems } = await validateContent(root, { runner: createFakeRunner(), compileMdx: noMdx });
    expect(problems.length).toBeGreaterThan(0);
    for (const problem of problems) {
      expect(problem.file).toBe(CODE_QUESTION);
      expect(problem.message).toMatch(/^solution: solution fails test #1: expected "110", got "6"/);
      expect(problem.line).toBe(11);
    }
  });

  it('reports a lesson code snippet whose output differs, naming the block and variant', async () => {
    await editFile(LESSON, (text) => text.replace('print(bin(n)[2:])', 'print(n)'));
    const { problems } = await validateContent(root, { runner: createFakeRunner(), compileMdx: noMdx });
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.map((problem) => problem.message)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^blocks\[5\]\.variants\[0\]: output differs from expectedOutput/)]),
    );
    expect(problems.every((problem) => problem.file === LESSON)).toBe(true);
  });

  it('lists a MySQL predict_output as not verified, not as a problem', async () => {
    await writeFile(
      path.join(root, CODE_QUESTION),
      [
        'key: binary-code',
        'type: code',
        'difficulty: medium',
        'tags: [binary-conversion]',
        'kind: predict_output',
        'language: mysql',
        'prompt: |',
        '  Qual é a saída?',
        'starterCode: |',
        '  SELECT 1;',
        'expectedOutput: |',
        '  1',
        'resolution: |',
        '  O resultado é 1.',
        '',
      ].join('\n'),
    );
    const { problems, notVerified } = await validateContent(root, { runner: createFakeRunner(), compileMdx: noMdx });
    expect(problems).toEqual([]);
    expect(notVerified).toEqual([`${CODE_QUESTION}: expectedOutput`]);
  });

  it('reports the load and cross-check problems of the pack', async () => {
    await editFile(CODE_QUESTION, (text) => text.replace('tags: [binary-conversion]', 'tags: [no-such-tag]'));
    const { problems } = await validateContent(root, { runner: createFakeRunner(), compileMdx: noMdx });
    expect(problems).toEqual([
      expect.objectContaining({ file: CODE_QUESTION, line: 4, message: expect.stringContaining('unknown tag "no-such-tag"') }),
    ]);
  });

  it('does not run code of a file whose payload is already reported as invalid', async () => {
    await editFile(CODE_QUESTION, (text) => text.replace(/solution: \|\n {2}.*\n {2}.*\n/, ''));
    const runner = createFakeRunner();
    const { problems } = await validateContent(root, { runner, compileMdx: noMdx });
    expect(problems.filter((problem) => problem.file === CODE_QUESTION)).toHaveLength(1);
    expect(problems[0].message).toContain('solution: required for a write task');
    expect(runner.calls.some((call) => call.source.includes('toString(2)'))).toBe(false);
  });

  it('reports progress per file', async () => {
    const messages: string[] = [];
    await validateContent(root, { runner: createFakeRunner(), compileMdx: noMdx, onProgress: (message) => messages.push(message) });
    expect(messages).toContain(`checking ${LESSON}`);
    expect(messages).toContain(`checking ${CODE_QUESTION}`);
  });

  describe('rate limiting', () => {
    /** Answers `rate_limited` to the first `limited` runs, then behaves like the fake runner. */
    function createRateLimitedRunner(limited: number, retryAfterMs: number): Runner & { calls: number } {
      const inner = createFakeRunner();
      const runner = {
        calls: 0,
        async runCode(request: RunRequest, opts?: Parameters<Runner['runCode']>[1]): Promise<RunResult> {
          runner.calls += 1;
          if (runner.calls <= limited) {
            return { status: 'unavailable', reason: 'rate_limited', message: 'slow down', retryAfterMs, cases: [] };
          }
          return inner.runCode(request, opts);
        },
      };
      return runner;
    }

    it('waits the runner’s retryAfterMs once, then passes', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const runner = createRateLimitedRunner(1, 10);
      const messages: string[] = [];
      const done = validateContent(root, { runner, compileMdx: noMdx, onProgress: (message) => messages.push(message) });

      await vi.waitFor(() => expect(messages).toContain('waiting 1s for Compiler Explorer…'));
      await vi.advanceTimersByTimeAsync(10);
      const result = await done;

      expect(result.problems).toEqual([]);
      expect(messages.filter((message) => message.startsWith('waiting'))).toHaveLength(1);
    });

    it('uses the wait the runner reported, not one parsed from the message', async () => {
      const waits: number[] = [];
      const runner = createRateLimitedRunner(1, 4200);
      const result = await validateContent(root, {
        runner,
        compileMdx: noMdx,
        sleep: async (ms) => {
          waits.push(ms);
        },
      });
      expect(result.problems).toEqual([]);
      expect(waits).toEqual([4200]);
    });

    it('gives up with an error after 10 retries of the same item', async () => {
      const runner = createRateLimitedRunner(Number.POSITIVE_INFINITY, 1);
      const waits: number[] = [];
      const { problems } = await validateContent(root, {
        runner,
        compileMdx: noMdx,
        sleep: async (ms) => {
          waits.push(ms);
        },
      });
      expect(problems.length).toBeGreaterThan(0);
      for (const problem of problems) {
        expect(problem.message).toMatch(/still rate limited after 10 retries/);
      }
      // Each item: the first try plus 10 retries, so 10 waits per item.
      expect(waits.length).toBe(problems.length * 10);
    });
  });

  describe('with the disk cache', () => {
    let cacheDir: string;

    beforeEach(async () => {
      cacheDir = await mkdtemp(path.join(tmpdir(), 'birb-validate-cache-'));
      // A C program, which only Compiler Explorer can run.
      await writeFile(
        path.join(root, CODE_QUESTION),
        [
          'key: binary-code',
          'type: code',
          'difficulty: medium',
          'tags: [binary-conversion]',
          'kind: predict_output',
          'language: c',
          'prompt: |',
          '  Qual é a saída?',
          'starterCode: |',
          '  #include <stdio.h>',
          '  int main(void) { puts("42"); return 0; }',
          'expectedOutput: |',
          '  42',
          'resolution: |',
          '  Imprime 42.',
          '',
        ].join('\n'),
      );
    });

    afterEach(async () => {
      await rm(cacheDir, { recursive: true, force: true });
    });

    function remoteRunner(fetchFn: typeof fetch): Runner {
      return createRunner({
        browser: createFakeRunner(),
        remote: createCompilerExplorerRunner({ fetch: fetchFn, cache: createDiskRunCache(cacheDir) }),
      });
    }

    it('sends no request on a second run', async () => {
      let requests = 0;
      const countingFetch = (async () => {
        requests += 1;
        return new Response(
          JSON.stringify({
            code: 0,
            timedOut: false,
            stdout: [{ text: '42' }],
            stderr: [],
            didExecute: true,
            buildResult: { code: 0, timedOut: false, stdout: [], stderr: [] },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }) as typeof fetch;

      const first = await validateContent(root, { runner: remoteRunner(countingFetch), compileMdx: noMdx });
      expect(first.problems).toEqual([]);
      expect(requests).toBe(1);

      // A new runner: only the files in the cache directory remember the result.
      const second = await validateContent(root, { runner: remoteRunner(countingFetch), compileMdx: noMdx });
      expect(second.problems).toEqual([]);
      expect(requests).toBe(1);
    });
  });
});
