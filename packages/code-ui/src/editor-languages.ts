// Type-only deep import: the content-schema barrel would pull Drizzle into browser bundles.
import type { Language } from '@birb-learn/content-schema/src/code-languages';
import type { Extension } from '@codemirror/state';

// Every grammar is imported on demand, so the editor only downloads the
// language the student is actually looking at.
const LOADERS: Record<Language, () => Promise<Extension>> = {
  javascript: async () => (await import('@codemirror/lang-javascript')).javascript(),
  typescript: async () => (await import('@codemirror/lang-javascript')).javascript({ typescript: true }),
  python: async () => (await import('@codemirror/lang-python')).python(),
  c: async () => (await import('@codemirror/lang-cpp')).cpp(),
  cpp: async () => (await import('@codemirror/lang-cpp')).cpp(),
  java: async () => (await import('@codemirror/lang-java')).java(),
  rust: async () => (await import('@codemirror/lang-rust')).rust(),
  go: async () => (await import('@codemirror/lang-go')).go(),
  sqlite: async () => {
    const { sql, SQLite } = await import('@codemirror/lang-sql');
    return sql({ dialect: SQLite });
  },
  mysql: async () => {
    const { sql, MySQL } = await import('@codemirror/lang-sql');
    return sql({ dialect: MySQL });
  },
  postgresql: async () => {
    const { sql, PostgreSQL } = await import('@codemirror/lang-sql');
    return sql({ dialect: PostgreSQL });
  },
  lua: async () => {
    const [{ StreamLanguage }, { lua }] = await Promise.all([import('@codemirror/language'), import('@codemirror/legacy-modes/mode/lua')]);
    return StreamLanguage.define(lua);
  },
  ruby: async () => {
    const [{ StreamLanguage }, { ruby }] = await Promise.all([import('@codemirror/language'), import('@codemirror/legacy-modes/mode/ruby')]);
    return StreamLanguage.define(ruby);
  },
};

/** Loads the CodeMirror syntax support for `language`. */
export function editorLanguageExtension(language: Language): Promise<Extension> {
  return LOADERS[language]();
}
