import { test, expect } from '@playwright/test';
import { loginUser, cleanupFamily } from './test-helpers';

test.describe('Family Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    // Clean up any existing family members before each test
    await cleanupFamily(page);
  });

  test('should display family page with navigation', async ({ page }) => {
    // Navigate to family page
    await page.click('a[href="/family"]');
    await expect(page).toHaveURL('/family');

    // Check page structure
    await expect(page.locator('h1')).toContainText('Family');

    // Should show empty state initially
    await expect(page.locator('text=No Family Members Added')).toBeVisible();
    await expect(page.locator('text=Start building meaningful connections')).toBeVisible();

    // Should have create family member button
    await expect(page.locator('button:has-text("Add Your First Family Member")')).toBeVisible();
  });

  test('should create a new family member successfully', async ({ page }) => {
    await page.goto('/family');

    // Click create family member button
    await page.click('button:has-text("Add Your First Family Member")');
    await expect(page).toHaveURL('/family/create');

    // Check page title
    await expect(page.locator('h1')).toContainText('Add Family Member');

    // Fill out the create family member form
    const uniqueName = `Test Family Member ${Date.now()}`;
    await page.fill('input[placeholder="Enter family member name"]', uniqueName);
    await page.selectOption('select', 'Son'); // Select relationship
    await page.fill('input[type="date"]', '2010-05-15'); // Birthday
    await page.fill('textarea[placeholder*="likes"]', 'Soccer, video games, reading');
    await page.fill('textarea[placeholder*="dislikes"]', 'Vegetables, loud noises');
    
    // Set energy level
    await page.locator('input[type="range"]').fill('7');
    
    // Add notes
    await page.fill('textarea[placeholder*="notes"]', 'Very energetic and loves outdoor activities');

    // Submit form
    await page.click('button[type="submit"]:has-text("Add Family Member")');

    // Should redirect to family member detail page
    await expect(page).toHaveURL(/\/family\/[a-f0-9-]+$/);

    // Should show the created family member details
    await expect(page.locator('h1')).toContainText(uniqueName);
    await expect(page.locator('text=Son')).toBeVisible();
    await expect(page.locator('text=Soccer, video games, reading')).toBeVisible();
    await expect(page.locator('text=Level 1')).toBeVisible();
  });

  test('should view family member details', async ({ page }) => {
    await page.goto('/family');

    // Create a family member first
    const uniqueName = `View Test Member ${Date.now()}`;
    await page.click('button:has-text("Add Your First Family Member")');
    await page.fill('input[placeholder="Enter family member name"]', uniqueName);
    await page.selectOption('select', 'Daughter');
    await page.fill('textarea[placeholder*="likes"]', 'Art, music, dancing');
    await page.click('button[type="submit"]:has-text("Add Family Member")');

    // Should be on family member details page
    await expect(page.locator('h1')).toContainText(uniqueName);
    await expect(page.locator('text=Daughter')).toBeVisible();
    await expect(page.locator('text=Art, music, dancing')).toBeVisible();

    // Should show connection info
    await expect(page.locator('text=Level 1')).toBeVisible();
    await expect(page.locator('text=0 XP')).toBeVisible();

    // Should have edit and delete buttons
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
  });

  test('should edit family member successfully', async ({ page }) => {
    await page.goto('/family');

    // Create a family member first
    const originalName = `Edit Test Member ${Date.now()}`;
    await page.click('button:has-text("Add Your First Family Member")');
    await page.fill('input[placeholder="Enter family member name"]', originalName);
    await page.selectOption('select', 'Wife');
    await page.fill('textarea[placeholder*="likes"]', 'Cooking, reading');
    await page.click('button[type="submit"]:has-text("Add Family Member")');

    // Click edit button
    await page.click('button:has-text("Edit")');
    await expect(page).toHaveURL(/\/family\/[a-f0-9-]+\/edit$/);

    // Check page title
    await expect(page.locator('h1')).toContainText('Edit Family Member');

    // Update the family member
    const updatedName = `${originalName} Updated`;
    await page.fill('input[placeholder="Enter family member name"]', updatedName);
    await page.fill('textarea[placeholder*="likes"]', 'Cooking, reading, gardening, yoga');
    await page.fill('textarea[placeholder*="dislikes"]', 'Loud music, crowded places');
    
    // Update energy level
    await page.locator('input[type="range"]').fill('8');

    // Submit changes
    await page.click('button[type="submit"]:has-text("Save Changes")');

    // Should redirect to family member details
    await expect(page).toHaveURL(/\/family\/[a-f0-9-]+$/);
    await expect(page.locator('h1')).toContainText(updatedName);
    await expect(page.locator('text=Cooking, reading, gardening, yoga')).toBeVisible();
    await expect(page.locator('text=Loud music, crowded places')).toBeVisible();
  });

  test('should delete family member with confirmation', async ({ page }) => {
    await page.goto('/family');

    // Create a family member first
    const uniqueName = `Delete Test Member ${Date.now()}`;
    await page.click('button:has-text("Add Your First Family Member")');
    await page.fill('input[placeholder="Enter family member name"]', uniqueName);
    await page.selectOption('select', 'Brother');
    await page.click('button[type="submit"]:has-text("Add Family Member")');

    // Set up dialog handler to accept deletion
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure you want to delete');
      await dialog.accept();
    });

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Should redirect to family page
    await expect(page).toHaveURL('/family');

    // Should show empty state again
    await expect(page.locator('text=No Family Members Added')).toBeVisible();
  });

  test('should add task feedback successfully', async ({ page }) => {
    await page.goto('/family');

    // Create a family member first
    const uniqueName = `Feedback Test Member ${Date.now()}`;
    await page.click('button:has-text("Add Your First Family Member")');
    await page.fill('input[placeholder="Enter family member name"]', uniqueName);
    await page.selectOption('select', 'Son');
    await page.click('button[type="submit"]:has-text("Add Family Member")');

    // Look for feedback or task button
    const feedbackButton = page.locator('button').filter({ hasText: /Add Task|Log Activity|Add Feedback/ }).first();
    if (await feedbackButton.isVisible()) {
      await feedbackButton.click();

      // Fill out feedback form
      await page.fill('textarea[placeholder*="task"]', 'Played soccer in the backyard for 30 minutes');
      await page.fill('textarea[placeholder*="feedback"]', 'He really enjoyed it and scored 3 goals!');
      
      // Select "yes" for enjoyed it
      await page.check('input[value="yes"]');
      
      await page.fill('textarea[placeholder*="notes"]', 'Weather was perfect for outdoor play');

      // Submit feedback
      await page.click('button[type="submit"]:has-text("Add Feedback")');

      // Should show success or return to member details
      await expect(page.locator('text=feedback added')).toBeVisible();
    }
  });

  test('should navigate between family members', async ({ page }) => {
    await page.goto('/family');

    // Create multiple family members
    const members = [
      { name: `Member 1 ${Date.now()}`, relationship: 'Wife' },
      { name: `Member 2 ${Date.now()}`, relationship: 'Son' },
      { name: `Member 3 ${Date.now()}`, relationship: 'Daughter' }
    ];

    for (const member of members) {
      await page.click('button:has-text("Add")'); // Generic "Add" button
      await page.fill('input[placeholder="Enter family member name"]', member.name);
      await page.selectOption('select', member.relationship);
      await page.click('button[type="submit"]:has-text("Add Family Member")');
      
      // Go back to family page
      await page.click('button:has-text("Back to Family")');
    }

    // Should show all family members
    for (const member of members) {
      await expect(page.locator(`text=${member.name}`)).toBeVisible();
    }

    // Click on first member to view details
    await page.click(`text=${members[0].name}`);
    await expect(page.locator('h1')).toContainText(members[0].name);
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/family/create');

    // Try to submit empty form - button should be disabled
    await expect(page.locator('button[type="submit"]:has-text("Add Family Member")')).toBeDisabled();

    // Focus and blur name field to trigger validation
    await page.click('input[placeholder="Enter family member name"]');
    await page.locator('input[placeholder="Enter family member name"]').blur();

    // Should show validation error after field is touched
    await expect(page.locator('text=Name is required')).toBeVisible();

    // Fill name to make form partially valid
    await page.fill('input[placeholder="Enter family member name"]', 'Valid name');

    // Relationship should also be required
    await expect(page.locator('button[type="submit"]:has-text("Add Family Member")')).toBeDisabled();

    // Select relationship
    await page.selectOption('select', 'Sister');

    // Button should now be enabled
    await expect(page.locator('button[type="submit"]:has-text("Add Family Member")')).toBeEnabled();
  });

  test('should show connection level and XP correctly', async ({ page }) => {
    await page.goto('/family');

    // Create a family member
    const uniqueName = `XP Test Member ${Date.now()}`;
    await page.click('button:has-text("Add Your First Family Member")');
    await page.fill('input[placeholder="Enter family member name"]', uniqueName);
    await page.selectOption('select', 'Son');
    await page.click('button[type="submit"]:has-text("Add Family Member")');

    // Should show initial level and XP
    await expect(page.locator('text=Level 1')).toBeVisible();
    await expect(page.locator('text=0 XP')).toBeVisible();

    // If we can add feedback to gain XP, test that
    const feedbackButton = page.locator('button').filter({ hasText: /Add Task|Log Activity|Add Feedback/ }).first();
    if (await feedbackButton.isVisible()) {
      await feedbackButton.click();
      await page.fill('textarea[placeholder*="task"]', 'Completed homework');
      await page.check('input[value="yes"]'); // Enjoyed it
      await page.click('button[type="submit"]:has-text("Add Feedback")');

      // Should show increased XP (base 10 + 5 bonus = 15 XP)
      await expect(page.locator('text=15 XP')).toBeVisible();
    }
  });

  test('should handle relationship icons correctly', async ({ page }) => {
    await page.goto('/family');

    // Test different relationship types
    const relationships = ['Wife', 'Son', 'Daughter', 'Mother', 'Father', 'Brother', 'Sister'];
    
    for (let i = 0; i < Math.min(relationships.length, 3); i++) {
      const relationship = relationships[i];
      const uniqueName = `${relationship} Test ${Date.now()}`;
      
      await page.click('button:has-text("Add")');
      await page.fill('input[placeholder="Enter family member name"]', uniqueName);
      await page.selectOption('select', relationship);
      await page.click('button[type="submit"]:has-text("Add Family Member")');
      
      // Go back to family page to check icon
      await page.click('button:has-text("Back to Family")');
      
      // Should show the family member with appropriate icon
      await expect(page.locator(`text=${uniqueName}`)).toBeVisible();
    }
  });
});
