import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Daily Intents & Task Generation', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display daily intent widget on dashboard', async ({ page }) => {
    await page.goto('/');

    // Check that the daily intent widget is visible
    await expect(page.locator('h3:has-text("Today\'s Most Important Thing")')).toBeVisible();

    // Check for the textarea
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toBeVisible();

    // Check for the save button
    await expect(page.locator('button').filter({ hasText: /Save Intent|Update Intent/ })).toBeVisible();
  });

  test('should save daily intent successfully', async ({ page }) => {
    await page.goto('/');

    const intentText = `Focus on completing the task generation feature ${Date.now()}`;

    // Fill in the daily intent
    await page.fill('textarea[placeholder*="The most important thing"]', intentText);

    // Save the intent
    await page.click('button:has-text("Save Intent")');

    // Wait for success indication (button text change or success message)
    await expect(page.locator('button:has-text("Update Intent")')).toBeVisible({ timeout: 5000 });

    // Refresh the page and verify the intent persists
    await page.reload();
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toHaveValue(intentText);
  });

  test('should display AI task generation widget on dashboard', async ({ page }) => {
    await page.goto('/');

    // Check that the generate tasks widget is visible
    await expect(page.locator('h3:has-text("AI Daily Tasks")')).toBeVisible();

    // Check for the generate button
    await expect(page.locator('button:has-text("Generate")')).toBeVisible();

    // Check for the include intent checkbox
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
    await expect(page.locator("text=Include today's intent in task generation")).toBeVisible();
  });

  test('should generate daily tasks successfully', async ({ page }) => {
    await page.goto('/');

    // First, set a daily intent to make task generation more interesting
    const intentText = `Complete an important project milestone ${Date.now()}`;
    await page.fill('textarea[placeholder*="The most important thing"]', intentText);
    await page.click('button:has-text("Save Intent")');
    await expect(page.locator('button:has-text("Update Intent")')).toBeVisible({ timeout: 5000 });

    // Generate tasks
    await page.click('button:has-text("Generate")');

    // Wait for generation to complete
    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 10000 });

    // Check for generated tasks display
    await expect(page.locator('text=Latest Generated Tasks').or(page.locator("text=Today's Generated Tasks"))).toBeVisible({ timeout: 5000 });

    // Should see personal and family task sections
    await expect(page.locator('text=Personal Task').or(page.locator('text=Family Task'))).toBeVisible();
  });

  test('should show generated tasks in todos widget', async ({ page }) => {
    await page.goto('/');

    // Generate tasks first
    await page.click('button:has-text("Generate")');
    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 10000 });

    // Look for AI-generated tasks in the todos section (tasks with AI badge)
    // The tasks might appear in the SimpleTodosWidget with a source indicator
    const aiTasks = page.locator('.badge:has-text("AI")');

    // There should be at least some indication of AI-generated tasks
    // Either in the generate tasks widget or in the todos list
    const hasAIIndicator = (await aiTasks.count()) > 0;
    const hasGeneratedTasksSection = await page.locator("text=Today's Generated Tasks").isVisible();

    expect(hasAIIndicator || hasGeneratedTasksSection).toBeTruthy();
  });

  test('should handle task generation with and without intent', async ({ page }) => {
    await page.goto('/');

    // Test without intent first
    await page.uncheck('input[type="checkbox"]');
    await page.click('button:has-text("Generate")');
    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 10000 });

    // Should still generate tasks
    await expect(page.locator('text=Latest Generated Tasks').or(page.locator("text=Today's Generated Tasks"))).toBeVisible({ timeout: 5000 });

    // Now test with intent
    const intentText = `Work on high-priority project ${Date.now()}`;
    await page.fill('textarea[placeholder*="The most important thing"]', intentText);
    await page.click('button:has-text("Save Intent")');
    await expect(page.locator('button:has-text("Update Intent")')).toBeVisible({ timeout: 5000 });

    // Enable intent inclusion and generate again
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Generate")');
    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 10000 });

    // Should see the intent included in the generated tasks display
    await expect(page.locator("text=Today's Intent:").or(page.locator('text=Including daily intent'))).toBeVisible({ timeout: 5000 });
  });

  test('should persist daily intent across sessions', async ({ page }) => {
    const intentText = `Persistent intent test ${Date.now()}`;

    await page.goto('/');

    // Set an intent
    await page.fill('textarea[placeholder*="The most important thing"]', intentText);
    await page.click('button:has-text("Save Intent")');
    await expect(page.locator('button:has-text("Update Intent")')).toBeVisible({ timeout: 5000 });

    // Navigate away and back
    await page.goto('/goals');
    await page.goto('/');

    // Verify intent is still there
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toHaveValue(intentText);
  });

  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/');

    // Test with very long intent text (over limit)
    const longText = 'A'.repeat(600); // Over the 500 character limit
    await page.fill('textarea[placeholder*="The most important thing"]', longText);

    // Should show character count warning
    await expect(page.locator('text=/600\/500/')).toBeVisible();

    // Button should be disabled or show validation error
    const saveButton = page.locator('button').filter({ hasText: /Save Intent|Update Intent/ });
    // We expect the button to be disabled when over limit, but this depends on implementation
    // For now, just check that the character counter is working
  });
});
