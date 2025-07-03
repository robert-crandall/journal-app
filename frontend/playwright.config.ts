import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: './tests/e2e',
	/* Run tests in files in parallel */
	fullyParallel: true, // Set to false for Docker E2E tests to avoid conflicts
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : 1,
	/* Global setup to seed test data after all servers are ready */
	globalSetup: './tests/e2e/global-setup.ts',

	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: 'http://localhost:4173',

		/* Capture screenshots on failure */
		screenshot: 'only-on-failure',

		/* Record video on failure */
		video: 'retain-on-failure',

		/* Capture trace on failure for debugging */
		trace: 'retain-on-failure'
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
		// Test on a single browser during development
		// {
		// 	name: 'Mobile Safari',
		// 	use: { ...devices['iPhone 12'] }
		// }
	],

	/* Run complete test environment setup */
	webServer: [
		{
			// Run database migrations
			command: 'cd ../backend && NODE_ENV=test bun run test:setup',
			reuseExistingServer: false,
			timeout: 15000
		},
		{
			// Start backend with test database
			command: 'cd ../backend && NODE_ENV=test bun run dev',
			port: 3000,
			reuseExistingServer: !process.env.CI,
			timeout: 30000
		},
		{
			// Start frontend dev server
			command: 'bun run build && bun run preview',
			port: 4173,
			reuseExistingServer: false,
			timeout: 30000
		}
	]
});
