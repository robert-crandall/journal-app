import { test, expect } from '@playwright/test';

test.describe('Family Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the family page
    await page.goto('/family');
  });

  test('should display family management page with correct title and header', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Family Management - D&D Life/);
    
    // Check main header
    await expect(page.getByRole('heading', { name: 'Family Management' })).toBeVisible();
    
    // Check subtitle
    await expect(page.getByText('Track and nurture your relationships with family members')).toBeVisible();
    
    // Check "Add Family Member" button is present (should be 2: header + empty state)
    await expect(page.getByRole('button', { name: 'Add Family Member' })).toHaveCount(2);
  });

  test('should show empty state when no family members exist', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForLoadState('networkidle');
    
    // Should show empty state
    await expect(page.getByText('No family members yet')).toBeVisible();
    await expect(page.getByText('Add your first family member to start tracking interactions')).toBeVisible();
    
    // Should show empty state add button
    await expect(page.getByRole('button', { name: 'Add Family Member' })).toHaveCount(2); // Header + empty state
  });

  test('should navigate to add family member page when clicking add button', async ({ page }) => {
    // Click the add button
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    
    // Should navigate to add page
    await expect(page).toHaveURL('/family/add');
    
    // Page should be visible
    await expect(page.getByRole('heading', { name: 'Add Family Member' })).toBeVisible();
    
    // Form fields should be present
    await expect(page.getByLabel('Name *')).toBeVisible();
    await expect(page.getByLabel('Age')).toBeVisible();
    await expect(page.getByLabel('Interests')).toBeVisible();
    await expect(page.getByLabel('Interaction Frequency')).toBeVisible();
    
    // Buttons should be present
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Family Member' })).toBeVisible();
  });

  test('should navigate back to family page when clicking cancel', async ({ page }) => {
    // Navigate to add page
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    await expect(page).toHaveURL('/family/add');
    
    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Should navigate back to family page
    await expect(page).toHaveURL('/family');
  });

  test('should validate required fields in add family member form', async ({ page }) => {
    // Navigate to add page
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    await expect(page).toHaveURL('/family/add');
    
    // Try to submit without name
    const addButton = page.getByTestId('submit-add-family-member');
    await expect(addButton).toBeDisabled();
    
    // Add name and verify button becomes enabled
    await page.getByLabel('Name *').fill('Test Family Member');
    await expect(addButton).toBeEnabled();
  });

  test('should create a new family member successfully', async ({ page }) => {
    await page.goto('/family');
    
    // Click the Add Family Member button in the header
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    
    // Should navigate to add page
    await expect(page).toHaveURL('/family/add');
    
    // Fill form fields
    await page.getByLabel('Name *').fill('John Doe');
    await page.getByLabel('Age').fill('35');
    await page.getByLabel('Interests').fill('reading, cooking, hiking');
    await page.getByLabel('Interaction Frequency').selectOption('weekly');
    
    // Wait a moment for the form to be ready
    await page.waitForTimeout(500);
    
    // Submit form - use the testid for reliable targeting
    const submitButton = page.getByTestId('submit-add-family-member');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    
    // Should navigate back to family page after successful creation
    await expect(page).toHaveURL('/family');
    
    // Wait for the API call to complete and page to update
    await page.waitForLoadState('networkidle');
    
    // Should show the new family member - just check the name first
    await expect(page.getByRole('heading', { name: 'John Doe' }).first()).toBeVisible();
    
    // Then check for some content in the family member cards
    await expect(page.locator('[data-testid="family-member-card"]').first()).toBeVisible();
    
    // Basic checks for family member content (be more flexible about exact text)
    const johnDoeCard = page.locator('[data-testid="family-member-card"]').filter({ hasText: 'John Doe' });
    await expect(johnDoeCard).toBeVisible();
    await expect(johnDoeCard).toContainText('35');
    await expect(johnDoeCard).toContainText('Weekly');
  });

  test('should show interaction alerts for new family members', async ({ page }) => {
    await page.goto('/family');
    
    // Create a family member first
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    await expect(page).toHaveURL('/family/add');
    await page.getByLabel('Name *').fill('Jane Doe');
    await page.getByTestId('submit-add-family-member').click();
    
    // Should navigate back to family page
    await expect(page).toHaveURL('/family');
    
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    
    // Should show interaction alerts section
    await expect(page.getByRole('heading', { name: 'Interaction Alerts' })).toBeVisible();
    await expect(page.getByText('Family members who need your attention')).toBeVisible();
    
    // Should show Jane Doe somewhere on the page (either in card or alert)
    await expect(page.getByRole('heading', { name: 'Jane Doe' })).toBeVisible();
  });

  test('should navigate to record interaction page from alert', async ({ page }) => {
    // Create a family member first
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    await expect(page).toHaveURL('/family/add');
    await page.getByLabel('Name *').fill('Jane Doe');
    await page.getByTestId('submit-add-family-member').click();
    await expect(page).toHaveURL('/family');
    await page.waitForLoadState('networkidle');
    
    // Click "Record Interaction" from alert
    await page.getByRole('button', { name: 'Record Interaction' }).first().click();
    
    // Should navigate to interaction page
    await expect(page).toHaveURL(/\/family\/interaction\/[^\/]+/);
    
    // Page should show the interaction form
    await expect(page.getByRole('heading', { name: 'Record Interaction' })).toBeVisible();
    
    // Form fields should be present
    await expect(page.getByLabel('Interaction Date')).toBeVisible();
    await expect(page.getByLabel('What did you do together? *')).toBeVisible();
    
    // Buttons should be present
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Record Interaction' })).toBeVisible();
  });

  test('should record an interaction successfully', async ({ page }) => {
    // Create a family member first
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    await expect(page).toHaveURL('/family/add');
    await page.getByLabel('Name *').fill('Jane Doe');
    await page.getByTestId('submit-add-family-member').click();
    await expect(page).toHaveURL('/family');
    await page.waitForLoadState('networkidle');
    
    // Open interaction page from family member card
    await page.getByRole('button', { name: 'Record Interaction' }).last().click(); // From card, not alert
    
    // Should navigate to interaction page
    await expect(page).toHaveURL(/\/family\/interaction\/[^\/]+/);
    
    // Fill interaction form
    await page.getByLabel('What did you do together? *').fill('We had a lovely dinner and talked about work');
    
    // Submit interaction
    await page.getByTestId('submit-record-interaction').click();
    
    // Should navigate back to family page
    await expect(page).toHaveURL('/family');
    
    // Wait for data to reload
    await page.waitForLoadState('networkidle');
    
    // Family member should show updated interaction status (be flexible about exact text)
    const familyCard = page.locator('[data-testid="family-member-card"]').first();
    await expect(familyCard).toContainText('Last:'); // Should show some "Last:" text
  });

  test('should delete a family member with confirmation', async ({ page }) => {
    // Create a family member first
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    await expect(page).toHaveURL('/family/add');
    await page.getByLabel('Name *').fill('John Doe');
    await page.getByTestId('submit-add-family-member').click();
    await expect(page).toHaveURL('/family');
    await page.waitForLoadState('networkidle');
    
    // Setup dialog handler for confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this family member?');
      await dialog.accept();
    });
    
    // Click delete button (trash icon) from the first family member card
    const firstFamilyCard = page.locator('[data-testid="family-member-card"]').first();
    await firstFamilyCard.getByRole('button', { name: 'Delete family member' }).click();
    
    // Wait for deletion to complete
    await page.waitForLoadState('networkidle');
    
    // Should return to empty state
    await expect(page.getByText('No family members yet')).toBeVisible();
  });

  test('should handle multiple family members correctly', async ({ page }) => {
    // Create multiple family members
    const members = [
      { name: 'Alice', age: '30', frequency: 'daily' },
      { name: 'Bob', age: '25', frequency: 'weekly' },
      { name: 'Carol', age: '40', frequency: 'monthly' }
    ];
    
    for (const member of members) {
      await page.getByRole('button', { name: 'Add Family Member' }).first().click();
      await expect(page).toHaveURL('/family/add');
      await page.getByLabel('Name *').fill(member.name);
      await page.getByLabel('Age').fill(member.age);
      await page.getByLabel('Interaction Frequency').selectOption(member.frequency);
      await page.getByTestId('submit-add-family-member').click();
      await expect(page).toHaveURL('/family');
      await page.waitForLoadState('networkidle');
    }
    
    // Should show all family members in family cards section
    const familyCardsSection = page.locator('.grid').first();
    await expect(familyCardsSection.getByRole('heading', { name: 'Alice' })).toBeVisible();
    await expect(familyCardsSection.getByRole('heading', { name: 'Bob' })).toBeVisible();
    await expect(familyCardsSection.getByRole('heading', { name: 'Carol' })).toBeVisible();
    
    // Should show different frequencies within family member cards (just check they exist)
    const familySection = page.locator('.grid');
    await expect(familySection.getByText('Daily').first()).toBeVisible();
    await expect(familySection.getByText('Weekly').first()).toBeVisible();
    await expect(familySection.getByText('Monthly').first()).toBeVisible();
    
    // Should show all in alerts (since no interactions) - just check they exist in some form
    const alertSection = page.locator('.card').filter({ hasText: 'Interaction Alerts' });
    await expect(alertSection.getByText('Alice').first()).toBeVisible();
    await expect(alertSection.getByText('Bob').first()).toBeVisible();
    await expect(alertSection.getByText('Carol').first()).toBeVisible();
  });

  test('should display error messages for API failures', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/family-members', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false, 
          message: 'Internal server error' 
        }),
      });
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should show error message
    await expect(page.getByText('Internal server error')).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be usable
    await expect(page.getByRole('heading', { name: 'Family Management' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Family Member' }).first()).toBeVisible();
    
    // Create a family member to test mobile layout
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    
    // Should navigate to add page
    await expect(page).toHaveURL('/family/add');
    await expect(page.getByRole('heading', { name: 'Add Family Member' })).toBeVisible();
    
    // Fill and submit
    await page.getByLabel('Name *').fill('Mobile Test');
    await page.getByTestId('submit-add-family-member').click();
    
    // Should navigate back
    await expect(page).toHaveURL('/family');
    await page.waitForLoadState('networkidle');
    
    // Family member card should be visible and properly laid out
    await expect(page.getByRole('heading', { name: 'Mobile Test' })).toBeVisible();
  });
});
