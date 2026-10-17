import { describe, expect, it } from 'vitest';
import type { QuestionExport } from '@birb-learn/content-schema';
import {
  compileQuestionForExport,
  isValidNumericCorrectAnswer,
  assertValidNumericCorrectAnswer,
  assertValidShortTextAnswer,
  assertValidMatchingPairs,
  parseCodeQuestion,
} from './export-question';

const mcQuestion: QuestionExport = {
  id: 1,
  type: 'multiple_choice',
  codeKind: null,
  codeLanguage: null,
  codeJson: null,
  difficulty: 'easy',
  promptMdx: 'Qual é o valor de $1 + 1$?',
  resolutionMdx: 'A soma vale $2$.',
  correctAnswer: null,
  options: [
    { id: 10, textMdx: '1', isCorrect: false },
    { id: 11, textMdx: '2', isCorrect: true },
  ],
  acceptedAnswers: [],
  matchingPairs: [],
  answerFormat: 'text',
  isFallback: false,
  tagIds: [5],
};

const numericQuestion: QuestionExport = {
  id: 2,
  type: 'numeric',
  codeKind: null,
  codeLanguage: null,
  codeJson: null,
  difficulty: 'medium',
  promptMdx: 'Quanto é $3 \\div 2$?',
  resolutionMdx: 'A divisão de $3$ por $2$ é igual a $1.5$.',
  correctAnswer: '1.5',
  options: [],
  acceptedAnswers: [],
  matchingPairs: [],
  answerFormat: 'text',
  isFallback: false,
  tagIds: [5, 6],
};

const multiResponseQuestion: QuestionExport = {
  id: 3,
  type: 'multiple_response',
  codeKind: null,
  codeLanguage: null,
  codeJson: null,
  difficulty: 'hard',
  promptMdx: 'Quais afirmações são verdadeiras?',
  resolutionMdx: 'A primeira e a terceira são verdadeiras.',
  correctAnswer: null,
  options: [
    { id: 20, textMdx: 'Afirmação 1', isCorrect: true },
    { id: 21, textMdx: 'Afirmação 2', isCorrect: false },
    { id: 22, textMdx: 'Afirmação 3', isCorrect: true },
  ],
  acceptedAnswers: [],
  matchingPairs: [],
  answerFormat: 'text',
  isFallback: false,
  tagIds: [7],
};

const trueFalseQuestion: QuestionExport = {
  id: 3,
  type: 'true_false',
  codeKind: null,
  codeLanguage: null,
  codeJson: null,
  difficulty: 'easy',
  promptMdx: 'O céu é azul?',
  resolutionMdx: 'Sim.',
  correctAnswer: 'true',
  options: [],
  acceptedAnswers: [],
  matchingPairs: [],
  answerFormat: 'text',
  isFallback: false,
  tagIds: [],
};

const shortTextQuestion: QuestionExport = {
  id: 4,
  type: 'short_text',
  codeKind: null,
  codeLanguage: null,
  codeJson: null,
  difficulty: 'medium',
  promptMdx: 'Qual gás as plantas liberam na fotossíntese?',
  resolutionMdx: 'Oxigênio.',
  correctAnswer: null,
  options: [],
  acceptedAnswers: [
    { id: 1, text: 'Oxigênio' },
    { id: 2, text: 'O2' },
  ],
  matchingPairs: [],
  answerFormat: 'text',
  isFallback: false,
  tagIds: [],
};

const mathShortTextQuestion: QuestionExport = {
  id: 7,
  type: 'short_text',
  codeKind: null,
  codeLanguage: null,
  codeJson: null,
  difficulty: 'hard',
  promptMdx: 'Calcule $\\lim_{x \\to 2} (3x + 1)$.',
  resolutionMdx: 'Substituição direta.',
  correctAnswer: null,
  answerFormat: 'math',
  isFallback: false,
  options: [],
  acceptedAnswers: [{ id: 3, text: '7' }],
  matchingPairs: [],
  tagIds: [],
};

