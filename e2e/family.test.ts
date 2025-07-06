import { test, expect } from '@playwright/test';

test.describe('Family Management', () => {
  // Shared user for all tests in this suite
  let testUser;

  test.beforeAll(async ({ browser }) => {
    // Create a user once for all tests
    const context = await browser.newContext();
    const page = await context.newPage();

    testUser = {
      email: `family-test-${Date.now()}@journal.com`,
      password: 'familytest123',
      name: `Family User ${Date.now()}`,
    };

    // Register the user
    await page.goto('/register');
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('text=Create Account');
    await expect(page).toHaveURL('/dashboard');

    await context.close();
  });

  // Helper function to login the existing user
  async function loginUser(page) {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('text=Sign In');
    await page.waitForURL('/dashboard');
    return testUser;
  }

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display family page correctly', async ({ page }) => {
    await page.goto('/family');

    // Check page title and heading
    await expect(page).toHaveTitle('Family - Journal App');
    await expect(page.locator('h1')).toContainText('Family Members');

    // Check empty state
    await expect(page.locator('text=No family members yet')).toBeVisible();
    await expect(page.locator('text=Add Your First Family Member')).toBeVisible();
  });

  test('should create a new family member', async ({ page }) => {
    await page.goto('/family');

    // Click add family member button - should navigate to separate page
    await page.click('text=Add Family Member');
    
    // Should be on the new family member page
    await expect(page).toHaveURL('/family/new');
    await expect(page.locator('h1')).toContainText('Add Family Member');

    // Fill out the form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="relationship"]', 'eldest son');
    await page.fill('input[name="birthday"]', '2010-05-15');
    await page.selectOption('select[name="energyLevel"]', 'active');
    await page.fill('textarea[name="likes"]', 'soccer, video games, drawing');
    await page.fill('textarea[name="dislikes"]', 'vegetables, loud noises');

    // Submit the form
    await page.locator('text=Add Family Member').nth(1).click(); // nth: 1 to get the submit button, not the main nav button

    // Should redirect back to family page
    await expect(page).toHaveURL('/family');

    // Check that the family member appears
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=eldest son')).toBeVisible();
    await expect(page.locator('text=active')).toBeVisible();
    await expect(page.locator('text=soccer')).toBeVisible();
    await expect(page.locator('text=vegetables')).toBeVisible();
  });

  test('should edit a family member', async ({ page }) => {
    await page.goto('/family');

    // Create a family member first
    await page.click('text=Add Family Member');
    await expect(page).toHaveURL('/family/new');
    await page.fill('input[name="name"]', 'Jane Doe');
    await page.fill('input[name="relationship"]', 'daughter');
    await page.click('text=Add Family Member');
    await expect(page).toHaveURL('/family');

    // Wait for the member to appear
    await expect(page.locator('text=Jane Doe')).toBeVisible();

    // Click the edit button (three dots menu button, not label)
    await page.locator('button:has(svg)').first().click();
    await page.click('text=Edit Details');

    // Should navigate to edit page
    await expect(page.url()).toContain('/family/');
    await expect(page.url()).toContain('/edit');
    await expect(page.locator('h1')).toContainText('Edit Jane Doe');

    // Edit the name
    await page.fill('input[name="name"]', 'Jane Smith');
    await page.fill('input[name="relationship"]', 'stepdaughter');

    // Save changes
    await page.click('text=Update Family Member');

    // Should redirect back to family page
    await expect(page).toHaveURL('/family');

    // Check that changes are reflected
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    await expect(page.locator('text=stepdaughter')).toBeVisible();
  });

  test('should delete a family member', async ({ page }) => {
    await page.goto('/family');

    // Create a family member first
    await page.click('text=Add Family Member');
    await expect(page).toHaveURL('/family/new');
    await page.fill('input[name="name"]', 'Test Member');
    await page.fill('input[name="relationship"]', 'test');
    await page.locator('text=Add Family Member').nth(1).click();
    await expect(page).toHaveURL('/family');

    // Wait for the member to appear
    await expect(page.locator('text=Test Member')).toBeVisible();

    // Set up dialog handler for confirmation
    page.on('dialog', (dialog) => dialog.accept());

    // Click delete
    await page.locator('button:has(svg)').first().click();
    await page.click('text=Delete');

    // Check that member is removed
    await expect(page.locator('text=Test Member')).not.toBeVisible();
    await expect(page.locator('text=No family members yet')).toBeVisible();
  });

  test('should update last interaction', async ({ page }) => {
    await page.goto('/family');

    // Create a family member first
    await page.click('text=Add Family Member');
    await expect(page).toHaveURL('/family/new');
    await page.fill('input[name="name"]', 'Test Member');
    await page.fill('input[name="relationship"]', 'test');
    await page.click('text=Add Family Member');
    await expect(page).toHaveURL('/family');

    // Wait for the member to appear
    await expect(page.locator('text=Test Member')).toBeVisible();

    // Check initial interaction time (should be "Today")
    await expect(page.locator('text=Last interaction: Today')).toBeVisible();

    // Update interaction
    await page.locator('button:has(svg)').first().click();
    await page.click('text=Update Interaction');

    // Should still show "Today" after update
    await expect(page.locator('text=Last interaction: Today')).toBeVisible();
  });

  test('should add task feedback', async ({ page }) => {
    await page.goto('/family');

    // Create a family member first
    await page.click('text=Add Family Member');
    await expect(page).toHaveURL('/family/new');
    await page.fill('input[name="name"]', 'Test Member');
    await page.fill('input[name="relationship"]', 'test');
    await page.click('text=Add Family Member');
    await expect(page).toHaveURL('/family');

    // Wait for the member to appear
    await expect(page.locator('text=Test Member')).toBeVisible();

    // Open feedback form
    await page.locator('button:has(svg)').first().click();
    await page.click('text=Add Feedback');

    // Fill feedback form
    await page.check('input[type="radio"][value="true"]');
    await page.fill('textarea[name="notes"]', 'Had a great time playing together!');

    // Submit feedback
    await page.click('button:has-text("Add Feedback")');

    // Check for success
    await expect(page.locator('text=Action completed successfully!')).toBeVisible();
  });

  test('should add connection XP', async ({ page }) => {
    await page.goto('/family');

    // Create a family member first
    await page.click('text=Add Family Member');
    await expect(page).toHaveURL('/family/new');
    await page.fill('input[name="name"]', 'Test Member');
    await page.fill('input[name="relationship"]', 'test');
    await page.click('text=Add Family Member');
    await expect(page).toHaveURL('/family');

    // Wait for the member to appear
    await expect(page.locator('text=Test Member')).toBeVisible();

    // Open XP form
    await page.locator('button:has(svg)').first().click();
    await page.click('text=Add XP');

    // Fill XP form
    await page.selectOption('select[name="source"]', 'task');
    await page.fill('input[name="xp"]', '25');
    await page.fill('textarea[name="comment"]', 'Completed a fun activity together');

    // Submit XP
    await page.click('button:has-text("Add XP")');

    // Check for success
    await expect(page.locator('text=Action completed successfully!')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/family/new');

    // Try to create family member without required fields
    await page.click('text=Add Family Member');

    // Should show validation error
    await expect(page.locator('text=Name is required')).toBeVisible();
  });

  test('should show family navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Check that Family link is present in navigation
    await expect(page.locator('a[href="/family"]')).toBeVisible();

    // Click Family link
    await page.click('a[href="/family"]');

    // Should navigate to family page
    await expect(page).toHaveURL('/family');
  });
});
