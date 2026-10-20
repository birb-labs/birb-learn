import { z } from 'zod';
import { isReadOnlyCodeLanguage, isSqlLanguage, LANGUAGES, type CodeKind, type Language } from './code-languages';

// "3" or "3-5": 1-based, inclusive line numbers.
const LINE_RANGE_PATTERN = /^\d+(-\d+)?$/;

export const LineRange = z.string().regex(LINE_RANGE_PATTERN);

/**
 * Parses a line range such as "3" or "3-5" into inclusive 1-based bounds.
 * Throws on a malformed range, a start below 1, or an end before the start.
 */
export function parseLineRange(range: string): { start: number; end: number } {
  if (!LINE_RANGE_PATTERN.test(range)) {
    throw new Error(`invalid line range "${range}" (expected "3" or "3-5")`);
  }
  const [startText, endText] = range.split('-');
  const start = Number(startText);
  const end = endText === undefined ? start : Number(endText);
  if (start < 1) {
    throw new Error(`invalid line range "${range}" (lines start at 1)`);
  }
  if (end < start) {
    throw new Error(`invalid line range "${range}" (end is before start)`);
  }
  return { start, end };
}

const LineNote = z.object({ lines: LineRange, mdx: z.string().min(1) });

export const CodeVariant = z.object({
  language: z.enum(LANGUAGES),
  code: z.string().min(1),
  annotations: z.array(LineNote).default([]),
  walkthrough: z.array(LineNote).default([]),
  runnable: z.boolean().default(false),
  stdin: z.string().optional(),
  sqlSetup: z.string().optional(),
  expectedOutput: z.string().optional(), // if set, the validator asserts it
});

export const CodeSnippetPayload = z.object({
  variants: z.array(CodeVariant).min(1), // unique languages; the first is the default tab
});

export const IoTest = z.object({
  name: z.string().optional(),
  stdin: z.string().default(''),
  expectedStdout: z.string(),
});

export const SqlTest = z.object({
  name: z.string().optional(),
  sqlSetup: z.string().default(''),
  expectedRows: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string().nullable())),
  }),
  orderMatters: z.boolean().default(false),
});

export const CodeTaskPayload = z.object({
  // write: starter; predict_output: snippet shown; fill_blank: code with ___1___ markers; find_bug: buggy code
  starterCode: z.string(),
  // Full correct code; required for write, fill_blank and find_bug.
  solution: z.string().optional(),
  harness: z
    .object({ prefix: z.string().default(''), suffix: z.string().default('') })
    .optional(),
  // A test is SQL iff it has `expectedRows`; SqlTest goes first so it is never parsed as an IoTest.
  tests: z.array(z.union([SqlTest, IoTest])).default([]),
  expectedOutput: z.string().optional(), // predict_output only (required there)
  blanks: z
    .array(z.object({ id: z.number().int().positive(), accepted: z.array(z.string().min(1)).min(1) }))
    .default([]),
  bugLines: LineRange.optional(), // find_bug only (required there)
  hints: z.array(z.string().min(1)).default([]), // MDX, revealed progressively
});

export type CodeSnippetPayloadData = z.infer<typeof CodeSnippetPayload>;
export type CodeTaskPayloadData = z.infer<typeof CodeTaskPayload>;
export type IoTestData = z.infer<typeof IoTest>;
export type SqlTestData = z.infer<typeof SqlTest>;

const BLANK_MARKER_PATTERN = /___(\d+)___/g;

/** Returns the sorted, unique ids of the `___n___` blank markers in `code`. */
export function findBlankIds(code: string): number[] {
  const ids = new Set<number>();
  for (const match of code.matchAll(BLANK_MARKER_PATTERN)) {
    ids.add(Number(match[1]));
  }
  return [...ids].sort((a, b) => a - b);
}

// A trailing newline does not start a new line.
function countLines(code: string): number {
  const lines = code.split('\n');
  return code.endsWith('\n') && lines.length > 1 ? lines.length - 1 : lines.length;
}