const orderingQuestion: QuestionExport = {
  id: 5,
  type: 'ordering',
  codeKind: null,
  codeLanguage: null,
  codeJson: null,
  difficulty: 'medium',
  promptMdx: 'Ordene os passos.',
  resolutionMdx: 'Ver resolução.',
  correctAnswer: null,
  options: [
    { id: 50, textMdx: 'Primeiro', isCorrect: false },
    { id: 51, textMdx: 'Segundo', isCorrect: false },
  ],
  acceptedAnswers: [],
  matchingPairs: [],
  answerFormat: 'text',
  isFallback: false,
  tagIds: [],
};

const matchingQuestion: QuestionExport = {
  id: 6,
  type: 'matching',
  codeKind: null,
  codeLanguage: null,
  codeJson: null,
  difficulty: 'hard',
  promptMdx: 'Associe.',
  resolutionMdx: 'Ver resolução.',
  correctAnswer: null,
  options: [],
  acceptedAnswers: [],
  matchingPairs: [
    { id: 60, leftMdx: 'Cão', rightMdx: 'Late' },
    { id: 61, leftMdx: 'Gato', rightMdx: 'Mia' },
  ],
  answerFormat: 'text',
  isFallback: false,
  tagIds: [],
};

const codeQuestion: QuestionExport = {
  id: 8,
  type: 'code',
  codeKind: 'write',
  codeLanguage: 'python',
  codeJson: JSON.stringify({
    starterCode: 'n = int(input())\n',
    solution: 'n = int(input())\nprint(n * 2)\n',
    tests: [{ stdin: '4\n', expectedStdout: '8\n' }],
  }),
  difficulty: 'easy',
  promptMdx: 'Imprima o **dobro** de `n`.',
  resolutionMdx: 'Multiplique por $2$.',
  correctAnswer: null,
  options: [],
  acceptedAnswers: [],
  matchingPairs: [],
  answerFormat: 'text',
  isFallback: false,
  tagIds: [9],
};

describe('compileQuestionForExport', () => {
  it('exports a code question with its payload and the highlighted starter and solution', async () => {
    const exported = await compileQuestionForExport(codeQuestion);

    expect(exported.type).toBe('code');
    expect(exported.promptHtml).toContain('<strong>dobro</strong>');
    expect(exported.resolutionHtml).toContain('class="katex"');
    expect(exported.code).not.toBeNull();
    const code = exported.code!;
    expect(code.kind).toBe('write');
    expect(code.language).toBe('python');
    // The payload is parsed, so the schema's defaults are filled in.
    expect(code.payload.tests).toEqual([{ stdin: '4\n', expectedStdout: '8\n' }]);
    expect(code.payload.blanks).toEqual([]);
    expect(code.starterTokens).toHaveLength(1);
    expect(code.starterTokens[0].map((token) => token.text).join('')).toBe('n = int(input())');
    expect(code.solutionTokens).toHaveLength(2);
    expect(code.solutionTokens[1].map((token) => token.text).join('')).toBe('print(n * 2)');
    expect(code.solutionTokens.flat().some((token) => token.color?.startsWith('var(--code-'))).toBe(true);
  });

  it('gives a code question with no solution empty solution tokens', async () => {
    const exported = await compileQuestionForExport({
      ...codeQuestion,
      codeKind: 'predict_output',
      codeJson: JSON.stringify({ starterCode: 'print(1)\n', expectedOutput: '1' }),
    });

    expect(exported.code!.solutionTokens).toEqual([]);
    expect(exported.code!.payload.expectedOutput).toBe('1');
  });

  it('exports code: null for a question of another type', async () => {
    const exported = await compileQuestionForExport(mcQuestion);

    expect(exported.code).toBeNull();
  });

  it('throws naming the question when a code payload fails the cross-field checks', async () => {
    const invalid = { ...codeQuestion, codeJson: JSON.stringify({ starterCode: 'x = 1\n', tests: [] }) };

    await expect(compileQuestionForExport(invalid)).rejects.toThrow(/^Question 8: solution: required for a write task$/);
  });
});

