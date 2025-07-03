import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

/**
 * Helper function to login a test user
 */
export async function loginUser(page: Page): Promise<void> {
	// Go to login page
	await page.goto('/login');

	// Fill out the login form with test credentials from config
	await page.fill('input[id="email"]', TEST_CONFIG.USER.email);
	await page.fill('input[id="password"]', TEST_CONFIG.USER.password);

	// Submit the form
	await page.click('button[type="submit"]');

	// Wait for navigation to complete
	await page.waitForURL('/');

	// Verify we're logged in
	await expect(page.locator('text=Welcome back')).toBeVisible();
}
