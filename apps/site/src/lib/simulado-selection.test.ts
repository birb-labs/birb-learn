import { describe, expect, it, vi, afterEach } from 'vitest';
import { selectQuestions } from './simulado-selection';
import type { ExportedQuestion } from './simulado-selection';
import type { SimuladoConfig, SimuladoModule } from '@/components/simulado-setup';
import type { TopicNode } from '@birb-math/content-schema';

function makeQuestion(overrides: Partial<ExportedQuestion>): ExportedQuestion {
  return {
    id: 1,
    type: 'numeric',
    difficulty: 'easy',
    promptHtml: '<p>prompt</p>',
    options: [],
    acceptedAnswers: [],
    matchingPairs: [],
    correctAnswer: '1',
    resolutionHtml: '<p>resolution</p>',
    answerFormat: 'text',
    isFallback: false,
    tagIds: [],
    ...overrides,
  };
}

function makeModule(overrides: Partial<SimuladoModule>): SimuladoModule {
  return { id: 'module-1', subjectId: 1, questionCount: 10, difficulty: 'any', tagIds: [], ...overrides };
}

function makeConfig(modules: SimuladoModule[], shuffleModules = false): SimuladoConfig {
  return { shuffleModules, modules };
}

const defaultTagTreesBySubject: Record<number, TopicNode[]> = {
  1: [
    { id: 10, slug: 't10', name: 'T10', subtopics: [] },
    { id: 20, slug: 't20', name: 'T20', subtopics: [] },
  ],
};

function select(
  questions: ExportedQuestion[],
  config: SimuladoConfig,
  tagTreesBySubject: Record<number, TopicNode[]> = defaultTagTreesBySubject,
) {
  return selectQuestions(questions, config, tagTreesBySubject);
}

describe('selectQuestions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters by tag when a module has non-empty tagIds', () => {
    const questions = [
      makeQuestion({ id: 1, tagIds: [10] }),
      makeQuestion({ id: 2, tagIds: [20] }),
    ];
    const config = makeConfig([makeModule({ tagIds: [10] })]);

    const result = select(questions, config);

    expect(result.questions.map((q) => q.id)).toEqual([1]);
  });

  it('includes all of a subject\'s questions when a module has no topic filter applied', () => {
    const questions = [makeQuestion({ id: 1, tagIds: [10] }), makeQuestion({ id: 2, tagIds: [20] })];
    const config = makeConfig([makeModule({ tagIds: [] })]);

    expect(select(questions, config).questions).toHaveLength(2);
  });

  it('excludes questions from another subject when a module has no topic filter applied', () => {
    const questions = [makeQuestion({ id: 1, tagIds: [10] }), makeQuestion({ id: 2, tagIds: [99] })];
    const config = makeConfig([makeModule({ tagIds: [] })]);

    expect(select(questions, config).questions.map((q) => q.id)).toEqual([1]);
  });

  it('filters by difficulty when a module requests a specific difficulty', () => {
    const questions = [
      makeQuestion({ id: 1, difficulty: 'easy', tagIds: [10] }),
      makeQuestion({ id: 2, difficulty: 'hard', tagIds: [10] }),
    ];
    const config = makeConfig([makeModule({ difficulty: 'easy' })]);

    expect(select(questions, config).questions.map((q) => q.id)).toEqual([1]);
  });

  it('includes every difficulty when a module requests "any"', () => {
    const questions = [
      makeQuestion({ id: 1, difficulty: 'easy', tagIds: [10] }),
      makeQuestion({ id: 2, difficulty: 'hard', tagIds: [10] }),
    ];
    const config = makeConfig([makeModule({ difficulty: 'any' })]);

    expect(select(questions, config).questions).toHaveLength(2);
  });

  it('caps a module result at its questionCount, sampling randomly', () => {
    const questions = Array.from({ length: 10 }, (_, i) => makeQuestion({ id: i, tagIds: [10] }));
    const config = makeConfig([makeModule({ questionCount: 3 })]);

    const result = select(questions, config);

    expect(result.questions).toHaveLength(3);
    const ids = result.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(3);
    for (const id of ids) {
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThan(10);
    }
  });

  it('reports a shortfall when fewer questions than requested match a module', () => {
    const questions = [makeQuestion({ id: 1, tagIds: [10] }), makeQuestion({ id: 2, tagIds: [10] })];
    const config = makeConfig([makeModule({ questionCount: 10 })]);

    const result = select(questions, config);

    expect(result.questions).toHaveLength(2);
    expect(result.shortfalls).toEqual([{ moduleIndex: 0, requested: 10, available: 2 }]);
  });

  it('selects independently per module and concatenates in module order when shuffleModules is false', () => {
    const questions = [
      makeQuestion({ id: 1, tagIds: [10] }),
      makeQuestion({ id: 2, tagIds: [20] }),
    ];
    const config = makeConfig([
      makeModule({ id: 'a', tagIds: [10], questionCount: 1 }),
      makeModule({ id: 'b', tagIds: [20], questionCount: 1 }),
    ]);

    const result = select(questions, config);

    expect(result.questions.map((q) => q.id)).toEqual([1, 2]);
    expect(result.shortfalls).toEqual([]);
  });

  it('reports one shortfall per module that falls short, with the correct moduleIndex', () => {
    const questions = [makeQuestion({ id: 1, tagIds: [10] })];
    const config = makeConfig([
      makeModule({ id: 'a', tagIds: [10], questionCount: 5 }),
      makeModule({ id: 'b', tagIds: [999], questionCount: 2 }),
    ]);

    const result = select(questions, config);

    expect(result.shortfalls).toEqual([
      { moduleIndex: 0, requested: 5, available: 1 },
      { moduleIndex: 1, requested: 2, available: 0 },
    ]);
  });

  it('shuffles the combined question list across modules when shuffleModules is true', () => {
    const questions = [
      ...Array.from({ length: 5 }, (_, i) => makeQuestion({ id: i, tagIds: [10] })),
      ...Array.from({ length: 5 }, (_, i) => makeQuestion({ id: i + 5, tagIds: [20] })),
    ];
    const config = makeConfig(
      [
        makeModule({ id: 'a', tagIds: [10], questionCount: 5 }),
        makeModule({ id: 'b', tagIds: [20], questionCount: 5 }),
      ],
      true,
    );

    const result = select(questions, config);

    expect(result.questions).toHaveLength(10);
    expect(new Set(result.questions.map((q) => q.id)).size).toBe(10);
  });

  it('scopes an empty topic filter to the module\'s own subject when multiple subjects exist', () => {
    const tagTreesBySubject: Record<number, TopicNode[]> = {
      1: [{ id: 10, slug: 'limites', name: 'Limites', subtopics: [] }],
      2: [{ id: 30, slug: 'cinematica', name: 'Cinemática', subtopics: [] }],
    };
    const questions = [
      makeQuestion({ id: 1, tagIds: [10] }),
      makeQuestion({ id: 2, tagIds: [30] }),
    ];
    const config = makeConfig([makeModule({ subjectId: 2, tagIds: [] })]);

    const result = select(questions, config, tagTreesBySubject);

    expect(result.questions.map((q) => q.id)).toEqual([2]);
  });
});
