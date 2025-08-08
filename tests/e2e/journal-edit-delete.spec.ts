import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Journal Edit/Delete Functionality', () => {
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

  async function createAndCompleteJournal(page: any, date: string, content: string): Promise<void> {
    // Create journal draft
    await page.goto(`/journal/${date}`);
    await page.waitForLoadState('networkidle');

    // Fill and save as draft
    await page.locator('[data-test-id="journal-editor-textarea"]').fill(content);
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Start reflection process
    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForTimeout(2000);

    // Should now be in chat mode - send a message
    await page.locator('[data-test-id="chat-input"]').fill('This reflection helps me understand my day better.');
    await page.locator('[data-test-id="send-message-button"]').click();
    await page.waitForTimeout(3000); // Wait for AI response

    // Complete the journal
    await page.locator('[data-test-id="finish-journal-button"]').click();
    await page.waitForTimeout(3000); // Wait for GPT processing

    // Should now be in complete status
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();
  }

  test('should show edit and delete buttons on completed journal', async ({ page }) => {
    const testDate = '2024-08-15';
    await cleanupJournal(page, testDate);

    // Create and complete a journal
    const journalContent = 'Had an amazing workout today and felt great!';
    await createAndCompleteJournal(page, testDate, journalContent);

    // Verify both edit and delete buttons are visible
    await expect(page.locator('[data-test-id="edit-journal-button"]')).toBeVisible();
    await expect(page.locator('[data-test-id="delete-journal-button"]')).toBeVisible();
  });

  test('should edit journal entry and reset to draft status', async ({ page }) => {
    const testDate = '2024-08-16';
    await cleanupJournal(page, testDate);

    // Create and complete a journal
    const originalContent = 'Today was a normal day with regular activities.';
    await createAndCompleteJournal(page, testDate, originalContent);

    // Click edit button directly
    await page.locator('[data-test-id="edit-journal-button"]').click();
    await page.waitForTimeout(2000); // Wait for edit API call

    // Should redirect back to journal editor and be in draft status
    await expect(page.locator('[data-test-id="journal-editor-textarea"]')).toBeVisible();

    // Verify it's in draft status by looking for editor elements
    await expect(page.locator('[data-test-id="save-draft-button"]')).toBeVisible();

    // Content should be preserved
    await expect(page.locator('[data-test-id="journal-editor-textarea"]')).toHaveValue(originalContent);
  });

  test('should delete journal entry with confirmation', async ({ page }) => {
    const testDate = '2024-08-17';
    await cleanupJournal(page, testDate);

    // Create and complete a journal
    const journalContent = 'This journal will be deleted in the test.';
    await createAndCompleteJournal(page, testDate, journalContent);

    // Set up dialog handler for confirmation
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure you want to delete this journal entry?');
      await dialog.accept();
    });

    // Click delete button directly
    await page.locator('[data-test-id="delete-journal-button"]').click();
    await page.waitForTimeout(2000);

    // Should redirect to journal dashboard
    await expect(page.url()).toMatch(/\/journal$/);

    // Verify journal was deleted by trying to access it again
    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    // Should show journal editor for creating new entry (since journal was deleted)
    await expect(page.locator('[data-test-id="journal-editor-textarea"]')).toBeVisible();
    await expect(page.locator('[data-test-id="journal-editor-textarea"]')).toHaveValue('');
  });

  test('should cancel delete operation', async ({ page }) => {
    const testDate = '2024-08-19';
    await cleanupJournal(page, testDate);

    // Create and complete a journal
    const journalContent = 'This journal should not be deleted.';
    await createAndCompleteJournal(page, testDate, journalContent);

    // Set up dialog handler to cancel deletion
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure you want to delete this journal entry?');
      await dialog.dismiss(); // Cancel the deletion
    });

    // Click delete button
    await page.locator('[data-test-id="delete-journal-button"]').click();
    await page.waitForTimeout(1000);

    // Should still be on the same page and journal should still exist
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();

    // Verify journal still exists by reloading
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();
  });

  // Remove modal-related tests since we simplified the interface

  // Cleanup after all tests
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginUser(page);

    // Clean up test journals
    const testDates = ['2024-08-15', '2024-08-16', '2024-08-17', '2024-08-19'];
    for (const date of testDates) {
      await cleanupJournal(page, date);
    }

    await context.close();
  });
});
