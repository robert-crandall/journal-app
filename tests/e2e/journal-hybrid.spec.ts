import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Journal Hybrid UX Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should support long-form journal entry creation without chat', async ({ page }) => {
    // Navigate to long-form journal page
    await page.goto('/journal/longform');
    
    // Check if the page has loaded correctly
    await expect(page.locator('h1')).toContainText('New Journal Entry');
    
    // Fill in the long-form content
    const testContent = 'This is a test journal entry written in long-form mode. I want to capture my thoughts before starting a conversation.';
    await page.fill('textarea', testContent);
    
    // Save the entry without starting reflection
    await page.getByRole('button', { name: 'Save Only' }).click();
    
    // Should be redirected to the entry view
    await expect(page).toHaveURL(/\/journal\/[\w-]+$/);
    
    // Check that the content is visible (might be in different elements depending on how it's rendered)
    await expect(page.getByText(testContent)).toBeVisible();
    
    // There should be a "Begin Reflection" button
    await expect(page.getByRole('button', { name: 'Begin Reflection' })).toBeVisible();
  });

  test('should allow starting in long-form and transitioning to chat mode', async ({ page }) => {
    // Navigate to long-form journal page
    await page.goto('/journal/longform');
    
    // Fill in the long-form content
    const testContent = 'This is a test journal entry that will transition to chat mode after saving.';
    await page.fill('textarea', testContent);
    
    // Click Save & Begin Reflection
    await page.getByRole('button', { name: 'Save & Begin Reflection' }).click();
    
    // Should be redirected to either session page or the entry page directly
    await expect(page).toHaveURL(/\/journal\/(session\?id=|)[\w-]+$/);
    
    // Wait for the chat session to load - look for any chat bubbles
    await expect(page.locator('.chat-bubble').first()).toBeVisible({ timeout: 10000 });
    
    // Check for at least 2 chat bubbles (user content + AI response)
    await expect(page.locator('.chat-bubble').nth(1)).toBeVisible({ timeout: 10000 });
    
    // Send a follow-up message
    const followUp = "I'm now continuing this as a conversation.";
    await page.fill('textarea', followUp);
    await page.click('button:has-text("Send")');
    
    // Check the message appears
    await expect(page.locator('.chat-bubble').nth(2)).toContainText(followUp);
    
    // Wait for GPT response
    await expect(page.locator('.chat-bubble').nth(3)).toBeVisible({ timeout: 30000 });
    
    // Save the entry
    await page.click('button:has-text("Save Entry")');
    
    // Should be redirected to the entry view
    await expect(page).toHaveURL(/\/journal\/[\w-]+$/);
    
    // Page should show both the long-form content and the chat
    await expect(page.locator('h2').first()).toContainText('Journal Entry');
    await expect(page.locator('h2').nth(1)).toContainText('Reflection');
  });
});
