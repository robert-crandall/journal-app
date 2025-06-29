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

  test('should open add family member modal when clicking add button', async ({ page }) => {
    // Click the add button
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    
    // Modal should be visible
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

  test('should close add family member modal when clicking cancel', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    await expect(page.getByRole('heading', { name: 'Add Family Member' })).toBeVisible();
    
    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Add Family Member' })).not.toBeVisible();
  });

  test('should validate required fields in add family member form', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    
    // Try to submit without name
    const addButton = page.getByRole('button', { name: 'Add Family Member' }).nth(1); // Second button is in modal
    await expect(addButton).toBeDisabled();
    
    // Add name and verify button becomes enabled
    await page.getByLabel('Name *').fill('Test Family Member');
    await expect(addButton).toBeEnabled();
  });

  test('should create a new family member successfully', async ({ page }) => {
    await page.goto('/family');
    
    // Click the Add Family Member button in the header
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    
    // Wait for modal to appear by checking for the modal title
    await page.waitForSelector('h2:has-text("Add Family Member")', { state: 'visible' });
    
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
    
    // Wait for either success (modal closes) or error message appears
    await Promise.race([
      page.waitForSelector('h2:has-text("Add Family Member")', { state: 'hidden', timeout: 15000 }),
      page.waitForSelector('.alert-error', { state: 'visible', timeout: 15000 }).catch(() => null)
    ]);
    
    // Check if there's an error on the page
    const errorElement = await page.locator('.alert-error').first();
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('Error found:', errorText);
      // If there's an error, check what it is
      throw new Error(`API Error: ${errorText}`);
    }
    
    // Wait for the API call to complete and page to update
    await page.waitForLoadState('networkidle');
    
    // Should show the new family member - check for at least one instance
    await expect(page.getByRole('heading', { name: 'John Doe' }).first()).toBeVisible();
    await expect(page.getByText('Age 35')).toBeVisible();
    await expect(page.getByText('Weekly')).toBeVisible();
    await expect(page.getByText('reading')).toBeVisible();
    await expect(page.getByText('cooking')).toBeVisible();
    await expect(page.getByText('hiking')).toBeVisible();
  });

  test('should show interaction alerts for new family members', async ({ page }) => {
    // Create a family member first
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    await page.getByLabel('Name *').fill('Jane Doe');
    await page.getByRole('button', { name: 'Add Family Member' }).nth(1).click();
    
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    
    // Should show interaction alerts section
    await expect(page.getByRole('heading', { name: 'Interaction Alerts' })).toBeVisible();
    await expect(page.getByText('Family members who need your attention')).toBeVisible();
    
    // Should show alert for new member
    await expect(page.getByText('Jane Doe')).toBeVisible();
    await expect(page.getByText(/You haven't recorded any interactions with Jane Doe yet/)).toBeVisible();
    
    // Should have "Record Interaction" button in alert
    await expect(page.getByRole('button', { name: 'Record Interaction' })).toBeVisible();
  });

  test('should open record interaction modal from alert', async ({ page }) => {
    // Create a family member first
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    await page.getByLabel('Name *').fill('Jane Doe');
    await page.getByRole('button', { name: 'Add Family Member' }).nth(1).click();
    await page.waitForLoadState('networkidle');
    
    // Click "Record Interaction" from alert
    await page.getByRole('button', { name: 'Record Interaction' }).first().click();
    
    // Modal should open
    await expect(page.getByRole('heading', { name: 'Record Interaction with Jane Doe' })).toBeVisible();
    
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
    await page.getByLabel('Name *').fill('Jane Doe');
    await page.getByRole('button', { name: 'Add Family Member' }).nth(1).click();
    await page.waitForLoadState('networkidle');
    
    // Open interaction modal from family member card
    await page.getByRole('button', { name: 'Record Interaction' }).last().click(); // From card, not alert
    
    // Fill interaction form
    await page.getByLabel('What did you do together? *').fill('We had a lovely dinner and talked about work');
    
    // Submit interaction
    await page.getByRole('button', { name: 'Record Interaction' }).nth(1).click(); // Second button is in modal
    
    // Wait for data to reload
    await page.waitForLoadState('networkidle');
    
    // Alert should be gone or reduced
    // Family member should show "Today" or "0 days ago" for last interaction
    await expect(page.getByText('Last: Today')).toBeVisible();
  });

  test('should delete a family member with confirmation', async ({ page }) => {
    // Create a family member first
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    await page.getByLabel('Name *').fill('John Doe');
    await page.getByRole('button', { name: 'Add Family Member' }).nth(1).click();
    await page.waitForLoadState('networkidle');
    
    // Setup dialog handler for confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this family member?');
      await dialog.accept();
    });
    
    // Click delete button (trash icon)
    await page.getByRole('button', { name: 'Delete family member' }).click();
    
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
      await page.getByLabel('Name *').fill(member.name);
      await page.getByLabel('Age').fill(member.age);
      await page.getByLabel('Interaction Frequency').selectOption(member.frequency);
      await page.getByRole('button', { name: 'Add Family Member' }).nth(1).click();
      await page.waitForLoadState('networkidle');
    }
    
    // Should show all family members
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Carol')).toBeVisible();
    
    // Should show different frequencies
    await expect(page.getByText('Daily')).toBeVisible();
    await expect(page.getByText('Weekly')).toBeVisible();
    await expect(page.getByText('Monthly')).toBeVisible();
    
    // Should show all in alerts (since no interactions)
    const alertSection = page.locator('.card').filter({ hasText: 'Interaction Alerts' });
    await expect(alertSection.getByText('Alice')).toBeVisible();
    await expect(alertSection.getByText('Bob')).toBeVisible();
    await expect(alertSection.getByText('Carol')).toBeVisible();
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
    await expect(page.getByRole('button', { name: 'Add Family Member' })).toBeVisible();
    
    // Create a family member to test mobile layout
    await page.getByRole('button', { name: 'Add Family Member' }).first().click();
    
    // Modal should be responsive
    await expect(page.getByRole('heading', { name: 'Add Family Member' })).toBeVisible();
    
    // Fill and submit
    await page.getByLabel('Name *').fill('Mobile Test');
    await page.getByRole('button', { name: 'Add Family Member' }).nth(1).click();
    await page.waitForLoadState('networkidle');
    
    // Family member card should be visible and properly laid out
    await expect(page.getByText('Mobile Test')).toBeVisible();
  });
});
