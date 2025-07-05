import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
	test('prevents XSS attacks in form inputs', async ({ page }) => {
		const xssPayload = '<script>alert("XSS")</script>';

		await page.goto('/register');

		// Try to inject XSS in display name
		await page.fill('input[name="name"]', xssPayload);
		await page.fill('input[name="email"]', `xss-${Date.now()}@example.com`);
		await page.fill('input[name="password"]', 'securepassword123');
		await page.click('button[type="submit"]');

		// Should successfully register but XSS should be escaped
		await expect(page).toHaveURL('/dashboard');

		// Should not execute script or render as HTML
		await expect(page.locator('script')).not.toBeVisible();

		// The display name should be visible but escaped
		// await expect(page.locator('text=' + xssPayload)).not.toBeVisible();
		await expect(page.locator('p').filter({ hasText: 'Hello, ' + xssPayload })).toBeVisible();
	});

	test('validates email format properly', async ({ page }) => {
		await page.goto('/register');

		const invalidEmails = [
			'invalid-email',
			'@example.com',
			'user@',
			'user@.com',
			'user..name@example.com'
		];

		for (const invalidEmail of invalidEmails) {
			await page.fill('input[name="name"]', 'Email Test User');
			await page.fill('input[name="email"]', invalidEmail);
			await page.fill('input[name="password"]', 'validpassword123');
			await page.click('button[type="submit"]');

			// Should show email validation error
			await expect(page.locator('.alert-error')).toContainText(
				'Please enter a valid email address'
			);

			// Clear form for next test
			await page.fill('input[name="email"]', '');
		}
	});

	test('prevents SQL injection attempts', async ({ page }) => {
		const sqlInjectionPayloads = [
			"'; DROP TABLE users; --",
			"admin' OR '1'='1",
			"' UNION SELECT * FROM users --"
		];

		for (const payload of sqlInjectionPayloads) {
			await page.goto('/login');

			await page.fill('input[name="email"]', payload);
			await page.fill('input[name="password"]', payload);
			await page.click('button[type="submit"]');

			// Should show normal login error, not SQL error
			// await expect(page.locator('.alert-error')).toBeVisible();

			// Should not crash the application
			await expect(page.locator('h1')).toContainText('Sign In');
		}
	});

	test('enforces session security', async ({ page, context }) => {
		// Register and login a user
		const sessionUser = {
			email: `session-security-${Date.now()}@example.com`,
			password: 'securesession123',
			name: 'Session Security User'
		};

		await page.goto('/register');
		await page.fill('input[name="name"]', sessionUser.name);
		await page.fill('input[name="email"]', sessionUser.email);
		await page.fill('input[name="password"]', sessionUser.password);
		await page.click('button[type="submit"]');

		await expect(page).toHaveURL('/dashboard');

		// Check that session cookie is set with proper security attributes
		const cookies = await context.cookies();
		const sessionCookie = cookies.find((cookie) => cookie.name === 'session');

		expect(sessionCookie).toBeDefined();
		expect(sessionCookie?.httpOnly).toBe(true);
		expect(sessionCookie?.secure).toBe(true);
		expect(sessionCookie?.sameSite).toBe('Strict');
	});

	test('prevents unauthorized access to protected routes', async ({ page }) => {
		// Clear any existing session
		await page.context().clearCookies();

		const protectedRoutes = ['/dashboard'];

		for (const route of protectedRoutes) {
			await page.goto(route);

			// Should redirect to login
			await expect(page).toHaveURL('/login');
		}
	});

	test('handles concurrent login attempts gracefully', async ({ browser }) => {
		const userCredentials = {
			email: `concurrent-${Date.now()}@example.com`,
			password: 'concurrenttest123',
			name: 'Concurrent Test User'
		};

		// First register the user
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();

		await page1.goto('/register');
		await page1.fill('input[name="name"]', userCredentials.name);
		await page1.fill('input[name="email"]', userCredentials.email);
		await page1.fill('input[name="password"]', userCredentials.password);
		await page1.click('button[type="submit"]');

		await expect(page1).toHaveURL('/dashboard');
		await context1.close();

		// Now try concurrent logins
		const context2 = await browser.newContext();
		const context3 = await browser.newContext();
		const page2 = await context2.newPage();
		const page3 = await context3.newPage();

		// Both pages attempt login simultaneously
		await Promise.all([page2.goto('/login'), page3.goto('/login')]);

		await Promise.all([
			page2.fill('input[name="email"]', userCredentials.email),
			page3.fill('input[name="email"]', userCredentials.email)
		]);

		await Promise.all([
			page2.fill('input[name="password"]', userCredentials.password),
			page3.fill('input[name="password"]', userCredentials.password)
		]);

		await Promise.all([page2.click('button[type="submit"]'), page3.click('button[type="submit"]')]);

		// Both should successfully login (separate sessions)
		await expect(page2).toHaveURL('/dashboard');
		await expect(page3).toHaveURL('/dashboard');

		await context2.close();
		await context3.close();
	});

	test('logout properly destroys session', async ({ page }) => {
		// Register and login
		const logoutUser = {
			email: `logout-security-${Date.now()}@example.com`,
			password: 'logoutsecurity123',
			name: 'Logout Security User'
		};

		await page.goto('/register');
		await page.fill('input[name="name"]', logoutUser.name);
		await page.fill('input[name="email"]', logoutUser.email);
		await page.fill('input[name="password"]', logoutUser.password);
		await page.click('button[type="submit"]');

		await expect(page).toHaveURL('/dashboard');

		// Logout
		await page.click('[data-testid="user-avatar-button"]'); // Avatar dropdown
		await page.click('button[type="submit"]'); // Logout button

		// Should redirect to home
		await expect(page).toHaveURL('/');

		// Session should be destroyed - accessing dashboard should redirect to login
		await page.goto('/dashboard');
		await expect(page).toHaveURL('/login');

		// Session cookie should be cleared
		const cookies = await page.context().cookies();
		const sessionCookie = cookies.find((cookie) => cookie.name === 'session');
		expect(sessionCookie).toBeUndefined();
	});

	test('handles malformed requests gracefully', async ({ page }) => {
		// Test with malformed form data
		await page.goto('/login');

		// Use page.evaluate to submit malformed data
		await page.evaluate(() => {
			const form = document.querySelector('form');
			if (form) {
				// Add extra fields that shouldn't be processed
				const maliciousInput = document.createElement('input');
				maliciousInput.name = 'admin';
				maliciousInput.value = 'true';
				maliciousInput.type = 'hidden';
				form.appendChild(maliciousInput);
			}
		});

		await page.fill('input[name="email"]', 'test@example.com');
		await page.fill('input[name="password"]', 'wrongpassword');
		await page.click('button[type="submit"]');

		// Should handle gracefully with normal error message
		await expect(page.locator('.alert-error')).toContainText('Invalid email or password');

		// Should not crash or expose internal errors
		await expect(page.locator('h1')).toContainText('Sign In');
	});
});
