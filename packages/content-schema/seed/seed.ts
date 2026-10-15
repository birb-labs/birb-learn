import { eq } from 'drizzle-orm';
import { getDb } from '../src/client';
import { CodeTaskPayload, validateCodeTask } from '../src/code-payloads';
import { parseLessonCodePayload, type LessonBlockContent } from '../src/queries';
import type { CodeKind, Language } from '../src/code-languages';
import {
  disciplineTranslations,
  disciplines,
  lessonBlockTranslations,
  lessonBlocks,
  lessonTranslations,
  lessons,
  questionOptionTranslations,
  questionOptions,
  questionTranslations,
  questions,
  questionTags,
  sectionTranslations,
  sections,
  subjectTranslations,
  subjects,
  tagTranslations,
  tags,
  topicTranslations,
  topics,
} from '../src/schema';

const db = getDb();

db.delete(questionTags).run();
db.delete(questionOptionTranslations).run();
db.delete(questionOptions).run();
db.delete(questionTranslations).run();
db.delete(questions).run();
db.delete(tagTranslations).run();
db.delete(tags).run();
db.delete(lessonBlockTranslations).run();
db.delete(lessonBlocks).run();
db.delete(lessonTranslations).run();
db.delete(lessons).run();
db.delete(sectionTranslations).run();
db.delete(sections).run();
db.delete(topicTranslations).run();
db.delete(topics).run();
db.delete(subjectTranslations).run();
db.delete(subjects).run();
db.delete(disciplineTranslations).run();
db.delete(disciplines).run();

// Development fixture shaped like real content: two disciplines, a few
// lessons and one lesson that exercises every block type. The production
// site is built from the admin database (see scripts/hydrate-from-admin.ts).
type Names = { 'pt-BR': string; 'en-US'?: string; es?: string };

function insertDiscipline(slug: string, order: number, names: Names) {
  const row = db.insert(disciplines).values({ slug, order }).returning().get();
  db.insert(disciplineTranslations)
    .values(Object.entries(names).map(([locale, name]) => ({ disciplineId: row.id, locale: locale as keyof Names, name })))
    .run();
  return row;
}

function insertSubject(disciplineId: number, slug: string, order: number, names: Names) {
  const row = db.insert(subjects).values({ disciplineId, slug, order }).returning().get();
  db.insert(subjectTranslations)
    .values(Object.entries(names).map(([locale, name]) => ({ subjectId: row.id, locale: locale as keyof Names, name })))
    .run();
  return row;
}

function insertTopic(subjectId: number, slug: string, order: number, names: Names) {
  const row = db.insert(topics).values({ subjectId, slug, order }).returning().get();
  db.insert(topicTranslations)
    .values(Object.entries(names).map(([locale, name]) => ({ topicId: row.id, locale: locale as keyof Names, name })))
    .run();
  return row;
}

function insertSection(topicId: number, slug: string, order: number, names: Names) {
  const row = db.insert(sections).values({ topicId, slug, order }).returning().get();
  db.insert(sectionTranslations)
    .values(Object.entries(names).map(([locale, name]) => ({ sectionId: row.id, locale: locale as keyof Names, name })))
    .run();
  return row;
}

function insertLesson(sectionId: number, slug: string, order: number, title: string) {
  const row = db.insert(lessons).values({ sectionId, slug, order }).returning().get();
  db.insert(lessonTranslations).values({ lessonId: row.id, locale: 'pt-BR', title }).run();
  return row;
}

type BlockFixture =
  | { type: 'text' | 'curiosity' | 'real_world_application'; title?: string; bodyMdx: string }
  | { type: 'solved_exercise'; title?: string; promptMdx: string; resolutionMdx: string }
  | { type: 'simulator'; simulatorKey: string; simulatorParams: string; caption?: string }
  | { type: 'code_snippet'; title?: string; caption?: string; payload: unknown }
  | {
      type: 'code_exercise';
      title?: string;
      promptMdx: string;
      resolutionMdx: string;
      codeKind: CodeKind;
      codeLanguage: Language;
      payload: unknown;
    };

