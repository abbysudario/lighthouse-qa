import { defineConfig } from '@playwright/test';

const signalMode = process.env.SIGNAL_MODE === 'true';

export default defineConfig({
  testDir: './playwright/tests',
  globalSetup: './playwright/global-setup.ts',
  retries: process.env.CI === 'true' && !process.env.DOCKER ? 1 : 0,
  grep: signalMode ? undefined : /^(?!.*Signal Generation)/,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'reports/playwright-results.json' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
  ],
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});