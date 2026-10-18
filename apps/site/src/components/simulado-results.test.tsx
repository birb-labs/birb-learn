import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { RunRequest, Runner } from '@birb-learn/code-runner/src/protocol';
import { serializeCodeAnswer } from '@birb-learn/code-ui';
import ptBR from '@/messages/pt-BR.json';
import { SimuladoResults } from './simulado-results';
import type { GradedQuestionResult, GradedResult } from '@/lib/grade-simulado';
import type { ExportedCodeTask } from '@/lib/export-question';
import type { ExportedQuestion } from '@/lib/simulado-selection';

const fixtureResult: GradedResult = {
  correctCount: 1,
  total: 3,
  perQuestion: [
    {
      question: {
        id: 1,
        type: 'multiple_choice',
        difficulty: 'easy',
        promptHtml: '<p>Q1</p>',
        options: [
          { id: 10, textHtml: '<p>A</p>', isCorrect: false },
          { id: 11, textHtml: '<p>B</p>', isCorrect: true },
        ],
        acceptedAnswers: [],
        matchingPairs: [],
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 1</p>',
        answerFormat: 'text',
        isFallback: false,
        tagIds: [],
        code: null,
      },
      userAnswer: '11',
      isCorrect: true,
      verdict: 'correct',
    },
    {
      question: {
        id: 2,
        type: 'numeric',
        difficulty: 'medium',
        promptHtml: '<p>Q2</p>',
        options: [],
        acceptedAnswers: [],
        matchingPairs: [],
        correctAnswer: '1000000',
        resolutionHtml: '<p>Resolution 2</p>',
        answerFormat: 'text',
        isFallback: false,
        tagIds: [],
        code: null,
      },
      userAnswer: '2',
      isCorrect: false,
      verdict: 'incorrect',
    },
    {
      question: {
        id: 3,
        type: 'multiple_response',
        difficulty: 'hard',
        promptHtml: '<p>Q3</p>',
        options: [
          { id: 30, textHtml: '<p>Afirmação A</p>', isCorrect: true },
          { id: 31, textHtml: '<p>Afirmação B</p>', isCorrect: false },
          { id: 32, textHtml: '<p>Afirmação C</p>', isCorrect: true },
        ],
        acceptedAnswers: [],
        matchingPairs: [],
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 3</p>',
        answerFormat: 'text',
        isFallback: false,
        tagIds: [],
        code: null,
      },
      userAnswer: '30,31',
      isCorrect: false,
      verdict: 'incorrect',
    },
  ],
};

const newTypesResult: GradedResult = {
  correctCount: 0,
  total: 4,
  perQuestion: [
    {
      question: {
        id: 4,
        type: 'true_false',
        difficulty: 'easy',
        promptHtml: '<p>Q4</p>',
        options: [],
        acceptedAnswers: [],
        matchingPairs: [],
        correctAnswer: 'true',
        resolutionHtml: '<p>Resolution 4</p>',
        answerFormat: 'text',
        isFallback: false,
        tagIds: [],
        code: null,
      },
      userAnswer: 'false',
      isCorrect: false,
      verdict: 'incorrect',
    },
    {
      question: {
        id: 5,
        type: 'short_text',
        difficulty: 'medium',
        promptHtml: '<p>Q5</p>',
        options: [],
        acceptedAnswers: [
          { id: 1, text: 'Teorema do Valor Intermediário' },
          { id: 2, text: 'TVI' },
        ],
        matchingPairs: [],
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 5</p>',
        answerFormat: 'text',
        isFallback: false,
        tagIds: [],
        code: null,
      },
      userAnswer: '<b>hacked</b>',
      isCorrect: false,
      verdict: 'incorrect',
    },
    {
      question: {
        id: 6,
        type: 'ordering',
        difficulty: 'medium',
        promptHtml: '<p>Q6</p>',
        options: [
          { id: 60, textHtml: '<p>Fatorar</p>', isCorrect: false },
          { id: 61, textHtml: '<p>Cancelar</p>', isCorrect: false },
          { id: 62, textHtml: '<p>Substituir</p>', isCorrect: false },
        ],
        acceptedAnswers: [],
        matchingPairs: [],
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 6</p>',
        answerFormat: 'text',
        isFallback: false,
        tagIds: [],
        code: null,
      },
      userAnswer: '61,60,62',
      isCorrect: false,
      verdict: 'incorrect',
    },
    {
      question: {
        id: 7,
        type: 'matching',
        difficulty: 'hard',
        promptHtml: '<p>Q7</p>',
        options: [],
        acceptedAnswers: [],
        matchingPairs: [
          { id: 70, leftHtml: '<p>Removível</p>', rightHtml: '<p>Descrição A</p>' },
          { id: 71, leftHtml: '<p>Salto</p>', rightHtml: '<p>Descrição B</p>' },
        ],
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 7</p>',
        answerFormat: 'text',
        isFallback: false,
        tagIds: [],
        code: null,
      },
      userAnswer: '70:71,71:70',
      isCorrect: false,
      verdict: 'incorrect',
    },
  ],
};

