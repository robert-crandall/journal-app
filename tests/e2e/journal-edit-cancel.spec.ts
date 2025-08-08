import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Journal Edit Cancel Functionality', () => {
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
    await page.waitForTimeout(3000); // Wait for completion process

    // Verify journal is complete
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();
  }

  test('should allow canceling edit of completed journal without losing XP', async ({ page }) => {
    const date = '2024-08-08';

    // First, create and complete a journal entry
    await createAndCompleteJournal(page, date, 'Today was productive. I worked on several programming projects.');

    // Verify the journal is complete and has XP grants
    await page.goto(`/journal/${date}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();

    // Check if we have XP information displayed (this indicates XP grants exist)
    const hasXpInfo = (await page.locator('text=/XP|Experience|Character Growth/').count()) > 0;

    // Click edit button
    await page.locator('[data-test-id="edit-journal-button"]').click();
    await page.waitForTimeout(1000);

    // Should now be in edit mode
    await expect(page.locator('[data-test-id="journal-editor-textarea"]')).toBeVisible();
    await expect(page.locator('text=/Edit Journal|Editing your completed journal/i')).toBeVisible();

    // Check for cancel button
    await expect(page.locator('[data-test-id="cancel-edit-button"]')).toBeVisible();

    // Make a small change to trigger the "unsaved changes" state
    await page.locator('[data-test-id="journal-editor-textarea"]').fill('Today was productive. I worked on several programming projects. Added this note.');
    await page.waitForTimeout(500);

    // Verify unsaved changes indicator is shown
    await expect(page.locator('text=/Unsaved changes/i')).toBeVisible();

    // Click cancel to return to complete view
    await page.locator('[data-test-id="cancel-edit-button"]').click();
    await page.waitForTimeout(1000);

    // Should be back in complete view
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();

    // Verify the original content is preserved (not the edited content)
    const originalContent = 'Today was productive. I worked on several programming projects.';
    await expect(page.locator(`text=${originalContent}`)).toBeVisible();

    // Verify we didn't lose XP by checking if XP information is still present
    if (hasXpInfo) {
      const stillHasXpInfo = (await page.locator('text=/XP|Experience|Character Growth/').count()) > 0;
      expect(stillHasXpInfo).toBeTruthy();
    }

    // Cleanup
    await cleanupJournal(page, date);
  });

  test('should show XP cleanup warning when editing complete journal', async ({ page }) => {
    const date = '2024-08-09';

    // Create and complete a journal entry
    await createAndCompleteJournal(page, date, 'Another productive day with learning and growth.');

    // Click edit
    await page.locator('[data-test-id="edit-journal-button"]').click();
    await page.waitForTimeout(1000);

    // Should show warning about XP recalculation
    await expect(page.locator('text=/XP will be recalculated when you save changes/i')).toBeVisible();

    // Cleanup
    await cleanupJournal(page, date);
  });

  test('should defer XP cleanup until first save after editing complete journal', async ({ page }) => {
    const date = '2024-08-10';

    // Create and complete a journal entry
    await createAndCompleteJournal(page, date, 'Learning new technologies and improving skills.');

    // Get initial XP before editing (by checking if XP section exists)
    await page.goto(`/journal/${date}`);
    await page.waitForLoadState('networkidle');
    const initialHasXp = (await page.locator('text=/Character Growth|XP Earned/').count()) > 0;

    // Click edit
    await page.locator('[data-test-id="edit-journal-button"]').click();
    await page.waitForTimeout(1000);

    // At this point, XP should NOT be cleaned up yet
    // Cancel and go back to check
    await page.locator('[data-test-id="cancel-edit-button"]').click();
    await page.waitForTimeout(1000);

    // XP should still be there since we didn't save
    if (initialHasXp) {
      const stillHasXp = (await page.locator('text=/Character Growth|XP Earned/').count()) > 0;
      expect(stillHasXp).toBeTruthy();
    }

    // Now edit again and actually save changes
    await page.locator('[data-test-id="edit-journal-button"]').click();
    await page.waitForTimeout(1000);

    // Make a change and save
    await page.locator('[data-test-id="journal-editor-textarea"]').fill('Learning new technologies and improving skills. This is an updated entry.');
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(2000);

    // Now XP should be cleaned up and journal should be in draft status
    // The warning about XP recalculation should be gone since we've saved once
    const hasXpWarning = (await page.locator('text=/XP will be recalculated when you save changes/i').count()) > 0;
    expect(hasXpWarning).toBeFalsy();

    // Complete the journal again to regenerate XP
    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-test-id="chat-input"]').fill('Updated reflection on my learning journey.');
    await page.locator('[data-test-id="send-message-button"]').click();
    await page.waitForTimeout(3000);
    await page.locator('[data-test-id="finish-journal-button"]').click();
    await page.waitForTimeout(3000);

    // Should be complete again with new XP
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();

    // Cleanup
    await cleanupJournal(page, date);
  });
});