describe('parseCodeQuestion', () => {
  it('returns the kind, language and parsed payload of a valid code question', () => {
    const parsed = parseCodeQuestion(codeQuestion);

    expect(parsed.kind).toBe('write');
    expect(parsed.language).toBe('python');
    expect(parsed.payload.solution).toBe('n = int(input())\nprint(n * 2)\n');
  });

  it('throws "Question <id>: <first error>" for a payload that fails validateCodeTask', () => {
    const invalid = { ...codeQuestion, codeJson: JSON.stringify({ starterCode: 'x = 1\n', tests: [] }) };

    expect(() => parseCodeQuestion(invalid)).toThrow('Question 8: solution: required for a write task');
  });

  it('throws naming the question for a payload that does not match the schema', () => {
    const invalid = { ...codeQuestion, codeJson: JSON.stringify({ tests: 'none' }) };

    expect(() => parseCodeQuestion(invalid)).toThrow(/^Question 8: /);
  });

  it('throws naming the question for malformed JSON or missing code columns', () => {
    expect(() => parseCodeQuestion({ ...codeQuestion, codeJson: '{' })).toThrow(/^Question 8: /);
    expect(() => parseCodeQuestion({ ...codeQuestion, codeJson: null })).toThrow(/^Question 8: /);
    expect(() => parseCodeQuestion({ ...codeQuestion, codeKind: null })).toThrow(/^Question 8: /);
  });
});

describe('compileQuestionForExport (non-code types)', () => {
  it('compiles a multiple-choice question, including all of its options, to HTML', async () => {
    const exported = await compileQuestionForExport(mcQuestion);

    expect(exported.id).toBe(1);
    expect(exported.type).toBe('multiple_choice');
    expect(exported.promptHtml).toContain('class="katex"');
    expect(exported.resolutionHtml).toContain('class="katex"');
    expect(exported.options).toHaveLength(2);
    expect(exported.options[1].isCorrect).toBe(true);
    expect(exported.options[0].textHtml).toContain('<p>');
    expect(exported.correctAnswer).toBeNull();
    expect(exported.tagIds).toEqual([5]);
  });

  it('compiles a numeric question with no options', async () => {
    const exported = await compileQuestionForExport(numericQuestion);

    expect(exported.type).toBe('numeric');
    expect(exported.options).toHaveLength(0);
    expect(exported.correctAnswer).toBe('1.5');
    expect(exported.promptHtml).toContain('class="katex"');
  });

  it('compiles a multiple-response question, including all of its options, to HTML', async () => {
    const exported = await compileQuestionForExport(multiResponseQuestion);

    expect(exported.type).toBe('multiple_response');
    expect(exported.options).toHaveLength(3);
    expect(exported.options.filter((option) => option.isCorrect)).toHaveLength(2);
    expect(exported.options[0].textHtml).toContain('<p>');
    expect(exported.correctAnswer).toBeNull();
  });

  it('compiles a true_false question with no options', async () => {
    const exported = await compileQuestionForExport(trueFalseQuestion);

    expect(exported.type).toBe('true_false');
    expect(exported.options).toHaveLength(0);
    expect(exported.correctAnswer).toBe('true');
  });

  it('passes short_text accepted answers through as plain text, uncompiled', async () => {
    const exported = await compileQuestionForExport(shortTextQuestion);

    expect(exported.type).toBe('short_text');
    expect(exported.acceptedAnswers).toEqual([
      { id: 1, text: 'Oxigênio' },
      { id: 2, text: 'O2' },
    ]);
  });

  it('compiles an ordering question’s options, preserving their order', async () => {
    const exported = await compileQuestionForExport(orderingQuestion);

    expect(exported.type).toBe('ordering');
    expect(exported.options).toHaveLength(2);
    expect(exported.options[0].textHtml).toContain('Primeiro');
    expect(exported.options[1].textHtml).toContain('Segundo');
  });

  it('compiles a matching question’s pairs, both sides, to HTML', async () => {
    const exported = await compileQuestionForExport(matchingQuestion);

    expect(exported.type).toBe('matching');
    expect(exported.matchingPairs).toHaveLength(2);
    expect(exported.matchingPairs[0].leftHtml).toContain('Cão');
    expect(exported.matchingPairs[0].rightHtml).toContain('Late');
  });

  it('passes through answerFormat unchanged for a math-mode short_text question', async () => {
    const exported = await compileQuestionForExport(mathShortTextQuestion);

    expect(exported.answerFormat).toBe('math');
    expect(exported.acceptedAnswers).toEqual([{ id: 3, text: '7' }]);
  });

  it('defaults answerFormat to "text" for a plain short_text question', async () => {
    const exported = await compileQuestionForExport(shortTextQuestion);

    expect(exported.answerFormat).toBe('text');
  });

  it('passes isFallback through unchanged', async () => {
    const exported = await compileQuestionForExport({
      id: 1,
      type: 'true_false',
      codeKind: null,
      codeLanguage: null,
      codeJson: null,
      difficulty: 'easy',
      promptMdx: 'Verdadeiro?',
      resolutionMdx: 'Sim.',
      isFallback: true,
      correctAnswer: 'true',
      answerFormat: 'text',
      options: [],
      acceptedAnswers: [],
      matchingPairs: [],
      tagIds: [],
    });

    expect(exported.isFallback).toBe(true);
  });
});

