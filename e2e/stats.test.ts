import { test, expect } from '@playwright/test';

test.describe('Stats Management', () => {
  test.beforeEach(async ({ page }) => {
    // Register a test user
    const testUser = {
      email: `stats-test-${Date.now()}@journal.com`,
      password: 'password123',
      name: 'Stats Test User',
    };

    await page.goto('/register');
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should be logged in and on dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show empty state when no stats exist', async ({ page }) => {
    await page.goto('/stats');

    await expect(page.locator('h1')).toContainText('Character Stats');
    await expect(page.locator('text=No stats yet')).toBeVisible();
    await expect(page.locator('text=Create your first stat')).toBeVisible();
  });

  test('should create a new stat successfully', async ({ page }) => {
    await page.goto('/stats');

    // Click create stat button
    await page.click('button:has-text("Create Your First Stat")');

    // Fill out the form
    await page.fill('input[name="name"]', 'Strength');
    await page.fill('textarea[name="description"]', 'Physical strength and fitness');

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Should show the new stat
    await expect(page.locator('h3:has-text("Strength")')).toBeVisible();
    await expect(page.locator('text=Physical strength and fitness')).toBeVisible();
    await expect(page.locator('text=Level 1')).toBeVisible();
    await expect(page.locator('text=0 XP')).toBeVisible();
    await expect(page.locator('text=100 to next level')).toBeVisible();
  });

  test('should award XP and level up', async ({ page }) => {
    await page.goto('/stats');

    // Create a stat first
    await page.click('button:has-text("Create Your First Stat")');
    await page.fill('input[name="name"]', 'Test Stat');
    await page.fill('textarea[name="description"]', 'A test stat');
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Award XP to level up
    await page.click('button:has-text("⋮")');
    await page.click('button:has-text("Award XP")');

    await page.fill('input[name="amount"]', '100');
    await page.fill('input[name="comment"]', 'Test activity');
    await page.click('button[type="submit"]:has-text("Award XP")');

    // Should level up (100 XP reaches level 2)
    await expect(page.locator('text=Level up!')).toBeVisible();
    await expect(page.locator('text=Level 2')).toBeVisible();
    await expect(page.locator('text=100 XP')).toBeVisible();
  });

  test('should manage stat activities', async ({ page }) => {
    await page.goto('/stats');

    // Create a stat
    await page.click('button:has-text("Create Your First Stat")');
    await page.fill('input[name="name"]', 'Fitness');
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Go to stat detail page
    await page.click('button:has-text("⋮")');
    await page.click('a:has-text("View History")');

    // Add an activity
    await page.click('button:has-text("Add Activity")');
    await page.fill('input[name="description"]', 'Push-ups');
    await page.fill('input[name="suggestedXp"]', '15');
    await page.click('button[type="submit"]:has-text("Add Activity")');

    // Should show the activity
    await expect(page.locator('text=Push-ups')).toBeVisible();
    await expect(page.locator('text=+15 XP')).toBeVisible();
  });

  test('should show XP history', async ({ page }) => {
    await page.goto('/stats');

    // Create a stat
    await page.click('button:has-text("Create Your First Stat")');
    await page.fill('input[name="name"]', 'Test Stat');
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Award some XP
    await page.click('button:has-text("⋮")');
    await page.click('button:has-text("Award XP")');
    await page.fill('input[name="amount"]', '50');
    await page.fill('input[name="comment"]', 'First activity');
    await page.click('button[type="submit"]:has-text("Award XP")');

    // Go to history
    await page.click('button:has-text("⋮")');
    await page.click('a:has-text("View History")');

    // Should show XP history
    await expect(page.locator('text=+50 XP')).toBeVisible();
    await expect(page.locator('text=First activity')).toBeVisible();
    await expect(page.locator('text=adhoc')).toBeVisible();
    await expect(page.locator('text=Total XP Earned')).toBeVisible();
    await expect(page.locator('text=50').first()).toBeVisible(); // Total XP
  });

  test('should edit and delete stats', async ({ page }) => {
    await page.goto('/stats');

    // Create a stat
    await page.click('button:has-text("Create Your First Stat")');
    await page.fill('input[name="name"]', 'Original Name');
    await page.fill('textarea[name="description"]', 'Original description');
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Edit the stat
    await page.click('button:has-text("⋮")');
    await page.click('button:has-text("Edit")');

    await page.fill('input[name="name"]', 'Updated Name');
    await page.fill('textarea[name="description"]', 'Updated description');
    await page.click('button[type="submit"]:has-text("Save")');

    // Should show updated content
    await expect(page.locator('h3:has-text("Updated Name")')).toBeVisible();
    await expect(page.locator('text=Updated description')).toBeVisible();

    // Delete the stat
    await page.click('button:has-text("⋮")');
    await page.click('button[type="submit"]:has-text("Delete")');

    // Should return to empty state
    await expect(page.locator('text=No stats yet')).toBeVisible();
  });

  test('should navigate between stats and other pages', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate to stats via user menu
    await page.click('[data-testid="user-avatar-button"]');
    await page.click('a:has-text("Stats")');

    await expect(page).toHaveURL('/stats');
    await expect(page.locator('h1')).toContainText('Character Stats');

    // Create a stat and navigate to detail page
    await page.click('button:has-text("Create Your First Stat")');
    await page.fill('input[name="name"]', 'Navigation Test');
    await page.click('button[type="submit"]:has-text("Create Stat")');

    await page.click('button:has-text("⋮")');
    await page.click('a:has-text("View History")');

    await expect(page).toHaveURL(/\/stats\/[a-f0-9-]+/);
    await expect(page.locator('h1')).toContainText('Navigation Test');

    // Navigate back
    await page.locator('button').first().click(); // Back button
    await expect(page).toHaveURL('/stats');
  });

  test('should calculate XP and levels correctly', async ({ page }) => {
    await page.goto('/stats');

    // Create a stat
    await page.click('button:has-text("Create Your First Stat")');
    await page.fill('input[name="name"]', 'XP Test');
    await page.click('button[type="submit"]:has-text("Create Stat")');

    // Start at level 1 with 0 XP
    await expect(page.locator('text=Level 1')).toBeVisible();
    await expect(page.locator('text=0 XP')).toBeVisible();
    await expect(page.locator('text=100 to next level')).toBeVisible();

    // Award 99 XP (still level 1)
    await page.click('button:has-text("⋮")');
    await page.click('button:has-text("Award XP")');
    await page.fill('input[name="amount"]', '99');
    await page.click('button[type="submit"]:has-text("Award XP")');

    // Should still be level 1
    await expect(page.locator('text=Level 1')).toBeVisible();
    await expect(page.locator('text=99 XP')).toBeVisible();
    await expect(page.locator('text=1 to next level')).toBeVisible(); // 100 - 99 = 1

    // Award 1 more XP to reach level 2 (100 total)
    await page.click('button:has-text("⋮")');
    await page.click('button:has-text("Award XP")');
    await page.fill('input[name="amount"]', '1');
    await page.click('button[type="submit"]:has-text("Award XP")');

    // Should level up to level 2
    await expect(page.locator('text=Level up!')).toBeVisible();
    await expect(page.locator('text=Level 2')).toBeVisible();
    await expect(page.locator('text=100 XP')).toBeVisible();
    await expect(page.locator('text=200 to next level')).toBeVisible(); // 300 - 100 = 200
  });
});
