// Type-only and deep imports: the code-runner barrel would pull the workers and engines into this graph.
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
import { LANGUAGES, type Language } from '@birb-learn/content-schema/src/code-languages';

const CODE_KEY_PREFIX = 'birb-learn:lab:';
/** Where a lesson snippet leaves the code it wants opened in the lab (session storage, read once). */
const INCOMING_KEY = 'birb-learn:lab:incoming';

/** A snippet handed over from a lesson ("Open in the lab"). */
export interface IncomingLabCode {
  language: Language;
  code: string;
  stdin?: string;
  sqlSetup?: string;
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** The code the student left in `language`, else that language's template. Storage may be unavailable. */
export function loadLabCode(language: Language): string {
  try {
    return localStorage.getItem(`${CODE_KEY_PREFIX}${language}`) ?? LANGUAGE_INFO[language].template;
  } catch {
    return LANGUAGE_INFO[language].template;
  }
}

export function saveLabCode(language: Language, code: string): void {
  try {
    localStorage.setItem(`${CODE_KEY_PREFIX}${language}`, code);
  } catch {
    // Saving is a convenience; storage may be blocked or full.
  }
}

/** Reads and removes the snippet a lesson handed over; anything malformed or of an unknown language is dropped. */
export function takeIncoming(): IncomingLabCode | null {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(INCOMING_KEY);
    if (raw !== null) sessionStorage.removeItem(INCOMING_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const { language, code, stdin, sqlSetup } = parsed as Record<string, unknown>;
  if (!isLanguage(language) || typeof code !== 'string') return null;
  return {
    language,
    code,
    ...(typeof stdin === 'string' ? { stdin } : {}),
    ...(typeof sqlSetup === 'string' ? { sqlSetup } : {}),
  };
}
