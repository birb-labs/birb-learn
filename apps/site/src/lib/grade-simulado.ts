import { normalizeNumericAnswer } from './numeric-answer';
import { parseSelectedOptionIds } from './multi-response-answer';
import { isTrueFalseAnswerCorrect } from './true-false-answer';
import { isAcceptedShortTextAnswer } from './short-text-answer';
import { isOrderingAnswerCorrect } from './ordering-answer';
import { isMatchingAnswerCorrect } from './matching-answer';
// Deep imports: the code-runner barrel would pull the workers and engines into this graph.
import { gradeCodeTask, type CodeGradeResult } from '@birb-learn/code-runner/src/grading';
import type { Runner, UnavailableReason } from '@birb-learn/code-runner/src/protocol';
import { readCodeAnswer } from './code-question-answer';
import { lazySiteRunner } from './lazy-site-runner';
import type { ExportedQuestion } from './simulado-selection';

export type QuestionVerdict = 'correct' | 'incorrect' | 'not_graded';

export interface GradedQuestionResult {
  question: ExportedQuestion;
  userAnswer: string | undefined;
  /** Always `verdict === 'correct'`; a `not_graded` question counts as not correct. */
  isCorrect: boolean;
  /** `not_graded` only for a code question whose tests could not run. */
  verdict: QuestionVerdict;
  /** Code questions only: the grader's details. Absent when the answer was empty (nothing was checked). */
  code?: CodeGradeResult;
  /** Why a `not_graded` question could not be graded, and how long to wait before a retry can succeed. */
  notGraded?: { reason: UnavailableReason; retryAfterMs?: number };
}

/** The verdict of a graded question; attempts stored before verdicts existed only have `isCorrect`. */
export function verdictOf(entry: GradedQuestionResult): QuestionVerdict {
  return entry.verdict ?? (entry.isCorrect ? 'correct' : 'incorrect');
}

export interface GradedResult {
  correctCount: number;
  total: number;
  perQuestion: GradedQuestionResult[];
}

async function isAnswerCorrect(
  question: ExportedQuestion,
  userAnswer: string | undefined,
  locale: string,
): Promise<boolean> {
  if (userAnswer === undefined) return false;

  if (question.type === 'code') {
    throw new Error('Code questions are graded by gradeCodeQuestion');
  }

  if (question.type === 'multiple_choice') {
    const selected = question.options.find((option) => String(option.id) === userAnswer);
    return selected?.isCorrect ?? false;
  }

  if (question.type === 'multiple_response') {
    const selectedIds = new Set(parseSelectedOptionIds(userAnswer));
    const correctIds = question.options.filter((option) => option.isCorrect).map((option) => option.id);
    // All-or-nothing: the selected set must match the correct set exactly.
    return selectedIds.size === correctIds.length && correctIds.every((id) => selectedIds.has(id));
  }

  if (question.type === 'true_false') {
    return question.correctAnswer !== null && isTrueFalseAnswerCorrect(userAnswer, question.correctAnswer);
  }

  if (question.type === 'short_text') {
    return isAcceptedShortTextAnswer(
      userAnswer,
      question.acceptedAnswers.map((answer) => answer.text),
      question.answerFormat,
    );
  }

  if (question.type === 'ordering') {
    return isOrderingAnswerCorrect(userAnswer, question.options);
  }

  if (question.type === 'matching') {
    return isMatchingAnswerCorrect(userAnswer, question.matchingPairs);
  }

  if (question.type === 'numeric') {
    if (question.correctAnswer === null) return false;

    // `question.correctAnswer` is already stored in canonical form (dot-decimal, no
    // thousands separators) — it is authored data, not locale-formatted user input. It must
    // NOT be run back through `normalizeNumericAnswer(_, locale)`: for a locale whose group
    // separator is "." (e.g. pt-BR), doing so would misinterpret the canonical decimal dot
    // as a thousands separator and strip it (turning "1.5" into "15"). Only the user's own
    // typed answer needs locale-aware normalization to convert it into canonical form.
    const normalizedUser = normalizeNumericAnswer(userAnswer, locale);
    if (normalizedUser === '') return false;

    const canonicalCorrect = question.correctAnswer.trim().toLowerCase();
    if (normalizedUser === canonicalCorrect) return true;

    // Normalization converts locale formatting (decimal/group separators) but does not
    // canonicalize numeric value (e.g. "1.0" vs "1" stay distinct strings). Fall back to
    // exact numeric equality (no tolerance/epsilon) so equivalent values still match; this
    // only applies when both sides actually parse as numbers, so symbolic answers (e.g.
    // "não existe", "∞") still rely purely on the string comparison above. Note: a blank
    // answer is rejected above, since Number('') is 0, not NaN, and would otherwise match
    // a correctAnswer of "0".
    const userValue = Number(normalizedUser);
    const correctValue = Number(canonicalCorrect);
    if (Number.isNaN(userValue) || Number.isNaN(correctValue)) return false;
    return userValue === correctValue;
  }

  // Exhaustiveness check: if a future question type is added to
  // `ExportedQuestion['type']` without a corresponding branch above, this
  // assignment fails to typecheck (rather than silently falling through and
  // being graded as if it were numeric).
  const exhaustiveCheck: never = question.type;
  throw new Error(`Unhandled question type in isAnswerCorrect: ${exhaustiveCheck}`);
}

