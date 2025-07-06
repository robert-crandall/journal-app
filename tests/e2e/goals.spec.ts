import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Goals Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
  });

  test('should display goals dashboard with navigation', async ({ page }) => {
    // Navigate to goals page
    await page.click('a[href="/goals"]');
    await expect(page).toHaveURL('/goals');

    // Check page title and structure
    await expect(page.locator('h1')).toContainText('Goals Dashboard');
    await expect(page.locator('text=Define and track your personal objectives')).toBeVisible();

    // Should show empty state initially
    await expect(page.locator('text=No Active Goals')).toBeVisible();
    await expect(page.locator('text=Start defining your objectives')).toBeVisible();

    // Should have create goal button
    await expect(page.locator('button:has-text("Create Your First Goal")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Goal")')).toBeVisible();

    // Should have filter controls
    await expect(page.locator('text=Show Archived')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  });

  test('should create a new goal successfully', async ({ page }) => {
    await page.goto('/goals');

    // Click create goal button
    await page.click('button:has-text("Create Your First Goal")');
    await expect(page).toHaveURL('/goals/create');

    // Check page title
    await expect(page.locator('h1')).toContainText('Create New Goal');

    // Fill out the create goal form
    await page.fill('input#title', 'Improve my relationship with family');
    await page.fill('textarea#description', 'Spend more quality time with family members and strengthen our bonds through regular activities and meaningful conversations.');

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
    await expect(page.locator('text=Improve my relationship with family')).toBeVisible();
    await expect(page.locator('.badge:has-text("Active")')).toBeVisible();
    await expect(page.locator('.badge:has-text("family")')).toBeVisible();
    await expect(page.locator('.badge:has-text("growth")')).toBeVisible();
  });

  test('should view goal details', async ({ page }) => {
    await page.goto('/goals');

    // Create a goal first
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', 'Learn new programming language');
    await page.fill('textarea#description', 'Master TypeScript and its advanced features');
    await page.fill('input#tag-input', 'career');
    await page.click('button:has-text("Add")');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Click on the goal to view details
    await page.click('button:has-text("View")');
    
    // Should show goal details page
    await expect(page.locator('h1')).toContainText('Learn new programming language');
    await expect(page.locator('text=Master TypeScript and its advanced features')).toBeVisible();
    await expect(page.locator('.badge:has-text("career")')).toBeVisible();
    await expect(page.locator('.badge:has-text("Active")')).toBeVisible();

    // Should have action buttons
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    await expect(page.locator('button:has-text("Archive")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();

    // Should show goal status info
    await expect(page.locator('text=Goal Status')).toBeVisible();
    await expect(page.locator('text=Created:')).toBeVisible();
    await expect(page.locator('text=Last Updated:')).toBeVisible();
  });

  test('should edit goal successfully', async ({ page }) => {
    await page.goto('/goals');

    // Create a goal first
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', 'Exercise regularly');
    await page.fill('textarea#description', 'Go to gym 3 times per week');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Click edit button
    await page.click('button:has-text("Edit")');
    
    // Should be on edit page
    await expect(page.locator('h1')).toContainText('Edit Goal');
    
    // Update the goal
    await page.fill('input#title', 'Exercise regularly and build strength');
    await page.fill('textarea#description', 'Go to gym 3 times per week and focus on progressive overload training');
    
    // Add a tag
    await page.fill('input#tag-input', 'health');
    await page.click('button:has-text("Add")');

    // Submit changes
    await page.click('button[type="submit"]:has-text("Save Changes")');

    // Should redirect to goal details
    await expect(page.locator('h1')).toContainText('Exercise regularly and build strength');
    await expect(page.locator('text=focus on progressive overload training')).toBeVisible();
    await expect(page.locator('.badge:has-text("health")')).toBeVisible();
  });

  test('should archive and unarchive goal', async ({ page }) => {
    await page.goto('/goals');

    // Create a goal first
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', 'Read 12 books this year');
    await page.fill('textarea#description', 'Expand knowledge through consistent reading');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Archive the goal
    await page.click('button:has-text("Archive")');
    
    // Goal should disappear from active goals (default view)
    await expect(page.locator('text=Read 12 books this year')).not.toBeVisible();
    await expect(page.locator('text=No Active Goals')).toBeVisible();

    // Switch to archived view
    await page.check('input[type="checkbox"]:near(text="Show Archived")');
    
    // Should show archived goal
    await expect(page.locator('text=Read 12 books this year')).toBeVisible();
    await expect(page.locator('.badge:has-text("Archived")')).toBeVisible();

    // Unarchive the goal
    await page.click('button:has-text("Unarchive")');

    // Switch back to active view
    await page.uncheck('input[type="checkbox"]:near(text="Show Archived")');
    
    // Goal should be visible again
    await expect(page.locator('text=Read 12 books this year')).toBeVisible();
    await expect(page.locator('.badge:has-text("Active")')).toBeVisible();
  });

  test('should delete goal with confirmation', async ({ page }) => {
    await page.goto('/goals');

    // Create a goal first
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', 'Temporary goal for deletion');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Try to delete goal
    await page.click('button:has-text("Delete")');
    
    // Should show confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete');
      await dialog.dismiss(); // Cancel first
    });

    // Goal should still be there
    await expect(page.locator('text=Temporary goal for deletion')).toBeVisible();

    // Delete for real
    page.on('dialog', async dialog => {
      await dialog.accept(); // Confirm deletion
    });
    
    await page.click('button:has-text("Delete")');
    
    // Goal should be gone
    await expect(page.locator('text=Temporary goal for deletion')).not.toBeVisible();
    await expect(page.locator('text=No Active Goals')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/goals/create');

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Create Goal")');
    
    // Should show validation error
    await expect(page.locator('text=Title is required')).toBeVisible();
    
    // Button should be disabled for invalid form
    await expect(page.locator('button[type="submit"]:has-text("Create Goal")')).toBeDisabled();

    // Fill title to make form valid
    await page.fill('input#title', 'Valid goal title');
    
    // Button should now be enabled
    await expect(page.locator('button[type="submit"]:has-text("Create Goal")')).toBeEnabled();

    // Test title length validation
    const longTitle = 'a'.repeat(256); // Over 255 character limit
    await page.fill('input#title', longTitle);
    await expect(page.locator('text=Title must be 255 characters or less')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Create Goal")')).toBeDisabled();
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

    // Should show zero stats initially
    await expect(page.locator('text=Active Goals:')).toBeVisible();
    await expect(page.locator('text=Total Goals:')).toBeVisible();
    await expect(page.locator('text=Archived:')).toBeVisible();

    // Create a goal
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', 'Test goal for stats');
    await page.fill('input#tag-input', 'family');
    await page.click('button:has-text("Add")');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Stats should update
    const activeGoalsCount = page.locator('text=Active Goals:').locator('..').locator('span').last();
    await expect(activeGoalsCount).toContainText('1');

    const totalGoalsCount = page.locator('text=Total Goals:').locator('..').locator('span').last();
    await expect(totalGoalsCount).toContainText('1');

    const mostUsedTag = page.locator('text=Most Used Tag:').locator('..').locator('span').last();
    await expect(mostUsedTag).toContainText('family');
  });

  test('should navigate between related features', async ({ page }) => {
    await page.goto('/goals');

    // Create a goal first
    await page.click('button:has-text("Create Goal")');
    await page.fill('input#title', 'Navigation test goal');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Click to view goal details
    await page.click('button:has-text("View")');

    // Navigate to character from goal details
    await page.click('button:has-text("View"):near(text="Character Profile")');
    await expect(page).toHaveURL('/character');

    // Go back to goals
    await page.click('a[href="/goals"]');
    await expect(page).toHaveURL('/goals');

    // Navigate to stats
    await page.click('button:has-text("View"):near(text="Stats Dashboard")');
    await expect(page).toHaveURL('/stats');
  });

  test('should show goal icons based on tags', async ({ page }) => {
    await page.goto('/goals');

    // Create goals with different tag types
    const goalTypes = [
      { title: 'Family goal', tag: 'family', expectedIcon: '👨‍👩‍👧‍👦' },
      { title: 'Health goal', tag: 'health', expectedIcon: '💪' },
      { title: 'Career goal', tag: 'career', expectedIcon: '💼' },
      { title: 'Spiritual goal', tag: 'spiritual', expectedIcon: '🙏' },
      { title: 'Default goal', tag: 'other', expectedIcon: '🎯' }
    ];

    for (const goalType of goalTypes) {
      await page.click('button:has-text("Create Goal")');
      await page.fill('input#title', goalType.title);
      await page.fill('input#tag-input', goalType.tag);
      await page.click('button:has-text("Add")');
      await page.click('button[type="submit"]:has-text("Create Goal")');

      // Verify the goal appears with expected icon
      const goalCard = page.locator(`text=${goalType.title}`).locator('..');
      await expect(goalCard.locator(`text=${goalType.expectedIcon}`)).toBeVisible();
    }
  });
});