function insertBlocks(lessonId: number, blocks: BlockFixture[]) {
  blocks.forEach((block, index) => {
    const isCode = block.type === 'code_snippet' || block.type === 'code_exercise';
    const payloadJson = isCode ? JSON.stringify(block.payload) : null;
    if (isCode) {
      // Fail the seed on a bad payload, with the same check the site runs at build time.
      parseLessonCodePayload({
        id: index + 1,
        order: index + 1,
        type: block.type,
        title: null,
        bodyMdx: null,
        promptMdx: null,
        resolutionMdx: null,
        caption: null,
        simulatorKey: null,
        simulatorParams: null,
        codeKind: block.type === 'code_exercise' ? block.codeKind : null,
        codeLanguage: block.type === 'code_exercise' ? block.codeLanguage : null,
        payloadJson,
      } satisfies LessonBlockContent);
    }
    const row = db
      .insert(lessonBlocks)
      .values({
        lessonId,
        order: index + 1,
        type: block.type,
        simulatorKey: block.type === 'simulator' ? block.simulatorKey : null,
        simulatorParams: block.type === 'simulator' ? block.simulatorParams : null,
        codeKind: block.type === 'code_exercise' ? block.codeKind : null,
        codeLanguage: block.type === 'code_exercise' ? block.codeLanguage : null,
      })
      .returning()
      .get();
    db.insert(lessonBlockTranslations)
      .values({
        blockId: row.id,
        locale: 'pt-BR',
        title: 'title' in block ? (block.title ?? null) : null,
        bodyMdx: 'bodyMdx' in block ? block.bodyMdx : null,
        promptMdx: 'promptMdx' in block ? block.promptMdx : null,
        resolutionMdx: 'resolutionMdx' in block ? block.resolutionMdx : null,
        caption: 'caption' in block ? (block.caption ?? null) : null,
        payloadJson,
      })
      .run();
  });
}

const math = insertDiscipline('matematica', 1, { 'pt-BR': 'Matemática', 'en-US': 'Mathematics', es: 'Matemáticas' });
const physics = insertDiscipline('fisica', 2, { 'pt-BR': 'Física', 'en-US': 'Physics', es: 'Física' });

const subject = insertSubject(math.id, 'calculo', 1, { 'pt-BR': 'Cálculo', 'en-US': 'Calculus', es: 'Cálculo' });
const algebra = insertSubject(math.id, 'algebra', 2, { 'pt-BR': 'Álgebra', 'en-US': 'Algebra', es: 'Álgebra' });
const mechanics = insertSubject(physics.id, 'mecanica', 1, { 'pt-BR': 'Mecânica', 'en-US': 'Mechanics', es: 'Mecánica' });

const limits = insertTopic(subject.id, 'limites', 1, { 'pt-BR': 'Limites', 'en-US': 'Limits', es: 'Límites' });
const intuition = insertSection(limits.id, 'ideia-intuitiva', 1, {
  'pt-BR': 'Ideia intuitiva de limite',
  'en-US': 'Intuitive idea of a limit',
  es: 'Idea intuitiva de límite',
});
const formal = insertSection(limits.id, 'definicao-formal', 2, { 'pt-BR': 'Definição formal' });

const lessonWhatIsALimit = insertLesson(intuition.id, 'o-que-e-um-limite', 1, 'O que é um limite?');
insertLesson(intuition.id, 'limites-laterais', 2, 'Limites laterais');
insertLesson(formal.id, 'epsilon-delta', 3, 'A definição de épsilon-delta');

insertBlocks(lessonWhatIsALimit.id, [
  {
    type: 'text',
    bodyMdx: `## Aproximando-se de um valor

Imagine que você caminha em direção a uma porta. A cada passo você fica mais perto dela, mesmo sem nunca precisar tocá-la. O **limite** formaliza essa ideia: ele descreve o valor para o qual uma função *se aproxima* quando a variável se aproxima de um ponto.

Escrevemos $\\lim_{x \\to a} f(x) = L$ quando $f(x)$ fica tão perto de $L$ quanto quisermos, desde que $x$ esteja suficientemente perto de $a$ (mas não necessariamente igual a $a$).`,
  },
  {
    type: 'simulator',
    simulatorKey: 'function-approach-grapher',
    simulatorParams: JSON.stringify({ expression: '\\frac{\\sin(x)}{x}', approachPoint: 0.5, domain: [-6, 6] }),
    caption: 'Aproxime x de 0 e observe f(x) = sen(x)/x: a função não existe em 0, mas se aproxima de 1.',
  },
  {
    type: 'curiosity',
    title: 'Você sabia?',
    bodyMdx: 'A ideia de limite é o alicerce do cálculo, desenvolvido de forma independente por **Newton** e **Leibniz** no século XVII, quase 150 anos antes de Cauchy dar a primeira definição rigorosa.',
  },
  {
    type: 'solved_exercise',
    promptMdx: 'Calcule $\\lim_{x \\to 2} (3x + 1)$.',
    resolutionMdx: 'Como $3x + 1$ é uma função polinomial, ela é contínua e basta substituir:\n\n$$\\lim_{x \\to 2} (3x + 1) = 3 \\cdot 2 + 1 = 7.$$',
  },
  {
    type: 'real_world_application',
    title: 'Velocidade instantânea',
    bodyMdx: 'Um velocímetro mostra a velocidade **em um instante**. Matematicamente, isso é o limite da velocidade média $\\frac{\\Delta s}{\\Delta t}$ quando $\\Delta t$ tende a zero.',
  },
]);

