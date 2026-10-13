import { describe, expect, it } from 'vitest';
import type { CodeKind, Language } from './code-languages';
import {
  CodeSnippetPayload,
  CodeTaskPayload,
  findBlankIds,
  parseLineRange,
  validateCodeSnippet,
  validateCodeTask,
  type CodeSnippetPayloadData,
  type CodeTaskPayloadData,
} from './code-payloads';

describe('parseLineRange', () => {
  it('parses a single line', () => {
    expect(parseLineRange('3')).toEqual({ start: 3, end: 3 });
  });

  it('parses an inclusive range', () => {
    expect(parseLineRange('3-5')).toEqual({ start: 3, end: 5 });
  });

  it('throws when the end is before the start', () => {
    expect(() => parseLineRange('5-3')).toThrow();
  });

  it('throws when the start is below 1', () => {
    expect(() => parseLineRange('0')).toThrow();
  });
});

describe('CodeSnippetPayload', () => {
  it('fills defaults for annotations, walkthrough and runnable', () => {
    const parsed = CodeSnippetPayload.parse({ variants: [{ language: 'python', code: 'print(1)' }] });
    expect(parsed.variants[0]!.annotations).toEqual([]);
    expect(parsed.variants[0]!.walkthrough).toEqual([]);
    expect(parsed.variants[0]!.runnable).toBe(false);
  });

  it('rejects an unknown language', () => {
    expect(CodeSnippetPayload.safeParse({ variants: [{ language: 'cobol', code: 'x' }] }).success).toBe(false);
  });

  it('rejects an empty variant list', () => {
    expect(CodeSnippetPayload.safeParse({ variants: [] }).success).toBe(false);
  });
});

describe('CodeTaskPayload', () => {
  it('parses an IoTest with the default stdin', () => {
    const parsed = CodeTaskPayload.parse({ starterCode: '', tests: [{ expectedStdout: '1' }] });
    expect(parsed.tests[0]).toEqual({ stdin: '', expectedStdout: '1' });
  });

  it('parses a test with expectedRows as a SqlTest, not an IoTest', () => {
    const parsed = CodeTaskPayload.parse({
      starterCode: '',
      tests: [{ expectedRows: { columns: ['n'], rows: [['1'], [null]] } }],
    });
    expect(parsed.tests[0]).toEqual({
      sqlSetup: '',
      expectedRows: { columns: ['n'], rows: [['1'], [null]] },
      orderMatters: false,
    });
  });
});

describe('validateCodeSnippet', () => {
  const snippet = (overrides: Record<string, unknown> = {}): CodeSnippetPayloadData =>
    CodeSnippetPayload.parse({
      variants: [{ language: 'python', code: 'a = 1\nb = 2\nprint(a + b)', ...overrides }],
    });

  it('returns no errors for a valid payload', () => {
    const payload = snippet({
      annotations: [{ lines: '1-2', mdx: 'Setup' }],
      walkthrough: [{ lines: '3', mdx: 'Print' }],
    });
    expect(validateCodeSnippet(payload)).toEqual([]);
  });

  it('reports a duplicate language across variants', () => {
    const payload = CodeSnippetPayload.parse({
      variants: [
        { language: 'python', code: 'x' },
        { language: 'python', code: 'y' },
      ],
    });
    const errors = validateCodeSnippet(payload);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('duplicate language');
  });

  it('reports an annotation past the end of the code', () => {
    const errors = validateCodeSnippet(snippet({ annotations: [{ lines: '4', mdx: 'Nope' }] }));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('variants[0].annotations[0].lines');
  });

  it('reports a walkthrough range past the end of the code', () => {
    const errors = validateCodeSnippet(snippet({ walkthrough: [{ lines: '2-9', mdx: 'Too far' }] }));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('variants[0].walkthrough[0].lines');
  });

  it('reports a malformed range such as 3-1', () => {
    const errors = validateCodeSnippet(snippet({ annotations: [{ lines: '3-1', mdx: 'Backwards' }] }));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('variants[0].annotations[0].lines');
  });

  it('prefixes errors with the variant index', () => {
    const payload = CodeSnippetPayload.parse({
      variants: [
        { language: 'python', code: 'a' },
        { language: 'c', code: 'a\nb', annotations: [{ lines: '3', mdx: 'x' }] },
      ],
    });
    expect(validateCodeSnippet(payload)[0]).toContain('variants[1].annotations[0].lines');
  });
});

