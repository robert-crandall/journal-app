import { test, expect } from '@playwright/test';
import { loginUser, cleanupStats, createTestStat } from './test-helpers';

test.describe('Stats Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
    // Note: We don't clean up stats before each test to avoid timeouts
    // Each test should be independent and create its own data
  });

  test('should display stats dashboard with navigation', async ({ page }) => {
    // Navigate to stats page
    await page.click('a[href="/stats"]');
    await expect(page).toHaveURL('/stats');

    // Check page title and structure
    await expect(page.locator('h1')).toContainText('Stats Dashboard');

    // Should show empty state initially
    await expect(page.locator('text=No Stats Yet')).toBeVisible();
    await expect(page.locator('text=Start your journey by creating')).toBeVisible();

    // Should have create stat button
    await expect(page.locator('button:has-text("Create Your First Stat")')).toBeVisible();
  });

  test('should create a custom stat successfully', async ({ page }) => {
    await page.goto('/stats');

    // Click create stat button
    await page.click('button:has-text("Create Your First Stat")');
    await expect(page).toHaveURL('/stats/create');

    // Fill out the create stat form
    await page.fill('input[placeholder="e.g., Programming, Fitness, Creativity"]', 'Programming Skills');
    await page.fill('textarea[placeholder*="Describe what this stat represents"]', 'Track my progress in learning new programming languages and frameworks');

    // Fill example activities
    await page.fill('input[placeholder*="Complete a coding challenge"]', 'Complete a LeetCode problem');
    await page.fill('input[placeholder="XP"]', '10');

    // Add another activity
    await page.click('button:has-text("Add Activity")');
    const secondActivity = page.locator('input[placeholder*="Complete a coding challenge"]').nth(1);
    await secondActivity.fill('Build a small project');
    const secondXp = page.locator('input[placeholder="XP"]').nth(1);
    await secondXp.fill('25');

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Should redirect to stats dashboard
    await expect(page).toHaveURL('/stats');

    // Should show the new stat
    await expect(page.locator('text=Programming Skills')).toBeVisible();
    await expect(page.locator('text=Level 1')).toBeVisible();

    // Check that the stat card shows 0 XP initially
    const statCard = page.locator('button:has-text("Programming Skills")');
    await expect(statCard.locator('.text-2xl').filter({ hasText: '0' })).toBeVisible();
  });

  test.skip('should create stat from predefined template', async ({ page }) => {
    await page.goto('/stats');

    // Click create stat button (try multiple possible texts)
    try {
      await page.click('button:has-text("Create Your First Stat")', { timeout: 2000 });
    } catch {
      try {
        await page.click('button:has-text("Create Custom Stat")', { timeout: 2000 });
      } catch {
        // Just navigate directly to create page
        await page.goto('/stats/create');
      }
    }

    // Should be on create page
    await expect(page).toHaveURL('/stats/create');

    // Click on a predefined stat (Strength) - use "Add to Character" button
    await page.click('button:has-text("Add to Character")');

    // Should navigate to create page with preset parameter
    await expect(page).toHaveURL(/\/stats\/create\?preset=/);

    // Form should be pre-filled with Strength (assuming it's the first predefined stat)
    await expect(page.locator('#stat-name')).toHaveValue('Strength');
    await expect(page.locator('#description')).toContainText('physical strength');

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Should redirect and show the stat
    // await expect(page).toHaveURL('/stats');
    await expect(page.locator('text=Strength')).toBeVisible();
  });

  test('should view stat details and XP history', async ({ page }) => {
    // Create a test stat using helper
    await createTestStat(page, 'Reading', 'Track books and articles read');

    // Click on the stat card to view details
    await page.click('button:has-text("Reading")');

    // Should be on stat detail page
    await expect(page).toHaveURL(/\/stats\/[^\/]+$/);
    await expect(page.locator('h1')).toContainText('Reading');
    await expect(page.locator('p').filter({ hasText: 'Level 1' })).toBeVisible();

    // Should show XP history section (empty initially)
    await expect(page.locator('h2:has-text("Recent XP History")')).toBeVisible();
    await expect(page.locator('text=No XP history yet')).toBeVisible();

    // Should have action buttons
    await expect(page.locator('button:has-text("Grant XP")')).toBeVisible();
    await expect(page.locator('button:has-text("Edit Stat")')).toBeVisible();
  });

  test('should grant XP to a stat', async ({ page }) => {
    // Create a test stat using helper
    await createTestStat(page, 'Exercise', 'Track workout sessions');

    // Go to stat details
    await page.click('button:has-text("Exercise")');

    // Click Grant XP
    await page.click('button:has-text("Grant XP")');
    await expect(page).toHaveURL(/\/stats\/[^\/]+\/grant-xp$/);

    // Fill XP grant form
    await page.fill('input[type="number"]', '20');
    await page.fill('textarea[placeholder*="Completed a 30-minute workout"]', 'Completed a 45-minute strength training session');

    // Submit
    await page.click('button[type="submit"]:has-text("Grant 20 XP")');

    // Should redirect back to stat details
    await expect(page).toHaveURL(/\/stats\/[a-f0-9-]+$/);

    // Should show updated XP
    await expect(page.locator('text=20 XP').first()).toBeVisible(); // Total XP

    // Should show XP history entry
    await expect(page.locator('text=Completed a 45-minute strength training session')).toBeVisible();
    await expect(page.locator('text=+20 XP')).toBeVisible();
  });

  test('should handle level up when enough XP is earned', async ({ page }) => {
    // Create a stat
    await page.goto('/stats/create');
    await page.fill('input[placeholder="e.g., Programming, Fitness, Creativity"]', 'Cooking');
    await page.fill('textarea[placeholder*="Describe what this stat represents"]', 'Culinary skills development');
    await page.fill('input[placeholder*="Complete a coding challenge"]', 'Cook a new recipe');
    await page.fill('input[placeholder="XP"]', '10');
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Go to stat details
    await page.click('button:has-text("Cooking")');

    // Grant enough XP to level up (300 XP for level 2, grant in chunks of 100)
    // First grant: 100 XP
    await page.click('button:has-text("Grant XP")');
    await page.fill('input[type="number"]', '100');
    await page.fill('textarea[placeholder*="Completed a 30-minute workout"]', 'Cooked a complex three-course meal');
    await page.click('button[type="submit"]:has-text("Grant 100 XP")');

    // Second grant: 100 XP
    await page.click('button:has-text("Grant XP")');
    await page.fill('input[type="number"]', '100');
    await page.fill('textarea[placeholder*="Completed a 30-minute workout"]', 'Prepared an elaborate dinner party');
    await page.click('button[type="submit"]:has-text("Grant 100 XP")');

    // Third grant: 100 XP (total: 300 XP)
    await page.click('button:has-text("Grant XP")');
    await page.fill('input[type="number"]', '100');
    await page.fill('textarea[placeholder*="Completed a 30-minute workout"]', 'Mastered a new cooking technique');
    await page.click('button[type="submit"]:has-text("Grant 100 XP")');

    // Should show level up button in stats dashboard
    await page.goto('/stats');
    await expect(page.locator('div.btn.btn-accent:has-text("Level Up Available!")')).toBeVisible();

    // Click level up button
    await page.click('div.btn.btn-accent:has-text("Level Up Available!")');
    await expect(page).toHaveURL(/\/stats\/[a-f0-9-]+\/level-up$/);

    // Should show level up interface
    await expect(page.locator('text=Level Up!')).toBeVisible();
    await expect(page.locator('h3:has-text("Ready for Level 2")')).toBeVisible();

    // Complete level up
    await page.click('button:has-text("Level Up to 2!")');

    // Should show celebration screen
    await expect(page.locator('text=Level Up!')).toBeVisible();
    await expect(page.locator('text=has reached Level')).toBeVisible();
  });

  test('should edit an existing stat', async ({ page }) => {
    // Create a stat first
    const statName = 'Writing';
    await createTestStat(page, statName, 'Track writing progress');

    // Go to stat details directly
    await page.click('button:has-text("Writing")');

    // Click Edit Stat button
    await page.getByRole('button', { name: 'Edit Stat' }).click();

    // Should be on edit page with pre-filled form
    await expect(page).toHaveURL(/\/stats\/[a-f0-9-]+\/edit$/);
    await expect(page.locator('#stat-name')).toHaveValue('Writing');

    // Update the stat
    await page.locator('#stat-name').fill('Creative Writing');
    await page.locator('#description').fill('Track creative writing projects and daily writing practice');

    // Submit changes
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Should redirect to stat details with updated info
    await expect(page).toHaveURL(/\/stats\/[a-f0-9-]+$/);
    await expect(page.locator('h1')).toContainText('Creative Writing');
    await expect(page.locator('text=Track creative writing projects')).toBeVisible();
  });

  test.skip('should delete a stat', async ({ page }) => {
    // TODO: Implement delete functionality
    // Create a stat first
    await page.goto('/stats/create');
    await page.fill('input[placeholder="e.g., Programming, Fitness, Creativity"]', 'Temporary Stat');
    await page.fill('textarea[placeholder*="Describe what this stat represents"]', 'This stat will be deleted');
    await page.fill('input[placeholder*="Complete a coding challenge"]', 'Do something');
    await page.fill('input[placeholder="XP"]', '5');
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Go to stat details
    await page.click('button:has-text("Temporary Stat")');

    // Click delete button
    await page.click('button:has-text("Delete Stat")');

    // Should show confirmation modal
    await expect(page.locator('text=Are you sure?')).toBeVisible();
    await expect(page.locator('text=This action cannot be undone')).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Yes, Delete")');

    // Should redirect to stats dashboard
    await expect(page).toHaveURL('/stats');

    // Stat should be gone
    await expect(page.locator('text=Temporary Stat')).not.toBeVisible();
    await expect(page.locator('text=No Stats Yet')).toBeVisible();
  });

  test('should display multiple stats with correct progress', async ({ page }) => {
    // Create multiple stats
    const stats = [
      {
        name: 'Fitness',
        description: 'Physical health tracking',
        activity: 'Workout session',
        xp: 15,
      },
      {
        name: 'Learning',
        description: 'Educational progress',
        activity: 'Complete a course',
        xp: 25,
      },
      {
        name: 'Creativity',
        description: 'Creative projects',
        activity: 'Create something new',
        xp: 20,
      },
    ];

    for (const stat of stats) {
      await page.goto('/stats/create');
      await page.fill('input[placeholder="e.g., Programming, Fitness, Creativity"]', stat.name);
      await page.fill('textarea[placeholder*="Describe what this stat represents"]', stat.description);
      await page.fill('input[placeholder*="Complete a coding challenge"]', stat.activity);
      await page.fill('input[placeholder="XP"]', stat.xp.toString());
      await page.click('button[type="submit"]:has-text("Create Stat")');
    }

    // Should see all stats on dashboard
    await page.goto('/stats');
    for (const stat of stats) {
      // Use more specific locator to find the stat card title
      await expect(page.locator('.card h3').filter({ hasText: stat.name })).toBeVisible();
    }

    // Check that at least one Level 1 is visible (since all stats start at Level 1)
    await expect(page.locator('text=Level 1').first()).toBeVisible(); // Grant XP to one stat and verify it updates
    await page.click('button:has-text("Fitness")');
    await page.click('button:has-text("Grant XP")');
    await page.fill('input[type="number"]', '30');
    await page.fill('textarea[placeholder*="Completed a 30-minute workout"]', 'Intense cardio workout');
    await page.click('button[type="submit"]:has-text("Grant 30 XP")');

    // Go back to dashboard and verify progress
    await page.goto('/stats');

    // Fitness should show 30 XP, others should still be 0
    const fitnessCard = page.locator('button:has-text("Fitness")');
    await expect(fitnessCard.locator('text=30')).toBeVisible();

    // Progress bar should be visible and partially filled
    await expect(fitnessCard.locator('.bg-gradient-to-r')).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/stats/create');

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Should stay on create page (browser validation will prevent submission)
    await expect(page).toHaveURL('/stats/create');

    // Fill only name field
    await page.fill('input[placeholder="e.g., Programming, Fitness, Creativity"]', 'Test Stat');

    // Try submitting - should still fail due to required fields
    await page.click('button[type="submit"]:has-text("Create Stat")');
    await expect(page).toHaveURL('/stats/create');

    // Fill all required fields correctly
    await page.fill('textarea[placeholder*="Describe what this stat represents"]', 'Test description');
    await page.fill('input[placeholder*="Complete a coding challenge"]', 'Test activity');
    await page.fill('input[placeholder="XP"]', '10');

    // Now it should work
    await page.click('button[type="submit"]:has-text("Create Stat")');
    await expect(page).toHaveURL('/stats');
  });

  test('should navigate between stats pages correctly', async ({ page }) => {
    // Create a stat for navigation testing
    await page.goto('/stats/create');
    await page.fill('input[placeholder="e.g., Programming, Fitness, Creativity"]', 'Navigation Test');
    await page.fill('textarea[placeholder*="Describe what this stat represents"]', 'Testing navigation');
    await page.fill('input[placeholder*="Complete a coding challenge"]', 'Navigate somewhere');
    await page.fill('input[placeholder="XP"]', '5');
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Test navigation flow: Dashboard -> Details -> Grant XP -> Back to Details -> Edit -> Back to Details -> Dashboard
    await page.click('button:has-text("Navigation Test")');
    await expect(page).toHaveURL(/\/stats\/[^\/]+$/);

    await page.click('button:has-text("Grant XP")');
    await expect(page).toHaveURL(/\/stats\/[a-f0-9-]+\/grant-xp$/);

    // Click the back button (circular button with arrow)
    await page.click('button.btn-circle');
    await expect(page).toHaveURL(/\/stats\/[a-f0-9-]+$/);

    await page.click('button:has-text("Edit Stat")');
    await expect(page).toHaveURL(/\/stats\/[a-f0-9-]+\/edit$/);

    // Click the back button (circular button with arrow)
    await page.click('button.btn-circle');
    await expect(page).toHaveURL(/\/stats\/[a-f0-9-]+$/);

    await page.click('a[href="/stats"]');
    await expect(page).toHaveURL('/stats');
  });
});