describe('isValidNumericCorrectAnswer', () => {
  it('rejects a comma-formatted decimal like "1,5"', () => {
    expect(isValidNumericCorrectAnswer('1,5')).toBe(false);
  });

  it('accepts a plain integer', () => {
    expect(isValidNumericCorrectAnswer('1')).toBe(true);
  });

  it('accepts a canonical decimal like "1.5"', () => {
    expect(isValidNumericCorrectAnswer('1.5')).toBe(true);
  });

  it('accepts a negative decimal like "-3.2"', () => {
    expect(isValidNumericCorrectAnswer('-3.2')).toBe(true);
  });

  it('accepts a symbolic answer like "não existe"', () => {
    expect(isValidNumericCorrectAnswer('não existe')).toBe(true);
  });

  it('accepts null (no correctAnswer set)', () => {
    expect(isValidNumericCorrectAnswer(null)).toBe(true);
  });
});

describe('assertValidNumericCorrectAnswer', () => {
  it('throws an error identifying the question id and the bad value', () => {
    expect(() => assertValidNumericCorrectAnswer({ id: 42, correctAnswer: '1,5' })).toThrow(/42/);
    expect(() => assertValidNumericCorrectAnswer({ id: 42, correctAnswer: '1,5' })).toThrow(/1,5/);
  });

  it('does not throw for a valid numeric answer', () => {
    expect(() => assertValidNumericCorrectAnswer({ id: 1, correctAnswer: '1.5' })).not.toThrow();
  });
});

describe('assertValidShortTextAnswer', () => {
  it('throws identifying the question id when there are zero accepted answers', () => {
    expect(() => assertValidShortTextAnswer({ id: 4, acceptedAnswers: [] })).toThrow(/4/);
  });

  it('does not throw when at least 1 accepted answer is present', () => {
    expect(() => assertValidShortTextAnswer({ id: 4, acceptedAnswers: [{ id: 1, text: 'TVI' }] })).not.toThrow();
  });
});

describe('assertValidMatchingPairs', () => {
  it('throws identifying the question id when there are fewer than 2 pairs', () => {
    expect(() => assertValidMatchingPairs({ id: 6, matchingPairs: [] })).toThrow(/6/);
    expect(() =>
      assertValidMatchingPairs({ id: 6, matchingPairs: [{ id: 60, leftMdx: 'Cão', rightMdx: 'Late' }] }),
    ).toThrow(/6/);
  });

  it('does not throw when there are at least 2 pairs', () => {
    expect(() =>
      assertValidMatchingPairs({
        id: 6,
        matchingPairs: [
          { id: 60, leftMdx: 'Cão', rightMdx: 'Late' },
          { id: 61, leftMdx: 'Gato', rightMdx: 'Mia' },
        ],
      }),
    ).not.toThrow();
  });
});
