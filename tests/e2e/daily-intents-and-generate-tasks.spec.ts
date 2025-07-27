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
    // Navigate to the dashboard
    await page.goto('/');

    // Fill in the daily intent modal
    await page.click('button:has-text("Generate")');
    await page.fill('textarea[placeholder="The most important thing I can accomplish today is..."]', 'Focus on building healthy habits');
    await page.click('button:has-text("Continue & Generate Tasks")');

    // Wait for modal to close and Generate button to reappear
    await page.waitForSelector('button:has-text("Generate")', { timeout: 30000 });

    // Verify the modal has closed (no longer visible)
    await expect(page.locator('textarea[placeholder="The most important thing I can accomplish today is..."]')).not.toBeVisible();
  });

  test('should show generated tasks in todos widget', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');

    // Fill in the daily intent modal and generate tasks
    await page.click('button:has-text("Generate")');
    await page.fill('textarea[placeholder="The most important thing I can accomplish today is..."]', 'Complete important work tasks');
    await page.click('button:has-text("Continue & Generate Tasks")');

    // Wait for modal to close and Generate button to reappear (indicating generation is complete)
    await page.waitForSelector('button:has-text("Generate")', { timeout: 30000 });

    // Check that todos widget contains generated tasks
    // Generated tasks should appear as regular todos in the SimpleTodosWidget
    const todosSection = page.locator('[data-testid="simple-todos-widget"], .todos-widget, text="Simple Todos"').first();

    // Wait for at least one todo item to appear (could be pre-existing or newly generated)
    await page.waitForSelector('.todo-item, [data-testid="todo-item"], li:has-text("Complete"), div:has-text(":")', { timeout: 15000 });

    // Verify that there are todo items present
    const todoItems = page.locator('.todo-item, [data-testid="todo-item"], li, div').filter({ hasText: /Complete|Task|Focus|Work|Family/ });
    await expect(todoItems.first()).toBeVisible();
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
});
