import { isCodeAnswerEmpty, parseCodeAnswer } from '@birb-learn/code-ui';
// Type-only deep import: the code-runner barrel would pull the workers and engines into this graph.
import type { CodeAnswer } from '@birb-learn/code-runner/src/grading';
import type { ExportedCodeTask } from './export-question';

/**
 * The student's answer to a code question, read from the simulado's answers
 * map: `undefined` when it is missing, malformed, of another kind or still
 * empty (an untouched `write` answer is the starter code), so the question
 * counts as unanswered and grades as incorrect without running anything.
 */
export function readCodeAnswer(task: ExportedCodeTask, raw: string | undefined): CodeAnswer | undefined {
  const answer = parseCodeAnswer(task.kind, raw);
  if (answer === undefined || isCodeAnswerEmpty(task.kind, answer, task.payload.starterCode)) return undefined;
  return answer;
}
