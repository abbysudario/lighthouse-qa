import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  globalSetup: './playwright/global-setup.ts',
  retries: process.env.CI ? 1 : 0,
  reporter: [['html'], ['json', { outputFile: 'reports/playwright-results.json' }]],
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
