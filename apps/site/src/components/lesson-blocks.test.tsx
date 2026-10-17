import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { LessonBlocks } from './lesson-blocks';
import type { LessonBlockContent } from '@birb-learn/content-schema';

// next/navigation's router (used by the code snippet island) throws outside an app router tree.
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return { ...actual, useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }) };
});

const labels = {
  blockTypes: {
    text: 'Conteúdo',
    curiosity: 'Curiosidade',
    real_world_application: 'No mundo real',
    solved_exercise: 'Exercício resolvido',
    simulator: 'Simulador',
    code_snippet: 'Código',
    code_exercise: 'Exercício de código',
  },
  showResolution: 'Ver resolução',
  hideResolution: 'Ocultar resolução',
  exerciseTry: 'Tente resolver antes de ver a resolução.',
  resolution: 'Resolução',
};

const fixtureBlocks: LessonBlockContent[] = [
  { id: 1, order: 1, type: 'text', title: null, bodyMdx: 'Texto normal.', promptMdx: null, resolutionMdx: null, caption: null, simulatorKey: null, simulatorParams: null, codeKind: null, codeLanguage: null, payloadJson: null },
  { id: 2, order: 2, type: 'curiosity', title: 'Você sabia?', bodyMdx: 'Uma curiosidade.', promptMdx: null, resolutionMdx: null, caption: null, simulatorKey: null, simulatorParams: null, codeKind: null, codeLanguage: null, payloadJson: null },
  { id: 3, order: 3, type: 'real_world_application', title: 'No mundo real', bodyMdx: 'Uma aplicação.', promptMdx: null, resolutionMdx: null, caption: null, simulatorKey: null, simulatorParams: null, codeKind: null, codeLanguage: null, payloadJson: null },
  { id: 4, order: 4, type: 'solved_exercise', title: null, bodyMdx: null, promptMdx: 'Enunciado do exercício.', resolutionMdx: 'Resolução do exercício.', caption: null, simulatorKey: null, simulatorParams: null, codeKind: null, codeLanguage: null, payloadJson: null },
  { id: 5, order: 5, type: 'simulator', title: null, bodyMdx: null, promptMdx: null, resolutionMdx: null, caption: 'Legenda do simulador.', simulatorKey: 'function-approach-grapher', simulatorParams: '{"expression":"x^2","approachPoint":1,"domain":[-2,2]}', codeKind: null, codeLanguage: null, payloadJson: null },
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

function codeSnippetBlock(payload: unknown): LessonBlockContent {
  return {
    id: 20,
    order: 1,
    type: 'code_snippet',
    title: 'Olá, Ana',
    bodyMdx: null,
    promptMdx: null,
    resolutionMdx: null,
    caption: 'O mesmo programa em duas linguagens.',
    simulatorKey: null,
    simulatorParams: null,
    codeKind: null,
    codeLanguage: null,
    payloadJson: typeof payload === 'string' ? payload : JSON.stringify(payload),
  };
}

const snippetPayload = {
  variants: [
    {
      language: 'python',
      code: 'nome = "Ana"\nprint(nome)\n',
      runnable: true,
      annotations: [{ lines: '1', mdx: 'Guarda o **texto** na variável.' }],
      walkthrough: [{ lines: '1-2', mdx: 'O programa inteiro.' }],
    },
    { language: 'c', code: 'int main(void) { return 0; }\n', runnable: true },
  ],
};

describe('LessonBlocks code_snippet', () => {
  async function renderSnippetBlock(payload: unknown) {
    const jsx = await LessonBlocks({ blocks: [codeSnippetBlock(payload)], labels });
    return render(<NextIntlClientProvider locale="pt-BR" messages={ptBR}>{jsx}</NextIntlClientProvider>);
  }

  it('renders the framed, highlighted code with its title and caption', async () => {
    const { container } = await renderSnippetBlock(snippetPayload);

    expect(screen.getByText('Código')).toBeInTheDocument();
    expect(screen.getByText('Olá, Ana')).toBeInTheDocument();
    expect(screen.getByText('O mesmo programa em duas linguagens.')).toBeInTheDocument();
    expect(container.querySelector('[data-block-type="code_snippet"]')).not.toBeNull();
    const firstLine = container.querySelector('[data-line="1"]');
    expect(firstLine?.textContent).toContain('nome = "Ana"');
    // Highlighted at build time: tokens carry theme variables, not hex colours.
    expect(container.querySelector('[data-line="1"] [style*="var(--code-"]')).not.toBeNull();
  });

  it('passes the annotation and walkthrough MDX to the island as compiled HTML', async () => {
    const user = userEvent.setup();
    await renderSnippetBlock(snippetPayload);

    await user.click(screen.getByRole('button', { name: 'Nota 1' }));
    expect(screen.getByRole('tooltip').querySelector('strong')?.textContent).toBe('texto');

    await user.click(screen.getByRole('button', { name: 'Percorrer o código' }));
    expect(screen.getByText('O programa inteiro.')).toBeInTheDocument();
  });

  it('fails loudly on a malformed payload', async () => {
    await expect(LessonBlocks({ blocks: [codeSnippetBlock('{not json')], labels })).rejects.toThrow(/Invalid code_snippet payload in block 20/);
    await expect(LessonBlocks({ blocks: [codeSnippetBlock({ variants: [] })], labels })).rejects.toThrow(/Invalid code_snippet payload/);
    await expect(
      LessonBlocks({ blocks: [codeSnippetBlock({ variants: [{ language: 'python', code: 'x = 1\n', annotations: [{ lines: '5', mdx: 'x' }] }] })], labels }),
    ).rejects.toThrow(/past the end of the code/);
  });
});

function codeExerciseBlock(overrides: Partial<LessonBlockContent>): LessonBlockContent {
  return {
    id: 30,
    order: 1,
    type: 'code_exercise',
    title: 'Complete a consulta',
    bodyMdx: null,
    promptMdx: 'Complete a consulta com **dois** operadores.',
    resolutionMdx: 'Maior ou igual é `>=`.',
    caption: null,
    simulatorKey: null,
    simulatorParams: null,
    codeKind: 'fill_blank',
    codeLanguage: 'sqlite',
    payloadJson: JSON.stringify(fillBlankPayload),
    ...overrides,
  };
}

const fillBlankPayload = {
  starterCode: 'SELECT nome FROM alunos WHERE idade ___1___ 18 ORDER BY ___2___;',
  solution: 'SELECT nome FROM alunos WHERE idade >= 18 ORDER BY nome;',
  blanks: [
    { id: 1, accepted: ['>='] },
    { id: 2, accepted: ['nome'] },
  ],
  hints: ['Pense em uma **comparação**.'],
};

describe('LessonBlocks code_exercise', () => {
  async function renderExerciseBlock(block: LessonBlockContent) {
    const jsx = await LessonBlocks({ blocks: [block], labels });
    return render(<NextIntlClientProvider locale="pt-BR" messages={ptBR}>{jsx}</NextIntlClientProvider>);
  }

  it('renders the framed exercise with its compiled prompt and an input per blank', async () => {
    const { container } = await renderExerciseBlock(codeExerciseBlock({}));

    expect(screen.getByText('Exercício de código')).toBeInTheDocument();
    expect(screen.getByText('Complete a consulta')).toBeInTheDocument();
    expect(container.querySelector('[data-block-type="code_exercise"]')).not.toBeNull();
    expect((await screen.findByText('dois')).tagName).toBe('STRONG');
    expect(await screen.findByLabelText('Lacuna 1')).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByLabelText('Lacuna 2')).toBeInstanceOf(HTMLInputElement);
    // Highlighted at build time: tokens carry theme variables, not hex colours.
    expect(container.querySelector('[data-line="1"] [style*="var(--code-"]')).not.toBeNull();
  });

  it('grades the blanks in the page without a runner', async () => {
    const user = userEvent.setup();
    await renderExerciseBlock(codeExerciseBlock({}));

    await user.type(await screen.findByLabelText('Lacuna 1'), '>=');
    await user.type(screen.getByLabelText('Lacuna 2'), 'nome');
    await user.click(screen.getByRole('button', { name: 'Verificar' }));
    expect(await screen.findByText('Correto!')).toBeInTheDocument();
  });

  it('compiles the hints and the resolution, revealed on request', async () => {
    const user = userEvent.setup();
    await renderExerciseBlock(codeExerciseBlock({}));

    await user.click(await screen.findByRole('button', { name: 'Mostrar dica 1 de 1' }));
    expect(screen.getByText('comparação', { selector: 'strong' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mostrar solução' }));
    expect(screen.getByText('>=', { selector: 'code' })).toBeInTheDocument();
  });

  it('fails loudly on a malformed payload', async () => {
    await expect(LessonBlocks({ blocks: [codeExerciseBlock({ payloadJson: '{not json' })], labels })).rejects.toThrow(/Invalid code_exercise payload in block 30/);
    await expect(
      LessonBlocks({ blocks: [codeExerciseBlock({ payloadJson: JSON.stringify({ ...fillBlankPayload, blanks: [] }) })], labels }),
    ).rejects.toThrow(/Invalid code_exercise payload/);
  });
});
