// Deep imports: the content-schema barrel also exports the Drizzle queries, which must stay out of the browser bundle.
import type { CodeKind, Language } from '@birb-learn/content-schema/src/code-languages';
import {
  CodeSnippetPayload,
  CodeTaskPayload,
  formatZodIssues,
  validateCodeSnippet,
  validateCodeTask,
  type CodeSnippetPayloadData,
  type CodeTaskPayloadData,
} from '@birb-learn/content-schema/src/code-payloads';

/** A payload that passed, with the schema defaults applied; or the "path: message" lines that say what is wrong. */
export type Checked<P> = { ok: true; data: P } | { ok: false; problems: string[] };

/** The same checks the server runs on a snippet payload: the schema, then the cross-field rules. */
export function checkSnippet(payload: unknown): Checked<CodeSnippetPayloadData> {
  const parsed = CodeSnippetPayload.safeParse(payload);
  if (!parsed.success) return { ok: false, problems: formatZodIssues(parsed.error.issues, payload) };
  const problems = validateCodeSnippet(parsed.data);
  return problems.length > 0 ? { ok: false, problems } : { ok: true, data: parsed.data };
}

/** The same checks the server runs on a task payload of the given kind and language. */
export function checkTask(kind: CodeKind, language: Language, payload: unknown): Checked<CodeTaskPayloadData> {
  const parsed = CodeTaskPayload.safeParse(payload);
  if (!parsed.success) return { ok: false, problems: formatZodIssues(parsed.error.issues, payload) };
  const problems = validateCodeTask(kind, language, parsed.data);
  return problems.length > 0 ? { ok: false, problems } : { ok: true, data: parsed.data };
}
