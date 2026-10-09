import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import type { LessonStep } from '@/lib/lesson-steps';
import { LessonShell } from './lesson-shell';

const steps: LessonStep[] = [
  { id: 'step-1', type: 'text', title: 'Introdução' },
  { id: 'step-2', type: 'simulator', title: 'Simulador' },
  { id: 'step-3', type: 'solved_exercise', title: 'Treino' },
];

const outline = [
  { slug: 'a', title: 'Lição A', href: '/content/m/c/a' },
  { slug: 'b', title: 'Lição B', href: '/content/m/c/b' },
  { slug: 'c', title: 'Lição C', href: '/content/m/c/c' },
];

function renderShell(props: Partial<React.ComponentProps<typeof LessonShell>> = {}) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
      <LessonShell
        steps={steps}
        lessonSlug="b"
        lessonNumber={2}
        lessonTotal={3}
        outline={outline}
        previousLesson={{ href: '/content/m/c/a', title: 'Lição A' }}
        nextLesson={{ href: '/content/m/c/c', title: 'Lição C' }}
        indexHref="/content/m/c"
        header={<h1>Título</h1>}
        footer={<p>Rodapé</p>}
        {...props}
      >
        {steps.map((step) => (
          <section key={step.id} id={step.id}>
            {step.title}
          </section>
        ))}
      </LessonShell>
    </NextIntlClientProvider>,
  );
}

// jsdom has no layout: every page measures 0px tall, which reads as "scrolled to
// the bottom". Give the document an explicit height so the first step is active.
function setPageHeight(height: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, get: () => height });
}

describe('LessonShell', () => {
  let scrolledTo: string[];

  beforeEach(() => {
    scrolledTo = [];
    // jsdom has no layout engine: record scroll targets instead of scrolling.
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolledTo.push(this.id);
    };
    window.localStorage.clear();
    setPageHeight(5000);
    // Lay the steps out 600px apart, the first one just under the reading line.
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const match = /^step-(\d+)$/.exec(this.id);
      const top = match ? 100 + (Number(match[1]) - 1) * 600 : 0;
      return { top, bottom: top + 500, left: 0, right: 0, width: 0, height: 500, x: 0, y: top, toJSON() {} };
    };
  });

  afterEach(() => {
    Reflect.deleteProperty(document.documentElement, 'scrollHeight');
  });

  it('shows the lesson position, the step list and the whole lesson outline', () => {
    renderShell();

    expect(screen.getAllByText('Lição 2 de 3').length).toBeGreaterThan(0);
    expect(screen.getByRole('navigation', { name: 'Etapas da lição' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lição B' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Lição A' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progresso de leitura da lição' })).toBeInTheDocument();
  });

  it('starts on the first step, with the previous button handing over to the previous lesson', () => {
    renderShell();

    expect(screen.getByText('Etapa 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lição anterior' })).toHaveAttribute('href', '/pt-BR/content/m/c/a');
    expect(screen.getByRole('button', { name: 'Próxima etapa' })).toBeInTheDocument();
  });

  it('disables going back at the first step of the first lesson', () => {
    renderShell({ previousLesson: undefined });

    expect(screen.getByRole('button', { name: 'Etapa anterior' })).toBeDisabled();
  });

  it('scrolls to the next step from the dock button', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Próxima etapa' }));
    expect(scrolledTo).toEqual(['step-2']);
  });

  it('scrolls to a step chosen in the step list', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('link', { name: 'Ir para: Treino' }));
    expect(scrolledTo).toEqual(['step-3']);
  });

  it('moves forward with the right arrow key', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.keyboard('{ArrowRight}');
    expect(scrolledTo).toEqual(['step-2']);
  });

  it('ignores arrow keys while typing in a field', async () => {
    const user = userEvent.setup();
    renderShell({
      header: <input aria-label="resposta" />,
    });

    await user.click(screen.getByLabelText('resposta'));
    await user.keyboard('{ArrowRight}');
    expect(scrolledTo).toEqual([]);
  });

  it('offers the next lesson once the last step is reached', () => {
    setPageHeight(window.innerHeight);
    renderShell();

    expect(screen.getByRole('link', { name: 'Próxima lição' })).toHaveAttribute('href', '/pt-BR/content/m/c/c');
  });

  it('falls back to the index link on the last step of the last lesson', () => {
    setPageHeight(window.innerHeight);
    renderShell({ nextLesson: undefined });

    const links = screen.getAllByRole('link', { name: 'Voltar ao índice' });
    expect(links.some((link) => link.getAttribute('href') === '/pt-BR/content/m/c')).toBe(true);
  });
});