// Computer Science: exercises the code block types and the code question type.
const computerScience = insertDiscipline('computer-science', 3, {
  'pt-BR': 'Ciência da Computação',
  'en-US': 'Computer Science',
  es: 'Ciencias de la Computación',
});
const csFundamentals = insertSubject(computerScience.id, 'fundamentos', 1, {
  'pt-BR': 'Fundamentos',
  'en-US': 'Fundamentals',
  es: 'Fundamentos',
});
const firstPrograms = insertTopic(csFundamentals.id, 'primeiros-programas', 1, {
  'pt-BR': 'Primeiros programas',
  'en-US': 'First programs',
  es: 'Primeros programas',
});
const codeBasics = insertSection(firstPrograms.id, 'codigo-na-pratica', 1, {
  'pt-BR': 'Código na prática',
  'en-US': 'Code in practice',
  es: 'Código en la práctica',
});
const lessonHelloCode = insertLesson(codeBasics.id, 'ola-codigo', 1, 'Olá, código');
const lessonCodeExercises = insertLesson(codeBasics.id, 'exercicios-de-codigo', 2, 'Exercícios de código');

insertBlocks(lessonHelloCode.id, [
  {
    type: 'text',
    bodyMdx: `## Escrevendo o primeiro programa

Um **programa** é uma lista de instruções que o computador executa na ordem em que aparecem. Nesta lição você vai ler exemplos, rodá-los e depois escrever o seu.`,
  },
  {
    type: 'code_snippet',
    title: 'Olá, Ana',
    caption: 'O mesmo programa em Python e em C.',
    payload: {
      variants: [
        {
          language: 'python',
          code: 'nome = "Ana"\nprint("Olá,", nome)\nfor i in range(3):\n    print(i)\n',
          runnable: true,
          expectedOutput: 'Olá, Ana\n0\n1\n2\n',
          annotations: [
            { lines: '1', mdx: 'Guarda o texto `"Ana"` na variável `nome`.' },
            { lines: '2', mdx: '`print` escreve na saída, separando os argumentos por espaço.' },
          ],
          walkthrough: [
            { lines: '1', mdx: 'A variável `nome` passa a valer `"Ana"`.' },
            { lines: '2', mdx: 'O programa imprime `Olá, Ana`.' },
            { lines: '3-4', mdx: 'O laço repete o `print` para `i` igual a 0, 1 e 2.' },
          ],
        },
        {
          language: 'c',
          code: '#include <stdio.h>\n\nint main(void) {\n    printf("Olá, Ana\\n");\n    return 0;\n}\n',
          runnable: true,
          expectedOutput: 'Olá, Ana\n',
        },
      ],
    },
  },
  {
    type: 'code_snippet',
    title: 'Consultando dados',
    caption: 'Código SQL apenas para leitura: copie e rode em um banco MySQL.',
    payload: {
      variants: [
        {
          language: 'mysql',
          code: 'SELECT nome, idade\nFROM alunos\nWHERE idade >= 18;\n',
          runnable: false,
        },
      ],
    },
  },
  {
    type: 'code_exercise',
    title: 'O dobro de um número',
    codeKind: 'write',
    codeLanguage: 'python',
    promptMdx: 'Leia um número inteiro da entrada e imprima o **dobro** dele.',
    resolutionMdx:
      '1. `input()` lê uma linha como texto, então `int(...)` a converte em número.\n2. Multiplicamos por 2 e imprimimos com `print`.',
    payload: {
      starterCode: '# Leia um número e imprima o dobro dele\nn = int(input())\n',
      solution: 'n = int(input())\nprint(n * 2)\n',
      tests: [
        { name: 'dobro de 4', stdin: '4\n', expectedStdout: '8\n' },
        { name: 'dobro de -3', stdin: '-3\n', expectedStdout: '-6\n' },
      ],
      hints: ['Use `int(input())` para ler o número.', 'Multiplique o valor por 2 e use `print`.'],
    },
  },
]);

