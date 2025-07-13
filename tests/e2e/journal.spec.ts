import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Journal System', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.waitForLoadState('networkidle');
  });

  async function cleanupJournal(page: any, date: string) {
    try {
      const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
      await page.request.delete(`/api/journals/${date}`, {
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

  test('should transition from draft to reflection mode', async ({ page }) => {
    const testDate = '2026-01-15'; // Unique date for this test
    await cleanupJournal(page, testDate);

    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    // Verify we see the editor
    await expect(page.locator('[data-test-id="journal-editor-textarea"]')).toBeVisible({ timeout: 10000 });

    // Write journal content
    const journalText = 'Today I worked on my coding project and made significant progress.';
    await page.locator('[data-test-id="journal-editor-textarea"]').fill(journalText);
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Start reflection
    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForTimeout(3000);

    // Should now be in chat mode
    await expect(page.locator('[data-test-id="chat-input"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-test-id="finish-journal-button"]')).toBeVisible();
  });

  test('should complete full journal workflow', async ({ page }) => {
    const testDate = '2026-01-16'; // Unique date for this test
    await cleanupJournal(page, testDate);

    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    // Verify we see the editor
    await expect(page.locator('[data-test-id="journal-editor-textarea"]')).toBeVisible({ timeout: 10000 });

    // Step 1: Write journal content
    const journalText = 'Today was an amazing day! I completed several important tasks.';
    await page.locator('[data-test-id="journal-editor-textarea"]').fill(journalText);
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Step 2: Start reflection
    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForTimeout(3000);

    // Step 3: Send a chat message (optional)
    const chatInput = page.locator('[data-test-id="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Step 4: Finish the journal
    await page.locator('[data-test-id="finish-journal-button"]').click();
    await page.waitForTimeout(2000);

    // Should now show completed view
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible({ timeout: 10000 });
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