const mathShortTextResult: GradedResult = {
  correctCount: 1,
  total: 1,
  perQuestion: [
    {
      question: {
        id: 8,
        type: 'short_text',
        difficulty: 'hard',
        promptHtml: '<p>Q8</p>',
        options: [],
        acceptedAnswers: [{ id: 1, text: '\\frac{1}{2}' }],
        matchingPairs: [],
        correctAnswer: null,
        answerFormat: 'math',
        resolutionHtml: '<p>Resolution 8</p>',
        isFallback: false,
        tagIds: [],
        code: null,
      },
      userAnswer: '\\frac{1}{2}',
      isCorrect: true,
      verdict: 'correct',
    },
  ],
};

describe('SimuladoResults', () => {
  it('shows the overall score', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={fixtureResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Você acertou 1 de 3 questões')).toBeInTheDocument();
  });

  it('shows each question with its resolution and correct/incorrect status', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={fixtureResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Resolution 1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
    expect(screen.getByText('Resolution 2')).toBeInTheDocument();
    expect(screen.getAllByText('Certo')).toHaveLength(1);
    expect(screen.getAllByText('Errado')).toHaveLength(2);
  });

  it('shows the user\'s selected option text for a multiple-choice question', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={fixtureResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    // The correctly-answered MC question's "your answer" is option 11's text ("B").
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('reformats a numeric correct answer for the active locale, regardless of stored format', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={fixtureResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    // Canonical "1000000" reformatted for pt-BR is "1.000.000", not the raw canonical string.
    expect(screen.getByText('1.000.000')).toBeInTheDocument();
    // The user's own raw input is shown as they typed it, not reformatted.
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows every selected and every correct option for a multiple-response question', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={fixtureResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    // User selected A and B (B is wrong); the correct set is A and C.
    const answersSection = screen.getByText('Q3').closest('div')!.parentElement!;
    expect(answersSection.textContent).toContain('Afirmação A');
    expect(answersSection.textContent).toContain('Afirmação B');
    expect(answersSection.textContent).toContain('Afirmação C');
  });

  it('translates true_false answers to Verdadeiro/Falso instead of showing the raw literals', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={newTypesResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    const answersSection = screen.getByText('Q4').closest('div')!.parentElement!;
    expect(answersSection.textContent).toContain('Falso');
    expect(answersSection.textContent).toContain('Verdadeiro');
    expect(answersSection.textContent).not.toContain('true');
    expect(answersSection.textContent).not.toContain('false');
  });

  it('shows the accepted answers and the user\'s typed text for a short_text question, as plain text', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={newTypesResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    const answersSection = screen.getByText('Q5').closest('div')!.parentElement!;
    expect(answersSection.textContent).toContain('Teorema do Valor Intermediário / TVI');
    // The raw, unescaped user-typed text must render as plain text, not HTML
    // — this is the self-XSS regression guard: no actual <b> element should
    // exist in the DOM, only its literal source text.
    expect(answersSection.textContent).toContain('<b>hacked</b>');
    expect(answersSection.querySelector('b')).toBeNull();
  });

  it('shows the chosen and correct sequences for an ordering question using option labels, not raw ids', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={newTypesResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    const answersSection = screen.getByText('Q6').closest('div')!.parentElement!;
    expect(answersSection.textContent).not.toContain('61,60,62');
    expect(answersSection.textContent).toContain('Cancelar');
    expect(answersSection.textContent).toContain('Fatorar');
    expect(answersSection.textContent).toContain('Substituir');
  });

  it('shows the chosen and correct pairings for a matching question using pair labels, not raw ids', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={newTypesResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    const answersSection = screen.getByText('Q7').closest('div')!.parentElement!;
    expect(answersSection.textContent).not.toContain('70:71,71:70');
    expect(answersSection.textContent).toContain('Removível');
    expect(answersSection.textContent).toContain('Salto');
    expect(answersSection.textContent).toContain('Descrição A');
    expect(answersSection.textContent).toContain('Descrição B');
  });

  it('renders a math-mode short_text answer as a rendered formula, not raw LaTeX text', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={mathShortTextResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    const answersSection = screen.getByText('Q8').closest('div')!.parentElement!;
    expect(answersSection.textContent).not.toContain('\\frac');
    expect(answersSection.querySelector('.katex')).toBeInTheDocument();
  });
});

const XSS = '<img src=x onerror=alert(1)>';

const writeCodeQuestion: ExportedQuestion = {
  id: 30,
  type: 'code',
  difficulty: 'easy',
  promptHtml: '<p>Q30</p>',
  options: [],
  acceptedAnswers: [],
  matchingPairs: [],
  correctAnswer: null,
  resolutionHtml: '<p>Resolution 30</p>',
  answerFormat: 'text',
  isFallback: false,
  tagIds: [],
  code: {
    kind: 'write',
    language: 'python',
    payload: {
      starterCode: 'n = int(input())\n',
      solution: 'n = int(input())\nprint(n * 2)\n',
      tests: [{ name: 'dobro de 4', stdin: '4\n', expectedStdout: '8\n' }],
      blanks: [],
      hints: [],
    },
    starterTokens: [[{ text: 'n = int(input())' }]],
    solutionTokens: [[{ text: 'n = int(input())' }], [{ text: 'print(n * 2)', color: 'var(--code-token-function)' }]],
  },
};

function renderResults(result: GradedResult, props: Partial<React.ComponentProps<typeof SimuladoResults>> = {}) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
      <SimuladoResults result={result} locale="pt-BR" onBackToSetup={() => {}} {...props} />
    </NextIntlClientProvider>,
  );
}