insertBlocks(lessonCodeExercises.id, [
  {
    type: 'code_exercise',
    title: 'Preveja a saída',
    codeKind: 'predict_output',
    codeLanguage: 'javascript',
    promptMdx: 'O que o programa abaixo imprime?',
    resolutionMdx: '`x` começa em 2 e vira 5 após `x += 3`. Depois imprimimos `5 * 2`, que é `10`.',
    payload: {
      starterCode: 'let x = 2;\nx += 3;\nconsole.log(x * 2);\n',
      expectedOutput: '10',
      hints: ['Acompanhe o valor de `x` linha a linha.'],
    },
  },
  {
    type: 'code_exercise',
    title: 'Complete a consulta',
    codeKind: 'fill_blank',
    codeLanguage: 'sqlite',
    promptMdx:
      'Complete a consulta para listar, em ordem alfabética, o nome dos alunos maiores de idade (18 anos ou mais).',
    resolutionMdx: 'Maior de idade significa `idade >= 18`, e `ORDER BY nome` ordena o resultado pelo nome.',
    payload: {
      starterCode: 'SELECT nome FROM alunos WHERE idade ___1___ 18 ORDER BY ___2___;',
      solution: 'SELECT nome FROM alunos WHERE idade >= 18 ORDER BY nome;',
      blanks: [
        { id: 1, accepted: ['>='] },
        { id: 2, accepted: ['nome'] },
      ],
      tests: [
        {
          name: 'maiores de idade',
          sqlSetup:
            "CREATE TABLE alunos (nome TEXT, idade INTEGER);\nINSERT INTO alunos VALUES ('Ana', 20), ('Bia', 17), ('Caio', 18);",
          expectedRows: { columns: ['nome'], rows: [['Ana'], ['Caio']] },
          orderMatters: true,
        },
      ],
      hints: ['O operador "maior ou igual" tem dois caracteres.'],
    },
  },
  {
    type: 'code_exercise',
    title: 'Encontre o erro',
    codeKind: 'find_bug',
    codeLanguage: 'ruby',
    promptMdx: 'O programa deveria imprimir a soma dos números (6), mas imprime outro valor. Qual linha tem o erro?',
    resolutionMdx: 'A linha 4 **substitui** `soma` a cada volta em vez de acumular. O correto é `soma += n`.',
    payload: {
      starterCode: 'numeros = [1, 2, 3]\nsoma = 0\nnumeros.each do |n|\n  soma = n\nend\nputs soma\n',
      solution: 'numeros = [1, 2, 3]\nsoma = 0\nnumeros.each do |n|\n  soma += n\nend\nputs soma\n',
      bugLines: '4',
      tests: [{ stdin: '', expectedStdout: '6\n' }],
      hints: ['Veja o que acontece com `soma` a cada volta do laço.'],
    },
  },
]);

const equations = insertTopic(algebra.id, 'equacoes', 1, { 'pt-BR': 'Equações', 'en-US': 'Equations' });
const firstDegree = insertSection(equations.id, 'primeiro-grau', 1, { 'pt-BR': 'Equações do 1º grau' });
insertLesson(firstDegree.id, 'equacoes-do-primeiro-grau', 1, 'Equações do 1º grau');

const kinematics = insertTopic(mechanics.id, 'cinematica', 1, { 'pt-BR': 'Cinemática', 'en-US': 'Kinematics' });
const uniformMotion = insertSection(kinematics.id, 'mru', 1, { 'pt-BR': 'Movimento uniforme' });
const lessonMru = insertLesson(uniformMotion.id, 'movimento-retilineo-uniforme', 1, 'Movimento retilíneo uniforme');
insertBlocks(lessonMru.id, [
  { type: 'text', bodyMdx: '## Velocidade constante\n\nNo movimento retilíneo uniforme a velocidade não muda: $s = s_0 + v t$.' },
]);

db.insert(tags).values({ slug: 'limites', subjectId: subject.id }).run();
const topicTag = db.select().from(tags).all()[0];
db.insert(tagTranslations)
  .values({ tagId: topicTag.id, locale: 'pt-BR', name: 'Limites' })
  .run();

db.insert(tags)
  .values({ slug: 'limites-laterais', subjectId: subject.id, parentTagId: topicTag.id })
  .run();
