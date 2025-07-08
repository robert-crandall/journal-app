import { test, expect } from '@playwright/test';
import { loginUser, cleanupJournalEntries } from './test-helpers';

test.describe('Journal Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await cleanupJournalEntries(page);
  });

  test('should display journal dashboard with navigation', async ({ page }) => {
    // Navigate to journal page
    await page.click('a[href="/journal"]');
    await expect(page).toHaveURL('/journal');

    // Check page loads with basic structure
    await expect(page.locator('h1')).toContainText('Journal');
    await expect(page.locator('button:has-text("Start New Session")')).toBeVisible();

    // Should show empty state initially
    await expect(page.locator('text=No journal entries yet')).toBeVisible();
  });

  test('should start a new journal session successfully', async ({ page }) => {
    await page.goto('/journal');

    // Click start new session button
    await page.click('button:has-text("Start New Session")');
    await expect(page).toHaveURL('/journal/session');

    // Check session page loads
    await expect(page.locator('h1')).toContainText('Journal Session');
    await expect(page.locator('text=Starting your journal session')).toBeVisible();

    // Wait for initial AI message to appear
    await expect(page.locator('.chat .chat-bubble').first()).toBeVisible({ timeout: 10000 });

    // Check AI message is visible and has proper styling
    const aiMessage = page.locator('.chat.chat-start .chat-bubble').first();
    await expect(aiMessage).toBeVisible();
    await expect(aiMessage).toHaveClass(/bg-primary/);

    // Check textarea is ready for input
    await expect(page.locator('textarea[placeholder*="Share whatever\'s on your mind"]')).toBeVisible();
  });

  test('should send messages and receive AI responses', async ({ page }) => {
    // Start a session first
    await page.goto('/journal/session');

    // Wait for initial AI message
    await expect(page.locator('.chat .chat-bubble').first()).toBeVisible({ timeout: 10000 });

    // Send a user message
    const userMessage = 'I had a really productive day today. Finished my project and felt accomplished.';
    await page.fill('textarea', userMessage);
    await page.click('button:has-text("Send")');

    // Check user message appears with correct styling
    const userBubble = page.locator('.chat.chat-end .chat-bubble').last();
    await expect(userBubble).toContainText(userMessage);
    await expect(userBubble).toHaveClass(/bg-base-200/);

    // Check AI is typing indicator appears
    await expect(page.locator('.loading.loading-dots')).toBeVisible();

    // Wait for AI response
    await expect(page.locator('.chat.chat-start .chat-bubble').nth(1)).toBeVisible({ timeout: 15000 });

    // Check AI response has proper styling
    const aiResponse = page.locator('.chat.chat-start .chat-bubble').nth(1);
    await expect(aiResponse).toHaveClass(/bg-primary/);
  });

  test('should offer to save entry after conversation', async ({ page }) => {
    // Start a session
    await page.goto('/journal/session');
    await expect(page.locator('.chat .chat-bubble').first()).toBeVisible({ timeout: 10000 });

    // Send multiple messages to make save button appear
    const messages = [
      'Today was a great day at work.',
      'I completed my main project and got positive feedback from my manager.',
      "I'm feeling really accomplished and motivated for tomorrow.",
    ];

    for (const message of messages) {
      await page.fill('textarea', message);
      await page.click('button:has-text("Send")');

      // Wait for AI response before sending next message
      await expect(page.locator('.loading.loading-dots')).toBeVisible();
      await expect(page.locator('.loading.loading-dots')).not.toBeVisible({ timeout: 15000 });
    }

    // Should show save button at bottom after conversation starts
    await expect(page.locator('button:has-text("💾 Save Entry")')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Ready to save this journal entry')).toBeVisible();
  });

  test('should save journal entry and navigate to entry view', async ({ page }) => {
    // Start a session and send messages
    await page.goto('/journal/session');
    await expect(page.locator('.chat .chat-bubble').first()).toBeVisible({ timeout: 10000 });

    // Send a meaningful message
    await page.fill('textarea', 'Today I reflected on my goals and made progress on my personal growth.');
    await page.click('button:has-text("Send")');

    // Wait for AI response and save button to appear at bottom
    await expect(page.locator('button:has-text("💾 Save Entry")')).toBeVisible({ timeout: 20000 });

    // Save the entry
    await page.click('button:has-text("💾 Save Entry")');

    // Should navigate to the saved entry view
    await expect(page).toHaveURL(/\/journal\/[a-f0-9-]+$/);

    // Check entry view page structure
    await expect(page.locator('h1')).toContainText('Journal Entry');

    // Check that we have multiple chat bubbles (at least 2 - initial AI + user message)
    const chatBubbles = page.locator('.chat .chat-bubble');
    await expect(chatBubbles).toHaveCount(2, { timeout: 10000 });

    // Check that we can see the conversation
    await expect(page.locator('text=Today I reflected on my goals')).toBeVisible();
  });

  test('should display saved entry in journal list', async ({ page }) => {
    // Create an entry first by going through the session flow
    await page.goto('/journal/session');
    await expect(page.locator('.chat .chat-bubble').first()).toBeVisible({ timeout: 10000 });

    const testMessage = `Test journal entry created on ${new Date().toLocaleDateString()}`;
    await page.fill('textarea', testMessage);
    await page.click('button:has-text("Send")');

    // Wait for save option and save
    await expect(page.locator('button:has-text("💾 Save Entry")')).toBeVisible({ timeout: 20000 });
    await page.click('button:has-text("💾 Save Entry")');

    // Navigate back to journal list
    await page.click('a[href="/journal"]');
    await expect(page).toHaveURL('/journal');

    // Should see the saved entry in the list
    const entryCards = page.locator('.card');
    await expect(entryCards.first()).toBeVisible();

    // Should contain our test message in one of the entries
    await expect(page.locator(`text=${testMessage}`)).toBeVisible();
  });

  test('should navigate between journal list and entry details', async ({ page }) => {
    // Ensure we have at least one entry by creating one
    await page.goto('/journal/session');
    await expect(page.locator('.chat .chat-bubble').first()).toBeVisible({ timeout: 10000 });

    await page.fill('textarea', 'Navigation test entry');
    await page.click('button:has-text("Send")');
    await expect(page.locator('button:has-text("💾 Save Entry")')).toBeVisible({ timeout: 20000 });
    await page.click('button:has-text("💾 Save Entry")');

    // Go back to journal list
    await page.click('a[href="/journal"]');
    await expect(page).toHaveURL('/journal');

    // Click on the entry card to view details
    await page.locator('.card').first().click();
    await expect(page).toHaveURL(/\/journal\/[a-f0-9-]+$/);

    // Check we can navigate back
    await page.click('a:has-text("← Back to Journal")');
    await expect(page).toHaveURL('/journal');
  });

  test('should handle session discard correctly', async ({ page }) => {
    // Start a session
    await page.goto('/journal/session');
    await expect(page.locator('.chat .chat-bubble').first()).toBeVisible({ timeout: 10000 });

    // Send a message
    await page.fill('textarea', 'This session will be discarded');
    await page.click('button:has-text("Send")');

    // Wait for save button to appear at bottom
    await expect(page.locator('button:has-text("💾 Save Entry")')).toBeVisible({ timeout: 20000 });

    // Click discard instead
    await page.click('button:has-text("Discard")');

    // Should navigate back to journal list
    await expect(page).toHaveURL('/journal');

    // The discarded entry should not appear in the list
    await expect(page.locator('text=This session will be discarded')).not.toBeVisible();
  });

  test('should show proper timestamps in conversation', async ({ page }) => {
    // Start a session
    await page.goto('/journal/session');
    await expect(page.locator('.chat .chat-bubble').first()).toBeVisible({ timeout: 10000 });

    // Send a message
    await page.fill('textarea', 'Testing timestamps');
    await page.click('button:has-text("Send")');

    // Check that timestamps are visible and properly formatted
    const timeElements = page.locator('.chat-header time');
    await expect(timeElements.first()).toBeVisible();

    // Should have HH:MM format
    const timeText = await timeElements.first().textContent();
    expect(timeText).toMatch(/^\d{1,2}:\d{2}$/);
  });

  test('should handle keyboard shortcuts correctly', async ({ page }) => {
    // Start a session
    await page.goto('/journal/session');
    await expect(page.locator('.chat .chat-bubble').first()).toBeVisible({ timeout: 10000 });

    const textarea = page.locator('textarea');

    // Test Enter key sends message
    await textarea.fill('Testing Enter key');
    await textarea.press('Enter');

    // Should send the message
    await expect(page.locator('text=Testing Enter key')).toBeVisible();

    // Test Shift+Enter adds new line (when we have text in textarea)
    await textarea.fill('Line 1');
    await textarea.press('Shift+Enter');
    await textarea.type('Line 2');

    // The textarea should contain both lines
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toContain('Line 1\nLine 2');
  });
});
