import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Hello World Page', () => {
	test('redirects to login when not authenticated', async ({ page }) => {
		// Navigate to the hello page
		await page.goto('/hello');

		// Should redirect to login page
		await expect(page).toHaveURL(/.*login/);
	});

	// Test that authenticated users can access the hello page
	test('shows hello message for authenticated users', async ({ page }) => {
		// Login first
		await loginUser(page);

		// Navigate to the hello page
		await page.goto('/hello');

		// We should stay on the hello page
		await expect(page).toHaveURL(/.*hello/);

		// Wait for API request to complete
		await page.waitForSelector('text=Hello,');

		// Check that the hello message is displayed
		await expect(page.locator('text=Hello,')).toBeVisible();

		// Check that user ID is displayed
		await expect(page.locator('text=This page is protected by JWT authentication')).toBeVisible();
	});
});
