import { expect, test, type Locator, type Page } from '@playwright/test';

// Drives the real lab page (`/pt-BR/lab/`) the way a student does: pick a
// language, edit the code in CodeMirror, press Run and read the output. The code
// goes through the bundled code runner (Web Workers, runtimes from jsDelivr).

interface LabCase {
  language: string;
  /** The picker's label, which is also in the editor's accessible name. */
  label: string;
  /** Part of the language's template: it proves the editor holds that language's starter code. */
  templateMarker: string;
  /**
   * Prints something only its own engine can produce, and never the output text itself: Python's `+`
   * is not Lua's `..`, `sqlite_version()` exists only in SQLite and `version()` only in PostgreSQL,
   * and `__STDC_VERSION__` (plus an `#error` for C++) only compiles as C. So the output proves which
   * engine ran.
   */
  program: string;
  /** A fragment the source does not contain; a pattern when the output varies (versions). */
  expectedOutput: string | RegExp;
}

const BROWSER_CASES: LabCase[] = [
  {
    language: 'javascript',
    label: 'JavaScript',
    templateMarker: "console.log('Hello, world!')",
    program: "console.log('ran-' + 'javascript');",
    expectedOutput: 'ran-javascript',
  },
  {
    language: 'typescript',
    label: 'TypeScript',
    templateMarker: 'const message: string',
    program: "const name: string = 'typescript'; console.log('ran-' + name);",
    expectedOutput: 'ran-typescript',
  },
  {
    language: 'python',
    label: 'Python',
    templateMarker: 'print("Hello, world!")',
    program: 'print("ran-" + "python")',
    expectedOutput: 'ran-python',
  },
  {
    language: 'lua',
    label: 'Lua',
    templateMarker: 'print("Hello, world!")',
    program: 'print("ran-" .. "lua")',
    expectedOutput: 'ran-lua',
  },
  {
    language: 'ruby',
    label: 'Ruby',
    templateMarker: 'puts "Hello, world!"',
    program: 'puts "ran-" + "ruby"',
    expectedOutput: 'ran-ruby',
  },
  {
    language: 'sqlite',
    label: 'SQLite',
    templateMarker: "SELECT 'Hello, world!' AS greeting;",
    program: "SELECT 'ran-' || sqlite_version() AS engine;",
    expectedOutput: /ran-3\.\d+/,
  },
  {
    language: 'postgresql',
    label: 'PostgreSQL',
    templateMarker: "SELECT 'Hello, world!' AS greeting;",
    program: "SELECT split_part(version(), ' ', 1) AS engine;",
    expectedOutput: 'PostgreSQL',
  },
];

const C_CASE: LabCase = {
  language: 'c',
  label: 'C',
  templateMarker: '#include <stdio.h>',
  program: [
    '#include <stdio.h>',
    '#ifdef __cplusplus',
    '#error compiled as C++',
    '#endif',
    'int main(void) { printf("ran-%ld\\n", (long)__STDC_VERSION__); return 0; }',
  ].join('\n'),
  expectedOutput: /ran-\d{6}/,
};

// The test timeout (120 s per language, see `playwright.config.ts`) bounds the whole test;
// a run that fails shows its verdict at once, so only a hung run waits this long.
const RUN_TIMEOUT_MS = 110000;
const FINISHED_STATUS = /^(ok|compile_error|runtime_error|timeout|output_limit|unavailable)$/;

const languagePicker = (page: Page) => page.getByRole('combobox', { name: 'Linguagem' });
const codeEditor = (page: Page, label: string) => page.getByRole('textbox', { name: `Código em ${label}` });

async function replaceCode(editor: Locator, code: string): Promise<void> {
  await editor.click();
  await editor.press('ControlOrMeta+A');
  await editor.press('Delete');
  await editor.page().keyboard.insertText(code);
}

/** Presses Run, waits for the run to end in whichever way, then requires that it succeeded. */
async function runAndWait(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Executar' }).click();
  const status = page.locator('[data-status]');
  await expect(status).toHaveAttribute('data-status', FINISHED_STATUS, { timeout: RUN_TIMEOUT_MS });
  await expect(status).toHaveAttribute('data-status', 'ok');
}

async function runInLab(page: Page, { language, label, templateMarker, program, expectedOutput }: LabCase): Promise<void> {
  await page.goto('/pt-BR/lab/');
  // The page picks its starting language once it has hydrated; choosing before that would be overridden.
  await expect(codeEditor(page, 'Python')).toBeVisible();
  await languagePicker(page).selectOption(language);
  await expect(languagePicker(page)).toHaveValue(language);

  const editor = codeEditor(page, label);
  await expect(editor).toContainText(templateMarker);

  await replaceCode(editor, program);
  await expect(editor).toContainText(program.split('\n').at(-1) ?? program);
  await runAndWait(page);
  await expect(page.getByRole('group', { name: 'Saída' })).toContainText(expectedOutput);
}

for (const labCase of BROWSER_CASES) {
  test(`runs ${labCase.language} in the lab, in the browser`, async ({ page }) => {
    await runInLab(page, labCase);
  });
}

// The only test that reaches Compiler Explorer, a volunteer-run service: opt in
// with CE_NETWORK_TESTS=1. It also proves the cross-origin request (CORS
// preflight) works from the site's origin.
test('runs C in the lab through Compiler Explorer', async ({ page }) => {
  test.skip(process.env.CE_NETWORK_TESTS !== '1', 'set CE_NETWORK_TESTS=1 to call Compiler Explorer');
  await runInLab(page, C_CASE);
});

test('opens a lesson snippet in the lab with its code', async ({ page }) => {
  await page.goto('/pt-BR/content/computer-science/fundamentos/ola-codigo/');
  const openInLab = page.getByRole('button', { name: 'Abrir no laboratório' });
  // The button is in the static HTML before the page is interactive: press it until the click takes effect.
  await expect(async () => {
    await openInLab.click({ timeout: 2000 });
    await expect(page).toHaveURL(/\/pt-BR\/lab\/#lang=python$/, { timeout: 2000 });
  }).toPass({ timeout: 30000 });

  await expect(languagePicker(page)).toHaveValue('python');
  const editor = codeEditor(page, 'Python');
  await expect(editor).toContainText('nome = "Ana"');
  await expect(editor).toContainText('print("Olá,", nome)');

  await runAndWait(page);
  await expect(page.getByRole('group', { name: 'Saída' })).toContainText('Olá, Ana');
});
