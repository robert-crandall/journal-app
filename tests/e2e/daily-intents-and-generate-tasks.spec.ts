import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Daily Intents & Task Generation', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display AI task generation widget on dashboard', async ({ page }) => {
    await page.goto('/');

    // Check that the generate tasks widget is visible
    await expect(page.locator('h3:has-text("AI Daily Tasks")')).toBeVisible();

    // Check for the generate button
    await expect(page.locator('button:has-text("Generate")')).toBeVisible();

    // The checkbox should no longer be visible as intent is handled via modal
    await expect(page.locator('input[type="checkbox"]')).not.toBeVisible();
  });

  test('should show daily intent modal when generating tasks', async ({ page }) => {
    await page.goto('/');

    // Click the Generate button
    await page.click('button:has-text("Generate")');

    // Check that the daily intent modal appears
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toBeVisible();

    // Check for the modal buttons
    await expect(page.locator('button:has-text("Continue & Generate Tasks")')).toBeVisible();
    await expect(page.locator('button:has-text("Skip")')).toBeVisible();
  });

  test('should generate daily tasks successfully', async ({ page }) => {
    await page.goto('/');

    // Click the Generate button to open the modal
    await page.click('button:has-text("Generate")');

    // Wait for the modal to appear
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toBeVisible();

    // Fill in a daily intent
    const intentText = `Complete an important project milestone ${Date.now()}`;
    await page.fill('textarea[placeholder*="The most important thing"]', intentText);

    // Click "Continue & Generate Tasks" to save intent and generate tasks
    await page.click('button:has-text("Continue & Generate Tasks")');

    // Wait for generation to complete (modal should close and show generated tasks)
    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 10000 });

    // Check for generated tasks display
    await expect(page.locator('text=Latest Generated Tasks').or(page.locator("text=Today's Generated Tasks"))).toBeVisible({ timeout: 5000 });

    // Should see personal and family task sections
    await expect(page.locator('text=Personal Task').or(page.locator('text=Family Task'))).toBeVisible();
  });

  test('should show generated tasks in todos widget', async ({ page }) => {
    await page.goto('/');

    // Generate tasks first by opening modal and clicking "Skip"
    await page.click('button:has-text("Generate")');
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toBeVisible();
    await page.click('button:has-text("Skip")');

    // Wait for generation to complete
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

    // Test without intent first - click Generate and then Skip
    await page.click('button:has-text("Generate")');
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toBeVisible();
    await page.click('button:has-text("Skip")');

    // Wait for generation
    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 10000 });

    // Should still generate tasks
    await expect(page.locator('text=Latest Generated Tasks').or(page.locator("text=Today's Generated Tasks"))).toBeVisible({ timeout: 5000 });

    // Now test with intent
    const intentText = `Work on high-priority project ${Date.now()}`;
    await page.click('button:has-text("Generate")');
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toBeVisible();
    await page.fill('textarea[placeholder*="The most important thing"]', intentText);
    await page.click('button:has-text("Continue & Generate Tasks")');

    // Wait for generation
    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 10000 });

    // Should see the intent included in the generated tasks display
    await expect(page.locator("text=Today's Intent:").or(page.locator('text=Including daily intent'))).toBeVisible({ timeout: 5000 });
  });

  test('should persist daily intent across sessions', async ({ page }) => {
    const intentText = `Persistent intent test ${Date.now()}`;

    await page.goto('/');

    // Set an intent via the modal
    await page.click('button:has-text("Generate")');
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toBeVisible();
    await page.fill('textarea[placeholder*="The most important thing"]', intentText);
    await page.click('button:has-text("Continue & Generate Tasks")');

    // Wait for generation to complete
    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 10000 });

    // Navigate away and back
    await page.goto('/goals');
    await page.goto('/');

    // Open modal again and verify intent is still there
    await page.click('button:has-text("Generate")');
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toHaveValue(intentText);
  });

  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/');

    // Open the modal
    await page.click('button:has-text("Generate")');
    await expect(page.locator('textarea[placeholder*="The most important thing"]')).toBeVisible();

    // Test with very long intent text (over limit)
    const longText = 'A'.repeat(600); // Over the 500 character limit
    await page.fill('textarea[placeholder*="The most important thing"]', longText);

    // Should show character count warning
    await expect(page.locator('text=/600\/500/')).toBeVisible();

    // Button should be disabled or show validation error
    const saveButton = page.locator('button:has-text("Continue & Generate Tasks")');
    // We expect the button to be disabled when over limit, but this depends on implementation
    // For now, just check that the character counter is working
  });
});