const subtopicTag = db.select().from(tags).where(eq(tags.slug, 'limites-laterais')).get()!;
db.insert(tagTranslations)
  .values({ tagId: subtopicTag.id, locale: 'pt-BR', name: 'Limites Laterais' })
  .run();

db.insert(questions)
  .values({
    type: 'multiple_choice',
    difficulty: 'easy',
    correctAnswer: null,
  })
  .run();
const mcQuestion = db.select().from(questions).all()[0];
db.insert(questionTranslations)
  .values({
    questionId: mcQuestion.id,
    locale: 'pt-BR',
    promptMdx: 'Qual é o valor de $1 + 1$?',
    resolutionMdx: 'A soma de $1 + 1$ é $2$, uma propriedade básica da aritmética.',
  })
  .run();

db.insert(questionOptions)
  .values([
    { questionId: mcQuestion.id, isCorrect: false, order: 1 },
    { questionId: mcQuestion.id, isCorrect: true, order: 2 },
    { questionId: mcQuestion.id, isCorrect: false, order: 3 },
  ])
  .run();
const mcOptions = db
  .select()
  .from(questionOptions)
  .where(eq(questionOptions.questionId, mcQuestion.id))
  .all();
db.insert(questionOptionTranslations)
  .values([
    { optionId: mcOptions[0].id, locale: 'pt-BR', textMdx: '1' },
    { optionId: mcOptions[1].id, locale: 'pt-BR', textMdx: '2' },
    { optionId: mcOptions[2].id, locale: 'pt-BR', textMdx: '3' },
  ])
  .run();

db.insert(questionTags).values({ questionId: mcQuestion.id, tagId: topicTag.id }).run();

db.insert(questions)
  .values({
    type: 'numeric',
    difficulty: 'medium',
    correctAnswer: '1.5',
  })
  .run();
const numericQuestion = db.select().from(questions).all()[1];
db.insert(questionTranslations)
  .values({
    questionId: numericQuestion.id,
    locale: 'pt-BR',
    promptMdx: 'Quanto é $3 \\div 2$?',
    resolutionMdx: 'A divisão de $3$ por $2$ é igual a $1.5$.',
  })
  .run();

db.insert(questionTags)
  .values([
    { questionId: numericQuestion.id, tagId: topicTag.id },
    { questionId: numericQuestion.id, tagId: subtopicTag.id },
  ])
  .run();

db.insert(questions)
  .values({
    type: 'multiple_response',
    difficulty: 'hard',
    correctAnswer: null,
  })
  .run();
const multiResponseQuestion = db.select().from(questions).all()[2];
db.insert(questionTranslations)
  .values({
    questionId: multiResponseQuestion.id,
    locale: 'pt-BR',
    promptMdx: 'Quais das afirmações abaixo são verdadeiras?',
    resolutionMdx:
      'A afirmação 1 e a afirmação 3 são verdadeiras; a afirmação 2 é falsa.',
  })
  .run();

db.insert(questionOptions)
  .values([
    { questionId: multiResponseQuestion.id, isCorrect: true, order: 1 },
    { questionId: multiResponseQuestion.id, isCorrect: false, order: 2 },
    { questionId: multiResponseQuestion.id, isCorrect: true, order: 3 },
    { questionId: multiResponseQuestion.id, isCorrect: false, order: 4 },
  ])
  .run();
const multiResponseOptions = db
  .select()
  .from(questionOptions)
  .where(eq(questionOptions.questionId, multiResponseQuestion.id))
  .all();
db.insert(questionOptionTranslations)
  .values([
    { optionId: multiResponseOptions[0].id, locale: 'pt-BR', textMdx: 'Afirmação 1' },
    { optionId: multiResponseOptions[1].id, locale: 'pt-BR', textMdx: 'Afirmação 2' },
    { optionId: multiResponseOptions[2].id, locale: 'pt-BR', textMdx: 'Afirmação 3' },
    { optionId: multiResponseOptions[3].id, locale: 'pt-BR', textMdx: 'Afirmação 4' },
  ])
  .run();

db.insert(questionTags)
  .values([
    { questionId: multiResponseQuestion.id, tagId: topicTag.id },
    { questionId: multiResponseQuestion.id, tagId: subtopicTag.id },
  ])
  .run();

// Code questions, one per kind, each in a different language. The `key` is the
// stable identity that content-pack imports use.
const codeTag = db
  .insert(tags)
  .values({ slug: 'fundamentos-de-codigo', subjectId: csFundamentals.id })
  .returning()
  .get();
