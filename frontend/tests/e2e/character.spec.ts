import { test, expect } from '@playwright/test';
import { loginUser, cleanupCharacter } from './test-helpers';

test.describe('Character Creation', () => {
	test('redirects to login when not authenticated', async ({ page }) => {
		// Navigate to the character page
		await page.goto('/character');

		// Should redirect to login page
		await expect(page).toHaveURL(/.*login/);
	});

	test('shows character creation form when no character exists', async ({ page }) => {
		// Login first
		await loginUser(page);

		// Clean up any existing character
		await cleanupCharacter(page);

		// Navigate to the character page
		await page.goto('/character');

		// We should stay on the character page
		await expect(page).toHaveURL(/.*character/);

		// Check that character creation form is displayed using role selectors
		await expect(page.getByRole('heading', { name: 'Create Your Character' })).toBeVisible();
		await expect(page.locator('input[id="name"]')).toBeVisible();
		await expect(page.locator('select[id="class"]')).toBeVisible();
		await expect(page.locator('textarea[id="backstory"]')).toBeVisible();
		await expect(page.locator('textarea[id="goals"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('creates a character successfully with minimal data', async ({ page }) => {
		// Login first
		await loginUser(page);

		// Clean up any existing character
		await cleanupCharacter(page);

		// Navigate to the character page
		await page.goto('/character');

		// Fill out the minimal character creation form
		await page.fill('input[id="name"]', 'Test Adventurer');
		await page.selectOption('select[id="class"]', 'Adventurer');

		// Submit the form
		await page.click('button[type="submit"]');

		// Wait for character to be created and page to update
		await expect(page.getByRole('heading', { name: 'Test Adventurer' })).toBeVisible();
		await expect(page.locator('.stat-value', { hasText: 'Adventurer' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Edit Character' })).toBeVisible();
	});

	test('creates a character with custom class and full data', async ({ page }) => {
		// Login first
		await loginUser(page);

		// Clean up any existing character
		await cleanupCharacter(page);

		// Navigate to the character page
		await page.goto('/character');

		// Fill out the complete character creation form
		await page.fill('input[id="name"]', 'Custom Hero');
		await page.selectOption('select[id="class"]', 'Custom');
		
		// Wait for custom class input to appear
		await expect(page.locator('input[placeholder="Enter your custom class"]')).toBeVisible();
		await page.fill('input[placeholder="Enter your custom class"]', 'Nature Guardian');
		
		await page.fill('textarea[id="backstory"]', 'A person who loves the outdoors and wants to spend more time in nature.');
		await page.fill('textarea[id="goals"]', 'Spend at least 3 hours outdoors each day and learn wilderness survival skills.');

		// Submit the form
		await page.click('button[type="submit"]');

		// Wait for character to be created and page to update
		await expect(page.getByRole('heading', { name: 'Custom Hero' })).toBeVisible();
		await expect(page.locator('.stat-value', { hasText: 'Nature Guardian' })).toBeVisible();
		await expect(page.locator('text=A person who loves the outdoors')).toBeVisible();
		await expect(page.locator('text=Spend at least 3 hours outdoors')).toBeVisible();
	});

	test('validates required fields', async ({ page }) => {
		// Login first
		await loginUser(page);

		// Clean up any existing character
		await cleanupCharacter(page);

		// Navigate to the character page
		await page.goto('/character');

		// Try to submit without filling required fields
		await page.click('button[type="submit"]');

		// Form should not submit (page shouldn't change)
		await expect(page.getByRole('heading', { name: 'Create Your Character' })).toBeVisible();

		// Fill only name
		await page.fill('input[id="name"]', 'Test Character');
		await page.click('button[type="submit"]');

		// Form should still not submit
		await expect(page.getByRole('heading', { name: 'Create Your Character' })).toBeVisible();
	});

	test('handles character creation error gracefully', async ({ page }) => {
		// Login first
		await loginUser(page);

		// Clean up any existing character
		await cleanupCharacter(page);

		// Navigate to the character page
		await page.goto('/character');

		// Fill out form with valid data
		await page.fill('input[id="name"]', 'Test Character');
		await page.selectOption('select[id="class"]', 'Adventurer');

		// Submit the form
		await page.click('button[type="submit"]');

		// Wait for success (character created)
		await expect(page.getByRole('heading', { name: 'Test Character' })).toBeVisible();

		// Navigate back to character page to test creating a second character (should fail)
		await page.goto('/character');

		// Should show the existing character, not the creation form
		await expect(page.getByRole('heading', { name: 'Test Character' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Create Your Character' })).not.toBeVisible();
	});
});

test.describe('Character Management', () => {
	test.beforeEach(async ({ page }) => {
		// Login and ensure we have a fresh character for each test
		await loginUser(page);
		
		// Clean up any existing character first
		await cleanupCharacter(page);
		
		// Now create a test character
		await page.goto('/character');
		await page.fill('input[id="name"]', 'Test Character');
		await page.selectOption('select[id="class"]', 'Adventurer');
		await page.fill('textarea[id="backstory"]', 'Test backstory');
		await page.fill('textarea[id="goals"]', 'Test goals');
		await page.click('button[type="submit"]');
		await expect(page.getByRole('heading', { name: 'Test Character' })).toBeVisible();
	});

	test('displays character information correctly', async ({ page }) => {
		await page.goto('/character');

		// Check that character info is displayed
		await expect(page.getByRole('heading', { name: 'Test Character' })).toBeVisible();
		await expect(page.locator('.stat-value', { hasText: 'Adventurer' })).toBeVisible();
		await expect(page.locator('text=Test backstory')).toBeVisible();
		await expect(page.locator('text=Test goals')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Edit Character' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Delete Character' })).toBeVisible();
	});

	test('edits character successfully', async ({ page }) => {
		await page.goto('/character');

		// Click edit button
		await page.getByRole('button', { name: 'Edit Character' }).click();

		// Check that edit form is visible
		await expect(page.getByRole('heading', { name: 'Edit Your Character' })).toBeVisible();
		await expect(page.locator('input[id="edit-name"]')).toBeVisible();

		// Update character information
		await page.fill('input[id="edit-name"]', 'Updated Character');
		await page.fill('input[id="edit-class"]', 'Updated Class');
		await page.fill('textarea[id="edit-backstory"]', 'Updated backstory');
		await page.fill('textarea[id="edit-goals"]', 'Updated goals');

		// Save changes
		await page.getByRole('button', { name: 'Save Changes' }).click();

		// Verify updates are visible
		await expect(page.getByRole('heading', { name: 'Updated Character' })).toBeVisible();
		await expect(page.locator('.stat-value', { hasText: 'Updated Class' })).toBeVisible();
		await expect(page.locator('text=Updated backstory')).toBeVisible();
		await expect(page.locator('text=Updated goals')).toBeVisible();
	});

	test('cancels character edit', async ({ page }) => {
		await page.goto('/character');

		// Click edit button
		await page.getByRole('button', { name: 'Edit Character' }).click();

		// Check that edit form is visible
		await expect(page.getByRole('heading', { name: 'Edit Your Character' })).toBeVisible();

		// Make some changes
		await page.fill('input[id="edit-name"]', 'Should Not Save');

		// Cancel edit
		await page.getByRole('button', { name: 'Cancel' }).click();

		// Verify original data is still displayed
		await expect(page.getByRole('heading', { name: 'Test Character' })).toBeVisible();
		await expect(page.locator('text=Should Not Save')).not.toBeVisible();
		await expect(page.getByRole('heading', { name: 'Edit Your Character' })).not.toBeVisible();
	});

	test('deletes character successfully', async ({ page }) => {
		await page.goto('/character');

		// Click delete button
		await page.getByRole('button', { name: 'Delete Character' }).click();

		// Check that confirmation modal is visible
		await expect(page.locator('text=Are you sure you want to delete')).toBeVisible();

		// Confirm deletion using specific modal button
		await page.locator('.modal .btn-error').click();

		// Should be back to character creation form
		await expect(page.getByRole('heading', { name: 'Create Your Character' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Test Character' })).not.toBeVisible();
	});

	test('cancels character deletion', async ({ page }) => {
		await page.goto('/character');

		// Click delete button
		await page.getByRole('button', { name: 'Delete Character' }).click();

		// Check that confirmation modal is visible
		await expect(page.locator('text=Are you sure you want to delete')).toBeVisible();

		// Cancel deletion
		await page.locator('.modal .btn-outline').click();

		// Character should still be visible
		await expect(page.getByRole('heading', { name: 'Test Character' })).toBeVisible();
		await expect(page.locator('text=Are you sure you want to delete')).not.toBeVisible();
	});
});

test.describe('Character Navigation', () => {
	test('character link appears in navigation when logged in', async ({ page }) => {
		// Login first
		await loginUser(page);

		// Check that character link is visible in navigation
		await expect(page.getByRole('link', { name: 'Character' })).toBeVisible();
	});

	test('character link is clickable and navigates correctly', async ({ page }) => {
		// Login first
		await loginUser(page);

		// Click character link in navigation
		await page.getByRole('link', { name: 'Character' }).click();

		// Should navigate to character page
		await expect(page).toHaveURL(/.*character/);
		await expect(page.getByRole('heading', { name: 'Your Character', exact: true })).toBeVisible();
	});
});
