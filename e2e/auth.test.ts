import { test, expect } from '@playwright/test';

test.describe('Authentication UI', () => {
	test('should redirect unauthenticated users from dashboard', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL('/login');
	});
});

test.describe('Authentication Flow', () => {
	const testUser = {
		email: `test-${Date.now()}@example.com`,
		password: 'testpassword123',
		name: 'Test User'
	};

	test('should register a new user successfully', async ({ page }) => {
		await page.goto('/register');

		// Fill out the registration form
		await page.fill('input[name="name"]', testUser.name);
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="password"]', testUser.password);

		// Submit the form
		await page.click('button[type="submit"]');

		// Should redirect to dashboard
		await expect(page).toHaveURL('/dashboard');

		// Should display user information
		await expect(page.locator('h1')).toContainText('Welcome back!');
		await expect(page.locator('p').filter({ hasText: 'Hello, ' + testUser.name })).toBeVisible();
	});

	test('should show error for duplicate email registration', async ({ page }) => {
		// First, register a user
		const duplicateEmail = `duplicate-${Date.now()}@example.com`;
		await page.goto('/register');
		await page.fill('input[name="name"]', 'First User');
		await page.fill('input[name="email"]', duplicateEmail);
		await page.fill('input[name="password"]', 'password123');
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');

		// Logout
		await page.click('[data-testid="user-avatar-button"]'); // Avatar button
		await page.click('button[type="submit"]'); // Logout button
		await expect(page).toHaveURL('/');

		// Try to register with same email
		await page.goto('/register');
		await page.fill('input[name="name"]', 'Second User');
		await page.fill('input[name="email"]', duplicateEmail);
		await page.fill('input[name="password"]', 'password123');
		await page.click('button[type="submit"]');

		// Should show error and stay on registration page
		await expect(page).toHaveURL('/register');
		await expect(page.locator('.alert-error')).toContainText(
			'An account with this email already exists'
		);
	});

	test('should login existing user successfully', async ({ page }) => {
		// First register a user
		const loginUser = {
			email: `login-test-${Date.now()}@example.com`,
			password: 'loginpassword123',
			name: 'Login Test User'
		};

		await page.goto('/register');
		await page.fill('input[name="name"]', loginUser.name);
		await page.fill('input[name="email"]', loginUser.email);
		await page.fill('input[name="password"]', loginUser.password);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');

		// Logout
		await page.click('[data-testid="user-avatar-button"]'); // Avatar button
		await page.click('button[type="submit"]'); // Logout button
		await expect(page).toHaveURL('/');

		// Now test login
		await page.goto('/login');
		await page.fill('input[name="email"]', loginUser.email);
		await page.fill('input[name="password"]', loginUser.password);
		await page.click('button[type="submit"]');

		// Should redirect to dashboard
		await expect(page).toHaveURL('/dashboard');
		await expect(page.locator('p').filter({ hasText: 'Hello, ' + loginUser.name })).toBeVisible();
	});

	test('should show error for invalid login credentials', async ({ page }) => {
		await page.goto('/login');

		// Test with non-existent email
		await page.fill('input[name="email"]', 'nonexistent@example.com');
		await page.fill('input[name="password"]', 'wrongpassword');
		await page.click('button[type="submit"]');

		await expect(page).toHaveURL('/login');
		await expect(page.locator('.alert-error')).toContainText('Invalid email or password');

		// Test with existing email but wrong password
		// First register a user
		const testEmail = `wrong-password-${Date.now()}@example.com`;
		await page.goto('/register');
		await page.fill('input[name="name"]', 'Test User');
		await page.fill('input[name="email"]', testEmail);
		await page.fill('input[name="password"]', 'correctpassword');
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');

		// Logout
		await page.click('[data-testid="user-avatar-button"]');
		await page.click('button[type="submit"]');

		// Try login with wrong password
		await page.goto('/login');
		await page.fill('input[name="email"]', testEmail);
		await page.fill('input[name="password"]', 'wrongpassword');
		await page.click('button[type="submit"]');

		await expect(page).toHaveURL('/login');
		await expect(page.locator('.alert-error')).toContainText('Invalid email or password');
	});

	test('should logout user successfully', async ({ page }) => {
		// Register and login a user
		const logoutUser = {
			email: `logout-test-${Date.now()}@example.com`,
			password: 'logoutpassword123',
			name: 'Logout Test User'
		};

		await page.goto('/register');
		await page.fill('input[name="name"]', logoutUser.name);
		await page.fill('input[name="email"]', logoutUser.email);
		await page.fill('input[name="password"]', logoutUser.password);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');

		// Logout
		await page.click('[data-testid="user-avatar-button"]'); // Avatar button
		await page.click('button[type="submit"]'); // Logout button

		// Should redirect to home page
		await expect(page).toHaveURL('/');

		// Should not be able to access dashboard without login
		await page.goto('/dashboard');
		await expect(page).toHaveURL('/login');
	});

	test('should redirect already logged in users from auth pages and home page', async ({
		page
	}) => {
		// Register and login a user
		const redirectUser = {
			email: `redirect-test-${Date.now()}@example.com`,
			password: 'redirectpassword123',
			name: 'Redirect Test User'
		};

		await page.goto('/register');
		await page.fill('input[name="name"]', redirectUser.name);
		await page.fill('input[name="email"]', redirectUser.email);
		await page.fill('input[name="password"]', redirectUser.password);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');

		// Try to visit login page while logged in
		await page.goto('/login');
		await expect(page).toHaveURL('/dashboard');

		// Try to visit register page while logged in
		await page.goto('/register');
		await expect(page).toHaveURL('/dashboard');

		// Try to visit home page while logged in (should redirect to dashboard)
		await page.goto('/');
		await expect(page).toHaveURL('/dashboard');
	});
});
