'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { SubjectSummary, TopicNode } from '@birb-learn/content-schema';
import styles from './simulado-setup.module.css';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type ModuleDifficulty = Difficulty | 'any';

export interface SimuladoModule {
  id: string;
  subjectId: number;
  questionCount: number;
  difficulty: ModuleDifficulty;
  tagIds: number[];
}

export interface SimuladoConfig {
  shuffleModules: boolean;
  modules: SimuladoModule[];
}

const ALL_DIFFICULTIES: ModuleDifficulty[] = ['any', 'easy', 'medium', 'hard'];

let nextModuleId = 0;
function createModule(subjectId: number): SimuladoModule {
  nextModuleId += 1;
  return { id: `module-${nextModuleId}`, subjectId, questionCount: 10, difficulty: 'any', tagIds: [] };
}

export function SimuladoSetup({
  subjects,
  tagTreesBySubject,
  onStart = () => {},
}: {
  subjects: SubjectSummary[];
  tagTreesBySubject: Record<number, TopicNode[]>;
  onStart?: (config: SimuladoConfig) => void | Promise<void>;
}) {
  const t = useTranslations('simulado.setup');
  const [shuffleModules, setShuffleModules] = useState(false);
  const [modules, setModules] = useState<SimuladoModule[]>(() => [createModule(subjects[0].id)]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateModule(moduleId: string, changes: Partial<SimuladoModule>) {
    setModules((prev) => prev.map((module) => (module.id === moduleId ? { ...module, ...changes } : module)));
  }

  function changeSubject(moduleId: string, subjectId: number) {
    updateModule(moduleId, { subjectId, tagIds: [] });
  }

  function toggleTopic(moduleId: string, module: SimuladoModule, topic: TopicNode) {
    const ids = [topic.id, ...topic.subtopics.map((subtopic) => subtopic.id)];
    const next = new Set(module.tagIds);
    if (next.has(topic.id)) {
      ids.forEach((id) => next.delete(id));
    } else {
      ids.forEach((id) => next.add(id));
    }
    updateModule(moduleId, { tagIds: [...next] });
  }

  function toggleSubtopic(moduleId: string, module: SimuladoModule, topic: TopicNode, subtopicId: number) {
    const next = new Set(module.tagIds);
    if (next.has(subtopicId)) {
      next.delete(subtopicId);
      next.delete(topic.id);
    } else {
      next.add(subtopicId);
      const allSubtopicsSelected = topic.subtopics.every(
        (subtopic) => subtopic.id === subtopicId || next.has(subtopic.id),
      );
      if (allSubtopicsSelected) next.add(topic.id);
    }
    updateModule(moduleId, { tagIds: [...next] });
  }

  function addModule() {
    setModules((prev) => [...prev, createModule(subjects[0].id)]);
  }

  function removeModule(moduleId: string) {
    setModules((prev) => (prev.length <= 1 ? prev : prev.filter((module) => module.id !== moduleId)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onStart({ shuffleModules, modules });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <div className={styles.checkboxRow}>
          <input
            id="shuffle-modules"
            type="checkbox"
            checked={shuffleModules}
            onChange={(event) => setShuffleModules(event.target.checked)}
          />
          <label htmlFor="shuffle-modules">{t('shuffleModules')}</label>
        </div>
      </div>

      {modules.map((module, index) => {
        const tagTree = tagTreesBySubject[module.subjectId] ?? [];
        return (
          <fieldset key={module.id} className={styles.moduleCard}>
            <legend>{t('moduleTitle', { number: index + 1 })}</legend>

            <div className={styles.field}>
              <label htmlFor={`subject-${module.id}`}>{t('subject')}</label>
              <select
                id={`subject-${module.id}`}
                className={styles.difficultySelect}
                value={module.subjectId}
                onChange={(event) => changeSubject(module.id, Number(event.target.value))}
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor={`question-count-${module.id}`}>{t('questionCount')}</label>
              <input
                id={`question-count-${module.id}`}
                className={styles.countInput}
                type="number"
                min={1}
                value={module.questionCount}
                onChange={(event) => updateModule(module.id, { questionCount: Number(event.target.value) })}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor={`difficulty-${module.id}`}>{t('difficulty')}</label>
              <select
                id={`difficulty-${module.id}`}
                className={styles.difficultySelect}
                value={module.difficulty}
                onChange={(event) =>
                  updateModule(module.id, { difficulty: event.target.value as ModuleDifficulty })
                }
              >
                {ALL_DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {t(`difficulty${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <span>{t('topics')}</span>
              {tagTree.map((topic) => (
                <div key={topic.id}>
                  <div className={styles.checkboxRow}>
                    <input
                      id={`tag-${module.id}-${topic.id}`}
                      type="checkbox"
                      checked={module.tagIds.includes(topic.id)}
                      onChange={() => toggleTopic(module.id, module, topic)}
                    />
                    <label htmlFor={`tag-${module.id}-${topic.id}`}>{topic.name}</label>
                  </div>
                  {topic.subtopics.length > 0 && (
                    <div className={styles.subtopics}>
                      {topic.subtopics.map((subtopic) => (
                        <div key={subtopic.id} className={styles.checkboxRow}>
                          <input
                            id={`tag-${module.id}-${subtopic.id}`}
                            type="checkbox"
                            checked={module.tagIds.includes(subtopic.id)}
                            onChange={() => toggleSubtopic(module.id, module, topic, subtopic.id)}
                          />
                          <label htmlFor={`tag-${module.id}-${subtopic.id}`}>{subtopic.name}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {modules.length > 1 && (
              <button type="button" className={styles.removeModuleButton} onClick={() => removeModule(module.id)}>
                {t('removeModule')}
              </button>
            )}
          </fieldset>
        );
      })}

      <button type="button" className={styles.addModuleButton} onClick={addModule}>
        {t('addModule')}
      </button>

      <button type="submit" className={styles.startButton} disabled={isSubmitting}>
        {isSubmitting ? t('loading') : t('start')}
      </button>
    </form>
  );
}
