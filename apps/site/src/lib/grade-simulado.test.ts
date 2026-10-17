import { describe, expect, it, vi } from 'vitest';
import type { RunRequest, RunResult, Runner } from '@birb-learn/code-runner/src/protocol';
import { serializeCodeAnswer } from '@birb-learn/code-ui';
import { gradeSimulado, regradeNotGraded } from './grade-simulado';
import type { ExportedQuestion } from './simulado-selection';

const mcQuestion: ExportedQuestion = {
  id: 1,
  type: 'multiple_choice',
  difficulty: 'easy',
  promptHtml: '<p>P</p>',
  options: [
    { id: 10, textHtml: '<p>1</p>', isCorrect: false },
    { id: 11, textHtml: '<p>2</p>', isCorrect: true },
  ],
  acceptedAnswers: [],
  matchingPairs: [],
  correctAnswer: null,
  resolutionHtml: '<p>R</p>',
  answerFormat: 'text',
  isFallback: false,
  tagIds: [],
  code: null,
};

const multiResponseQuestion: ExportedQuestion = {
  id: 5,
  type: 'multiple_response',
  difficulty: 'hard',
  promptHtml: '<p>P</p>',
  options: [
    { id: 30, textHtml: '<p>A</p>', isCorrect: true },
    { id: 31, textHtml: '<p>B</p>', isCorrect: false },
    { id: 32, textHtml: '<p>C</p>', isCorrect: true },
  ],
  acceptedAnswers: [],
  matchingPairs: [],
  correctAnswer: null,
  resolutionHtml: '<p>R</p>',
  answerFormat: 'text',
  isFallback: false,
  tagIds: [],
  code: null,
};

const numericQuestion: ExportedQuestion = {
  id: 2,
  type: 'numeric',
  difficulty: 'medium',
  promptHtml: '<p>P</p>',
  options: [],
  acceptedAnswers: [],
  matchingPairs: [],
  correctAnswer: '1',
  resolutionHtml: '<p>R</p>',
  answerFormat: 'text',
  isFallback: false,
  tagIds: [],
  code: null,
};

