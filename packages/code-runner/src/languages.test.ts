import { describe, expect, it } from 'vitest';
import { LANGUAGES, SQL_LANGUAGES } from '@birb-learn/content-schema';
import { BROWSER_LANGUAGES, LANGUAGE_INFO, READ_ONLY_LANGUAGES, REMOTE_LANGUAGES } from './languages';
import { clampTimeout, DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS } from './protocol';

describe('LANGUAGE_INFO', () => {
  it('covers exactly the supported languages', () => {
    expect(new Set(Object.keys(LANGUAGE_INFO))).toEqual(new Set(LANGUAGES));
  });

  it('splits engines into browser, remote and none', () => {
    expect([...BROWSER_LANGUAGES].sort()).toEqual(
      ['javascript', 'lua', 'postgresql', 'python', 'ruby', 'sqlite', 'typescript'].sort(),
    );
    expect([...REMOTE_LANGUAGES].sort()).toEqual(['c', 'cpp', 'go', 'java', 'rust'].sort());
    expect(READ_ONLY_LANGUAGES).toEqual(['mysql']);
    expect(LANGUAGE_INFO.mysql.engine).toBe('none');
  });

  it('flags SQL exactly for the SQL languages', () => {
    for (const language of LANGUAGES) {
      expect(LANGUAGE_INFO[language].isSql).toBe((SQL_LANGUAGES as readonly string[]).includes(language));
    }
  });

  it('has the expected labels and highlighter ids', () => {
    expect(LANGUAGES.map((l) => LANGUAGE_INFO[l].label)).toEqual([
      'C', 'C++', 'Java', 'JavaScript', 'TypeScript', 'Python', 'Lua', 'Go', 'Rust', 'Ruby',
      'SQLite', 'MySQL', 'PostgreSQL',
    ]);
    expect(LANGUAGES.map((l) => LANGUAGE_INFO[l].shikiLang)).toEqual([
      'c', 'cpp', 'java', 'javascript', 'typescript', 'python', 'lua', 'go', 'rust', 'ruby',
      'sql', 'sql', 'sql',
    ]);
  });

  it('has a hello world template for every language', () => {
    for (const language of LANGUAGES) {
      const { template, isSql } = LANGUAGE_INFO[language];
      expect(template).toContain('Hello, world!');
      if (isSql) expect(template).toBe("SELECT 'Hello, world!' AS greeting;");
    }
  });
});

describe('clampTimeout', () => {
  it('defaults, clamps and rejects invalid values', () => {
    expect(clampTimeout()).toBe(DEFAULT_TIMEOUT_MS);
    expect(clampTimeout(1000)).toBe(1000);
    expect(clampTimeout(999999)).toBe(MAX_TIMEOUT_MS);
    expect(clampTimeout(0)).toBe(DEFAULT_TIMEOUT_MS);
    expect(clampTimeout(-5)).toBe(DEFAULT_TIMEOUT_MS);
    expect(clampTimeout(Number.NaN)).toBe(DEFAULT_TIMEOUT_MS);
  });
});
