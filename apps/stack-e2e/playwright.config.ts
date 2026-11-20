import { defineConfig } from '@playwright/test';

const uiPort = process.env['UI_HOST_PORT'] ?? '36000';

export default defineConfig({
  testDir: './src',
  testMatch: /.*\.spec\.ts$/,
  // One shared stack and one Redis: spec files run serially.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  outputDir: 'test-results',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  globalSetup: require.resolve('./src/support/global-setup'),
  globalTeardown: require.resolve('./src/support/global-teardown'),
  use: {
    baseURL: `http://localhost:${uiPort}`,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
