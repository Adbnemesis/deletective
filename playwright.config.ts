import { defineConfig, devices } from '@playwright/test';

// Start `npm run build && npm run preview` before running this suite.
// A single worker respects the production room-creation rate limiter.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 12_000 },
  forbidOnly: Boolean(process.env.CI),
  outputDir: 'test-results/browser',
  reporter: [['list'], ['json', { outputFile: 'test-results/playwright-results.json' }], ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8787',
    viewport: { width: 1280, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'chrome', testMatch: /compatibility\.spec\.ts/, use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'firefox', testMatch: /compatibility\.spec\.ts/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: /compatibility\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
  ],
});
