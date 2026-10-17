import { describe, expect, it } from 'vitest';
import { serializeCodeAnswer } from '@birb-learn/code-ui';
import { readCodeAnswer } from './code-question-answer';
import type { ExportedCodeTask } from './export-question';

const writeTask: ExportedCodeTask = {
  kind: 'write',
  language: 'python',
  payload: { starterCode: 'n = int(input())\n', tests: [{ stdin: '', expectedStdout: '1\n' }], blanks: [], hints: [] },
  starterTokens: [],
  solutionTokens: [],
};

describe('readCodeAnswer', () => {
  it('returns a real answer', () => {
    expect(readCodeAnswer(writeTask, serializeCodeAnswer({ kind: 'write', code: 'print(1)' }))).toEqual({
      kind: 'write',
      code: 'print(1)',
    });
  });

  it('returns undefined for a missing, malformed, other-kind or still-starter answer', () => {
    expect(readCodeAnswer(writeTask, undefined)).toBeUndefined();
    expect(readCodeAnswer(writeTask, '{')).toBeUndefined();
    expect(readCodeAnswer(writeTask, serializeCodeAnswer({ kind: 'predict_output', output: '1' }))).toBeUndefined();
    expect(readCodeAnswer(writeTask, serializeCodeAnswer({ kind: 'write', code: 'n = int(input())' }))).toBeUndefined();
  });
});
