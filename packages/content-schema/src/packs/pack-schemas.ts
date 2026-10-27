// Content-pack file schemas and the normalized bundle they load into. Pure (zod
// only), so the admin Worker can import it together with check-pack.ts; the
// file-system loader lives in load-pack.ts. See spec §11.
import { z } from 'zod';
import { CODE_KINDS, LANGUAGES, type CodeKind, type Language } from '../code-languages';
import { CodeTaskPayload, CodeVariant } from '../code-payloads';
import { isValidNumericCorrectAnswer } from '../numeric-answer-validation';
import { questions, type LessonBlockType, type Locale } from '../schema';

export const QUESTION_TYPES = questions.type.enumValues;
export type QuestionType = (typeof QUESTION_TYPES)[number];
export const DIFFICULTIES = questions.difficulty.enumValues;
export type Difficulty = (typeof DIFFICULTIES)[number];
export type AnswerFormat = 'text' | 'math';

// ---------------------------------------------------------------------------
// Problems and the normalized bundle
// ---------------------------------------------------------------------------

/** One problem in a pack. `file` is relative to the content root, with `/` separators. */
export interface PackProblem {
  file: string;
  line?: number;
  message: string;
}

/** Where an item was declared. */
export interface PackSource {
  file: string;
  line?: number;
}

/** A name in every locale, as written in `_tree.yaml`. */
export type LocaleNames = Record<Locale, string>;

export interface PackDiscipline {
  slug: string;
  order: number;
  names: LocaleNames;
  source: PackSource;
}

export interface PackSubject {
  slug: string;
  disciplineSlug: string;
  order: number;
  names: LocaleNames;
  source: PackSource;
}

export interface PackTopic {
  slug: string;
  subjectSlug: string;
  order: number;
  names: LocaleNames;
  source: PackSource;
}

export interface PackSection {
  slug: string;
  topicSlug: string;
  order: number;
  names: LocaleNames;
  source: PackSource;
}

export interface PackTag {
  slug: string;
  subjectSlug: string;
  parentSlug: string | null;
  names: LocaleNames;
  source: PackSource;
}

/** The structural (shared across locales) columns of a `lesson_blocks` row. */
export interface PackLessonBlock {
  type: LessonBlockType;
  simulatorKey: string | null;
  /** JSON text of the `simulatorParams` mapping. */
  simulatorParams: string | null;
  codeKind: CodeKind | null;
  codeLanguage: Language | null;
}

/** The columns of a `lesson_block_translations` row, plus where it was written. */
export interface PackLessonBlockTranslation {
  /** Line of the block in the locale file. */
  line?: number;
  /** Line of every field inside the block, keyed by path ("variants[0].runnable"). */
  lines: Record<string, number>;
  title: string | null;
  bodyMdx: string | null;
  promptMdx: string | null;
  resolutionMdx: string | null;
  caption: string | null;
  /** JSON text of a CodeSnippetPayload (code_snippet) or CodeTaskPayload (code_exercise). */
  payloadJson: string | null;
}

export interface PackLessonTranslation {
  file: string;
  title: string;
  /** One per lesson block, in the same order. */
  blocks: PackLessonBlockTranslation[];
}

export interface PackLesson {
  slug: string;
  /** From the `<order>-` filename prefix. */
  order: number;
  // The lesson's directory: <discipline>/<subject>/<topic>/<section>/.
  disciplineSlug: string;
  subjectSlug: string;
  topicSlug: string;
  sectionSlug: string;
  blocks: PackLessonBlock[];
  translations: Partial<Record<Locale, PackLessonTranslation>>;
}

export interface PackQuestionTranslation {
  file: string;
  /** Line of every field in the file, keyed by path ("tests[0].stdin"). */
  lines: Record<string, number>;
  promptMdx: string;
  resolutionMdx: string;
  /** JSON text of a CodeTaskPayload; only for type `code`. */
  codeJson: string | null;
  /** One text per question option (choices, or ordering items in the correct order). */
  options: { textMdx: string }[];
  matchingPairs: { leftMdx: string; rightMdx: string }[];
  /** Accepted answers of this locale; only for short_text with answerFormat `text`. */
  acceptedAnswers: string[];
}

