import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Family Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display family page', async ({ page }) => {
    await page.goto('/family');
    await expect(page).toHaveURL('/family');
    await expect(page.locator('h1')).toContainText('Family');
  });

  test('should create a new family member', async ({ page }) => {
    await page.goto('/family');

    // Handle both empty state and existing members
    const addFirstButton = page.locator('button:has-text("Add Your First Family Member")');
    const addButton = page.locator('button:has-text("Add Family Member")').first();

    if (await addFirstButton.isVisible()) {
      await addFirstButton.click();
    } else {
      await addButton.click();
    }

    await expect(page).toHaveURL('/family/create');

    // Fill form
    const uniqueName = `Test ${Date.now()}`;
    await page.fill('input[placeholder="Their name"]', uniqueName);
    await page.fill('input[placeholder="How they\'re related to you"]', 'Son');
    await page.click('button[type="submit"]:has-text("Create Family Member")');

    // Should redirect to family page and show the member
    await expect(page).toHaveURL('/family');
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible();
  });

  test('should view family member details', async ({ page }) => {
    await page.goto('/family');

    // Create a member first
    const uniqueName = `Details ${Date.now()}`;

    const addFirstButton = page.locator('button:has-text("Add Your First Family Member")');
    const addButton = page.locator('button:has-text("Add Family Member")').first();

    if (await addFirstButton.isVisible()) {
      await addFirstButton.click();
    } else {
      await addButton.click();
    }

    await page.fill('input[placeholder="Their name"]', uniqueName);
    await page.fill('input[placeholder="How they\'re related to you"]', 'Daughter');
    await page.click('button[type="submit"]:has-text("Create Family Member")');

    // Go back and click on member
    await page.goto('/family');
    await page.click(`text=${uniqueName}`);

    // Verify details page
    await expect(page.locator('h1')).toContainText(uniqueName);
    await expect(page.locator('text=Daughter').first()).toBeVisible();
    await expect(page.locator('button:has-text("Edit")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Delete")').first()).toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    await page.goto('/family/create');

    // Button should be disabled initially
    await expect(page.locator('button[type="submit"]:has-text("Create Family Member")')).toBeDisabled();

    // Fill name only
    await page.fill('input[placeholder="Their name"]', 'Test Name');
    await expect(page.locator('button[type="submit"]:has-text("Create Family Member")')).toBeDisabled();

    // Fill relationship
    await page.fill('input[placeholder="How they\'re related to you"]', 'Sister');
    await expect(page.locator('button[type="submit"]:has-text("Create Family Member")')).toBeEnabled();
  });

  test('should delete family member', async ({ page }) => {
    await page.goto('/family');

    // Create member
    const uniqueName = `Delete ${Date.now()}`;

    const addFirstButton = page.locator('button:has-text("Add Your First Family Member")');
    const addButton = page.locator('button:has-text("Add Family Member")').first();

    if (await addFirstButton.isVisible()) {
      await addFirstButton.click();
    } else {
      await addButton.click();
    }

    await page.fill('input[placeholder="Their name"]', uniqueName);
    await page.fill('input[placeholder="How they\'re related to you"]', 'Brother');
    await page.click('button[type="submit"]:has-text("Create Family Member")');

    // Go to details and delete
    await page.goto('/family');
    await page.click(`text=${uniqueName}`);

    // Handle confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("Delete")');

    // Should redirect back
    await expect(page).toHaveURL('/family');
  });
});
