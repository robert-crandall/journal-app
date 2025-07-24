import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Journal System', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.waitForLoadState('networkidle');
  });

  async function cleanupJournal(page: any, date: string) {
    try {
      const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
      await page.request.delete(`${TEST_CONFIG.API_BASE_URL}/api/journals/${date}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    } catch (error) {
      // Ignore errors - journal might not exist
    }
  }

  test('should show journal widget on homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-test-id="journal-widget"]')).toBeVisible();
    await expect(page.locator('[data-test-id="journal-action-button"]')).toBeVisible();
  });

  test('should create new journal entry', async ({ page }) => {
    // Use a future date to ensure no existing journal
    const futureDate = '2025-12-25';
    await cleanupJournal(page, futureDate);

    await page.goto(`/journal/${futureDate}`);
    await page.waitForLoadState('networkidle');

    // Should show the journal editor for a new entry
    await expect(page.locator('[data-test-id="journal-editor-textarea"]')).toBeVisible();
    await expect(page.locator('[data-test-id="save-draft-button"]')).toBeVisible();

    // Fill and save journal
    const journalText = 'Today was a great day! I accomplished a lot.';
    await page.locator('[data-test-id="journal-editor-textarea"]').fill(journalText);
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Verify content was saved
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-test-id="journal-editor-textarea"]')).toHaveValue(journalText);
  });

  test('should handle navigation from homepage to journal', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('[data-test-id="journal-action-button"]');
    await expect(button).toBeVisible();

    await button.click();
    await page.waitForLoadState('networkidle');

    // Should navigate to today's journal page (whatever today happens to be)
    await expect(page.url()).toContain('/journal/');

    // Should show either journal editor or another journal component
    const hasEditor = await page.locator('[data-test-id="journal-editor-textarea"]').isVisible();
    const hasChat = await page.locator('[data-test-id="chat-input"]').isVisible();
    const hasComplete = await page.locator('[data-test-id="journal-complete"]').isVisible();

    // Should have one of the three journal components
    expect(hasEditor || hasChat || hasComplete).toBe(true);
  });
});
