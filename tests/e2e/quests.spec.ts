import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Quests', () => {
  test('can create, view, edit, and delete a quest', async ({ page }) => {
    // Login first
    await loginUser(page);

    // Navigate to quests page
    await page.goto('/quests');
    await expect(page).toHaveTitle(/Quests/);

    // Should see empty state initially
    await expect(page.locator('h3:has-text("No quests yet")')).toBeVisible();

    // Click create new quest button
    await page.click('a[href="/quests/new"]');
    await expect(page).toHaveURL('/quests/new');

    // Fill out quest form
    await page.fill('#title', 'Test Quest');
    await page.fill('#summary', 'This is a test quest for E2E testing');
    await page.fill('#startDate', '2024-01-01');
    await page.fill('#endDate', '2024-12-31');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should redirect to quest detail page
    await expect(page).toHaveURL(/\/quests\/[a-z0-9-]+$/);
    await expect(page.locator('h1:has-text("Test Quest")')).toBeVisible();
    await expect(page.locator('text=This is a test quest for E2E testing')).toBeVisible();

    // Check quest details are displayed
    await expect(page.locator('text=Started 2024-01-01')).toBeVisible();
    await expect(page.locator('text=Due: 2024-12-31')).toBeVisible();

    // Go to edit quest
    await page.click('a[href$="/edit"]');
    await expect(page).toHaveURL(/\/quests\/[a-z0-9-]+\/edit$/);

    // Update the quest
    await page.fill('#title', 'Updated Test Quest');
    await page.fill('#reflection', 'This quest has been updated during testing');
    await page.selectOption('#status', 'completed');

    // Submit the update
    await page.click('button[type="submit"]');

    // Should redirect back to quest detail page with updates
    await expect(page).toHaveURL(/\/quests\/[a-z0-9-]+$/);
    await expect(page.locator('h1:has-text("Updated Test Quest")')).toBeVisible();
    await expect(page.locator('text=This quest has been updated during testing')).toBeVisible();
    await expect(page.locator('.badge:has-text("completed")')).toBeVisible();

    // Go back to quests list
    await page.click('button:has-text("Back to Quests")');
    await expect(page).toHaveURL('/quests');

    // Should see the quest in the list
    await expect(page.locator('h3:has-text("Updated Test Quest")')).toBeVisible();
    await expect(page.locator('.badge:has-text("completed")')).toBeVisible();

    // Go back to edit to test deletion
    await page.click('a[href$="/edit"]:first-of-type');
    await expect(page).toHaveURL(/\/quests\/[a-z0-9-]+\/edit$/);

    // Type quest title for delete confirmation
    await page.fill('#deleteConfirmation', 'Updated Test Quest');

    // Delete the quest
    await page.click('button:has-text("Delete Quest")');

    // Should redirect to quests list
    await expect(page).toHaveURL('/quests');

    // Should see empty state again
    await expect(page.locator('h3:has-text("No quests yet")')).toBeVisible();
  });

  test('can filter quests by status', async ({ page }) => {
    // Login first
    await loginUser(page);

    // Navigate to quests page
    await page.goto('/quests');

    // Create an active quest
    await page.click('a[href="/quests/new"]');
    await page.fill('#title', 'Active Quest');
    await page.fill('#summary', 'An active quest');
    await page.fill('#startDate', '2024-01-01');
    await page.click('button[type="submit"]');

    // Go back and create a completed quest
    await page.click('button:has-text("Back to Quests")');
    await page.click('a[href="/quests/new"]');
    await page.fill('#title', 'Completed Quest');
    await page.fill('#summary', 'A completed quest');
    await page.fill('#startDate', '2024-01-01');
    await page.click('button[type="submit"]');

    // Edit to mark as completed
    await page.click('a[href$="/edit"]');
    await page.selectOption('#status', 'completed');
    await page.click('button[type="submit"]');

    // Go back to list
    await page.click('button:has-text("Back to Quests")');

    // Should see both quests
    await expect(page.locator('h3:has-text("Active Quest")')).toBeVisible();
    await expect(page.locator('h3:has-text("Completed Quest")')).toBeVisible();

    // Filter by active only
    await page.selectOption('select', 'active');
    await expect(page.locator('h3:has-text("Active Quest")')).toBeVisible();
    await expect(page.locator('h3:has-text("Completed Quest")')).not.toBeVisible();

    // Filter by completed only
    await page.selectOption('select', 'completed');
    await expect(page.locator('h3:has-text("Active Quest")')).not.toBeVisible();
    await expect(page.locator('h3:has-text("Completed Quest")')).toBeVisible();

    // Show all again
    await page.selectOption('select', 'all');
    await expect(page.locator('h3:has-text("Active Quest")')).toBeVisible();
    await expect(page.locator('h3:has-text("Completed Quest")')).toBeVisible();

    // Clean up - delete the quests
    for (const questTitle of ['Active Quest', 'Completed Quest']) {
      await page.click(`h3:has-text("${questTitle}") + div a[href$="/edit"]`);
      await page.fill('#deleteConfirmation', questTitle);
      await page.click('button:has-text("Delete Quest")');
    }
  });

  test('can search quests', async ({ page }) => {
    // Login first
    await loginUser(page);

    // Navigate to quests page and create test quests
    await page.goto('/quests');

    // Create first quest
    await page.click('a[href="/quests/new"]');
    await page.fill('#title', 'Learning JavaScript');
    await page.fill('#summary', 'Master JavaScript fundamentals');
    await page.fill('#startDate', '2024-01-01');
    await page.click('button[type="submit"]');

    // Go back and create second quest
    await page.click('button:has-text("Back to Quests")');
    await page.click('a[href="/quests/new"]');
    await page.fill('#title', 'Fitness Challenge');
    await page.fill('#summary', 'Get in shape this year');
    await page.fill('#startDate', '2024-01-01');
    await page.click('button[type="submit"]');

    // Go back to list
    await page.click('button:has-text("Back to Quests")');

    // Should see both quests
    await expect(page.locator('h3:has-text("Learning JavaScript")')).toBeVisible();
    await expect(page.locator('h3:has-text("Fitness Challenge")')).toBeVisible();

    // Search for "JavaScript"
    await page.fill('input[placeholder="Search quests..."]', 'JavaScript');
    await expect(page.locator('h3:has-text("Learning JavaScript")')).toBeVisible();
    await expect(page.locator('h3:has-text("Fitness Challenge")')).not.toBeVisible();

    // Search for "fitness"
    await page.fill('input[placeholder="Search quests..."]', 'fitness');
    await expect(page.locator('h3:has-text("Learning JavaScript")')).not.toBeVisible();
    await expect(page.locator('h3:has-text("Fitness Challenge")')).toBeVisible();

    // Clear search
    await page.fill('input[placeholder="Search quests..."]', '');
    await expect(page.locator('h3:has-text("Learning JavaScript")')).toBeVisible();
    await expect(page.locator('h3:has-text("Fitness Challenge")')).toBeVisible();

    // Clean up
    for (const questTitle of ['Learning JavaScript', 'Fitness Challenge']) {
      await page.click(`h3:has-text("${questTitle}") + div a[href$="/edit"]`);
      await page.fill('#deleteConfirmation', questTitle);
      await page.click('button:has-text("Delete Quest")');
    }
  });
});