export interface GradeOptions {
  /** Runs the code questions' tests; defaults to the shared site runner, found on first run. */
  runner?: Runner;
  /** Reports how many code questions are graded so far, out of how many. */
  onProgress?: (done: number, total: number) => void;
  /** Aborts the runs in flight; grading then rejects. */
  signal?: AbortSignal;
}

function verdictResult(question: ExportedQuestion, userAnswer: string | undefined, verdict: QuestionVerdict): GradedQuestionResult {
  return { question, userAnswer, isCorrect: verdict === 'correct', verdict };
}

async function gradeCodeQuestion(
  question: ExportedQuestion,
  userAnswer: string | undefined,
  runner: Runner,
  signal: AbortSignal | undefined,
): Promise<GradedQuestionResult> {
  const task = question.code;
  if (!task) throw new Error(`Question ${question.id}: a code question needs its code task`);
  const answer = readCodeAnswer(task, userAnswer);
  if (answer === undefined) return verdictResult(question, userAnswer, 'incorrect');

  // The grader reports only that the tests could not run; the reason is read off the runner's own results.
  let unavailable: { reason: UnavailableReason; retryAfterMs?: number } | undefined;
  const observingRunner: Runner = {
    async runCode(request, options) {
      const run = await runner.runCode(request, options);
      if (run.status === 'unavailable' && unavailable === undefined) {
        unavailable = { reason: run.reason ?? 'service_error' };
        if (run.retryAfterMs !== undefined) unavailable.retryAfterMs = run.retryAfterMs;
      }
      return run;
    },
  };

  let code: CodeGradeResult;
  try {
    code = await gradeCodeTask(task.kind, task.language, task.payload, answer, observingRunner, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    // The runner contract is to resolve; a rejection is a bug on its side, shown as a failed service.
    code = { verdict: 'not_graded', tests: [] };
    unavailable = { reason: 'service_error' };
  }
  signal?.throwIfAborted();

  const graded: GradedQuestionResult = { ...verdictResult(question, userAnswer, code.verdict), code };
  if (code.verdict === 'not_graded') graded.notGraded = unavailable ?? { reason: 'service_error' };
  return graded;
}

/**
 * Grades the code questions at `indexes`, one at a time (they share one runner,
 * and a remote one is rate-limited), writing each result back into `perQuestion`.
 */
async function gradeCodeQuestionsInOrder(
  perQuestion: GradedQuestionResult[],
  indexes: number[],
  answers: Record<number, string>,
  options: GradeOptions,
): Promise<void> {
  if (indexes.length === 0) return;
  const runner = options.runner ?? lazySiteRunner;
  options.onProgress?.(0, indexes.length);
  for (const [done, index] of indexes.entries()) {
    options.signal?.throwIfAborted();
    const question = perQuestion[index].question;
    perQuestion[index] = await gradeCodeQuestion(question, answers[question.id], runner, options.signal);
    options.onProgress?.(done + 1, indexes.length);
  }
}

function summarize(perQuestion: GradedQuestionResult[]): GradedResult {
  return {
    correctCount: perQuestion.filter((result) => result.isCorrect).length,
    total: perQuestion.length,
    perQuestion,
  };
}

/**
 * Grades a finished simulado. Every non-code question is graded first; then the
 * code questions run their tests sequentially. A code question whose tests could
 * not run is `not_graded`, not wrong (see `regradeNotGraded`).
 */
export async function gradeSimulado(
  questions: ExportedQuestion[],
  answers: Record<number, string>,
  locale: string,
  options: GradeOptions = {},
): Promise<GradedResult> {
  const perQuestion = await Promise.all(
    questions.map(async (question): Promise<GradedQuestionResult> => {
      const userAnswer = answers[question.id];
      // Placeholder until the code pass below grades it.
      if (question.type === 'code') return verdictResult(question, userAnswer, 'incorrect');
      return verdictResult(question, userAnswer, (await isAnswerCorrect(question, userAnswer, locale)) ? 'correct' : 'incorrect');
    }),
  );

  const codeIndexes = questions.flatMap((question, index) => (question.type === 'code' ? [index] : []));
  await gradeCodeQuestionsInOrder(perQuestion, codeIndexes, answers, options);
  return summarize(perQuestion);
}

/**
 * Grades again only the `not_graded` questions of `result` (sequentially, like
 * `gradeSimulado`) and recomputes `correctCount`. `result` itself is left unchanged.
 * Only code questions are ever not_graded, so the locale (which only the other
 * types need) goes unused; it keeps the signature in line with `gradeSimulado`.
 */
export async function regradeNotGraded(
  result: GradedResult,
  answers: Record<number, string>,
  _locale: string,
  options: GradeOptions = {},
): Promise<GradedResult> {
  const perQuestion = [...result.perQuestion];
  const notGradedIndexes = perQuestion.flatMap((entry, index) =>
    verdictOf(entry) === 'not_graded' && entry.question.type === 'code' ? [index] : [],
  );
  await gradeCodeQuestionsInOrder(perQuestion, notGradedIndexes, answers, options);
  return summarize(perQuestion);
}