db.insert(tagTranslations)
  .values([
    { tagId: codeTag.id, locale: 'pt-BR', name: 'Fundamentos de código' },
    { tagId: codeTag.id, locale: 'en-US', name: 'Code fundamentals' },
    { tagId: codeTag.id, locale: 'es', name: 'Fundamentos de código' },
  ])
  .run();

function insertCodeQuestion(fixture: {
  key: string;
  difficulty: 'easy' | 'medium' | 'hard';
  codeKind: CodeKind;
  codeLanguage: Language;
  promptMdx: string;
  resolutionMdx: string;
  payload: Record<string, unknown>;
}) {
  const errors = validateCodeTask(fixture.codeKind, fixture.codeLanguage, CodeTaskPayload.parse(fixture.payload));
  if (errors.length > 0) throw new Error(`Invalid code question ${fixture.key}: ${errors[0]}`);
  const row = db
    .insert(questions)
    .values({
      type: 'code',
      difficulty: fixture.difficulty,
      key: fixture.key,
      codeKind: fixture.codeKind,
      codeLanguage: fixture.codeLanguage,
    })
    .returning()
    .get();
  db.insert(questionTranslations)
    .values({
      questionId: row.id,
      locale: 'pt-BR',
      promptMdx: fixture.promptMdx,
      resolutionMdx: fixture.resolutionMdx,
      codeJson: JSON.stringify(fixture.payload),
    })
    .run();
  db.insert(questionTags).values({ questionId: row.id, tagId: codeTag.id }).run();
}

insertCodeQuestion({
  key: 'cs-code-write-square-lua',
  difficulty: 'easy',
  codeKind: 'write',
  codeLanguage: 'lua',
  promptMdx: 'Leia um número e imprima o seu **quadrado**.',
  resolutionMdx: '`io.read("n")` lê um número. Imprimimos `n * n`.',
  payload: {
    starterCode: 'local n = io.read("n")\n',
    solution: 'local n = io.read("n")\nprint(n * n)\n',
    tests: [
      { stdin: '5\n', expectedStdout: '25\n' },
      { stdin: '-2\n', expectedStdout: '4\n' },
    ],
  },
});
insertCodeQuestion({
  key: 'cs-code-predict-precedence-postgresql',
  difficulty: 'easy',
  codeKind: 'predict_output',
  codeLanguage: 'postgresql',
  promptMdx: 'Qual valor a consulta abaixo retorna?',
  resolutionMdx: 'A multiplicação tem precedência sobre a soma: $3 \\cdot 4 = 12$ e $2 + 12 = 14$.',
  payload: { starterCode: 'SELECT 2 + 3 * 4 AS resultado;', expectedOutput: '14' },
});
insertCodeQuestion({
  key: 'cs-code-fill-factorial-python',
  difficulty: 'medium',
  codeKind: 'fill_blank',
  codeLanguage: 'python',
  promptMdx: 'Complete a função recursiva que calcula o fatorial de `n`.',
  resolutionMdx: 'O caso base é `n <= 1` e a chamada recursiva usa `n - 1`.',
  payload: {
    starterCode: 'def fatorial(n):\n    if n <= ___1___:\n        return 1\n    return n * fatorial(n ___2___ 1)\n\nprint(fatorial(5))\n',
    solution: 'def fatorial(n):\n    if n <= 1:\n        return 1\n    return n * fatorial(n - 1)\n\nprint(fatorial(5))\n',
    blanks: [
      { id: 1, accepted: ['1'] },
      { id: 2, accepted: ['-'] },
    ],
    tests: [{ stdin: '', expectedStdout: '120\n' }],
  },
});
insertCodeQuestion({
  key: 'cs-code-bug-average-javascript',
  difficulty: 'medium',
  codeKind: 'find_bug',
  codeLanguage: 'javascript',
  promptMdx: 'A função deveria devolver a média de `a` e `b`, mas devolve outro valor. Qual linha está errada?',
  resolutionMdx: 'Por causa da precedência, `b / 2` é calculado primeiro. O correto é `(a + b) / 2`.',
  payload: {
    starterCode: 'function media(a, b) {\n  return a + b / 2;\n}\nconsole.log(media(4, 6));\n',
    solution: 'function media(a, b) {\n  return (a + b) / 2;\n}\nconsole.log(media(4, 6));\n',
    bugLines: '2',
    tests: [{ stdin: '', expectedStdout: '5\n' }],
  },
});

console.log('Seed complete: 3 disciplines, 4 subjects, 7 lessons, 3 tags, 7 questions.');
db.$client.close();
