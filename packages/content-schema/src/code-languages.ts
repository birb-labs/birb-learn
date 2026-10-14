// Languages supported by the code lab. The order is the display order in the
// language pickers, so keep it stable.
export const LANGUAGES = [
  'c',
  'cpp',
  'java',
  'javascript',
  'typescript',
  'python',
  'lua',
  'go',
  'rust',
  'ruby',
  'sqlite',
  'mysql',
  'postgresql',
] as const;

export type Language = (typeof LANGUAGES)[number];

// SQL dialects are graded by comparing result sets instead of stdout.
export const SQL_LANGUAGES = ['sqlite', 'mysql', 'postgresql'] as const;

export function isSqlLanguage(language: Language): boolean {
  return (SQL_LANGUAGES as readonly string[]).includes(language);
}

// Languages whose code may be shown but never run. Duplicated in code-runner,
// which asserts the two lists match, because content-schema cannot import it.
export const READ_ONLY_CODE_LANGUAGES = ['mysql'] as const;

export function isReadOnlyCodeLanguage(language: Language): boolean {
  return (READ_ONLY_CODE_LANGUAGES as readonly string[]).includes(language);
}

// The four ways a code task can be posed to the student.
export const CODE_KINDS = ['write', 'predict_output', 'fill_blank', 'find_bug'] as const;

export type CodeKind = (typeof CODE_KINDS)[number];
