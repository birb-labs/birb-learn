import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// Browser smoke tests against the static export. Run on demand (not in CI):
//   pnpm --filter site build && pnpm --filter site e2e
// The runtimes download from jsDelivr, so the tests need the network.
export default defineConfig({
  testDir: './e2e',
  // Every engine downloads its runtime on first use.
  timeout: 120000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx serve out -l ${PORT}`,
    url: `http://localhost:${PORT}/pt-BR/lab/`,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