export interface PackQuestion {
  key: string;
  // The question's directory: <discipline>/<subject>/questions/.
  disciplineSlug: string;
  subjectSlug: string;
  type: QuestionType;
  difficulty: Difficulty;
  /** numeric: the canonical number; true_false: "true" or "false"; otherwise null. */
  correctAnswer: string | null;
  answerFormat: AnswerFormat;
  codeKind: CodeKind | null;
  codeLanguage: Language | null;
  tagSlugs: string[];
  /** The `question_options` rows in order; ordering items are stored here in the correct order. */
  options: { isCorrect: boolean }[];
  matchingPairCount: number;
  /** Accepted answers shared by every locale; only for short_text with answerFormat `math`. */
  acceptedAnswersShared: string[];
  translations: Partial<Record<Locale, PackQuestionTranslation>>;
}

/** Everything a content root holds, normalized and ready to import. Plain JSON-safe data. */
export interface PackBundle {
  disciplines: PackDiscipline[];
  subjects: PackSubject[];
  topics: PackTopic[];
  sections: PackSection[];
  tags: PackTag[];
  lessons: PackLesson[];
  questions: PackQuestion[];
  /**
   * Slugs whose `_tree.yaml` entry had problems and was left out. They are
   * already reported, so `checkPack` names the bad entry instead of calling
   * every lesson, question or tag under it "missing".
   */
  treeProblems: TreeProblemSlugs;
}

export type TreeTable = 'disciplines' | 'subjects' | 'topics' | 'sections' | 'tags';

export interface TreeProblemSlugs extends Record<TreeTable, string[]> {
  /** For each left-out slug, the discipline directory whose `_tree.yaml` holds the entry. */
  directories: Record<TreeTable, Record<string, string>>;
}

export function emptyBundle(): PackBundle {
  return {
    disciplines: [],
    subjects: [],
    topics: [],
    sections: [],
    tags: [],
    lessons: [],
    questions: [],
    treeProblems: {
      disciplines: [],
      subjects: [],
      topics: [],
      sections: [],
      tags: [],
      directories: { disciplines: {}, subjects: {}, topics: {}, sections: {}, tags: {} },
    },
  };
}

/**
 * The line recorded for `path` in a `lines` index, or for its nearest
 * recorded ancestor ("tests[0].stdin", then "tests[0]", then "tests").
 */
