export type { ExportedAcceptedAnswer, ExportedOption, ExportedMatchingPair, ExportedQuestion } from './export-question';

import type { TopicNode } from '@birb-learn/content-schema';
import type { SimuladoConfig, SimuladoModule } from '@/components/simulado-setup';
import type { ExportedQuestion } from './export-question';
import { shuffle } from './shuffle';

export interface ModuleShortfall {
  moduleIndex: number;
  requested: number;
  available: number;
}

export interface SimuladoSelectionResult {
  questions: ExportedQuestion[];
  shortfalls: ModuleShortfall[];
}

function flattenTagIds(tree: TopicNode[]): number[] {
  return tree.flatMap((topic) => [topic.id, ...topic.subtopics.map((subtopic) => subtopic.id)]);
}

function selectForModule(
  all: ExportedQuestion[],
  module: SimuladoModule,
  tagTreesBySubject: Record<number, TopicNode[]>,
): ExportedQuestion[] {
  const effectiveTagIds =
    module.tagIds.length > 0 ? module.tagIds : flattenTagIds(tagTreesBySubject[module.subjectId] ?? []);

  const filtered = all.filter((question) => {
    const matchesTags = question.tagIds.some((id) => effectiveTagIds.includes(id));
    const matchesDifficulty = module.difficulty === 'any' || module.difficulty === question.difficulty;
    return matchesTags && matchesDifficulty;
  });

  return shuffle(filtered).slice(0, module.questionCount);
}

export function selectQuestions(
  all: ExportedQuestion[],
  config: SimuladoConfig,
  tagTreesBySubject: Record<number, TopicNode[]>,
): SimuladoSelectionResult {
  const shortfalls: ModuleShortfall[] = [];
  const perModule = config.modules.map((module, moduleIndex) => {
    const selected = selectForModule(all, module, tagTreesBySubject);
    if (selected.length < module.questionCount) {
      shortfalls.push({ moduleIndex, requested: module.questionCount, available: selected.length });
    }
    return selected;
  });

  const combined = perModule.flat();
  const questions = config.shuffleModules ? shuffle(combined) : combined;

  return { questions, shortfalls };
}
