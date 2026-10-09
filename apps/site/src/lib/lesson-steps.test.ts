import { describe, expect, it } from 'vitest';
import type { LessonBlockContent, LessonBlockType } from '@birb-learn/content-schema';
import { buildLessonSteps, firstHeading, stepId } from './lesson-steps';

const labels: Record<LessonBlockType, string> = {
  text: 'Conteúdo',
  curiosity: 'Curiosidade',
  real_world_application: 'No mundo real',
  solved_exercise: 'Exercício resolvido',
  simulator: 'Simulador',
};

function block(partial: Partial<LessonBlockContent> & Pick<LessonBlockContent, 'type'>): LessonBlockContent {
  return {
    id: 1,
    order: 1,
    title: null,
    bodyMdx: null,
    promptMdx: null,
    resolutionMdx: null,
    caption: null,
    simulatorKey: null,
    simulatorParams: null,
    ...partial,
  };
}

describe('firstHeading', () => {
  it('reads the first heading as plain text', () => {
    expect(firstHeading('Intro\n\n## O que é um **limite**?\n\nTexto')).toBe('O que é um limite?');
  });

  it('drops inline math and links from the label', () => {
    expect(firstHeading('# Limite de $f(x)$ em [x](http://a.b)')).toBe('Limite de em x');
  });

  it('returns undefined without a heading or body', () => {
    expect(firstHeading('Sem título')).toBeUndefined();
    expect(firstHeading(null)).toBeUndefined();
  });
});

describe('buildLessonSteps', () => {
  it('prefers the block title, then a heading, then the type label', () => {
    const steps = buildLessonSteps(
      [
        block({ id: 1, type: 'curiosity', title: 'Você sabia?' }),
        block({ id: 2, type: 'text', bodyMdx: '## Definição\n\ncorpo' }),
        block({ id: 3, type: 'text', bodyMdx: 'só texto' }),
        block({ id: 4, type: 'simulator' }),
      ],
      labels,
    );

    expect(steps).toEqual([
      { id: 'step-1', type: 'curiosity', title: 'Você sabia?' },
      { id: 'step-2', type: 'text', title: 'Definição' },
      { id: 'step-3', type: 'text', title: 'Conteúdo' },
      { id: 'step-4', type: 'simulator', title: 'Simulador' },
    ]);
  });

  it('numbers step ids from one', () => {
    expect(stepId(0)).toBe('step-1');
  });
});