function single(entry: GradedQuestionResult): GradedResult {
  return { correctCount: entry.isCorrect ? 1 : 0, total: 1, perQuestion: [entry] };
}

describe('SimuladoResults with code questions', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the student code, the per-test outcomes, the solution and the resolution', () => {
    renderResults(
      single({
        question: writeCodeQuestion,
        userAnswer: serializeCodeAnswer({ kind: 'write', code: 'print(0)\n' }),
        isCorrect: false,
        verdict: 'incorrect',
        code: { verdict: 'incorrect', tests: [{ name: 'dobro de 4', passed: false, status: 'ok', expected: '8', actual: '0' }] },
      }),
    );

    const card = screen.getByText('Q30').closest('[data-correct]')!;
    expect(card).toHaveTextContent('Errado');
    expect(card.textContent).toContain('print(0)');
    expect(card).toHaveTextContent('dobro de 4');
    expect(card).toHaveTextContent('falhou');
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Solução')).toBeInTheDocument();
    expect(screen.getByText('print(n * 2)')).toBeInTheDocument();
    expect(screen.getByText('Resolution 30')).toBeInTheDocument();
  });

  it('renders an attempt reopened from the history, whose stored question has no highlighted tokens', () => {
    const { starterTokens: _starter, solutionTokens: _solution, ...stored } = writeCodeQuestion.code!;
    renderResults(
      single({
        question: { ...writeCodeQuestion, code: stored as ExportedCodeTask },
        userAnswer: serializeCodeAnswer({ kind: 'write', code: 'print(0)\n' }),
        isCorrect: false,
        verdict: 'incorrect',
        code: { verdict: 'incorrect', tests: [{ name: 'dobro de 4', passed: false, status: 'ok', expected: '8', actual: '0' }] },
      }),
    );

    const card = screen.getByText('Q30').closest('[data-correct]')!;
    expect(card).toHaveTextContent('Errado');
    expect(card).toHaveTextContent('dobro de 4');
    // The solution falls back to its plain text.
    expect(screen.getByText('Solução')).toBeInTheDocument();
    expect(card.textContent).toContain('print(n * 2)');
    expect(screen.getByText('Resolution 30')).toBeInTheDocument();
  });

  it('renders student code, expected and actual output literally, never as HTML', () => {
    renderResults(
      single({
        question: writeCodeQuestion,
        userAnswer: serializeCodeAnswer({ kind: 'write', code: XSS }),
        isCorrect: false,
        verdict: 'incorrect',
        code: {
          verdict: 'incorrect',
          compileOutput: XSS,
          tests: [{ passed: false, status: 'ok', expected: XSS, actual: XSS }],
        },
      }),
    );

    const card = screen.getByText('Q30').closest('[data-correct]')!;
    expect(card.textContent!.split(XSS).length - 1).toBe(4);
    expect(card.querySelector('img')).toBeNull();
  });

  it('shows the answers of the other code kinds as text', () => {
    const predict: ExportedQuestion = {
      ...writeCodeQuestion,
      id: 31,
      promptHtml: '<p>Q31</p>',
      code: {
        ...writeCodeQuestion.code!,
        kind: 'predict_output',
        payload: { starterCode: 'print(5)\n', expectedOutput: '5', tests: [], blanks: [], hints: [] },
        solutionTokens: [],
      },
    };
    const fill: ExportedQuestion = {
      ...writeCodeQuestion,
      id: 32,
      promptHtml: '<p>Q32</p>',
      code: {
        ...writeCodeQuestion.code!,
        kind: 'fill_blank',
        payload: { starterCode: 'x = ___1___\n', solution: 'x = 1\n', tests: [], blanks: [{ id: 1, accepted: ['1', 'um'] }], hints: [] },
      },
    };
    const bug: ExportedQuestion = {
      ...writeCodeQuestion,
      id: 33,
      promptHtml: '<p>Q33</p>',
      code: {
        ...writeCodeQuestion.code!,
        kind: 'find_bug',
        payload: { starterCode: 'a\nb\n', solution: 'a\nc\n', tests: [], blanks: [], hints: [], bugLines: '2' },
      },
    };
    renderResults({
      correctCount: 0,
      total: 3,
      perQuestion: [
        { question: predict, userAnswer: serializeCodeAnswer({ kind: 'predict_output', output: XSS }), isCorrect: false, verdict: 'incorrect', code: { verdict: 'incorrect', tests: [] } },
        {
          question: fill,
          userAnswer: serializeCodeAnswer({ kind: 'fill_blank', blanks: { 1: XSS } }),
          isCorrect: false,
          verdict: 'incorrect',
          code: { verdict: 'incorrect', tests: [], blanksCorrect: { 1: false } },
        },
        {
          question: bug,
          userAnswer: serializeCodeAnswer({ kind: 'find_bug', line: 1, code: 'a\nb\n' }),
          isCorrect: false,
          verdict: 'incorrect',
          code: { verdict: 'incorrect', tests: [], lineCorrect: false },
        },
      ],
    });

    const predictCard = screen.getByText('Q31').closest('[data-correct]')!;
    expect(predictCard.textContent).toContain(XSS);
    expect(predictCard).toHaveTextContent('Resposta correta');
    expect(predictCard.querySelector('img')).toBeNull();

    const fillCard = screen.getByText('Q32').closest('[data-correct]')!;
    expect(fillCard.textContent).toContain(`Lacuna 1: ${XSS}`);
    expect(fillCard).toHaveTextContent('Lacuna 1: incorreta');
    expect(fillCard).toHaveTextContent('Lacuna 1: 1 / um');
    expect(fillCard.querySelector('img')).toBeNull();

    const bugCard = screen.getByText('Q33').closest('[data-correct]')!;
    expect(bugCard).toHaveTextContent('Linha escolhida: 1');
    expect(bugCard).toHaveTextContent('O erro não está na linha escolhida.');
    expect(bugCard).toHaveTextContent('O erro está na linha 2');
  });

  it('shows a not_graded question with its reason, and counts it apart in the score', () => {
    renderResults(
      single({
        question: writeCodeQuestion,
        userAnswer: serializeCodeAnswer({ kind: 'write', code: 'print(8)\n' }),
        isCorrect: false,
        verdict: 'not_graded',
        code: { verdict: 'not_graded', tests: [] },
        notGraded: { reason: 'offline' },
      }),
    );

    expect(screen.getByText('Não corrigida — tente de novo')).toBeInTheDocument();
    expect(screen.getByText('Você está sem conexão com a internet.')).toBeInTheDocument();
    expect(screen.getByText('0 de 1 certas, 1 sem correção')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Corrigir de novo' })).toBeEnabled();
  });

  it('keeps the retry button disabled until retryAfterMs passes, then re-grades and updates the score', async () => {
    vi.useFakeTimers();
    const requests: RunRequest[] = [];
    const runner: Runner = {
      async runCode(request) {
        requests.push(request);
        return { status: 'ok', cases: [{ status: 'ok', stdout: '8\n', stderr: '', exitCode: 0, durationMs: 1 }] };
      },
    };
    const onResultChange = vi.fn();
    renderResults(
      single({
        question: writeCodeQuestion,
        userAnswer: serializeCodeAnswer({ kind: 'write', code: 'print(8)\n' }),
        isCorrect: false,
        verdict: 'not_graded',
        code: { verdict: 'not_graded', tests: [] },
        notGraded: { reason: 'rate_limited', retryAfterMs: 5000 },
      }),
      { runner, onResultChange },
    );

    expect(screen.getByRole('button', { name: 'Corrigir de novo em 5 s' })).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Corrigir de novo em 3 s' })).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    const retry = screen.getByRole('button', { name: 'Corrigir de novo' });
    expect(retry).toBeEnabled();
    expect(requests).toHaveLength(0);

    vi.useRealTimers();
    fireEvent.click(retry);

    expect(await screen.findByText('Você acertou 1 de 1 questões')).toBeInTheDocument();
    expect(requests).toHaveLength(1);
    expect(screen.queryByText('Não corrigida — tente de novo')).toBeNull();
    expect(screen.queryByRole('button', { name: /Corrigir de novo/ })).toBeNull();
    expect(onResultChange).toHaveBeenCalledWith(expect.objectContaining({ correctCount: 1, total: 1 }));
  });

  it('treats an attempt stored before verdicts existed by its isCorrect flag', () => {
    const legacy = { ...fixtureResult.perQuestion[0] } as Partial<GradedQuestionResult>;
    delete legacy.verdict;
    renderResults({ correctCount: 1, total: 1, perQuestion: [legacy as GradedQuestionResult] });

    expect(screen.getByText('Certo')).toBeInTheDocument();
    expect(screen.getByText('Você acertou 1 de 1 questões')).toBeInTheDocument();
  });
});
