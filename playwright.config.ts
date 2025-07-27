import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2,
  /* Global setup to seed test data after all servers are ready */
  globalSetup: './tests/e2e/global-setup.ts',

  timeout: 10 * 1000, // Default timeout for each test

  expect: {
    timeout: 5000, // Maximum time expect() should wait for the condition to be met.
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4173',

    /* Capture screenshots on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Capture trace on failure for debugging */
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    // 	name: 'Mobile Safari',
    // 	use: { ...devices['iPhone 12'] }
    // }
  ],

  /* Run complete test environment setup */
  webServer: [
    {
      // Start backend with test database
      command: 'NODE_ENV=test bun run backend:force',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      // Start frontend dev server
      command: 'cd frontend && bun run build && bun run preview',
      port: 4173,
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
