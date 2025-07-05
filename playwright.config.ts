import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false, // Disable parallel execution for database tests
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // Use single worker to avoid database conflicts
	globalSetup: './e2e/global-setup.ts',
	use: {
		baseURL: 'http://localhost:5173',
		/* Capture screenshots on failure */
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure'
	},
	timeout: 10 * 1000, // Default timeout for each test
	expect: {
		timeout: 5000 // Maximum time expect() should wait for the condition to be met.
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: [
		{
			// Start frontend dev server
			command: 'NODE_ENV=test bun run dev:force',
			port: 5173,
			reuseExistingServer: false,
			timeout: 30000
		}
	]
});