describe('gradeSimulado', () => {
  it('grades a correct multiple-choice answer', async () => {
    const result = await gradeSimulado([mcQuestion], { 1: '11' }, 'pt-BR');
    expect(result.correctCount).toBe(1);
    expect(result.total).toBe(1);
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it('grades an incorrect multiple-choice answer', async () => {
    const result = await gradeSimulado([mcQuestion], { 1: '10' }, 'pt-BR');
    expect(result.correctCount).toBe(0);
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a numeric answer using locale-aware normalization', async () => {
    const result = await gradeSimulado([numericQuestion], { 2: '1,0' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it('grades an unanswered question as incorrect, not a crash', async () => {
    const result = await gradeSimulado([mcQuestion, numericQuestion], {}, 'pt-BR');
    expect(result.correctCount).toBe(0);
    expect(result.perQuestion.every((q) => !q.isCorrect)).toBe(true);
  });

  it('computes an overall correctCount/total across mixed question types', async () => {
    const result = await gradeSimulado([mcQuestion, numericQuestion], { 1: '11', 2: '1' }, 'pt-BR');
    expect(result.correctCount).toBe(2);
    expect(result.total).toBe(2);
  });

  it('grades a blank numeric answer as incorrect even when the correct answer is zero', async () => {
    const zeroQuestion: ExportedQuestion = { ...numericQuestion, id: 3, correctAnswer: '0' };
    const result = await gradeSimulado([zeroQuestion], { 3: '' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a correct decimal numeric answer for the es locale', async () => {
    const decimalQuestion: ExportedQuestion = { ...numericQuestion, id: 4, correctAnswer: '1.5' };
    const result = await gradeSimulado([decimalQuestion], { 4: '1,5' }, 'es');
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it('grades a multiple-response answer correct only when the exact set of correct options is selected', async () => {
    const result = await gradeSimulado([multiResponseQuestion], { 5: '30,32' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it('grades a multiple-response answer missing a correct option as incorrect', async () => {
    const result = await gradeSimulado([multiResponseQuestion], { 5: '30' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a multiple-response answer with an extra incorrect option selected as incorrect', async () => {
    const result = await gradeSimulado([multiResponseQuestion], { 5: '30,31,32' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades an unanswered multiple-response question as incorrect, not a crash', async () => {
    const result = await gradeSimulado([multiResponseQuestion], {}, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a blank multiple-response answer as incorrect', async () => {
    const result = await gradeSimulado([multiResponseQuestion], { 5: '' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a true_false question by exact string match', async () => {
    const question: ExportedQuestion = {
      id: 10,
      type: 'true_false',
      difficulty: 'easy',
      promptHtml: '<p>P?</p>',
      options: [],
      acceptedAnswers: [],
      matchingPairs: [],
      correctAnswer: 'true',
      resolutionHtml: '<p>R.</p>',
      answerFormat: 'text',
      isFallback: false,
      tagIds: [],
      code: null,
    };

    const result = await gradeSimulado([question], { 10: 'true' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(true);

    const wrongResult = await gradeSimulado([question], { 10: 'false' }, 'pt-BR');
    expect(wrongResult.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a short_text question by normalized, accent-insensitive match', async () => {
    const question: ExportedQuestion = {
      id: 11,
      type: 'short_text',
      difficulty: 'medium',
      promptHtml: '<p>P?</p>',
      options: [],
      acceptedAnswers: [
        { id: 1, text: 'Teorema do Valor Intermediário' },
        { id: 2, text: 'TVI' },
      ],
      matchingPairs: [],
      correctAnswer: null,
      resolutionHtml: '<p>R.</p>',
      answerFormat: 'text',
      isFallback: false,
      tagIds: [],
      code: null,
    };

    expect((await gradeSimulado([question], { 11: 'tvi' }, 'pt-BR')).perQuestion[0].isCorrect).toBe(true);
    expect(
      (await gradeSimulado([question], { 11: 'teorema do valor intermediario' }, 'pt-BR')).perQuestion[0].isCorrect,
    ).toBe(true);
    expect((await gradeSimulado([question], { 11: 'algo errado' }, 'pt-BR')).perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a math-mode short_text question case-sensitively and whitespace-insensitively', async () => {
    const question: ExportedQuestion = {
      id: 20,
      type: 'short_text',
      difficulty: 'hard',
      promptHtml: '<p>P?</p>',
      options: [],
      acceptedAnswers: [{ id: 1, text: '3x+1' }],
      matchingPairs: [],
      correctAnswer: null,
      answerFormat: 'math',
      resolutionHtml: '<p>R.</p>',
      isFallback: false,
      tagIds: [],
      code: null,
    };

    const result = await gradeSimulado([question], { 20: '3x + 1' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(true);

    const wrongCase = await gradeSimulado([question], { 20: '3X+1' }, 'pt-BR');
    expect(wrongCase.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a math-mode short_text answer as correct when symbolically equivalent, not just syntactically identical', async () => {
    const question: ExportedQuestion = {
      id: 21,
      type: 'short_text',
      difficulty: 'hard',
      promptHtml: '<p>P?</p>',
      options: [],
      acceptedAnswers: [{ id: 1, text: '3x+1' }],
      matchingPairs: [],
      correctAnswer: null,
      answerFormat: 'math',
      resolutionHtml: '<p>R.</p>',
      isFallback: false,
      tagIds: [],
      code: null,
    };

    const result = await gradeSimulado([question], { 21: '1+3x' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it('grades an ordering question by exact sequence match', async () => {
    const question: ExportedQuestion = {
      id: 12,
      type: 'ordering',
      difficulty: 'medium',
      promptHtml: '<p>P?</p>',
      options: [
        { id: 100, textHtml: '<p>Fatorar</p>', isCorrect: false },
        { id: 101, textHtml: '<p>Cancelar</p>', isCorrect: false },
        { id: 102, textHtml: '<p>Substituir</p>', isCorrect: false },
      ],
      acceptedAnswers: [],
      matchingPairs: [],
      correctAnswer: null,
      resolutionHtml: '<p>R.</p>',
      answerFormat: 'text',
      isFallback: false,
      tagIds: [],
      code: null,
    };

    expect((await gradeSimulado([question], { 12: '100,101,102' }, 'pt-BR')).perQuestion[0].isCorrect).toBe(true);
    expect((await gradeSimulado([question], { 12: '101,100,102' }, 'pt-BR')).perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a matching question by exact leftId=rightId pairing', async () => {
    const question: ExportedQuestion = {
      id: 13,
      type: 'matching',
      difficulty: 'hard',
      promptHtml: '<p>P?</p>',
      options: [],
      acceptedAnswers: [],
      matchingPairs: [
        { id: 1, leftHtml: '<p>Removível</p>', rightHtml: '<p>Descrição A</p>' },
        { id: 2, leftHtml: '<p>Salto</p>', rightHtml: '<p>Descrição B</p>' },
      ],
      correctAnswer: null,
      resolutionHtml: '<p>R.</p>',
      answerFormat: 'text',
      isFallback: false,
      tagIds: [],
      code: null,
    };

    expect((await gradeSimulado([question], { 13: '1:1,2:2' }, 'pt-BR')).perQuestion[0].isCorrect).toBe(true);
    expect((await gradeSimulado([question], { 13: '1:2,2:1' }, 'pt-BR')).perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a numeric question explicitly, not as a fallthrough default', async () => {
    // Regression guard for the exhaustiveness fix: numeric grading must
    // still work when reached via its own explicit `if (question.type ===
    // 'numeric')` branch rather than an implicit catch-all.
    const result = await gradeSimulado([numericQuestion], { 2: '1' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it('throws instead of silently misgrading an unrecognized question type', async () => {
    // Simulates a future 8th type added to the exported data without a
    // corresponding branch in `isAnswerCorrect` — the exhaustiveness check
    // must fail loudly at runtime for such data, matching what TypeScript
    // would flag at compile time for a real new union member.
    const unknownQuestion = { ...numericQuestion, type: 'essay' } as unknown as ExportedQuestion;
    await expect(gradeSimulado([unknownQuestion], { 2: 'anything' }, 'pt-BR')).rejects.toThrow(/essay/);
  });
});

function makeCodeQuestion(id: number, overrides: Partial<NonNullable<ExportedQuestion['code']>> = {}): ExportedQuestion {
  return {
    ...mcQuestion,
    id,
    type: 'code',
    options: [],
    code: {
      kind: 'write',
      language: 'python',
      payload: {
        starterCode: 'n = int(input())\n',
        solution: 'n = int(input())\nprint(n * 2)\n',
        tests: [{ stdin: '4\n', expectedStdout: '8\n' }],
        blanks: [],
        hints: [],
      },
      starterTokens: [[{ text: 'n = int(input())' }]],
      solutionTokens: [],
      ...overrides,
    },
  };
}

const writeAnswer = (code: string) => serializeCodeAnswer({ kind: 'write', code });

function okRun(stdout: string): RunResult {
  return { status: 'ok', cases: [{ status: 'ok', stdout, stderr: '', exitCode: 0, durationMs: 1 }] };
}

/** A runner that answers every run with `stdout`, recording the requests. */
function fakeRunner(stdout = '8\n'): Runner & { requests: RunRequest[] } {
  const requests: RunRequest[] = [];
  return {
    requests,
    async runCode(request) {
      requests.push(request);
      return okRun(stdout);
    },
  };
}

describe('gradeSimulado with code questions', () => {
  it('grades a correct write answer as correct', async () => {
    const runner = fakeRunner();
    const result = await gradeSimulado([makeCodeQuestion(40)], { 40: writeAnswer('n = int(input())\nprint(n * 2)\n') }, 'pt-BR', {
      runner,
    });

    expect(result.perQuestion[0].verdict).toBe('correct');
    expect(result.perQuestion[0].isCorrect).toBe(true);
    expect(result.perQuestion[0].code?.tests[0].passed).toBe(true);
    expect(result.correctCount).toBe(1);
    expect(runner.requests).toHaveLength(1);
  });

  it('grades a write answer whose tests fail as incorrect', async () => {
    const result = await gradeSimulado([makeCodeQuestion(40)], { 40: writeAnswer('print(0)\n') }, 'pt-BR', {
      runner: fakeRunner('0\n'),
    });

    expect(result.perQuestion[0].verdict).toBe('incorrect');
    expect(result.perQuestion[0].isCorrect).toBe(false);
    expect(result.perQuestion[0].code?.tests[0]).toMatchObject({ passed: false, expected: '8', actual: '0' });
  });

  it('grades a missing, malformed or untouched answer as incorrect without running anything', async () => {
    const runner = fakeRunner();
    const questions = [makeCodeQuestion(40), makeCodeQuestion(41), makeCodeQuestion(42)];
    const result = await gradeSimulado(questions, { 41: 'not json', 42: writeAnswer('n = int(input())\n') }, 'pt-BR', { runner });

    expect(result.perQuestion.map((entry) => entry.verdict)).toEqual(['incorrect', 'incorrect', 'incorrect']);
    expect(result.perQuestion.every((entry) => entry.code === undefined)).toBe(true);
    expect(runner.requests).toHaveLength(0);
  });

  it('marks a code question not_graded, with the reason, when the runner is unavailable', async () => {
    const runner: Runner = {
      runCode: async () => ({ status: 'unavailable', reason: 'rate_limited', retryAfterMs: 3000, cases: [] }),
    };
    const result = await gradeSimulado([makeCodeQuestion(40), mcQuestion], { 40: writeAnswer('print(8)\n'), 1: '11' }, 'pt-BR', {
      runner,
    });

    expect(result.perQuestion[0].verdict).toBe('not_graded');
    expect(result.perQuestion[0].isCorrect).toBe(false);
    expect(result.perQuestion[0].notGraded).toEqual({ reason: 'rate_limited', retryAfterMs: 3000 });
    expect(result.correctCount).toBe(1);
  });

  it('marks a code question not_graded when the runner rejects', async () => {
    const runner: Runner = { runCode: () => Promise.reject(new Error('boom')) };
    const result = await gradeSimulado([makeCodeQuestion(40)], { 40: writeAnswer('print(8)\n') }, 'pt-BR', { runner });

    expect(result.perQuestion[0].verdict).toBe('not_graded');
    expect(result.perQuestion[0].notGraded).toEqual({ reason: 'service_error' });
  });

  it('gives every non-code question a verdict that matches isCorrect', async () => {
    const result = await gradeSimulado([mcQuestion, numericQuestion], { 1: '11', 2: '5' }, 'pt-BR');

    expect(result.perQuestion.map((entry) => entry.verdict)).toEqual(['correct', 'incorrect']);
  });

  it('grades code questions one at a time, after the others, keeping the question order', async () => {
    const events: string[] = [];
    let running = 0;
    let overlapped = false;
    const runner: Runner = {
      async runCode(request) {
        running += 1;
        if (running > 1) overlapped = true;
        events.push(`start ${request.source.trim()}`);
        await new Promise((resolve) => setTimeout(resolve, 5));
        events.push(`end ${request.source.trim()}`);
        running -= 1;
        return okRun('8\n');
      },
    };
    const onProgress = vi.fn();
    const questions = [makeCodeQuestion(40), mcQuestion, makeCodeQuestion(41)];

    const result = await gradeSimulado(questions, { 40: writeAnswer('print(8) # a'), 41: writeAnswer('print(8) # b'), 1: '11' }, 'pt-BR', {
      runner,
      onProgress,
    });

    expect(overlapped).toBe(false);
    expect(events).toEqual(['start print(8) # a', 'end print(8) # a', 'start print(8) # b', 'end print(8) # b']);
    expect(result.perQuestion.map((entry) => entry.question.id)).toEqual([40, 1, 41]);
    expect(onProgress).toHaveBeenNthCalledWith(1, 0, 2);
    expect(onProgress).toHaveBeenLastCalledWith(2, 2);
    expect(result.correctCount).toBe(3);
  });

  it('passes the signal to the runner and rejects once it is aborted', async () => {
    const controller = new AbortController();
    const signals: (AbortSignal | undefined)[] = [];
    const runner: Runner = {
      async runCode(_request, options) {
        signals.push(options?.signal);
        controller.abort();
        return { status: 'unavailable', reason: 'service_error', cases: [] };
      },
    };

    await expect(
      gradeSimulado([makeCodeQuestion(40), makeCodeQuestion(41)], { 40: writeAnswer('print(8)'), 41: writeAnswer('print(8)') }, 'pt-BR', {
        runner,
        signal: controller.signal,
      }),
    ).rejects.toThrow();
    expect(signals).toEqual([controller.signal]);
  });
});

describe('regradeNotGraded', () => {
  it('re-runs only the not_graded questions and recomputes correctCount', async () => {
    const questions = [makeCodeQuestion(40), makeCodeQuestion(41), mcQuestion];
    const answers = { 40: writeAnswer('print(8) # a'), 41: writeAnswer('print(0) # b'), 1: '11' };
    let available = false;
    const requests: RunRequest[] = [];
    const runner: Runner = {
      async runCode(request) {
        requests.push(request);
        if (request.source.includes('# a') && !available) return { status: 'unavailable', reason: 'offline', cases: [] };
        return okRun(request.source.includes('# a') ? '8\n' : '0\n');
      },
    };

    const first = await gradeSimulado(questions, answers, 'pt-BR', { runner });
    expect(first.perQuestion.map((entry) => entry.verdict)).toEqual(['not_graded', 'incorrect', 'correct']);
    expect(first.correctCount).toBe(1);

    available = true;
    requests.length = 0;
    const onProgress = vi.fn();
    const second = await regradeNotGraded(first, answers, 'pt-BR', { runner, onProgress });

    expect(requests.map((request) => request.source)).toEqual(['print(8) # a']);
    expect(second.perQuestion.map((entry) => entry.verdict)).toEqual(['correct', 'incorrect', 'correct']);
    expect(second.perQuestion[0].notGraded).toBeUndefined();
    expect(second.correctCount).toBe(2);
    expect(second.total).toBe(3);
    expect(onProgress).toHaveBeenLastCalledWith(1, 1);
    // The earlier result is left as it was.
    expect(first.correctCount).toBe(1);
  });

  it('returns an equal result without running anything when nothing is not_graded', async () => {
    const runner = fakeRunner();
    const first = await gradeSimulado([mcQuestion], { 1: '11' }, 'pt-BR', { runner });
    const second = await regradeNotGraded(first, { 1: '11' }, 'pt-BR', { runner });

    expect(second).toEqual(first);
    expect(runner.requests).toHaveLength(0);
  });
});
