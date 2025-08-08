import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

const TEST_CONFIG = {
  API_BASE_URL: 'http://localhost:3001',
};

test.describe('Journal Photos in Complete State', () => {
  const testDate = '2024-02-14';

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    // Clean up any existing journal for this date
    await cleanupJournal(page, testDate);
  });

  test.afterEach(async ({ page }) => {
    // Clean up after each test
    await cleanupJournal(page, testDate);
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

    // Complete the journal directly (skip reflection for simplicity)
    await page.locator('[data-test-id="finish-journal-button"]').click();
    await page.locator('[data-test-id="confirm-finish-button"]').click();
    await page.waitForTimeout(3000); // Wait for completion
  }

  test('should show photos section on completed journal', async ({ page }) => {
    const journalContent = 'This is a completed journal with photos to be added later.';

    // Create and complete a journal
    await createAndCompleteJournal(page, testDate, journalContent);

    // Verify we're on the completed journal view
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();

    // Verify photos section is present
    await expect(page.getByText('Photos (0)')).toBeVisible();

    // Verify "Add Photos" button is present
    await expect(page.getByText('Add Photos')).toBeVisible();
  });

  test('should toggle photo upload interface', async ({ page }) => {
    const journalContent = 'This is a completed journal ready for photo upload.';

    // Create and complete a journal
    await createAndCompleteJournal(page, testDate, journalContent);

    // Verify we're on the completed journal view
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();

    // Initially, upload interface should not be visible
    await expect(page.getByText('Drop files here or click to browse')).not.toBeVisible();

    // Click "Add Photos" to show upload interface
    await page.getByText('Add Photos').click();

    // Upload interface should now be visible
    await expect(page.getByText('Drop files here or click to browse')).toBeVisible();

    // Button text should change to "Hide Upload"
    await expect(page.getByText('Hide Upload')).toBeVisible();

    // Click again to hide
    await page.getByText('Hide Upload').click();

    // Upload interface should be hidden again
    await expect(page.getByText('Drop files here or click to browse')).not.toBeVisible();
  });

  test('should show message when no photos are attached', async ({ page }) => {
    const journalContent = 'This is a completed journal with no photos.';

    // Create and complete a journal
    await createAndCompleteJournal(page, testDate, journalContent);

    // Verify we're on the completed journal view
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();

    // Should show "No photos attached" message
    await expect(page.getByText('No photos attached to this journal entry.')).toBeVisible();
  });
});