export function lookupLine(lines: Record<string, number>, path: string): number | undefined {
  let current = path;
  while (current !== '') {
    if (Object.hasOwn(lines, current)) return lines[current];
    const cut = Math.max(current.lastIndexOf('.'), current.lastIndexOf('['));
    if (cut <= 0) return undefined;
    current = current.slice(0, cut);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// File schemas
// ---------------------------------------------------------------------------

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const Slug = z
  .string()
  .regex(SLUG_PATTERN, 'use only lowercase letters, digits and hyphens, starting with a letter or digit');

/** MDX or plain text that must not be blank. */
const Text = z.string().refine((value) => value.trim() !== '', 'must not be blank');

const Order = z.number().int().positive();

const Names = z.strictObject({ 'pt-BR': Text, 'en-US': Text, es: Text });

// Each `_tree.yaml` entry is validated on its own, with its children as raw
// lists, so one bad entry leaves out only itself.
export const TreeDisciplineSchema = z.strictObject({ slug: Slug, order: Order, names: Names });

export const TreeSubjectSchema = z.strictObject({
  slug: Slug,
  order: Order,
  names: Names,
  topics: z.array(z.unknown()).default([]),
  tags: z.array(z.unknown()).default([]),
});

export const TreeTopicSchema = z.strictObject({
  slug: Slug,
  order: Order,
  names: Names,
  sections: z.array(z.unknown()).default([]),
});

export const TreeSectionSchema = z.strictObject({ slug: Slug, order: Order, names: Names });

export const TreeTagSchema = z.strictObject({ slug: Slug, names: Names, parent: Slug.optional() });

/** Top level of `_tree.yaml`. */
export const TreeFileSchema = z.strictObject({
  discipline: z.unknown(),
  subjects: z.array(z.unknown()).default([]),
});

/** Top level of a lesson file; each block is validated with `LESSON_BLOCK_SCHEMAS`. */
export const LessonFileSchema = z.strictObject({
  slug: Slug,
  title: Text,
  blocks: z.array(z.unknown()).min(1),
});

// Unknown fields inside a variant are mistakes too (a misspelled `runnable` would
// otherwise silently make the snippet read-only).
const PackCodeVariant = z.strictObject(CodeVariant.shape);

export const LESSON_BLOCK_SCHEMAS = {
  text: z.strictObject({ type: z.literal('text'), title: Text.optional(), body: Text }),
  curiosity: z.strictObject({ type: z.literal('curiosity'), title: Text, body: Text }),
  real_world_application: z.strictObject({ type: z.literal('real_world_application'), title: Text, body: Text }),
  solved_exercise: z.strictObject({
    type: z.literal('solved_exercise'),
    title: Text.optional(),
    prompt: Text,
    resolution: Text,
  }),
  simulator: z.strictObject({
    type: z.literal('simulator'),
    simulatorKey: Text,
    simulatorParams: z.record(z.string(), z.unknown()).optional(),
    caption: Text.optional(),
  }),
  code_snippet: z.strictObject({
    type: z.literal('code_snippet'),
    title: Text.optional(),
    caption: Text.optional(),
    variants: z.array(PackCodeVariant).min(1),
  }),
  code_exercise: z.strictObject({
    type: z.literal('code_exercise'),
    kind: z.enum(CODE_KINDS),
    language: z.enum(LANGUAGES),
    title: Text.optional(),
    prompt: Text,
    resolution: Text,
    ...CodeTaskPayload.shape,
  }),
} satisfies Record<LessonBlockType, z.ZodType>;

export type LessonBlockData = { [K in LessonBlockType]: z.output<(typeof LESSON_BLOCK_SCHEMAS)[K]> }[LessonBlockType];

const questionCommon = {
  key: Slug,
  difficulty: z.enum(DIFFICULTIES),
  tags: z.array(Slug).default([]),
  prompt: Text,
  resolution: Text,
};

const ChoiceOption = z.strictObject({ text: Text, correct: z.boolean().default(false) });

function countCorrect(options: { correct: boolean }[]): number {
  return options.filter((option) => option.correct).length;
}

// The rules mirror `validateQuestionInput` in apps/admin/src/worker/routes/questions.ts.
export const QUESTION_SCHEMAS = {
  multiple_choice: z
    .strictObject({ ...questionCommon, type: z.literal('multiple_choice'), options: z.array(ChoiceOption).min(2) })
    .superRefine((question, ctx) => {
      const correct = countCorrect(question.options);
      if (correct !== 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: `a multiple_choice question needs exactly 1 correct option, found ${correct}; use multiple_response for several`,
        });
      }
    }),
  multiple_response: z
    .strictObject({ ...questionCommon, type: z.literal('multiple_response'), options: z.array(ChoiceOption).min(2) })
    .superRefine((question, ctx) => {
      if (countCorrect(question.options) < 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'a multiple_response question needs at least 1 option with correct: true',
        });
      }
    }),
  numeric: z.strictObject({
    ...questionCommon,
    type: z.literal('numeric'),
    // The loader passes a plain YAML number as its source text, so 0.0000001
    // is kept as written instead of becoming "1e-7".
    correctAnswer: z
      .unknown()
      .transform((value, ctx) => {
        if (typeof value === 'string') return value;
        if (typeof value === 'number' && Number.isFinite(value)) return String(value);
        let message = `expected a number, got ${describeValue(value)}`;
        if (value === undefined) message = 'required (expected a number)';
        else if (typeof value === 'number') {
          message = `YAML read .inf or .nan as a non-finite number; wrap it in quotes for a symbolic answer, like "∞"`;
        }
        ctx.addIssue({ code: 'custom', message });
        return z.NEVER;
      })
      .refine(
        (value) => value.trim() !== '' && isValidNumericCorrectAnswer(value),
        'expected a number written with a dot, like 1.5 (not "1,5"), or a symbolic answer without digits, like "∞"',
      ),
  }),
  true_false: z.strictObject({
    ...questionCommon,
    type: z.literal('true_false'),
    correctAnswer: z.union([z.boolean(), z.enum(['true', 'false'])], {
      error: 'expected true or false',
    }),
  }),
  short_text: z.strictObject({
    ...questionCommon,
    type: z.literal('short_text'),
    answerFormat: z.enum(['text', 'math']).default('text'),
    acceptedAnswers: z.array(Text).min(1),
  }),
  ordering: z.strictObject({
    ...questionCommon,
    type: z.literal('ordering'),
    // In the correct order; the site shuffles them.
    items: z.array(Text).min(2),
  }),
  matching: z.strictObject({
    ...questionCommon,
    type: z.literal('matching'),
    pairs: z.array(z.strictObject({ left: Text, right: Text })).min(2),
  }),
  code: z.strictObject({
    ...questionCommon,
    type: z.literal('code'),
    kind: z.enum(CODE_KINDS),
    language: z.enum(LANGUAGES),
    ...CodeTaskPayload.shape,
  }),
} satisfies Record<QuestionType, z.ZodType>;

