import { describe, expect, it } from 'vitest';
import type { CodeAnswer } from '@birb-learn/code-runner/src/grading';
import { isCodeAnswerEmpty, parseCodeAnswer, serializeCodeAnswer } from './task-answer';

const ANSWERS: CodeAnswer[] = [
  { kind: 'write', code: 'print(1)\n' },
  { kind: 'predict_output', output: '10' },
  { kind: 'fill_blank', blanks: { 1: '>=', 2: 'nome' } },
  { kind: 'find_bug', line: 4, code: 'soma += n' },
];

describe('serializeCodeAnswer and parseCodeAnswer', () => {
  it.each(ANSWERS)('round-trips a $kind answer', (answer) => {
    expect(parseCodeAnswer(answer.kind, serializeCodeAnswer(answer))).toEqual(answer);
  });

  it('returns undefined for a missing or unparsable value', () => {
    expect(parseCodeAnswer('write', undefined)).toBeUndefined();
    expect(parseCodeAnswer('write', '')).toBeUndefined();
    expect(parseCodeAnswer('write', '{not json')).toBeUndefined();
    expect(parseCodeAnswer('write', 'null')).toBeUndefined();
    expect(parseCodeAnswer('write', '[]')).toBeUndefined();
  });

  it('returns undefined for an answer of another kind', () => {
    expect(parseCodeAnswer('predict_output', serializeCodeAnswer(ANSWERS[0]))).toBeUndefined();
  });

  it('returns undefined for a malformed payload of the right kind', () => {
    expect(parseCodeAnswer('write', '{"kind":"write","code":3}')).toBeUndefined();
    expect(parseCodeAnswer('predict_output', '{"kind":"predict_output"}')).toBeUndefined();
    expect(parseCodeAnswer('fill_blank', '{"kind":"fill_blank","blanks":{"a":"x"}}')).toBeUndefined();
    expect(parseCodeAnswer('fill_blank', '{"kind":"fill_blank","blanks":{"1":2}}')).toBeUndefined();
    expect(parseCodeAnswer('find_bug', '{"kind":"find_bug","line":1.5,"code":""}')).toBeUndefined();
    expect(parseCodeAnswer('find_bug', '{"kind":"find_bug","line":"3","code":""}')).toBeUndefined();
  });

  it('drops unknown properties', () => {
    expect(parseCodeAnswer('write', '{"kind":"write","code":"x","extra":1}')).toEqual({ kind: 'write', code: 'x' });
  });
});

describe('isCodeAnswerEmpty', () => {
  it('treats a write answer equal to the starter code (trimmed) as empty', () => {
    expect(isCodeAnswerEmpty('write', { kind: 'write', code: '  n = int(input())\n\n' }, 'n = int(input())\n')).toBe(true);
    expect(isCodeAnswerEmpty('write', { kind: 'write', code: 'n = int(input())\nprint(n)' }, 'n = int(input())\n')).toBe(false);
  });

  it('treats a blank predict_output answer as empty', () => {
    expect(isCodeAnswerEmpty('predict_output', { kind: 'predict_output', output: ' \n' }, '')).toBe(true);
    expect(isCodeAnswerEmpty('predict_output', { kind: 'predict_output', output: '0' }, '')).toBe(false);
  });

  it('treats a fill_blank answer as empty only when every blank is blank', () => {
    expect(isCodeAnswerEmpty('fill_blank', { kind: 'fill_blank', blanks: {} }, '')).toBe(true);
    expect(isCodeAnswerEmpty('fill_blank', { kind: 'fill_blank', blanks: { 1: ' ', 2: '' } }, '')).toBe(true);
    expect(isCodeAnswerEmpty('fill_blank', { kind: 'fill_blank', blanks: { 1: '', 2: 'x' } }, '')).toBe(false);
  });

  it('treats a find_bug answer as empty until a line is chosen', () => {
    expect(isCodeAnswerEmpty('find_bug', { kind: 'find_bug', line: 0, code: 'changed' }, '')).toBe(true);
    expect(isCodeAnswerEmpty('find_bug', { kind: 'find_bug', line: 3, code: '' }, '')).toBe(false);
  });

  it('treats an answer of another kind as empty', () => {
    expect(isCodeAnswerEmpty('write', { kind: 'predict_output', output: 'x' }, '')).toBe(true);
  });
});
