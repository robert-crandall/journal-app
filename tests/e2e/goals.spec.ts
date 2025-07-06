import { test, expect } from '@playwright/test';
import { loginUser, cleanupGoals } from './test-helpers';

test.describe('Goals Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    // Skip cleanup for now to test if basic functionality works
    // await cleanupGoals(page);
  });

  test('should display goals dashboard with navigation', async ({ page }) => {
    // Navigate to goals page
    await page.click('a[href="/goals"]');
    await expect(page).toHaveURL('/goals');

    // Check page loads with basic structure
    await expect(page.locator('h1')).toContainText('Goals Dashboard');
    await expect(page.locator('button:has-text("Create Goal")')).toBeVisible();
  });

  test('should create a new goal successfully', async ({ page }) => {
    await page.goto('/goals');

    // Click create goal button (use a more generic selector)
    const createButton = page.locator('button').filter({ hasText: 'Create' }).first();
    await createButton.click();
    await expect(page).toHaveURL('/goals/create');

    // Check page title
    await expect(page.locator('h1')).toContainText('Create New Goal');

    // Fill out the create goal form with a unique title
    const uniqueTitle = `Test Goal ${Date.now()}`;
    await page.fill('input#title', uniqueTitle);
    await page.fill(
      'textarea#description',
      'Spend more quality time with family members and strengthen our bonds through regular activities and meaningful conversations.',
    );

    // Add tags
    await page.fill('input#tag-input', 'family');
    await page.click('button:has-text("Add")');
    await page.fill('input#tag-input', 'growth');
    await page.click('button:has-text("Add")');

    // Verify tags are added
    await expect(page.locator('.badge:has-text("family")')).toBeVisible();
    await expect(page.locator('.badge:has-text("growth")')).toBeVisible();

    // Ensure active goal checkbox is checked
    await expect(page.locator('input[type="checkbox"]')).toBeChecked();

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Should redirect to goals page
    await expect(page).toHaveURL('/goals');

    // Should show the created goal
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
    await expect(page.locator('.badge:has-text("Active")').first()).toBeVisible();
    await expect(page.locator('.badge:has-text("family")').first()).toBeVisible();
    await expect(page.locator('.badge:has-text("growth")').first()).toBeVisible();
  });

  test('should view goal details', async ({ page }) => {
    await page.goto('/goals');

    // Create a goal first
    const uniqueTitle = `View Test Goal ${Date.now()}`;
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', uniqueTitle);
    await page.fill('textarea#description', 'Test description for viewing');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Find the specific goal card and click its View button
    const goalCard = page.locator('.card').filter({ hasText: uniqueTitle });
    await goalCard.locator('button:has-text("View")').click();

    // Should show goal details page with our specific goal
    await expect(page.locator('h1')).toContainText(uniqueTitle);
    await expect(page.locator('text=Test description for viewing')).toBeVisible();
  });

  test('should edit goal successfully', async ({ page }) => {
    await page.goto('/goals');

    // Create a goal first
    const uniqueTitle = `Edit Test Goal ${Date.now()}`;
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', uniqueTitle);
    await page.fill('textarea#description', 'Go to gym 3 times per week');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Find the specific goal card and click its Edit button
    const goalCard = page.locator('.card').filter({ hasText: uniqueTitle });
    await goalCard.locator('button:has-text("Edit")').click();

    // Should be on edit page
    await expect(page.locator('h1')).toContainText('Edit Goal');

    // Update the goal
    await page.fill('input#title', `${uniqueTitle} updated`);
    await page.fill('textarea#description', 'Go to gym 3 times per week and focus on progressive overload training');

    // Add a tag
    await page.fill('input#tag-input', 'health');
    await page.click('button:has-text("Add")');

    // Submit changes
    await page.click('button[type="submit"]:has-text("Save Changes")');

    // Should redirect to goal details
    await expect(page.locator('h1')).toContainText(`${uniqueTitle} updated`);
    await expect(page.locator('text=focus on progressive overload training')).toBeVisible();
    await expect(page.locator('.badge:has-text("health")')).toBeVisible();
  });

  test('should archive and unarchive goal', async ({ page }) => {
    await page.goto('/goals');

    // Create a goal first with unique title
    const uniqueTitle = `Archive Test Goal ${Date.now()}`;
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', uniqueTitle);
    await page.fill('textarea#description', 'Test goal for archiving');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Find the specific goal and archive it
    const goalCard = page.locator('.card').filter({ hasText: uniqueTitle });
    await goalCard.locator('button:has-text("Archive")').click();

    // Goal should disappear from active goals (default view)
    await expect(page.locator('.card').filter({ hasText: uniqueTitle })).not.toBeVisible();

    // Switch to archived view
    await page.locator('label:has-text("Show Archived")').locator('input[type="checkbox"]').check();

    // Should show archived goal
    await expect(page.locator('.card').filter({ hasText: uniqueTitle })).toBeVisible();
    await expect(goalCard.locator('.badge:has-text("Archived")')).toBeVisible();

    // Unarchive the goal
    await goalCard.locator('button:has-text("Unarchive")').click();

    // Switch back to active view
    await page.locator('label:has-text("Show Archived")').locator('input[type="checkbox"]').uncheck();

    // Goal should be visible again in active view
    await expect(page.locator('.card').filter({ hasText: uniqueTitle })).toBeVisible();
  });

  test('should delete goal with confirmation', async ({ page }) => {
    await page.goto('/goals');

    // Create a goal first with unique title
    const uniqueTitle = `Delete Test Goal ${Date.now()}`;
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', uniqueTitle);
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Find the specific goal card and delete it
    const goalCard = page.locator('.card').filter({ hasText: uniqueTitle });

    // Set up dialog handler to accept deletion
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure you want to delete');
      await dialog.accept();
    });

    await goalCard.locator('button:has-text("Delete")').click();

    // Goal should be gone
    await expect(page.locator('.card').filter({ hasText: uniqueTitle })).not.toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/goals/create');

    // Try to submit empty form - button should be disabled
    await expect(page.locator('button[type="submit"]:has-text("Create Goal")')).toBeDisabled();

    // Focus and blur title field to trigger validation
    await page.click('input#title');
    await page.locator('input#title').blur();

    // Should show validation error after field is touched
    await expect(page.locator('text=Title is required')).toBeVisible();

    // Button should be disabled for invalid form
    await expect(page.locator('button[type="submit"]:has-text("Create Goal")')).toBeDisabled();

    // Fill title to make form valid
    await page.fill('input#title', 'Valid goal title');

    // Button should now be enabled
    await expect(page.locator('button[type="submit"]:has-text("Create Goal")')).toBeEnabled();

    // Test title length validation - try to enter more than 255 characters
    // Note: The input has maxlength="255" so it won't actually accept more
    const longTitle = 'a'.repeat(255); // Exactly 255 characters
    await page.fill('input#title', longTitle);

    // Button should be enabled for exactly 255 characters
    await expect(page.locator('button[type="submit"]:has-text("Create Goal")')).toBeEnabled();

    // The browser maxlength attribute prevents entering more than 255 chars
    // So we can't test the "Title must be 255 characters or less" validation message
    // through user input. The validation logic exists in the code but is redundant with maxlength.
  });

  test('should handle tag management', async ({ page }) => {
    await page.goto('/goals/create');

    // Add multiple tags
    await page.fill('input#tag-input', 'family');
    await page.click('button:has-text("Add")');
    await page.fill('input#tag-input', 'growth');
    await page.click('button:has-text("Add")');
    await page.fill('input#tag-input', 'spiritual');
    await page.click('button:has-text("Add")');

    // Verify tags are added
    await expect(page.locator('.badge:has-text("family")')).toBeVisible();
    await expect(page.locator('.badge:has-text("growth")')).toBeVisible();
    await expect(page.locator('.badge:has-text("spiritual")')).toBeVisible();

    // Remove a tag
    await page.click('.badge:has-text("growth") button');
    await expect(page.locator('.badge:has-text("growth")')).not.toBeVisible();

    // Try to add duplicate tag
    await page.fill('input#tag-input', 'family');
    await page.click('button:has-text("Add")');

    // Should only have one family tag
    await expect(page.locator('.badge:has-text("family")')).toHaveCount(1);

    // Test tag input with Enter key
    await page.fill('input#tag-input', 'health');
    await page.press('input#tag-input', 'Enter');
    await expect(page.locator('.badge:has-text("health")')).toBeVisible();
  });

  test('should display quick stats correctly', async ({ page }) => {
    await page.goto('/goals');

    // Should show the stats section
    await expect(page.locator('text=Active Goals:')).toBeVisible();
    await expect(page.locator('text=Total Goals:')).toBeVisible();
    await expect(page.locator('text=Archived:')).toBeVisible();
  });

  test('should navigate between related features', async ({ page }) => {
    await page.goto('/goals');

    // Test navigation to other features
    await page.click('a[href="/character"]');
    await expect(page).toHaveURL('/character');

    await page.click('a[href="/goals"]');
    await expect(page).toHaveURL('/goals');

    await page.click('a[href="/stats"]');
    await expect(page).toHaveURL('/stats');
  });

  test('should show goal icons based on tags', async ({ page }) => {
    await page.goto('/goals');

    // Test just one goal with one icon to verify the functionality
    const uniqueTitle = `Icon Test Goal ${Date.now()}`;
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', uniqueTitle);
    await page.fill('input#tag-input', 'family');
    await page.click('button:has-text("Add")');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Verify the goal appears with the family icon
    const goalCard = page.locator('.card').filter({ hasText: uniqueTitle });
    await expect(goalCard.locator('text=👨‍👩‍👧‍👦').first()).toBeVisible();
  });
});
