import {
  CODE_KINDS,
  CodeSnippetPayload,
  CodeTaskPayload,
  LANGUAGES,
  formatZodIssues,
  validateCodeSnippet,
  validateCodeTask,
  type CodeKind,
  type Language,
  type Locale,
} from '@birb-learn/content-schema';

export function isCodeKind(value: unknown): value is CodeKind {
  return typeof value === 'string' && (CODE_KINDS as readonly string[]).includes(value);
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** Validates the structural kind/language pair a code task needs. */
export function validateCodeKindAndLanguage(codeKind: unknown, codeLanguage: unknown): string | null {
  if (!isCodeKind(codeKind)) {
    return `Tarefas de código precisam de um codeKind válido (${CODE_KINDS.join(', ')}).`;
  }
  if (!isLanguage(codeLanguage)) {
    return `Tarefas de código precisam de uma codeLanguage válida (${LANGUAGES.join(', ')}).`;
  }
  return null;
}

function formatPayloadError(locale: Locale, details: string[]): string {
  return `${locale}: payload inválido — ${details.join('; ')}`;
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/**
 * Validates one locale's stored payload text against the snippet schema and
 * its cross-field checks. Returns a pt-BR message prefixed with the locale,
 * or null when valid.
 */
export function validateSnippetPayloadText(locale: Locale, payloadJson: string | null | undefined): string | null {
  if (payloadJson === null || payloadJson === undefined || payloadJson.trim() === '') {
    return `${locale}: o payload do bloco de código é obrigatório.`;
  }
  const parsed = parseJson(payloadJson);
  if (!parsed.ok) return `${locale}: o payload não é um JSON válido.`;

  const result = CodeSnippetPayload.safeParse(parsed.value);
  if (!result.success) {
    return formatPayloadError(
      locale,
      formatZodIssues(result.error.issues, parsed.value),
    );
  }
  const errors = validateCodeSnippet(result.data);
  return errors.length > 0 ? formatPayloadError(locale, errors) : null;
}

/**
 * Validates one locale's task payload text against the task schema and the
 * cross-field checks for `codeKind` / `codeLanguage`. Returns a pt-BR message
 * prefixed with the locale, or null when valid.
 */
export function validateTaskPayloadText(
  locale: Locale,
  codeKind: CodeKind,
  codeLanguage: Language,
  payloadJson: string | null | undefined,
): string | null {
  if (payloadJson === null || payloadJson === undefined || payloadJson.trim() === '') {
    return `${locale}: o payload da tarefa de código é obrigatório.`;
  }
  const parsed = parseJson(payloadJson);
  if (!parsed.ok) return `${locale}: o payload não é um JSON válido.`;

  const result = CodeTaskPayload.safeParse(parsed.value);
  if (!result.success) {
    return formatPayloadError(
      locale,
      formatZodIssues(result.error.issues, parsed.value),
    );
  }
  const errors = validateCodeTask(codeKind, codeLanguage, result.data);
  return errors.length > 0 ? formatPayloadError(locale, errors) : null;
}
