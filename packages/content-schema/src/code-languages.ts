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

// The four ways a code task can be posed to the student.
export const CODE_KINDS = ['write', 'predict_output', 'fill_blank', 'find_bug'] as const;

export type CodeKind = (typeof CODE_KINDS)[number];
