import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { LessonBlocks } from './lesson-blocks';
import type { LessonBlockContent } from '@birb-learn/content-schema';

const labels = {
  blockTypes: {
    text: 'Conteúdo',
    curiosity: 'Curiosidade',
    real_world_application: 'No mundo real',
    solved_exercise: 'Exercício resolvido',
    simulator: 'Simulador',
  },
  showResolution: 'Ver resolução',
  hideResolution: 'Ocultar resolução',
  exerciseTry: 'Tente resolver antes de ver a resolução.',
  resolution: 'Resolução',
};

const fixtureBlocks: LessonBlockContent[] = [
  { id: 1, order: 1, type: 'text', title: null, bodyMdx: 'Texto normal.', promptMdx: null, resolutionMdx: null, caption: null, simulatorKey: null, simulatorParams: null },
  { id: 2, order: 2, type: 'curiosity', title: 'Você sabia?', bodyMdx: 'Uma curiosidade.', promptMdx: null, resolutionMdx: null, caption: null, simulatorKey: null, simulatorParams: null },
  { id: 3, order: 3, type: 'real_world_application', title: 'No mundo real', bodyMdx: 'Uma aplicação.', promptMdx: null, resolutionMdx: null, caption: null, simulatorKey: null, simulatorParams: null },
  { id: 4, order: 4, type: 'solved_exercise', title: null, bodyMdx: null, promptMdx: 'Enunciado do exercício.', resolutionMdx: 'Resolução do exercício.', caption: null, simulatorKey: null, simulatorParams: null },
  { id: 5, order: 5, type: 'simulator', title: null, bodyMdx: null, promptMdx: null, resolutionMdx: null, caption: 'Legenda do simulador.', simulatorKey: 'function-approach-grapher', simulatorParams: '{"expression":"x^2","approachPoint":1,"domain":[-2,2]}' },
];

describe('LessonBlocks', () => {
  async function renderBlocks() {
    const jsx = await LessonBlocks({ blocks: fixtureBlocks, labels });
    return render(<NextIntlClientProvider locale="pt-BR" messages={ptBR}>{jsx}</NextIntlClientProvider>);
  }

  it('renders every block type with its content', async () => {
    await renderBlocks();

    expect(screen.getByText('Texto normal.')).toBeInTheDocument();
    expect(screen.getByText('Você sabia?')).toBeInTheDocument();
    expect(screen.getByText('Uma curiosidade.')).toBeInTheDocument();
    expect(screen.getByText('Uma aplicação.')).toBeInTheDocument();
    expect(screen.getByText('Enunciado do exercício.')).toBeInTheDocument();
    expect(screen.getByText('Ver resolução')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Gráfico de função interativo' })).toBeInTheDocument();
    expect(screen.getByText('Legenda do simulador.')).toBeInTheDocument();
  });

  it('gives each block type its own labelled frame and color tone', async () => {
    const { container } = await renderBlocks();

    const tones = Object.fromEntries(
      [...container.querySelectorAll<HTMLElement>('[data-block-type]')].map((element) => [
        element.dataset.blockType,
        element.dataset.tone ?? 'prose',
      ]),
    );
    expect(tones).toEqual({
      text: 'prose',
      curiosity: 'warning',
      real_world_application: 'info',
      solved_exercise: 'success',
      simulator: 'accent',
    });
    expect(screen.getByText('Curiosidade')).toBeInTheDocument();
    expect(screen.getByText('Exercício resolvido')).toBeInTheDocument();
    expect(screen.getByText('Simulador')).toBeInTheDocument();
  });

  it('numbers every block with an anchor id the stepper can scroll to', async () => {
    const { container } = await renderBlocks();

    const ids = [...container.querySelectorAll('[data-step]')].map((element) => element.id);
    expect(ids).toEqual(['step-1', 'step-2', 'step-3', 'step-4', 'step-5']);
  });

  it('keeps the exercise resolution collapsed until revealed', async () => {
    const { container } = await renderBlocks();

    const details = container.querySelector('details');
    expect(details).not.toHaveAttribute('open');
    expect(screen.getByText('Resolução do exercício.')).toBeInTheDocument();
  });
});
