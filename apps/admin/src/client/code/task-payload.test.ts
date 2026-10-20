import { describe, expect, it } from 'vitest';
import { validateCodeSnippet, validateCodeTask, type CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import { adaptTaskPayload, parseSnippetPayload, parseTaskPayload, placeholderSnippet, placeholderTask, syncBlanks } from './task-payload';

const WRITE: CodeTaskPayloadData = {
  starterCode: 'x = ___1___\n',
  solution: 'x = 1\n',
  tests: [{ stdin: '', expectedStdout: '1\n' }],
  blanks: [],
  hints: [],
};

describe('placeholders', () => {
  it('start from payloads the validators accept', () => {
    expect(validateCodeSnippet(placeholderSnippet())).toEqual([]);
    expect(validateCodeTask('write', 'python', placeholderTask())).toEqual([]);
    expect(placeholderTask().tests).toHaveLength(1);
  });
});

describe('parseSnippetPayload / parseTaskPayload', () => {
  it('parse stored text and apply the schema defaults', () => {
    const snippet = parseSnippetPayload(JSON.stringify({ variants: [{ language: 'python', code: 'x' }] }));
    expect(snippet?.variants[0]).toMatchObject({ annotations: [], walkthrough: [], runnable: false });

    expect(parseTaskPayload(JSON.stringify({ starterCode: '' }))).toMatchObject({ tests: [], blanks: [], hints: [] });
  });

  it('return null for missing, malformed or invalid text', () => {
    for (const text of [null, undefined, '', '{', '{}', '[]']) {
      expect(parseSnippetPayload(text)).toBeNull();
    }
    expect(parseTaskPayload('{"tests":3}')).toBeNull();
  });
});

describe('syncBlanks', () => {
  it('creates blanks for new markers, keeps known ones and drops the rest', () => {
    const blanks = [
      { id: 1, accepted: ['a'] },
      { id: 3, accepted: ['c'] },
    ];
    expect(syncBlanks('___1___ ___2___ ___1___', blanks)).toEqual([
      { id: 1, accepted: ['a'] },
      { id: 2, accepted: [''] },
    ]);
  });
});

describe('adaptTaskPayload', () => {
  it('empties the tests and requires the expected output for predict_output', () => {
    const adapted = adaptTaskPayload(WRITE, 'predict_output', 'python');
    expect(adapted.tests).toEqual([]);
    expect(adapted.expectedOutput).toBe('');
    expect(validateCodeTask('predict_output', 'python', adapted)).toEqual([]);
  });

  it('syncs the blanks with the markers for fill_blank and clears them for the other kinds', () => {
    const adapted = adaptTaskPayload(WRITE, 'fill_blank', 'python');
    expect(adapted.blanks).toEqual([{ id: 1, accepted: [''] }]);
    expect(adaptTaskPayload(adapted, 'write', 'python').blanks).toEqual([]);
  });

  it('gives find_bug bug lines and keeps existing ones', () => {
    expect(adaptTaskPayload({ ...WRITE, starterCode: 'a\nb\n' }, 'find_bug', 'python').bugLines).toBe('1');
    expect(adaptTaskPayload({ ...WRITE, bugLines: '2' }, 'find_bug', 'python').bugLines).toBe('2');
    expect(adaptTaskPayload({ ...WRITE, bugLines: '2' }, 'write', 'python')).not.toHaveProperty('bugLines');
  });

  it('uses the starter as the solution when there is none', () => {
    const { solution: _solution, ...withoutSolution } = WRITE;
    expect(adaptTaskPayload(withoutSolution, 'write', 'python').solution).toBe(WRITE.starterCode);
  });

  it('replaces tests of the wrong shape when the language moves between stdout and SQL', () => {
    const sql = adaptTaskPayload(WRITE, 'write', 'sqlite');
    expect(sql.tests).toHaveLength(1);
    expect(sql.tests[0]).toHaveProperty('expectedRows');
    expect(validateCodeTask('write', 'sqlite', sql)).toEqual([]);

    const back = adaptTaskPayload(sql, 'write', 'python');
    expect(back.tests[0]).toHaveProperty('expectedStdout');
  });

  it('keeps tests that already match the language', () => {
    expect(adaptTaskPayload(WRITE, 'write', 'javascript').tests).toEqual(WRITE.tests);
  });
});
