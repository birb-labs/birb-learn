// Type-only deep imports: the code-runner barrel would pull the workers and engines into this graph.
import type { CodeAnswer } from '@birb-learn/code-runner/src/grading';
import type { CodeKind } from '@birb-learn/content-schema/src/code-languages';

/** The string stored in a simulado's answers map for a code question. */
export function serializeCodeAnswer(answer: CodeAnswer): string {
  return JSON.stringify(answer);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Rebuilds the answer field by field, so unknown properties never reach the grader. */
function validate(kind: CodeKind, value: unknown): CodeAnswer | undefined {
  if (!isRecord(value) || value.kind !== kind) return undefined;
  switch (kind) {
    case 'write':
      return typeof value.code === 'string' ? { kind, code: value.code } : undefined;
    case 'predict_output':
      return typeof value.output === 'string' ? { kind, output: value.output } : undefined;
    case 'fill_blank': {
      if (!isRecord(value.blanks)) return undefined;
      const blanks: Record<number, string> = {};
      for (const [id, text] of Object.entries(value.blanks)) {
        if (!/^\d+$/.test(id) || typeof text !== 'string') return undefined;
        blanks[Number(id)] = text;
      }
      return { kind, blanks };
    }
    case 'find_bug':
      return Number.isInteger(value.line) && typeof value.code === 'string'
        ? { kind, line: value.line as number, code: value.code }
        : undefined;
  }
}

/** Reads a stored answer back. Anything missing, malformed or of another kind is `undefined`. */
export function parseCodeAnswer(kind: CodeKind, raw: string | undefined): CodeAnswer | undefined {
  if (raw === undefined) return undefined;
  try {
    return validate(kind, JSON.parse(raw));
  } catch {
    return undefined;
  }
}

/**
 * Whether the student has not really answered yet. A `write` answer is empty
 * while it is still the starter code (hence `starterCode`; the other kinds ignore it).
 */
export function isCodeAnswerEmpty(kind: CodeKind, answer: CodeAnswer, starterCode: string): boolean {
  if (answer.kind !== kind) return true;
  switch (answer.kind) {
    case 'write':
      return answer.code.trim() === starterCode.trim();
    case 'predict_output':
      return answer.output.trim() === '';
    case 'fill_blank':
      return Object.values(answer.blanks).every((text) => text.trim() === '');
    case 'find_bug':
      return answer.line < 1;
  }
}
