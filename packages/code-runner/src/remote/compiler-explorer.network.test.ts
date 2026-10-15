import { describe, expect, it } from 'vitest';
import { COMPILER_EXPLORER_API, COMPILER_EXPLORER_COMPILERS, type RemoteLanguage } from './compilers';
import { createCompilerExplorerRunner } from './compiler-explorer';

// Opt-in: talks to the real Compiler Explorer (a volunteer-run service), so it is
// skipped unless `CE_NETWORK_TESTS=1`. Run it sparingly; it makes about a dozen
// requests, one at a time.

const HELLO: Record<RemoteLanguage, string> = {
  c: '#include <stdio.h>\nint main(void) { printf("Hello, world!\\n"); return 0; }\n',
  cpp: '#include <iostream>\nint main() { std::cout << "Hello, world!" << std::endl; return 0; }\n',
  go: 'package main\nimport "fmt"\nfunc main() { fmt.Println("Hello, world!") }\n',
  java: 'class Main { public static void main(String[] args) { System.out.println("Hello, world!"); } }\n',
  rust: 'fn main() { println!("Hello, world!"); }\n',
};

const ECHO: Record<RemoteLanguage, string> = {
  c: '#include <stdio.h>\nint main(void) { char b[64]; if (fgets(b, 64, stdin)) printf("%s", b); return 0; }\n',
  cpp: '#include <iostream>\n#include <string>\nint main() { std::string s; std::getline(std::cin, s); std::cout << s << "\\n"; return 0; }\n',
  go: 'package main\nimport ("bufio"; "fmt"; "os")\nfunc main() { s, _ := bufio.NewReader(os.Stdin).ReadString(\'\\n\'); fmt.Print(s) }\n',
  java: 'class Main { public static void main(String[] a) { System.out.println(new java.util.Scanner(System.in).nextLine()); } }\n',
  rust: 'fn main() { let mut s = String::new(); std::io::stdin().read_line(&mut s).unwrap(); print!("{}", s); }\n',
};

const LANGUAGES = Object.keys(COMPILER_EXPLORER_COMPILERS) as RemoteLanguage[];

describe.skipIf(!process.env.CE_NETWORK_TESTS)('Compiler Explorer (network)', () => {
  // One runner: its in-flight limit keeps the requests sequential and polite.
  const runner = createCompilerExplorerRunner();

  it.each(LANGUAGES)('runs hello world in %s', async (language) => {
    const result = await runner.runCode({ language, source: HELLO[language] });
    expect(result).toMatchObject({ status: 'ok' });
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: 'Hello, world!\n', exitCode: 0 });
  }, 90000);

  it.each(LANGUAGES)('echoes stdin in %s', async (language) => {
    const result = await runner.runCode({ language, source: ECHO[language], cases: [{ stdin: 'ping\n' }] });
    expect(result.cases[0]).toMatchObject({ status: 'ok', stdout: 'ping\n' });
  }, 90000);

  it('reports a C compile error', async () => {
    const result = await runner.runCode({ language: 'c', source: 'int main(void) { return x; }\n' });
    expect(result.status).toBe('compile_error');
    expect(result.compileOutput).toContain('error');
  }, 90000);

  it('still lists every pinned compiler id', async () => {
    const response = await fetch(`${COMPILER_EXPLORER_API}/compilers?fields=id`, {
      headers: { Accept: 'application/json' },
      credentials: 'omit',
    });
    expect(response.ok).toBe(true);
    const ids = new Set(((await response.json()) as { id: string }[]).map((compiler) => compiler.id));
    for (const { id } of Object.values(COMPILER_EXPLORER_COMPILERS)) expect(ids.has(id)).toBe(true);
  }, 90000);
});
