import { renderToStaticMarkup } from 'react-dom/server';
import {
  CodeTaskPayload,
  validateCodeTask,
  type CodeKind,
  type CodeTaskPayloadData,
  type Language,
  type QuestionExport,
} from '@birb-learn/content-schema';
// The highlight entry, not the root: the root also carries React components that import CSS, which the export script cannot load.
import { highlightCode, type HighlightedLine } from '@birb-learn/code-ui/highlight';
import { compileLessonMdx } from './compile-lesson-mdx';

export interface ExportedOption {
  id: number;
  textHtml: string;
  isCorrect: boolean;
}

export interface ExportedAcceptedAnswer {
  id: number;
  text: string;
}

export interface ExportedMatchingPair {
  id: number;
  leftHtml: string;
  rightHtml: string;
}

/** What a `code` question ships to the client. The tests ship too: grading runs in the browser (spec §9.3). */
export interface ExportedCodeTask {
  kind: CodeKind;
  language: Language;
  payload: CodeTaskPayloadData;
  /** `payload.starterCode`, highlighted at build time. */
  starterTokens: HighlightedLine[];
  /** `payload.solution`, highlighted at build time; empty when the task has no solution (predict_output). */
  solutionTokens: HighlightedLine[];
}

export interface ExportedQuestion {
  id: number;
  type:
    | 'multiple_choice'
    | 'multiple_response'
    | 'numeric'
    | 'true_false'
    | 'short_text'
    | 'ordering'
    | 'matching'
    | 'code';
  difficulty: 'easy' | 'medium' | 'hard';
  promptHtml: string;
  options: ExportedOption[];
  acceptedAnswers: ExportedAcceptedAnswer[];
  matchingPairs: ExportedMatchingPair[];
  correctAnswer: string | null;
  answerFormat: 'text' | 'math';
  isFallback: boolean;
  resolutionHtml: string;
  tagIds: number[];
  /** Set for `code` questions only. */
  code: ExportedCodeTask | null;
}

async function compileToHtml(source: string): Promise<string> {
  const element = await compileLessonMdx(source);
  return renderToStaticMarkup(element);
}

export { isValidNumericCorrectAnswer, assertValidNumericCorrectAnswer } from '@birb-learn/content-schema';

/**
 * Throws a descriptive error if a short_text question has no accepted
 * answers, so a build fails loudly instead of shipping a question that can
 * never be marked correct (mirrors `assertValidNumericCorrectAnswer`).
 */
export function assertValidShortTextAnswer(question: { id: number; acceptedAnswers: unknown[] }): void {
  if (question.acceptedAnswers.length < 1) {
    throw new Error(
      `Question ${question.id}: short_text questions must have at least 1 accepted answer, ` +
        `otherwise they can never be answered correctly.`,
    );
  }
}

/**
 * Throws a descriptive error if a matching question has fewer than 2 pairs,
 * so a build fails loudly instead of shipping an unanswerable question
 * (mirrors `assertValidNumericCorrectAnswer`).
 */
export function assertValidMatchingPairs(question: { id: number; matchingPairs: unknown[] }): void {
  if (question.matchingPairs.length < 2) {
    throw new Error(
      `Question ${question.id}: matching questions must have at least 2 pairs, ` +
        `otherwise they are unanswerable.`,
    );
  }
}

/**
 * Reads the code task of a `code` question: its kind, language and payload,
 * parsed with the schema's defaults and checked by `validateCodeTask`. Throws
 * `Question <id>: <first error>`, so a build fails loudly instead of shipping
 * a task that cannot be answered or graded.
 */
export function parseCodeQuestion(
  question: Pick<QuestionExport, 'id' | 'codeKind' | 'codeLanguage' | 'codeJson'>,
): { kind: CodeKind; language: Language; payload: CodeTaskPayloadData } {
  const fail = (reason: string): never => {
    throw new Error(`Question ${question.id}: ${reason}`);
  };

  const { codeKind: kind, codeLanguage: language, codeJson } = question;
  if (kind === null || language === null) return fail('codeKind and codeLanguage are required for a code question');
  if (codeJson === null) return fail('codeJson is required for a code question');

  let raw: unknown;
  try {
    raw = JSON.parse(codeJson);
  } catch (error) {
    return fail(`malformed codeJson (${error instanceof Error ? error.message : String(error)})`);
  }
  const parsed = CodeTaskPayload.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue ? `${issue.path.join('.') || 'codeJson'}: ${issue.message}` : 'codeJson: schema validation failed');
  }
  const [firstError] = validateCodeTask(kind, language, parsed.data);
  if (firstError) return fail(firstError);
  return { kind, language, payload: parsed.data };
}

async function exportCodeTask(question: QuestionExport): Promise<ExportedCodeTask> {
  const { kind, language, payload } = parseCodeQuestion(question);
  const [starterTokens, solutionTokens] = await Promise.all([
    highlightCode(payload.starterCode, language),
    payload.solution === undefined ? [] : highlightCode(payload.solution, language),
  ]);
  return { kind, language, payload, starterTokens, solutionTokens };
}

export async function compileQuestionForExport(question: QuestionExport): Promise<ExportedQuestion> {
  const promptHtml = await compileToHtml(question.promptMdx);
  const resolutionHtml = await compileToHtml(question.resolutionMdx);

  // Only multiple_choice/multiple_response/ordering questions ever have
  // option rows (enforced by the admin route's validation) — checking
  // length directly, rather than listing those three type names again
  // here, means this guard never needs updating when a future type is
  // added unless it too stores its content in `options`.
  const options: ExportedOption[] =
    question.options.length > 0
      ? await Promise.all(
          question.options.map(async (option) => ({
            id: option.id,
            textHtml: await compileToHtml(option.textMdx),
            isCorrect: option.isCorrect,
          })),
        )
      : [];

  const acceptedAnswers: ExportedAcceptedAnswer[] = question.acceptedAnswers.map((answer) => ({
    id: answer.id,
    text: answer.text,
  }));

  const matchingPairs: ExportedMatchingPair[] = await Promise.all(
    question.matchingPairs.map(async (pair) => ({
      id: pair.id,
      leftHtml: await compileToHtml(pair.leftMdx),
      rightHtml: await compileToHtml(pair.rightMdx),
    })),
  );

  return {
    id: question.id,
    type: question.type,
    difficulty: question.difficulty,
    promptHtml,
    options,
    acceptedAnswers,
    matchingPairs,
    correctAnswer: question.correctAnswer,
    answerFormat: question.answerFormat,
    isFallback: question.isFallback,
    resolutionHtml,
    tagIds: question.tagIds,
    code: question.type === 'code' ? await exportCodeTask(question) : null,
  };
}
