import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
	// Shared user for all tests in this suite
	let testUser;

	test.beforeAll(async ({ browser }) => {
		// Create a user once for all tests
		const context = await browser.newContext();
		const page = await context.newPage();

		testUser = {
			email: `dashboard-test-${Date.now()}@example.com`,
			password: 'dashboardtest123',
			name: `Dashboard User ${Date.now()}`
		};

		// Register the user
		await page.goto('/register');
		await page.fill('input[name="name"]', testUser.name);
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="password"]', testUser.password);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');

		await context.close();
	});

	// Helper function to login the existing user
	async function loginUser(page) {
		await page.goto('/login');
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="password"]', testUser.password);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');
		return testUser;
	}

	test('should display dashboard with user information', async ({ page }) => {
		const user = await loginUser(page);

		// Verify dashboard content
		await expect(page.locator('h1')).toContainText('Welcome back!');
		await expect(page.locator('p').filter({ hasText: 'Hello, ' + user.name })).toBeVisible();
	});

	test('should have working navigation', async ({ page }) => {
		await loginUser(page);

		// Check navbar
		await expect(page.getByRole('link', { name: 'Example App' })).toBeVisible();

		// Click on brand link should stay on dashboard
		await page.click('a[href="/dashboard"]');
		await expect(page).toHaveURL('/dashboard');
	});

	test('should display user dropdown menu', async ({ page }) => {
		const user = await loginUser(page);

		// Click on avatar to open dropdown
		await page.click('[data-testid="user-avatar-button"]');

		// Check dropdown content
		await expect(page.locator('li.menu-title').filter({ hasText: user.name })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

		// Check logout form is present
		const logoutButton = page.locator('form[action="/logout"] button[type="submit"]');
		await expect(logoutButton).toBeVisible();
		await expect(logoutButton).toContainText('Logout');
	});

	test('should logout from dropdown menu', async ({ page }) => {
		await loginUser(page);

		// Open dropdown and logout
		await page.click('[data-testid="user-avatar-button"]');
		await page.click('button[type="submit"]'); // Logout button

		// Should redirect to home page
		await expect(page).toHaveURL('/');

		// Verify we're logged out by trying to access dashboard
		await page.goto('/dashboard');
		await expect(page).toHaveURL('/login');
	});

	test('should preserve session on page reload', async ({ page }) => {
		const user = await loginUser(page);

		// Reload the page
		await page.reload();

		// Should still be on dashboard and show user info
		await expect(page).toHaveURL('/dashboard');
		await expect(page.locator('p').filter({ hasText: 'Hello, ' + user.name })).toBeVisible();
	});

	test('should handle navigation between dashboard and other pages', async ({ page }) => {
		await loginUser(page);

		// Navigate to home page
		await page.goto('/');
		// Home page should probably redirect logged-in users to dashboard or show different content
		// For now, just verify we can navigate

		// Go back to dashboard
		await page.goto('/dashboard');
		await expect(page).toHaveURL('/dashboard');
		await expect(page.locator('h1')).toContainText('Welcome back!');
	});
});
