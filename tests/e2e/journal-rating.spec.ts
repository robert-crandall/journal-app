import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Journal Day Rating', () => {
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

  test('should allow rating a day when completing a journal', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for this test significantly

    // Use a future date to ensure no existing journal
    const testDate = '2025-12-26';
    await cleanupJournal(page, testDate);

    // Create a new journal entry
    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    // Wait specifically for the journal editor to be visible
    await expect(page.locator('[data-test-id="journal-editor-textarea"]')).toBeVisible({ timeout: 10000 });

    // Fill and save journal draft
    const journalText = 'This was a pretty good day overall!';
    await page.locator('[data-test-id="journal-editor-textarea"]').fill(journalText);
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Start reflection
    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForTimeout(1000);

    // Send a message in the chat
    await page.locator('[data-test-id="chat-input"]').fill('I feel good about today');
    await page.locator('[data-test-id="send-message-button"]').click();
    await page.waitForTimeout(2000); // Wait for AI response

    // Click finish journal
    await page.locator('[data-test-id="finish-journal-button"]').click();
    await page.waitForTimeout(500);

    // The rating dialog should appear
    await expect(page.getByRole('heading', { name: 'Complete Your Journal' })).toBeVisible();

    // Select a rating of 4
    await page.locator('[data-test-id="rating-button-4"]').click();

    // Click the finish button
    await page.locator('[data-test-id="confirm-finish-button"]').click();
    await page.waitForTimeout(3000); // Wait for completion

    // The journal should be complete with the rating visible
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible({ timeout: 10000 });

    // Check that the day rating component shows the selected rating
    await expect(page.locator('[data-test-id="day-rating-label"]')).toBeVisible({ timeout: 5000 });
  });
});
