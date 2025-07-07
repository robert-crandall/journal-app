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
      timeout: 10000,
    });
  } catch (error) {
    // Character doesn't exist, which is what we want
    // Just make sure the creation form is visible
    await expect(page.getByRole('heading', { name: 'Create Your Character' })).toBeVisible({
      timeout: 10000,
    });
  }
}

/**
 * Helper function to delete all stats if they exist
 */
export async function cleanupStats(page: Page): Promise<void> {
  // Navigate to stats page
  await page.goto('/stats');
  await page.waitForLoadState('networkidle');

  // Keep deleting stats until none remain, but limit attempts to prevent infinite loops
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      // Look for any stat cards (look for Level text which appears in stat cards)
      await page.waitForSelector('text=Level', { timeout: 2000 });

      // Find the first stat card and click on it
      const firstStatCard = page.locator('button:has-text("Level")').first();
      await firstStatCard.click();

      // Wait for navigation to stat details
      await page.waitForURL(/\/stats\/[^\/]+$/, { timeout: 5000 });

      // Click delete button
      await page.click('button:has-text("Delete Stat")');

      // Wait for confirmation modal
      await expect(page.locator('text=Are you sure?')).toBeVisible({ timeout: 3000 });

      // Confirm deletion
      await page.click('button:has-text("Yes, Delete")');

      // Wait for redirect back to stats page
      await page.waitForURL('/stats', { timeout: 5000 });
      await page.waitForLoadState('networkidle');

      attempts++;
    } catch (error) {
      // No more stats found or some other error - break out of loop
      break;
    }
  }
}

/**
 * Helper function to delete all goals if they exist
 */
export async function cleanupGoals(page: Page): Promise<void> {
  try {
    // Navigate to goals page
    await page.goto('/goals');
    await page.waitForLoadState('networkidle');

    // Simple approach: just delete any goals we find
    for (let i = 0; i < 10; i++) {
      // Max 10 attempts
      try {
        // Look for delete buttons
        const deleteButton = page.locator('button:has-text("Delete")').first();
        const isVisible = await deleteButton.isVisible();

        if (!isVisible) {
          // No delete buttons visible, check archived view
          try {
            const checkbox = page.locator('label:has-text("Show Archived")').locator('input[type="checkbox"]');
            if (!(await checkbox.isChecked())) {
              await checkbox.check();
              await page.waitForLoadState('networkidle');
              continue; // Try again to find goals in archived view
            } else {
              // Already showing archived and no delete buttons found
              break;
            }
          } catch {
            // No archived checkbox, we're done
            break;
          }
        }

        // Click delete and handle dialog
        const dialogPromise = page.waitForEvent('dialog');
        await deleteButton.click();
        const dialog = await dialogPromise;
        await dialog.accept();

        // Wait for deletion to complete
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(200); // Small delay for UI update
      } catch (error) {
        // Error or no more goals, break out
        break;
      }
    }

    // Reset to active view
    try {
      const checkbox = page.locator('label:has-text("Show Archived")').locator('input[type="checkbox"]');
      if (await checkbox.isChecked()) {
        await checkbox.uncheck();
        await page.waitForLoadState('networkidle');
      }
    } catch {
      // Ignore any errors with checkbox
    }
  } catch (error) {
    // If cleanup fails entirely, continue with tests
    console.warn('Goal cleanup failed:', error);
  }
}

/**
 * Helper function to delete all family members if they exist
 */
export async function cleanupFamily(page: Page): Promise<void> {
  try {
    // Navigate to family page
    await page.goto('/family');
    await page.waitForLoadState('networkidle');

    // Simple approach: delete any family members we find
    for (let i = 0; i < 10; i++) { // Max 10 attempts
      try {
        // Look for family member cards and delete buttons
        const deleteButton = page.locator('button:has-text("Delete")').first();
        const isVisible = await deleteButton.isVisible();

        if (!isVisible) {
          // No delete buttons visible, check if we need to enter a family member detail page
          const familyMemberCard = page.locator('.card').filter({ hasText: /Level|Connection/ }).first();
          if (await familyMemberCard.isVisible()) {
            // Click on the family member to enter details page
            await familyMemberCard.click();
            await page.waitForLoadState('networkidle');
            continue; // Try again to find delete button on details page
          } else {
            // No family member cards found
            break;
          }
        }

        // Click delete and handle dialog
        const dialogPromise = page.waitForEvent('dialog');
        await deleteButton.click();
        const dialog = await dialogPromise;
        await dialog.accept();

        // Wait for deletion to complete and return to family page
        await page.waitForLoadState('networkidle');
        await page.goto('/family'); // Ensure we're back on the main family page
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(200); // Small delay for UI update
      } catch (error) {
        // Error or no more family members, break out
        break;
      }
    }
  } catch (error) {
    // If cleanup fails entirely, continue with tests
    console.warn('Family cleanup failed:', error);
  }
}

/**
 * Helper function to create a basic stat for testing
 */
export async function createTestStat(page: Page, name: string = 'Test Stat', description: string = 'Test description'): Promise<void> {
  await page.goto('/stats/create');
  await page.fill('input[placeholder="e.g., Programming, Fitness, Creativity"]', name);
  await page.fill('textarea[placeholder*="Describe what this stat represents"]', description);
  await page.fill('input[placeholder*="Complete a coding challenge"]', 'Test activity');
  await page.fill('input[placeholder="XP"]', '10');
  await page.click('button[type="submit"]:has-text("Create Stat")');
  await page.waitForURL('/stats');
}