describe('findBlankIds', () => {
  it('returns sorted unique ids', () => {
    expect(findBlankIds('a = ___2___ + ___1___\nb = ___1___')).toEqual([1, 2]);
  });

  it('returns an empty list when there are no markers', () => {
    expect(findBlankIds('a = 1')).toEqual([]);
  });
});

describe('validateCodeTask', () => {
  const task = (overrides: Record<string, unknown> = {}): CodeTaskPayloadData =>
    CodeTaskPayload.parse({ starterCode: 'a = 1\nb = 2', ...overrides });

  const ioTest = { stdin: '', expectedStdout: '3' };
  const sqlTest = { expectedRows: { columns: ['n'], rows: [['1']] } };

  const cases: Array<{
    name: string;
    kind: CodeKind;
    language: Language;
    payload: Record<string, unknown>;
    expected: string | null; // substring of the expected error, null = valid
  }> = [
    { name: 'valid write', kind: 'write', language: 'python', payload: { solution: 'print(3)', tests: [ioTest] }, expected: null },
    { name: 'write without solution', kind: 'write', language: 'python', payload: { tests: [ioTest] }, expected: 'solution' },
    { name: 'write with zero tests', kind: 'write', language: 'python', payload: { solution: 'print(3)' }, expected: 'tests' },
    { name: 'predict_output without expectedOutput', kind: 'predict_output', language: 'python', payload: {}, expected: 'expectedOutput' },
    { name: 'predict_output with tests', kind: 'predict_output', language: 'python', payload: { expectedOutput: '3', tests: [ioTest] }, expected: 'tests' },
    { name: 'valid predict_output', kind: 'predict_output', language: 'python', payload: { expectedOutput: '3' }, expected: null },
    {
      name: 'fill_blank missing blank 2',
      kind: 'fill_blank',
      language: 'python',
      payload: {
        starterCode: 'a = ___1___ + ___2___',
        solution: 'a = 1 + 2',
        blanks: [{ id: 1, accepted: ['1'] }],
      },
      expected: '2',
    },
    {
      name: 'fill_blank blank 3 absent from code',
      kind: 'fill_blank',
      language: 'python',
      payload: {
        starterCode: 'a = ___1___',
        solution: 'a = 1',
        blanks: [
          { id: 1, accepted: ['1'] },
          { id: 3, accepted: ['3'] },
        ],
      },
      expected: '3',
    },
    {
      name: 'valid fill_blank',
      kind: 'fill_blank',
      language: 'python',
      payload: { starterCode: 'a = ___1___', solution: 'a = 1', blanks: [{ id: 1, accepted: ['1'] }] },
      expected: null,
    },
    { name: 'find_bug without bugLines', kind: 'find_bug', language: 'python', payload: { solution: 'a = 1' }, expected: 'bugLines' },
    { name: 'find_bug without solution', kind: 'find_bug', language: 'python', payload: { bugLines: '1' }, expected: 'solution' },
    { name: 'bugLines beyond starter code', kind: 'find_bug', language: 'python', payload: { solution: 'a = 1', bugLines: '2-5' }, expected: 'bugLines' },
    { name: 'valid find_bug', kind: 'find_bug', language: 'python', payload: { solution: 'a = 1', bugLines: '2' }, expected: null },
    { name: 'sqlite with an IoTest', kind: 'write', language: 'sqlite', payload: { solution: 'select 1', tests: [ioTest] }, expected: 'tests[0]' },
    { name: 'python with a SqlTest', kind: 'write', language: 'python', payload: { solution: 'print(3)', tests: [sqlTest] }, expected: 'tests[0]' },
    { name: 'valid sql write', kind: 'write', language: 'postgresql', payload: { solution: 'select 1', tests: [sqlTest] }, expected: null },
  ];

  it.each(cases)('$name', ({ kind, language, payload, expected }) => {
    const errors = validateCodeTask(kind, language, task(payload));
    if (expected === null) {
      expect(errors).toEqual([]);
    } else {
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join('\n')).toContain(expected);
    }
  });

  it('prefixes errors with the offending path', () => {
    const errors = validateCodeTask('write', 'python', task({ tests: [ioTest] }));
    expect(errors[0]).toMatch(/^solution: /);
  });
});