export type QuestionData = { [K in QuestionType]: z.output<(typeof QUESTION_SCHEMAS)[K]> }[QuestionType];

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const EXPECTED_LABELS: Record<string, string> = {
  string: 'text',
  number: 'a number',
  boolean: 'true or false',
  array: 'a list',
  object: 'a mapping',
  record: 'a mapping',
};

function describeValue(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'a list';
  if (typeof value === 'object') return 'a mapping';
  if (typeof value === 'string') return `the text ${JSON.stringify(value)}`;
  return `${typeof value} ${String(value)}`;
}

// The subset of a raw zod issue the message function reads.
interface RawIssueLike {
  code?: string;
  expected?: string;
  input?: unknown;
  keys?: readonly string[];
  values?: readonly unknown[];
  origin?: string;
  minimum?: number | bigint;
}

/**
 * Error customizer for every pack parse: author-facing wording instead of
 * zod's defaults. Returns undefined to keep the default message.
 */
export function packIssueMessage(issue: RawIssueLike): string | undefined {
  switch (issue.code) {
    case 'invalid_type': {
      const expected = EXPECTED_LABELS[issue.expected ?? ''] ?? issue.expected;
      if (issue.input === undefined) return `required (expected ${expected})`;
      if (issue.expected === 'string' && (typeof issue.input === 'number' || typeof issue.input === 'boolean')) {
        return `expected text, but YAML read ${String(issue.input)} as a ${typeof issue.input}; wrap it in quotes`;
      }
      return `expected ${expected}, got ${describeValue(issue.input)}`;
    }
    case 'invalid_value':
      if (issue.values && issue.values.length === 1) {
        return `expected ${JSON.stringify(issue.values[0])}, got ${describeValue(issue.input)}`;
      }
      return `expected one of ${(issue.values ?? []).map((value) => String(value)).join(', ')}; got ${describeValue(issue.input)}`;
    case 'unrecognized_keys': {
      const keys = (issue.keys ?? []).map((key) => `"${key}"`).join(', ');
      return `unknown field${(issue.keys ?? []).length === 1 ? '' : 's'} ${keys}`;
    }
    case 'too_small':
      if (issue.origin === 'array') {
        return `needs at least ${String(issue.minimum)} item${Number(issue.minimum) === 1 ? '' : 's'}`;
      }
      return undefined;
    default:
      return undefined;
  }
}
