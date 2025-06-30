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
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] }
		}
	],

	/* Run complete test environment setup */
	webServer: [
		{
			// Start test database
			command: 'docker-compose -f ../docker-compose.yml up test-db -d',
			port: 5435,
			reuseExistingServer: !process.env.CI,
			timeout: 30000
		},
		{
			// Run database migrations
			command:
				'cd ../backend && DATABASE_URL=postgresql://test:test@localhost:5435/example_app bun run db:migrate',
			reuseExistingServer: false,
			timeout: 15000
		},
		{
			// Start backend with test database
			command:
				'cd ../backend && DATABASE_URL=postgresql://test:test@localhost:5435/example_app JWT_SECRET=test-secret-at-least-32-chars-long bun run src/index.ts',
			port: 3000,
			reuseExistingServer: !process.env.CI,
			timeout: 30000,
			env: {
				DATABASE_URL: 'postgresql://test:test@localhost:5435/example_app',
				JWT_SECRET: 'test-secret-at-least-32-chars-long',
				FRONTEND_URL: 'http://localhost:4173',
				NODE_ENV: 'test'
			}
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
