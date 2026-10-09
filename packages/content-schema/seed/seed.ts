import { eq } from 'drizzle-orm';
import { getDb } from '../src/client';
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
  | { type: 'simulator'; simulatorKey: string; simulatorParams: string; caption?: string };

function insertBlocks(lessonId: number, blocks: BlockFixture[]) {
  blocks.forEach((block, index) => {
    const row = db
      .insert(lessonBlocks)
      .values({
        lessonId,
        order: index + 1,
        type: block.type,
        simulatorKey: block.type === 'simulator' ? block.simulatorKey : null,
        simulatorParams: block.type === 'simulator' ? block.simulatorParams : null,
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

console.log('Seed complete: 2 disciplines, 3 subjects, 5 lessons, 2 tags, 3 questions.');
db.$client.close();
