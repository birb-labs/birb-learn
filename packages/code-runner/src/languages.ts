import { LANGUAGES, type Language } from '@birb-learn/content-schema';

export interface LanguageInfo {
  label: string;
  /** `browser` runs in a Web Worker, `remote` goes through the remote runner and `none` is never executed (read-only). */
  engine: 'browser' | 'remote' | 'none';
  isSql: boolean;
  /** Syntax highlighter language id. */
  shikiLang: string;
  /** Default lab code: prints `Hello, world!`. */
  template: string;
}

const SQL_HELLO = "SELECT 'Hello, world!' AS greeting;";

// The editor (CodeMirror) loaders are deliberately not part of this registry:
// they live in `packages/code-ui` so that the runner has no UI dependencies.
export const LANGUAGE_INFO: Record<Language, LanguageInfo> = {
  c: {
    label: 'C',
    engine: 'remote',
    isSql: false,
    shikiLang: 'c',
    template: `#include <stdio.h>

int main(void) {
    printf("Hello, world!\\n");
    return 0;
}
`,
  },
  cpp: {
    label: 'C++',
    engine: 'remote',
    isSql: false,
    shikiLang: 'cpp',
    template: `#include <iostream>

int main() {
    std::cout << "Hello, world!" << std::endl;
    return 0;
}
`,
  },
  java: {
    label: 'Java',
    engine: 'remote',
    isSql: false,
    shikiLang: 'java',
    // Not `public`: Compiler Explorer compiles the source as `example.java`, and a
    // public class must live in a file named after it. Content authors must follow
    // the same rule (see `COMPILER_EXPLORER_COMPILERS`).
    template: `class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}
`,
  },
  javascript: {
    label: 'JavaScript',
    engine: 'browser',
    isSql: false,
    shikiLang: 'javascript',
    template: `console.log('Hello, world!');
`,
  },
  typescript: {
    label: 'TypeScript',
    engine: 'browser',
    isSql: false,
    shikiLang: 'typescript',
    template: `const message: string = 'Hello, world!';
console.log(message);
`,
  },
  python: {
    label: 'Python',
    engine: 'browser',
    isSql: false,
    shikiLang: 'python',
    template: `print("Hello, world!")
`,
  },
  lua: {
    label: 'Lua',
    engine: 'browser',
    isSql: false,
    shikiLang: 'lua',
    template: `print("Hello, world!")
`,
  },
  go: {
    label: 'Go',
    engine: 'remote',
    isSql: false,
    shikiLang: 'go',
    template: `package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}
`,
  },
  rust: {
    label: 'Rust',
    engine: 'remote',
    isSql: false,
    shikiLang: 'rust',
    template: `fn main() {
    println!("Hello, world!");
}
`,
  },
  ruby: {
    label: 'Ruby',
    engine: 'browser',
    isSql: false,
    shikiLang: 'ruby',
    template: `puts "Hello, world!"
`,
  },
  sqlite: { label: 'SQLite', engine: 'browser', isSql: true, shikiLang: 'sql', template: SQL_HELLO },
  mysql: { label: 'MySQL', engine: 'none', isSql: true, shikiLang: 'sql', template: SQL_HELLO },
  postgresql: { label: 'PostgreSQL', engine: 'browser', isSql: true, shikiLang: 'sql', template: SQL_HELLO },
};

export const BROWSER_LANGUAGES: Language[] = LANGUAGES.filter((l) => LANGUAGE_INFO[l].engine === 'browser');
export const REMOTE_LANGUAGES: Language[] = LANGUAGES.filter((l) => LANGUAGE_INFO[l].engine === 'remote');
/** Languages whose code is shown but never executed. */
export const READ_ONLY_LANGUAGES: Language[] = LANGUAGES.filter((l) => LANGUAGE_INFO[l].engine === 'none');
