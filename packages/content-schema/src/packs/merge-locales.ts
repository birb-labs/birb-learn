// Merges the locale files of one lesson or question into one bundle item. pt-BR
// is the structural authority; the structural fields of every other locale
// must match it (spec §11.3), and a file that does not is reported and left out.
import { LOCALES, type Locale } from '../schema';
import {
  lookupLine,
  type LessonBlockData,
  type PackLesson,
  type PackLessonBlock,
  type PackLessonBlockTranslation,
  type PackProblem,
  type PackQuestion,
  type PackQuestionTranslation,
  type QuestionData,
} from './pack-schemas';

export interface LessonFileBlock {
  structural: PackLessonBlock;
  translation: PackLessonBlockTranslation;
  data: LessonBlockData;
}

export interface LessonFile {
  file: string;
  locale: Locale;
  order: number;
  slug: string;
  dirParts: string[];
  title: string;
  blocksLine: number | undefined;
  blocks: LessonFileBlock[];
}

export type QuestionStructure = Omit<PackQuestion, 'key' | 'disciplineSlug' | 'subjectSlug' | 'translations'>;

export interface QuestionFile {
  file: string;
  locale: Locale;
  key: string;
  dirParts: string[];
  data: QuestionData;
  structure: QuestionStructure;
  translation: PackQuestionTranslation;
}

