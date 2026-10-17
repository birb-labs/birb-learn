import { expect, test, type Page } from '@playwright/test';

// Runs the hello world template of each language on the temporary lab page,
// through the bundled code runner (Web Workers, runtimes from jsDelivr).
const BROWSER_LANGUAGES = ['javascript', 'typescript', 'python', 'lua', 'ruby', 'sqlite', 'postgresql'] as const;

// The test timeout (120 s per language, see `playwright.config.ts`) bounds the run.
const RUN_TIMEOUT_MS = 120000;

async function runTemplate(page: Page, language: string): Promise<void> {
  await page.goto('/pt-BR/lab/');
  await page.getByTestId('lab-language').selectOption(language);
  await page.getByTestId('lab-run').click();
  await expect(page.getByTestId('lab-status')).toHaveText('done', { timeout: RUN_TIMEOUT_MS });
}

for (const language of BROWSER_LANGUAGES) {
  test(`runs ${language} hello world in the browser`, async ({ page }) => {
    await runTemplate(page, language);
    const output = page.getByTestId('lab-output');
    await expect(output).toContainText('[ok]');
    await expect(output).toContainText('Hello, world!');
  });
}

// The only test that reaches Compiler Explorer, a volunteer-run service: opt in
// with CE_NETWORK_TESTS=1. It also proves the cross-origin request (CORS
// preflight) works from the site's origin.
test('runs C hello world through Compiler Explorer', async ({ page }) => {
  test.skip(process.env.CE_NETWORK_TESTS !== '1', 'set CE_NETWORK_TESTS=1 to call Compiler Explorer');
  await runTemplate(page, 'c');
  const output = page.getByTestId('lab-output');
  await expect(output).toContainText('[ok]');
  await expect(output).toContainText('Hello, world!');
});
