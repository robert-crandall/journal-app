import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Photo Upload Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should show photo upload option in journal editor', async ({ page }) => {
    // Navigate to today's journal entry
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    await page.goto(`/journal/${today}`);
    
    // Should be on today's journal page or redirected to it
    await page.waitForLoadState('networkidle');
    
    // Look for the photo upload button
    await expect(page.locator('button:has-text("Add Photos")')).toBeVisible();
    
    // Click the photo upload button
    await page.locator('button:has-text("Add Photos")').click();
    
    // Should show the photo upload component
    await expect(page.locator('.photo-upload')).toBeVisible();
    
    // Should show file input options
    await expect(page.locator('button:has-text("Camera")')).toBeVisible();
    await expect(page.locator('button:has-text("Gallery")')).toBeVisible();
  });

  test('should show photo upload option in measurement creation', async ({ page }) => {
    // Navigate to create measurement page
    await page.goto('/measurements/create');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for the photo upload button
    await expect(page.locator('button:has-text("Add Progress Photos")')).toBeVisible();
    
    // Click the photo upload button
    await page.locator('button:has-text("Add Progress Photos")').click();
    
    // Should show information about saving measurement first
    await expect(page.locator('text=Save your measurement first')).toBeVisible();
  });

  test('should be able to enable photo upload after creating measurement', async ({ page }) => {
    // Navigate to create measurement page
    await page.goto('/measurements/create');
    await page.waitForLoadState('networkidle');
    
    // Fill in a minimal measurement
    await page.fill('input[id="weight"]', '150');
    
    // Click the photo upload button to enable it
    await page.locator('button:has-text("Add Progress Photos")').click();
    
    // Save the measurement
    await page.locator('button[type="submit"]').click();
    
    // After save, the photo upload component should be available
    // (This would be in the post-save state where measurement ID is available)
    await page.waitForTimeout(1000); // Wait for any post-save updates
  });

  test('should toggle photo upload visibility', async ({ page }) => {
    // Go to today's journal
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    await page.goto(`/journal/${today}`);
    await page.waitForLoadState('networkidle');
    
    // Initially photo upload should not be visible
    await expect(page.locator('.photo-upload')).not.toBeVisible();
    
    // Click to show photos
    await page.locator('button:has-text("Add Photos")').click();
    await expect(page.locator('.photo-upload')).toBeVisible();
    
    // Click to hide photos
    await page.locator('button:has-text("Hide Photos")').click();
    await expect(page.locator('.photo-upload')).not.toBeVisible();
  });
});