function showValue(value: unknown): string {
  if (value === null || value === undefined) return 'nothing';
  if (Array.isArray(value)) return `[${value.map((item) => String(item)).join(', ')}]`;
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** Collects structural mismatches of one locale file against the authority file. */
class MismatchCollector {
  readonly problems: PackProblem[] = [];

  constructor(
    private readonly file: string,
    private readonly authorityFile: string,
    private readonly lineOf: (fieldPath: string) => number | undefined,
  ) {}

  value(fieldPath: string, here: unknown, there: unknown): boolean {
    if (JSON.stringify(here) === JSON.stringify(there)) return true;
    this.add(fieldPath, `${showValue(here)} here but ${showValue(there)} in ${this.authorityFile}`);
    return false;
  }

  count(fieldPath: string, here: number, there: number, noun: string): boolean {
    if (here === there) return true;
    this.add(fieldPath, `${plural(here, noun)} here but ${there} in ${this.authorityFile}`);
    return false;
  }

  add(fieldPath: string, detail: string): void {
    this.problems.push({ file: this.file, line: this.lineOf(fieldPath), message: `${fieldPath}: ${detail}` });
  }
}

/** pt-BR is the structural authority; without it, the first locale present. */
function byLocale<T extends { locale: Locale; file: string }>(
  files: T[],
  noun: string,
  problems: PackProblem[],
): { files: Map<Locale, T>; authority: T } {
  const map = new Map<Locale, T>();
  for (const file of files) {
    const existing = map.get(file.locale);
    if (existing) {
      problems.push({ file: file.file, message: `a second ${file.locale} file for this ${noun}; ${existing.file} is the first` });
    } else {
      map.set(file.locale, file);
    }
  }
  const authority = LOCALES.map((locale) => map.get(locale)).find((file) => file !== undefined)!;
  return { files: map, authority };
}

export function mergeLesson(group: LessonFile[], problems: PackProblem[]): PackLesson {
  const { files, authority } = byLocale(group, 'lesson', problems);
  const [disciplineSlug, subjectSlug, topicSlug, sectionSlug] = authority.dirParts;
  const lesson: PackLesson = {
    slug: authority.slug,
    order: authority.order,
    disciplineSlug,
    subjectSlug,
    topicSlug,
    sectionSlug,
    blocks: authority.blocks.map((block) => block.structural),
    translations: {},
  };

  for (const locale of LOCALES) {
    const file = files.get(locale);
    if (!file) continue;
    if (file !== authority) {
      const mismatches = compareLessons(file, authority);
      if (mismatches.length > 0) {
        // Left out, so the bundle never pairs translations with the wrong blocks.
        problems.push(...mismatches);
        continue;
      }
    }
    lesson.translations[locale] = {
      file: file.file,
      title: file.title,
      blocks: file.blocks.map((block) => block.translation),
    };
  }
  return lesson;
}

function compareLessons(file: LessonFile, authority: LessonFile): PackProblem[] {
  const blockLine = (fieldPath: string): number | undefined => {
    const match = /^blocks\[(\d+)\]\.?(.*)$/.exec(fieldPath);
    if (!match) return fieldPath === 'blocks' ? file.blocksLine : undefined;
    const translation = file.blocks[Number(match[1])].translation;
    return lookupLine(translation.lines, match[2]) ?? translation.line;
  };
  const check = new MismatchCollector(file.file, authority.file, blockLine);

  if (file.order !== authority.order) {
    check.problems.push({
      file: file.file,
      message: `the file name gives order ${file.order} but ${authority.file} gives ${authority.order}`,
    });
  }
  if (!check.count('blocks', file.blocks.length, authority.blocks.length, 'block')) {
    check.problems[check.problems.length - 1].message += '; every locale file needs the same blocks in the same order';
    return check.problems;
  }

  file.blocks.forEach((block, index) => {
    const here = block.data;
    const there = authority.blocks[index].data;
    const at = `blocks[${index}]`;
    if (!check.value(`${at}.type`, here.type, there.type)) return;

    if (here.type === 'simulator' && there.type === 'simulator') {
      check.value(`${at}.simulatorKey`, here.simulatorKey, there.simulatorKey);
      check.value(`${at}.simulatorParams`, block.structural.simulatorParams, authority.blocks[index].structural.simulatorParams);
    } else if (here.type === 'code_exercise' && there.type === 'code_exercise') {
      check.value(`${at}.kind`, here.kind, there.kind);
      check.value(`${at}.language`, here.language, there.language);
      check.count(`${at}.tests`, here.tests.length, there.tests.length, 'test');
    } else if (here.type === 'code_snippet' && there.type === 'code_snippet') {
      if (check.count(`${at}.variants`, here.variants.length, there.variants.length, 'variant')) {
        here.variants.forEach((variant, variantIndex) => {
          check.value(`${at}.variants[${variantIndex}].language`, variant.language, there.variants[variantIndex].language);
        });
      }
    }
  });
  return check.problems;
}

export function mergeQuestion(group: QuestionFile[], problems: PackProblem[]): PackQuestion {
  const { files, authority } = byLocale(group, 'question', problems);
  const [disciplineSlug, subjectSlug] = authority.dirParts;
  const question: PackQuestion = {
    key: authority.key,
    disciplineSlug,
    subjectSlug,
    ...authority.structure,
    translations: {},
  };

  for (const locale of LOCALES) {
    const file = files.get(locale);
    if (!file) continue;
    if (file !== authority) {
      const mismatches = compareQuestions(file, authority);
      if (mismatches.length > 0) {
        problems.push(...mismatches);
        continue;
      }
    }
    question.translations[locale] = file.translation;
  }
  return question;
}

function compareQuestions(file: QuestionFile, authority: QuestionFile): PackProblem[] {
  const check = new MismatchCollector(file.file, authority.file, (fieldPath) => lookupLine(file.translation.lines, fieldPath));
  const here = file.data;
  const there = authority.data;

  if (!check.value('type', here.type, there.type)) return check.problems;
  check.value('difficulty', here.difficulty, there.difficulty);
  check.value('tags', [...here.tags].sort(), [...there.tags].sort());

  if ((here.type === 'numeric' || here.type === 'true_false') && (there.type === 'numeric' || there.type === 'true_false')) {
    check.value('correctAnswer', file.structure.correctAnswer, authority.structure.correctAnswer);
  } else if (here.type === 'short_text' && there.type === 'short_text') {
    if (check.value('answerFormat', here.answerFormat, there.answerFormat) && here.answerFormat === 'math') {
      check.value('acceptedAnswers', here.acceptedAnswers, there.acceptedAnswers);
    }
  } else if (
    (here.type === 'multiple_choice' || here.type === 'multiple_response') &&
    (there.type === 'multiple_choice' || there.type === 'multiple_response')
  ) {
    if (check.count('options', here.options.length, there.options.length, 'option')) {
      here.options.forEach((option, index) => {
        check.value(`options[${index}].correct`, option.correct, there.options[index].correct);
      });
    }
  } else if (here.type === 'ordering' && there.type === 'ordering') {
    check.count('items', here.items.length, there.items.length, 'item');
  } else if (here.type === 'matching' && there.type === 'matching') {
    check.count('pairs', here.pairs.length, there.pairs.length, 'pair');
  } else if (here.type === 'code' && there.type === 'code') {
    check.value('kind', here.kind, there.kind);
    check.value('language', here.language, there.language);
    check.count('tests', here.tests.length, there.tests.length, 'test');
  }
  return check.problems;
}
