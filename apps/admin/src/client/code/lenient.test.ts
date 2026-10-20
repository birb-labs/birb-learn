import { describe, expect, it } from 'vitest';
import { lenientSnippet, lenientTask, readStoredSnippet, readStoredTask } from './lenient';

describe('lenientSnippet', () => {
  it('keeps what a mid-edit payload holds, even where the schema would reject it', () => {
    const snippet = lenientSnippet({
      variants: [
        {
          language: 'python',
          code: '',
          annotations: [{ lines: '3-', mdx: '' }],
          walkthrough: [{ lines: '' , mdx: 'x' }],
          runnable: true,
          expectedOutput: '',
        },
      ],
    });

    expect(snippet).toEqual({
      variants: [
        {
          language: 'python',
          code: '',
          annotations: [{ lines: '3-', mdx: '' }],
          walkthrough: [{ lines: '', mdx: 'x' }],
          runnable: true,
          expectedOutput: '',
        },
      ],
    });
  });

  it('fills the defaults of missing fields', () => {
    expect(lenientSnippet({ variants: [{ language: 'lua', code: 'x' }] })).toEqual({
      variants: [{ language: 'lua', code: 'x', annotations: [], walkthrough: [], runnable: false }],
    });
  });

  it('returns null when there is no variants list', () => {
    for (const raw of [null, 3, 'x', [], {}, { variants: 3 }]) expect(lenientSnippet(raw)).toBeNull();
  });
});

describe('lenientTask', () => {
  it('keeps blanks without accepted answers, empty hints and half-typed bug lines', () => {
    const task = lenientTask({
      starterCode: 'x = ___2___',
      solution: 'x = 1',
      blanks: [{ id: 2, accepted: [''] }],
      bugLines: '3-',
      hints: [''],
      tests: [{ stdin: '', expectedStdout: '' }],
    });

    expect(task).toEqual({
      starterCode: 'x = ___2___',
      solution: 'x = 1',
      blanks: [{ id: 2, accepted: [''] }],
      bugLines: '3-',
      hints: [''],
      tests: [{ stdin: '', expectedStdout: '' }],
    });
  });

  it('keeps SQL tests (with NULL cells) and the harness', () => {
    const sqlTest = { name: 'n', sqlSetup: 's', expectedRows: { columns: ['a'], rows: [['1'], [null]] }, orderMatters: true };
    expect(lenientTask({ starterCode: '', harness: { prefix: 'p' }, tests: [sqlTest] })).toEqual({
      starterCode: '',
      harness: { prefix: 'p', suffix: '' },
      tests: [sqlTest],
      blanks: [],
      hints: [],
    });
  });

  it('returns null when it is not an object', () => {
    for (const raw of [null, 3, 'x', []]) expect(lenientTask(raw)).toBeNull();
  });
});

describe('readStoredSnippet / readStoredTask', () => {
  it('reports nothing for absent text', () => {
    for (const text of [null, undefined, '', '  ']) {
      expect(readStoredSnippet(text)).toEqual({ kind: 'none' });
      expect(readStoredTask(text)).toEqual({ kind: 'none' });
    }
  });

  it('reads a valid payload with the schema defaults', () => {
    const stored = readStoredSnippet(JSON.stringify({ variants: [{ language: 'python', code: 'x' }] }));
    expect(stored).toEqual({
      kind: 'typed',
      payload: { variants: [{ language: 'python', code: 'x', annotations: [], walkthrough: [], runnable: false }] },
    });
  });

  it('still shows an invalid payload that has the right shape', () => {
    const text = JSON.stringify({ starterCode: 'x = ___1___', blanks: [{ id: 1, accepted: [] }] });
    expect(readStoredTask(text)).toMatchObject({ kind: 'typed', payload: { blanks: [{ id: 1, accepted: [] }] } });
  });

  it('keeps text it cannot read as the raw text instead of dropping it', () => {
    expect(readStoredTask('{"starterCode":')).toEqual({ kind: 'raw', text: '{"starterCode":' });
    expect(readStoredSnippet('[1,2]')).toEqual({ kind: 'raw', text: '[1,2]' });
  });
});