// Returns an error message when `range` is malformed or past the end of the code, else null.
function checkLineRange(path: string, range: string, lineCount: number): string | null {
  try {
    const { end } = parseLineRange(range);
    if (end > lineCount) {
      return `${path}: range "${range}" is past the end of the code (${lineCount} lines)`;
    }
    return null;
  } catch (error) {
    return `${path}: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Cross-field checks for a code snippet. Returns developer-facing error
 * messages, each prefixed with the offending path; empty means valid.
 */
export function validateCodeSnippet(payload: CodeSnippetPayloadData): string[] {
  const errors: string[] = [];
  const seenLanguages = new Set<Language>();

  payload.variants.forEach((variant, variantIndex) => {
    const variantPath = `variants[${variantIndex}]`;

    if (seenLanguages.has(variant.language)) {
      errors.push(`${variantPath}.language: duplicate language "${variant.language}"`);
    }
    seenLanguages.add(variant.language);

    if (variant.runnable && isReadOnlyCodeLanguage(variant.language)) {
      errors.push(`${variantPath}.runnable: ${variant.language} code is read-only`);
    }

    const lineCount = countLines(variant.code);
    for (const field of ['annotations', 'walkthrough'] as const) {
      variant[field].forEach((note, noteIndex) => {
        const error = checkLineRange(`${variantPath}.${field}[${noteIndex}].lines`, note.lines, lineCount);
        if (error) errors.push(error);
      });
    }
  });

  return errors;
}

/**
 * Cross-field checks for a code task of the given kind and language. Returns
 * developer-facing error messages, each prefixed with the offending path;
 * empty means valid.
 */
export function validateCodeTask(kind: CodeKind, language: Language, payload: CodeTaskPayloadData): string[] {
  const errors: string[] = [];

  // predict_output only shows code, so a read-only language is fine there.
  if (kind !== 'predict_output' && isReadOnlyCodeLanguage(language)) {
    errors.push(`language: ${language} code is read-only; use sqlite or postgresql for runnable tasks`);
  }

  switch (kind) {
    case 'write':
      if (payload.solution === undefined) errors.push('solution: required for a write task');
      if (payload.tests.length === 0) errors.push('tests: a write task needs at least 1 test');
      break;

    case 'predict_output':
      if (payload.expectedOutput === undefined) errors.push('expectedOutput: required for a predict_output task');
      if (payload.tests.length > 0) errors.push('tests: must be empty for a predict_output task');
      break;

    case 'fill_blank': {
      if (payload.solution === undefined) errors.push('solution: required for a fill_blank task');
      const markerIds = findBlankIds(payload.starterCode);
      const blankIds = new Set<number>();
      payload.blanks.forEach((blank, index) => {
        if (blankIds.has(blank.id)) {
          errors.push(`blanks[${index}].id: duplicate blank ${blank.id}`);
        }
        blankIds.add(blank.id);
        if (!markerIds.includes(blank.id)) {
          errors.push(`blanks[${index}].id: blank ${blank.id} has no ___${blank.id}___ marker in starterCode`);
        }
      });
      for (const id of markerIds) {
        if (!blankIds.has(id)) {
          errors.push(`blanks: marker ___${id}___ in starterCode has no matching blank ${id}`);
        }
      }
      break;
    }

    case 'find_bug':
      if (payload.bugLines === undefined) {
        errors.push('bugLines: required for a find_bug task');
      } else {
        const error = checkLineRange('bugLines', payload.bugLines, countLines(payload.starterCode));
        if (error) errors.push(error);
      }
      if (payload.solution === undefined) errors.push('solution: required for a find_bug task');
      break;
  }

  // SQL languages use only SqlTest; every other language uses only IoTest.
  const sql = isSqlLanguage(language);
  payload.tests.forEach((test, index) => {
    const isSqlTest = 'expectedRows' in test;
    if (sql && !isSqlTest) {
      errors.push(`tests[${index}]: ${language} tasks need SQL tests (expectedRows), not stdout tests`);
    } else if (!sql && isSqlTest) {
      errors.push(`tests[${index}]: ${language} tasks need stdout tests (expectedStdout), not SQL tests`);
    }
  });

  return errors;
}

// The subset of a zod issue that `formatZodIssues` reads. `errors` is only set
// on `invalid_union` issues: one list of issues per union branch.
interface ZodIssueLike {
  path: readonly PropertyKey[];
  message: string;
  errors?: readonly (readonly ZodIssueLike[])[];
}

// "tests" then 0 then "expectedStdout" becomes "tests[0].expectedStdout".
function formatIssuePath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((text, segment) => {
    if (typeof segment === 'number') return `${text}[${segment}]`;
    return text === '' ? String(segment) : `${text}.${String(segment)}`;
  }, '');
}

function valueAtPath(input: unknown, path: readonly PropertyKey[]): unknown {
  let current = input;
  for (const segment of path) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<PropertyKey, unknown>)[segment];
  }
  return current;
}

// The only union in the payload schemas is `[SqlTest, IoTest]` in `tests`. A
// SQL test is recognised by `expectedRows`; any other object is read as a
// stdout test. Anything else falls back to the branch with the fewest issues.
function pickUnionBranch(branches: readonly (readonly ZodIssueLike[])[], value: unknown): readonly ZodIssueLike[] {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return 'expectedRows' in value ? branches[0] : branches[branches.length - 1];
  }
  return branches.reduce((best, branch) => (branch.length < best.length ? branch : best));
}

/**
 * Turns zod issues into "path: message" lines. A failed `invalid_union` is
 * flattened into the issues of the branch that matches the raw `input`, with
 * the union's own path prefixed, so a stdout test missing its expected output
 * reads `tests[0].expectedStdout: ...` instead of `tests[0]: Invalid input`.
 */
export function formatZodIssues(issues: readonly ZodIssueLike[], input: unknown): string[] {
  return issues.flatMap((issue) => {
    if (issue.errors && issue.errors.length > 0) {
      const branch = pickUnionBranch(issue.errors, valueAtPath(input, issue.path));
      const prefixed = branch.map((sub) => ({ ...sub, path: [...issue.path, ...sub.path] }));
      return formatZodIssues(prefixed, input);
    }
    const path = formatIssuePath(issue.path);
    return [path === '' ? issue.message : `${path}: ${issue.message}`];
  });
}
