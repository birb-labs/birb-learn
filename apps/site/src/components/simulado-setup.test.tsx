import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { SimuladoSetup } from './simulado-setup';
import type { SubjectSummary, TopicNode } from '@birb-math/content-schema';

const fixtureSubjects: SubjectSummary[] = [{ id: 1, slug: 'matematica', name: 'Matemática' }];

const fixtureTagTreesBySubject: Record<number, TopicNode[]> = {
  1: [
    {
      id: 1,
      slug: 'limites',
      name: 'Limites',
      subtopics: [{ id: 2, slug: 'limites-laterais', name: 'Limites Laterais' }],
    },
  ],
};

const multiSubjects: SubjectSummary[] = [
  { id: 1, slug: 'matematica', name: 'Matemática' },
  { id: 2, slug: 'fisica', name: 'Física' },
];

const multiTagTreesBySubject: Record<number, TopicNode[]> = {
  1: [{ id: 1, slug: 'limites', name: 'Limites', subtopics: [] }],
  2: [{ id: 3, slug: 'cinematica', name: 'Cinemática', subtopics: [] }],
};

describe('SimuladoSetup', () => {
  it('renders one module by default with a subject select, topic/subtopic checkboxes, a difficulty select, a question-count input, and no remove button', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={fixtureSubjects} tagTreesBySubject={fixtureTagTreesBySubject} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('checkbox', { name: 'Embaralhar módulos' })).toBeInTheDocument();
    expect(screen.getByLabelText('Matéria')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Limites' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Limites Laterais' })).toBeInTheDocument();
    expect(screen.getByLabelText('Número de questões')).toBeInTheDocument();
    expect(screen.getByLabelText('Dificuldade')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar módulo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remover módulo' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar simulado' })).toBeInTheDocument();
  });

  it('calls onStart with the selected configuration for a single module', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={fixtureSubjects} tagTreesBySubject={fixtureTagTreesBySubject} onStart={onStart} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));
    await user.clear(screen.getByLabelText('Número de questões'));
    await user.type(screen.getByLabelText('Número de questões'), '5');
    await user.selectOptions(screen.getByLabelText('Dificuldade'), 'Fácil');
    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    const config = onStart.mock.calls[0][0];
    expect(config.shuffleModules).toBe(false);
    expect(config.modules).toHaveLength(1);
    expect(config.modules[0]).toMatchObject({ subjectId: 1, questionCount: 5, difficulty: 'easy', tagIds: [1, 2] });
  });

  it('toggling "Embaralhar módulos" is reflected in the submitted configuration', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={fixtureSubjects} tagTreesBySubject={fixtureTagTreesBySubject} onStart={onStart} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Embaralhar módulos' }));
    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));

    expect(onStart.mock.calls[0][0].shuffleModules).toBe(true);
  });

  it('"Adicionar módulo" adds an independent module with its own fields, and both modules gain a remove button', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={fixtureSubjects} tagTreesBySubject={fixtureTagTreesBySubject} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar módulo' }));

    expect(screen.getAllByLabelText('Matéria')).toHaveLength(2);
    expect(screen.getAllByLabelText('Número de questões')).toHaveLength(2);
    expect(screen.getAllByLabelText('Dificuldade')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Remover módulo' })).toHaveLength(2);
  });

  it('"Remover módulo" removes only that module, and the last remaining module cannot be removed', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={fixtureSubjects} tagTreesBySubject={fixtureTagTreesBySubject} onStart={onStart} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar módulo' }));
    await user.click(screen.getAllByRole('button', { name: 'Remover módulo' })[0]);

    expect(screen.getAllByLabelText('Número de questões')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Remover módulo' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));
    expect(onStart.mock.calls[0][0].modules).toHaveLength(1);
  });

  it('each module tracks its own topic selection independently', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={fixtureSubjects} tagTreesBySubject={fixtureTagTreesBySubject} onStart={onStart} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar módulo' }));
    await user.click(screen.getAllByRole('checkbox', { name: 'Limites' })[0]);
    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));

    const config = onStart.mock.calls[0][0];
    expect(config.modules[0].tagIds).toEqual([1, 2]);
    expect(config.modules[1].tagIds).toEqual([]);
  });

  it('changing a module\'s subject swaps the rendered topics to that subject\'s tree and clears previously selected topics', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={multiSubjects} tagTreesBySubject={multiTagTreesBySubject} onStart={onStart} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));
    await user.selectOptions(screen.getByLabelText('Matéria'), 'Física');

    expect(screen.queryByRole('checkbox', { name: 'Limites' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Cinemática' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));

    const config = onStart.mock.calls[0][0];
    expect(config.modules[0]).toMatchObject({ subjectId: 2, tagIds: [] });
  });

  it('selecting a topic also selects all of its subtopics', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={fixtureSubjects} tagTreesBySubject={fixtureTagTreesBySubject} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));

    expect(screen.getByRole('checkbox', { name: 'Limites' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Limites Laterais' })).toBeChecked();
  });

  it('deselecting a subtopic also deselects its parent topic', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={fixtureSubjects} tagTreesBySubject={fixtureTagTreesBySubject} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));
    await user.click(screen.getByRole('checkbox', { name: 'Limites Laterais' }));

    expect(screen.getByRole('checkbox', { name: 'Limites' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Limites Laterais' })).not.toBeChecked();
  });

  it('deselecting a topic also deselects all of its subtopics', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={fixtureSubjects} tagTreesBySubject={fixtureTagTreesBySubject} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));
    await user.click(screen.getByRole('checkbox', { name: 'Limites' }));

    expect(screen.getByRole('checkbox', { name: 'Limites' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Limites Laterais' })).not.toBeChecked();
  });

  it('selecting every subtopic individually also selects the parent topic', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoSetup subjects={fixtureSubjects} tagTreesBySubject={fixtureTagTreesBySubject} onStart={() => {}} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Limites Laterais' }));

    expect(screen.getByRole('checkbox', { name: 'Limites' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Limites Laterais' })).toBeChecked();
  });
});
