import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LessonBlocks } from './lesson-blocks';
import type { LessonBlockContent } from '@birb-math/content-schema';

const fixtureBlocks: LessonBlockContent[] = [
  { id: 1, order: 1, type: 'text', title: null, bodyMdx: 'Texto normal.', promptMdx: null, resolutionMdx: null, caption: null, simulatorKey: null, simulatorParams: null },
  { id: 2, order: 2, type: 'curiosity', title: 'Você sabia?', bodyMdx: 'Uma curiosidade.', promptMdx: null, resolutionMdx: null, caption: null, simulatorKey: null, simulatorParams: null },
  { id: 3, order: 3, type: 'real_world_application', title: 'No mundo real', bodyMdx: 'Uma aplicação.', promptMdx: null, resolutionMdx: null, caption: null, simulatorKey: null, simulatorParams: null },
  { id: 4, order: 4, type: 'solved_exercise', title: null, bodyMdx: null, promptMdx: 'Enunciado do exercício.', resolutionMdx: 'Resolução do exercício.', caption: null, simulatorKey: null, simulatorParams: null },
];

describe('LessonBlocks', () => {
  it('renders every block type with its icon/title where applicable', async () => {
    const jsx = await LessonBlocks({ blocks: fixtureBlocks, showResolutionLabel: 'Ver resolução' });
    render(jsx);

    expect(screen.getByText('Texto normal.')).toBeInTheDocument();
    expect(screen.getByText('Você sabia?')).toBeInTheDocument();
    expect(screen.getByText('Uma curiosidade.')).toBeInTheDocument();
    expect(screen.getByText('No mundo real')).toBeInTheDocument();
    expect(screen.getByText('Enunciado do exercício.')).toBeInTheDocument();
    expect(screen.getByText('Ver resolução')).toBeInTheDocument();
  });
});
