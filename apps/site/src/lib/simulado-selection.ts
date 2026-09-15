export type { ExportedAcceptedAnswer, ExportedOption, ExportedMatchingPair, ExportedQuestion } from './export-question';

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

function selectForModule(all: ExportedQuestion[], module: SimuladoModule): ExportedQuestion[] {
  const filtered = all.filter((question) => {
    const matchesTags = module.tagIds.length === 0 || question.tagIds.some((id) => module.tagIds.includes(id));
    const matchesDifficulty = module.difficulty === 'any' || module.difficulty === question.difficulty;
    return matchesTags && matchesDifficulty;
  });

  return shuffle(filtered).slice(0, module.questionCount);
}

export function selectQuestions(all: ExportedQuestion[], config: SimuladoConfig): SimuladoSelectionResult {
  const shortfalls: ModuleShortfall[] = [];
  const perModule = config.modules.map((module, moduleIndex) => {
    const selected = selectForModule(all, module);
    if (selected.length < module.questionCount) {
      shortfalls.push({ moduleIndex, requested: module.questionCount, available: selected.length });
    }
    return selected;
  });

  const combined = perModule.flat();
  const questions = config.shuffleModules ? shuffle(combined) : combined;

  return { questions, shortfalls };
}
