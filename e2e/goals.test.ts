import { test, expect } from '@playwright/test';

test.describe('Goals Management', () => {
  // Shared user for all tests in this suite
  let testUser;

  test.beforeAll(async ({ browser }) => {
    // Create a user once for all tests
    const context = await browser.newContext();
    const page = await context.newPage();

    testUser = {
      email: `goals-test-${Date.now()}@journal.com`,
      password: 'goalstest123',
      name: `Goals User ${Date.now()}`,
    };

    // Register the user
    await page.goto('/register');
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    await context.close();
  });

  // Helper function to login the existing user
  async function loginUser(page) {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    return testUser;
  }
  test('should display empty state when no goals exist', async ({ page }) => {
    await loginUser(page);
    await page.goto('/goals');

    // Should see empty state
    await expect(page.locator('h3:has-text("No goals yet")')).toBeVisible();
    await expect(page.getByTestId('create-first-goal-btn')).toBeVisible();

    // Click the create first goal button
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="create-first-goal-btn"]');

    // Should show the create form
    await expect(page.locator('[data-testid="create-goal-form"]')).toBeVisible();
  });

  test('should display goals page', async ({ page }) => {
    await loginUser(page);

    // Navigate to goals page
    await page.goto('/goals');
    await expect(page).toHaveURL('/goals');

    // Verify page elements
    await expect(page.locator('h1')).toContainText('Personal Goals');
    await expect(page.getByTestId('create-goal-btn')).toBeVisible();
  });

  test('should navigate to goals page from user menu', async ({ page }) => {
    await loginUser(page);

    // Click on avatar to open dropdown
    await page.click('[data-testid="user-avatar-button"]');

    // Click on Goals link
    await page.click('a[href="/goals"]');

    // Should be on goals page
    await expect(page).toHaveURL('/goals');
    await expect(page.locator('h1')).toContainText('Personal Goals');
  });

  test('should create a new goal', async ({ page }) => {
    await loginUser(page);
    await page.goto('/goals');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Ensure the create button is present and clickable
    await expect(page.locator('[data-testid="create-goal-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-goal-btn"]')).toBeEnabled();

    // Click create goal button - let Playwright handle actionability naturally
    await page.click('[data-testid="create-goal-btn"]');

    // Wait for the form to appear
    await page.waitForSelector('[data-testid="create-goal-form"]', {
      state: 'visible',
      timeout: 15000,
    });

    // Fill in goal information
    await page.fill('input[name="title"]', 'Live close to nature');
    await page.fill('textarea[name="description"]', 'Spend more time outdoors and connect with the natural world');
    await page.fill('input[name="tags"]', 'family, outdoor, lifestyle');

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Wait for form to close and success state
    await page.waitForSelector('[data-testid="create-goal-form"]', { state: 'detached' });

    // Should see success message
    await expect(page.locator('.alert-success')).toContainText('Goal action completed successfully!');

    // Should see the new goal in the list
    await expect(page.locator('h3:has-text("Live close to nature")')).toBeVisible();
    await expect(page.locator('text=Spend more time outdoors and connect with the natural world')).toBeVisible();

    // Should see the tags
    await expect(page.locator('.badge:has-text("family")')).toBeVisible();
    await expect(page.locator('.badge:has-text("outdoor")')).toBeVisible();
    await expect(page.locator('.badge:has-text("lifestyle")')).toBeVisible();
  });

  test('should edit an existing goal', async ({ page }) => {
    await loginUser(page);
    await page.goto('/goals');

    // Create a goal first
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="create-goal-btn"]');
    await page.waitForSelector('[data-testid="create-goal-form"]', { state: 'visible', timeout: 15000 });
    await page.fill('input[name="title"]', 'Test Goal');
    await page.fill('textarea[name="description"]', 'Original description');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Wait for goal to be created
    await expect(page.locator('h3:has-text("Test Goal")')).toBeVisible();

    // Open the dropdown menu for the goal
    const goalCard = page.locator('.card:has(h3:has-text("Test Goal"))');
    await goalCard.locator('[data-testid^="goal-menu-"]').click();

    // Click edit
    await goalCard.locator('[data-testid^="edit-goal-"]:has-text("Edit")').click();

    // Update the goal
    await page.fill('input[name="title"]', 'Updated Test Goal');
    await page.fill('textarea[name="description"]', 'Updated description');
    await page.fill('input[name="tags"]', 'new, tags');

    // Save changes
    await page.click('button[type="submit"]:has-text("Save")');

    // Should see updated goal
    await expect(page.locator('h3:has-text("Updated Test Goal")')).toBeVisible();
    await expect(page.locator('text=Updated description')).toBeVisible();
    await expect(page.locator('.badge:has-text("new")')).toBeVisible();
    await expect(page.locator('.badge:has-text("tags")')).toBeVisible();
  });

  test('should toggle goal active status', async ({ page }) => {
    await loginUser(page);
    await page.goto('/goals');

    // Create a goal first
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="create-goal-btn"]');
    await page.waitForSelector('[data-testid="create-goal-form"]', { state: 'visible', timeout: 15000 });
    await page.fill('input[name="title"]', 'Toggle Test Goal');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Wait for goal to be created
    await expect(page.locator('h3:has-text("Toggle Test Goal")')).toBeVisible();

    // Open dropdown and deactivate
    const goalCard = page.locator('.card:has(h3:has-text("Toggle Test Goal"))');
    await goalCard.locator('[data-testid^="goal-menu-"]').click();
    await goalCard.locator('[data-testid^="toggle-active-"]:has-text("Deactivate")').click();

    // Should see inactive badge
    await expect(goalCard.locator('.badge:has-text("Inactive")')).toBeVisible();

    // Reactivate
    await goalCard.locator('[data-testid^="goal-menu-"]').click();
    await goalCard.locator('[data-testid^="toggle-active-"]:has-text("Activate")').click();

    // Should no longer see inactive badge
    await expect(goalCard.locator('.badge:has-text("Inactive")')).not.toBeVisible();
  });

  test('should archive and unarchive goals', async ({ page }) => {
    await loginUser(page);
    await page.goto('/goals');

    // Create a goal first
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="create-goal-btn"]');
    await page.waitForSelector('[data-testid="create-goal-form"]', { state: 'visible', timeout: 15000 });
    await page.fill('input[name="title"]', 'Archive Test Goal');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Wait for goal to be created
    await expect(page.locator('h3:has-text("Archive Test Goal")')).toBeVisible();

    // Archive the goal
    const goalCard = page.locator('.card:has(h3:has-text("Archive Test Goal"))');
    await goalCard.locator('[data-testid^="goal-menu-"]').click();
    await goalCard.locator('[data-testid^="archive-goal-"]:has-text("Archive")').click();

    // Goal should no longer be visible in active view
    await expect(page.locator('h3:has-text("Archive Test Goal")')).not.toBeVisible();

    // Switch to archived view
    await page.click('[data-testid="toggle-archived-btn"]');

    // Should see the archived goal
    const archivedCard = page.locator('.card:has(h3:has-text("Archive Test Goal"))');
    await expect(archivedCard.locator('h3:has-text("Archive Test Goal")')).toBeVisible();
    await expect(archivedCard.locator('.badge:has-text("Archived")')).toBeVisible();

    // Unarchive the goal
    await archivedCard.locator('[data-testid^="goal-menu-"]').click();
    await archivedCard.locator('[data-testid^="unarchive-goal-"]:has-text("Unarchive")').click();

    // Goal should no longer be visible in archived view
    await expect(page.locator('h3:has-text("Archive Test Goal")')).not.toBeVisible();

    // Switch back to active view
    await page.click('[data-testid="toggle-archived-btn"]');

    // Should see the goal in active view again
    await expect(page.locator('h3:has-text("Archive Test Goal")')).toBeVisible();
    await expect(page.locator('.badge:has-text("Archived")')).not.toBeVisible();
  });

  test('should delete a goal', async ({ page }) => {
    await loginUser(page);
    await page.goto('/goals');

    // Create a goal first
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="create-goal-btn"]');
    await page.waitForSelector('[data-testid="create-goal-form"]', { state: 'visible', timeout: 15000 });
    await page.fill('input[name="title"]', 'Delete Test Goal');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Wait for goal to be created
    await expect(page.locator('h3:has-text("Delete Test Goal")')).toBeVisible();

    // Delete the goal
    const goalCard = page.locator('.card:has(h3:has-text("Delete Test Goal"))');
    await goalCard.locator('[data-testid^="goal-menu-"]').click();

    // Handle any potential delete confirmation dialog
    page.removeAllListeners('dialog');
    page.once('dialog', (dialog) => dialog.accept());

    await goalCard.locator('[data-testid^="delete-goal-"]:has-text("Delete")').click();

    // Goal should no longer be visible
    await expect(page.locator('h3:has-text("Delete Test Goal")')).not.toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    await loginUser(page);
    await page.goto('/goals');

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    // Click create goal button
    await expect(page.locator('[data-testid="create-goal-btn"]')).toBeVisible();
    await page.click('[data-testid="create-goal-btn"]');

    // Wait for form to appear
    await page.waitForSelector('[data-testid="create-goal-form"]', { state: 'visible' });

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Should see validation message (browser validation will prevent submission)
    // The required attribute should prevent the form from submitting
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toHaveAttribute('required');
  });

  test('should show correct page title and navigation', async ({ page }) => {
    await loginUser(page);
    await page.goto('/goals');

    // Check page title
    await expect(page).toHaveTitle('Goals - Journal App');

    // Check navigation highlighting
    await page.click('[data-testid="user-avatar-button"]');
    const goalsLink = page.locator('a[href="/goals"]');
    await expect(goalsLink).toBeVisible();
  });

  test('should persist goal data after page reload', async ({ page }) => {
    await loginUser(page);
    await page.goto('/goals');

    // Create a goal
    await page.click('[data-testid="create-goal-btn"]');
    await page.waitForSelector('[data-testid="create-goal-form"]', { state: 'visible' });
    await page.fill('input[name="title"]', 'Persistent Goal');
    await page.fill('textarea[name="description"]', 'This should persist after reload');
    await page.fill('input[name="tags"]', 'persistence, test');
    await page.click('button[type="submit"]:has-text("Create Goal")');

    // Wait for goal to be created
    await expect(page.locator('h3:has-text("Persistent Goal")')).toBeVisible();

    // Reload the page
    await page.reload();

    // Verify goal is still there
    await expect(page.locator('h3:has-text("Persistent Goal")')).toBeVisible();
    await expect(page.locator('text=This should persist after reload')).toBeVisible();
    await expect(page.locator('.badge:has-text("persistence")')).toBeVisible();
    await expect(page.locator('.badge:has-text("test")')).toBeVisible();
  });

  test('should handle navigation between goals and other pages', async ({ page }) => {
    await loginUser(page);
    await page.goto('/goals');

    // Navigate to dashboard using navbar
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');

    // Go back to goals
    await page.click('[data-testid="user-avatar-button"]');
    await page.click('a[href="/goals"]');
    await expect(page).toHaveURL('/goals');
    await expect(page.locator('h1')).toContainText('Personal Goals');
  });
});
