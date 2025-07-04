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

/**
 * Helper function to delete character if it exists
 */
export async function cleanupCharacter(page: Page): Promise<void> {
	// Navigate to character page
	await page.goto('/character');
	await page.waitForLoadState('networkidle');

	// Check if character exists by looking for edit button
	const editButton = page.getByRole('button', { name: 'Edit Character' });

	try {
		// Wait briefly for the button to appear, if it exists
		await editButton.waitFor({ timeout: 2000 });

		// If we get here, character exists - delete it
		const deleteButton = page.getByRole('button', { name: 'Delete Character' });
		await deleteButton.click();

		// Wait for confirmation modal to appear
		await expect(page.locator('text=Are you sure you want to delete')).toBeVisible();

		// Confirm deletion using the specific modal button
		await page.locator('.modal .btn-error').click();

		// Wait for the deletion to complete - the page should redirect/refresh
		await page.waitForLoadState('networkidle');

		// Wait for the creation form to appear
		await expect(page.getByRole('heading', { name: 'Create Your Character' })).toBeVisible({
			timeout: 10000
		});
	} catch (error) {
		// Character doesn't exist, which is what we want
		// Just make sure the creation form is visible
		await expect(page.getByRole('heading', { name: 'Create Your Character' })).toBeVisible({
			timeout: 10000
		});
	}
}
