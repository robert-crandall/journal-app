import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Daily Questions Feature', () => {
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

  async function cleanupDailyQuestion(page: any, date: string) {
    try {
      const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
      // Get today's question to find its ID
      const response = await page.request.get(`${TEST_CONFIG.API_BASE_URL}/api/daily-questions/today?date=${date}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.question) {
        // Clean up by marking as answered to avoid interference
        await page.request.patch(`${TEST_CONFIG.API_BASE_URL}/api/daily-questions/${data.data.question.id}/answered`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    } catch (error) {
      // Ignore errors - question might not exist
    }
  }

  test('should show daily question at start of reflection session', async ({ page }) => {
    // Use a future date to ensure clean slate
    const testDate = '2025-03-15';
    await cleanupJournal(page, testDate);
    await cleanupDailyQuestion(page, testDate);

    // Navigate to journal page and create initial content
    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    // Fill and save journal content
    const journalText = 'Today I worked on some interesting projects and learned new things.';
    await page.locator('[data-test-id="journal-editor-textarea"]').fill(journalText);
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Start reflection session
    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForLoadState('networkidle');

    // Should show the chat interface
    await expect(page.locator('text=Reflection Session')).toBeVisible();

    // Should show the daily question with special styling
    await expect(page.locator('text=Question of the Day')).toBeVisible();

    // Should show an answer button for the daily question
    await expect(page.locator('button:has-text("Answer this question")')).toBeVisible();

    // The question content should be meaningful (not just default text)
    const questionElement = page.locator('text=Question of the Day').locator('..').locator('..');
    await expect(questionElement).toContainText(/(?:How|What|Tell|Describe|Share)/);
  });

  test('should allow user to answer daily question and start conversation', async ({ page }) => {
    // Use a future date to ensure clean slate
    const testDate = '2025-03-20';
    await cleanupJournal(page, testDate);
    await cleanupDailyQuestion(page, testDate);

    // Navigate to journal page and create initial content
    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    // Fill and save journal content
    const journalText = 'Great day working on new features and solving interesting problems.';
    await page.locator('[data-test-id="journal-editor-textarea"]').fill(journalText);
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Start reflection session
    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForLoadState('networkidle');

    // Wait for daily question to load
    await expect(page.locator('text=Question of the Day')).toBeVisible();
    await expect(page.locator('button:has-text("Answer this question")')).toBeVisible();

    // Click the answer button
    await page.locator('button:has-text("Answer this question")').click();

    // Wait for the question to be processed as a message
    await page.waitForTimeout(2000);

    // Should see user message with the question text
    await expect(page.locator('[data-test-role="user-message"]').first()).toBeVisible();

    // Should see AI response
    await expect(page.locator('[data-test-role="assistant-message"]').first()).toBeVisible();

    // Daily question should no longer be visible (answered)
    await expect(page.locator('text=Question of the Day')).not.toBeVisible();
    await expect(page.locator('button:has-text("Answer this question")')).not.toBeVisible();

    // Chat input should be available for continued conversation
    await expect(page.locator('textarea[placeholder*="Type your response"]')).toBeVisible();
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
  });

  test('should not show daily question if already answered', async ({ page }) => {
    // Use a future date to ensure clean slate
    const testDate = '2025-03-25';
    await cleanupJournal(page, testDate);

    // First, create a journal and answer the daily question
    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    // Fill and save journal content
    const journalText = 'Another productive day with lots of learning.';
    await page.locator('[data-test-id="journal-editor-textarea"]').fill(journalText);
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Start reflection and answer daily question
    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Answer this question")')).toBeVisible();
    await page.locator('button:has-text("Answer this question")').click();
    await page.waitForTimeout(2000);

    // Now navigate back to journal page
    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    // Start reflection again
    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForLoadState('networkidle');

    // Daily question should NOT appear again
    await expect(page.locator('text=Question of the Day')).not.toBeVisible();
    await expect(page.locator('button:has-text("Answer this question")')).not.toBeVisible();

    // Should see previous chat messages
    await expect(page.locator('[data-test-role="user-message"]')).toBeVisible();
    await expect(page.locator('[data-test-role="assistant-message"]')).toBeVisible();
  });

  test('should show different questions on different days', async ({ page }) => {
    const testDate1 = '2025-04-01';
    const testDate2 = '2025-04-02';

    // Clean up both dates
    await cleanupJournal(page, testDate1);
    await cleanupJournal(page, testDate2);
    await cleanupDailyQuestion(page, testDate1);
    await cleanupDailyQuestion(page, testDate2);

    // Get question for first date
    await page.goto(`/journal/${testDate1}`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-test-id="journal-editor-textarea"]').fill('First day content.');
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Question of the Day')).toBeVisible();
    const question1Element = page.locator('text=Question of the Day').locator('..').locator('..');
    const question1Text = await question1Element.textContent();

    // Get question for second date
    await page.goto(`/journal/${testDate2}`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-test-id="journal-editor-textarea"]').fill('Second day content.');
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Question of the Day')).toBeVisible();
    const question2Element = page.locator('text=Question of the Day').locator('..').locator('..');
    const question2Text = await question2Element.textContent();

    // Questions should be different (this tests that questions are date-specific)
    expect(question1Text).not.toBe(question2Text);
  });

  test('should handle daily question loading errors gracefully', async ({ page }) => {
    const testDate = '2025-05-01';
    await cleanupJournal(page, testDate);

    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    // Intercept the daily questions API call and make it fail
    await page.route('**/api/daily-questions/today*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Server error' }),
      });
    });

    await page.locator('[data-test-id="journal-editor-textarea"]').fill('Test content.');
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    await page.locator('[data-test-id="start-reflection-button"]').click();
    await page.waitForLoadState('networkidle');

    // Should still show reflection session without daily question
    await expect(page.locator('text=Reflection Session')).toBeVisible();

    // Daily question should not be visible
    await expect(page.locator('text=Question of the Day')).not.toBeVisible();

    // Chat interface should still be functional
    await expect(page.locator('textarea[placeholder*="Type your response"]')).toBeVisible();
  });
});
