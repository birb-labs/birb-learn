// Reading stored payload text without the schema's refinements. The editors work on typed drafts that are
// often invalid for a moment while the author types (a blank with no accepted answer, `3-` on the way to
// `3-5`, an emptied hint). Such a draft must come back as it was, never be swapped for a placeholder.
// Deep imports: the content-schema barrel also exports the Drizzle queries, which must stay out of the browser bundle.
import { LANGUAGES, type Language } from '@birb-learn/content-schema/src/code-languages';
import {
  CodeSnippetPayload,
  CodeTaskPayload,
  type CodeSnippetPayloadData,
  type CodeTaskPayloadData,
} from '@birb-learn/content-schema/src/code-payloads';

type Obj = Record<string, unknown>;
type Variant = CodeSnippetPayloadData['variants'][number];
type Test = CodeTaskPayloadData['tests'][number];

function isObj(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function textList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function lineNotes(value: unknown): Variant['annotations'] {
  if (!Array.isArray(value)) return [];
  return value.filter(isObj).map((note) => ({ lines: text(note.lines), mdx: text(note.mdx) }));
}

/** Drops the keys whose value is `undefined`, so an absent optional field stays absent. */
function compact<T extends Obj>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function lenientVariant(raw: Obj): Variant {
  const language = LANGUAGES.includes(raw.language as Language) ? (raw.language as Language) : 'python';
  return compact({
    language,
    code: text(raw.code),
    annotations: lineNotes(raw.annotations),
    walkthrough: lineNotes(raw.walkthrough),
    runnable: raw.runnable === true,
    stdin: optionalText(raw.stdin),
    sqlSetup: optionalText(raw.sqlSetup),
    expectedOutput: optionalText(raw.expectedOutput),
  });
}

/** A snippet payload with whatever the stored value holds, or `null` when it has no `variants` list. */
export function lenientSnippet(raw: unknown): CodeSnippetPayloadData | null {
  if (!isObj(raw) || !Array.isArray(raw.variants)) return null;
  return { variants: raw.variants.filter(isObj).map(lenientVariant) };
}

function lenientTest(raw: Obj): Test {
  if (isObj(raw.expectedRows)) {
    const rows = Array.isArray(raw.expectedRows.rows) ? raw.expectedRows.rows : [];
    return compact({
      name: optionalText(raw.name),
      sqlSetup: text(raw.sqlSetup),
      expectedRows: {
        columns: textList(raw.expectedRows.columns),
        rows: rows
          .filter(Array.isArray)
          .map((row: unknown[]) => row.map((cell) => (cell === null ? null : text(cell)))),
      },
      orderMatters: raw.orderMatters === true,
    });
  }
  return compact({ name: optionalText(raw.name), stdin: text(raw.stdin), expectedStdout: text(raw.expectedStdout) });
}

/** A task payload with whatever the stored value holds, or `null` when it is not an object. */
export function lenientTask(raw: unknown): CodeTaskPayloadData | null {
  if (!isObj(raw)) return null;
  return compact({
    starterCode: text(raw.starterCode),
    solution: optionalText(raw.solution),
    harness: isObj(raw.harness) ? { prefix: text(raw.harness.prefix), suffix: text(raw.harness.suffix) } : undefined,
    tests: Array.isArray(raw.tests) ? raw.tests.filter(isObj).map(lenientTest) : [],
    expectedOutput: optionalText(raw.expectedOutput),
    blanks: Array.isArray(raw.blanks)
      ? raw.blanks.filter(isObj).map((blank) => ({ id: typeof blank.id === 'number' ? blank.id : 0, accepted: textList(blank.accepted) }))
      : [],
    bugLines: optionalText(raw.bugLines),
    hints: textList(raw.hints),
  });
}

/** What a stored payload text holds: a typed payload, text that could not be read (kept as is), or nothing. */
export type StoredPayload<P> = { kind: 'typed'; payload: P } | { kind: 'raw'; text: string } | { kind: 'none' };

function readStored<P>(stored: string | null | undefined, strict: (raw: unknown) => P | null, lenient: (raw: unknown) => P | null): StoredPayload<P> {
  if (stored === null || stored === undefined || stored.trim() === '') return { kind: 'none' };
  let raw: unknown;
  try {
    raw = JSON.parse(stored);
  } catch {
    return { kind: 'raw', text: stored };
  }
  const payload = strict(raw) ?? lenient(raw);
  return payload ? { kind: 'typed', payload } : { kind: 'raw', text: stored };
}

export function readStoredSnippet(stored: string | null | undefined): StoredPayload<CodeSnippetPayloadData> {
  return readStored(
    stored,
    (raw) => {
      const result = CodeSnippetPayload.safeParse(raw);
      return result.success ? result.data : null;
    },
    lenientSnippet,
  );
}

export function readStoredTask(stored: string | null | undefined): StoredPayload<CodeTaskPayloadData> {
  return readStored(
    stored,
    (raw) => {
      const result = CodeTaskPayload.safeParse(raw);
      return result.success ? result.data : null;
    },
    lenientTask,
  );
}
