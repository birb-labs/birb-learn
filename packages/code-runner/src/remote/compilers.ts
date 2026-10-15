import type { Language } from '@birb-learn/content-schema';

/** Languages that run on Compiler Explorer. Keep in sync with the `remote` engines in `LANGUAGE_INFO`. */
export type RemoteLanguage = Extract<Language, 'c' | 'cpp' | 'go' | 'java' | 'rust'>;

export interface CompilerExplorerCompiler {
  /** Compiler Explorer compiler id, used in `/api/compiler/<id>/compile`. */
  id: string;
  /** Compiler Explorer language id (`c++`, not `cpp`). */
  lang: string;
  /** Compile flags (`options.userArguments`). */
  flags: string;
}

export const COMPILER_EXPLORER_API = 'https://godbolt.org/api';

// Pinned on 2026-10-13 from
//   GET https://godbolt.org/api/compilers/<lang>?fields=id,name,semver,supportsExecute
// to the newest stable release that reports `supportsExecute: true` (no trunk,
// beta, nightly or tip builds), except Java, which follows the LTS line:
//   c     cg162     x86-64 gcc 16.2
//   c++   g162      x86-64 gcc 16.2
//   go    gl1260    x86-64 gc 1.26.0
//   java  java2500  jdk 25.0.0 (the newest LTS; deliberately not the newer non-LTS 26/27)
//   rust  r1990     rustc 1.99.0
// Re-pin deliberately (and re-record the fixtures) when a newer release is wanted;
// the opt-in network test checks that every id below still exists and can execute.
//
// Java: the executor compiles the source as `example.java`, so a top-level
// `public class Main` is a compile error ("class Main is public, should be
// declared in a file named Main.java"). Declare the class without `public`
// (`class Main { public static void main(String[] args) { ... } }`); the
// executor then finds the class that has `main` on its own. Content authors
// must follow this rule for every Java snippet and exercise.
export const COMPILER_EXPLORER_COMPILERS: Record<RemoteLanguage, CompilerExplorerCompiler> = {
  c: { id: 'cg162', lang: 'c', flags: '-std=c17 -O0 -Wall' },
  cpp: { id: 'g162', lang: 'c++', flags: '-std=c++20 -O0 -Wall' },
  go: { id: 'gl1260', lang: 'go', flags: '' },
  java: { id: 'java2500', lang: 'java', flags: '' },
  rust: { id: 'r1990', lang: 'rust', flags: '--edition 2021 -C opt-level=0' },
};
