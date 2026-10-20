// Deep imports: the content-schema barrel also exports the Drizzle queries, which must stay out of the browser bundle.
import { isSqlLanguage, type CodeKind, type Language } from '@birb-learn/content-schema/src/code-languages';
import {
  CodeSnippetPayload,
  CodeTaskPayload,
  findBlankIds,
  type CodeSnippetPayloadData,
  type CodeTaskPayloadData,
} from '@birb-learn/content-schema/src/code-payloads';

export type CodeTaskTests = CodeTaskPayloadData['tests'];

/** A runnable Python hello-world: the payload a brand-new code snippet block starts with. */
export function placeholderSnippet(): CodeSnippetPayloadData {
  return {
    variants: [
      {
        language: 'python',
        code: 'print("Hello, world!")\n',
        annotations: [],
        walkthrough: [],
        runnable: true,
        expectedOutput: 'Hello, world!',
      },
    ],
  };
}

/** One starting test for a task of the given language: a stdout test, or a result-set test for SQL. */
export function placeholderTest(language: Language): CodeTaskTests[number] {
  if (isSqlLanguage(language)) {
    return { sqlSetup: '', expectedRows: { columns: ['column'], rows: [['1']] }, orderMatters: false };
  }
  return { stdin: '', expectedStdout: '' };
}

/** A Python `write` task with one test: the payload a brand-new code exercise or code question starts with. */
export function placeholderTask(): CodeTaskPayloadData {
  return {
    starterCode: 'n = int(input())\n',
    solution: 'n = int(input())\nprint(n * 2)\n',
    tests: [{ name: 'Dobro de 4', stdin: '4\n', expectedStdout: '8\n' }],
    blanks: [],
    hints: [],
  };
}

function parseJson(text: string | null | undefined): unknown {
  if (text === null || text === undefined || text.trim() === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** The stored snippet payload text as typed data, or `null` when it is missing or does not parse. */
export function parseSnippetPayload(text: string | null | undefined): CodeSnippetPayloadData | null {
  const result = CodeSnippetPayload.safeParse(parseJson(text));
  return result.success ? result.data : null;
}

/** The stored task payload text as typed data, or `null` when it is missing or does not parse. */
export function parseTaskPayload(text: string | null | undefined): CodeTaskPayloadData | null {
  const result = CodeTaskPayload.safeParse(parseJson(text));
  return result.success ? result.data : null;
}

/** Keeps the blank for every `___n___` marker in `code`, adds a new one for each new marker and drops the rest. */
export function syncBlanks(code: string, blanks: CodeTaskPayloadData['blanks']): CodeTaskPayloadData['blanks'] {
  return findBlankIds(code).map((id) => blanks.find((blank) => blank.id === id) ?? { id, accepted: [''] });
}

function isSqlTest(test: CodeTaskTests[number]): boolean {
  return 'expectedRows' in test;
}

/**
 * Reshapes a task payload so it carries what `kind` and `language` need and nothing
 * the validators reject there: a `predict_output` task has no tests, tests keep only
 * the shape of the language (stdout or SQL), a `write` task keeps at least one test,
 * and each kind gets its own required field.
 */
export function adaptTaskPayload(payload: CodeTaskPayloadData, kind: CodeKind, language: Language): CodeTaskPayloadData {
  const sql = isSqlLanguage(language);
  let tests = kind === 'predict_output' ? [] : payload.tests.filter((test) => isSqlTest(test) === sql);
  if (kind === 'write' && tests.length === 0) tests = [placeholderTest(language)];

  const { bugLines: _bugLines, ...rest } = payload;
  const adapted: CodeTaskPayloadData = {
    ...rest,
    tests,
    blanks: kind === 'fill_blank' ? syncBlanks(payload.starterCode, payload.blanks) : [],
  };
  if (kind !== 'predict_output') adapted.solution = payload.solution ?? payload.starterCode;
  if (kind === 'predict_output') adapted.expectedOutput = payload.expectedOutput ?? '';
  if (kind === 'find_bug') adapted.bugLines = payload.bugLines ?? '1';
  return adapted;
}
