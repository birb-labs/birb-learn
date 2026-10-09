import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { ContentTree, SubjectProgressSummary } from './content-tree';
import { READING_PROGRESS_STORAGE_KEY } from '@/hooks/use-reading-progress';
import type { ContentSubject } from '@birb-learn/content-schema';

const subject: ContentSubject = {
  id: 1,
  slug: 'calculo',
  name: 'Cálculo',
  topics: [
    {
      id: 1,
      slug: 'limites',
      name: 'Limites',
      sections: [
        {
          id: 1,
          slug: 'limites-laterais',
          name: 'Limites Laterais',
          lessons: [
            { slug: 'licao-1', title: 'Lição Um' },
            { slug: 'licao-2', title: 'Lição Dois' },
          ],
        },
        {
          id: 2,
          slug: 'limites-infinitos',
          name: 'Limites Infinitos',
          lessons: [{ slug: 'licao-3', title: 'Lição Três' }],
        },
      ],
    },
  ],
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
      {ui}
    </NextIntlClientProvider>,
  );
}

function markComplete(slugs: string[]) {
  window.localStorage.setItem(READING_PROGRESS_STORAGE_KEY, JSON.stringify(slugs));
}

describe('ContentTree', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders topics, lesson groups and lessons linking to the full hierarchical URL', () => {
    renderWithIntl(<ContentTree disciplineSlug="matematica" subject={subject} />);

    expect(screen.getByRole('heading', { name: 'Limites' })).toBeInTheDocument();
    expect(screen.getByText('Limites Laterais')).toBeInTheDocument();
    expect(screen.getByText('Limites Infinitos')).toBeInTheDocument();
    // localePrefix is 'always', so next-intl's Link prepends the locale even for pt-BR.
    expect(screen.getByRole('link', { name: /Lição Um/ })).toHaveAttribute(
      'href',
      '/pt-BR/content/matematica/calculo/licao-1',
    );
  });

  it('shows 0 of N completed for the topic when nothing is read yet', () => {
    renderWithIntl(<ContentTree disciplineSlug="matematica" subject={subject} />);

    expect(screen.getByText('0 de 3 lições concluídas')).toBeInTheDocument();
    expect(screen.queryByText('Concluída')).not.toBeInTheDocument();
  });

  it('aggregates completed counts per lesson group and per topic', () => {
    markComplete(['licao-1', 'licao-3']);
    renderWithIntl(<ContentTree disciplineSlug="matematica" subject={subject} />);

    expect(screen.getByText('2 de 3 lições concluídas')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument();
    expect(screen.getAllByText('Concluída')).toHaveLength(2);
  });

  it('highlights the next lesson to read once the student has started', () => {
    markComplete(['licao-1']);
    renderWithIntl(<ContentTree disciplineSlug="matematica" subject={subject} />);

    const nextLink = screen.getByRole('link', { name: /Lição Dois/ });
    expect(within(nextLink).getByText('Próxima')).toBeInTheDocument();
  });
});

describe('SubjectProgressSummary', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('offers to start at the first lesson when nothing is read', () => {
    renderWithIntl(<SubjectProgressSummary disciplineSlug="matematica" subject={subject} />);

    const action = screen.getByRole('link', { name: /Começar/ });
    expect(action).toHaveAttribute('href', '/pt-BR/content/matematica/calculo/licao-1');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('continues at the first unread lesson and reports the percentage', () => {
    markComplete(['licao-1']);
    renderWithIntl(<SubjectProgressSummary disciplineSlug="matematica" subject={subject} />);

    expect(screen.getByRole('link', { name: /Continuar de onde parou/ })).toHaveAttribute(
      'href',
      '/pt-BR/content/matematica/calculo/licao-2',
    );
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('switches to review mode once every lesson is complete', () => {
    markComplete(['licao-1', 'licao-2', 'licao-3']);
    renderWithIntl(<SubjectProgressSummary disciplineSlug="matematica" subject={subject} />);

    expect(screen.getByRole('link', { name: /Revisar conteúdo/ })).toHaveAttribute(
      'href',
      '/pt-BR/content/matematica/calculo/licao-1',
    );
    expect(screen.getByText('Você concluiu todas as lições deste assunto!')).toBeInTheDocument();
  });
});
