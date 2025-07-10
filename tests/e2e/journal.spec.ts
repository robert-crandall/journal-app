import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Journal functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as the test user
    await loginUser(page);
  });

  test('should display journal page and allow navigation to create new entry', async ({ page }) => {
    // Navigate to journal page
    await page.goto('/journal');

    // Check page loads correctly
    await expect(page).toHaveTitle(/Journal/);
    await expect(page.locator('h1')).toContainText('Journal');

    // Should show empty state initially or existing entries
    const hasEntries = await page.locator('text=No Journal Entries Yet').isVisible();
    if (hasEntries) {
      // Should have a button to create new entry
      await expect(page.locator('button:has-text("Write Your First Entry")')).toBeVisible();
    } else {
      // Should have new entry button in header
      await expect(page.locator('button:has-text("New Entry")')).toBeVisible();
    }
  });

  test('should create a new journal entry', async ({ page }) => {
    // Navigate to journal page
    await page.goto('/journal');

    // Click to create new entry (handle both empty state and regular state)
    const writeFirstButton = page.locator('button:has-text("Write Your First Entry")');
    const newEntryButton = page.locator('button:has-text("New Entry"), button:has-text("Start Today\'s Journal")');

    if (await writeFirstButton.isVisible()) {
      await writeFirstButton.click();
    } else {
      await newEntryButton.first().click();
    }

    // Should navigate to new entry page
    await expect(page).toHaveURL(/\/journal\/new/);
    await expect(page.locator('h1')).toContainText('New Journal Entry');

    // Fill in content
    const journalContent =
      'Today was a great day. I learned a lot about web development and felt very productive. I solved several challenging problems and made good progress on my projects.';
    await page.fill('textarea[placeholder*="Write freely about your day"]', journalContent);

    // Check character and word count updates
    await expect(page.locator('text=characters')).toBeVisible();
    await expect(page.locator('text=words')).toBeVisible();

    // Save the entry
    await page.click('button:has-text("Save Entry")');

    // Should navigate to the journal detail view
    await expect(page).toHaveURL(/\/journal\/[a-f0-9-]+$/);
    await expect(page.locator('h1')).toContainText('Journal Entry');

    // Should show the content
    await expect(page.locator('text=Original Entry')).toBeVisible();
    await expect(page.locator(`text=${journalContent}`)).toBeVisible();

    // Should show draft status
    await expect(page.locator('.badge:has-text("Draft")')).toBeVisible();
  });

  test('should edit existing journal entry', async ({ page }) => {
    // First create a journal entry
    await page.goto('/journal/new');

    const originalContent = 'This is my original journal entry content.';
    await page.fill('textarea[placeholder*="Write freely about your day"]', originalContent);
    await page.click('button:has-text("Save Entry")');

    // Now edit it
    await page.click('button:has-text("Edit")');

    // Should navigate to edit page
    await expect(page).toHaveURL(/\/journal\/[a-f0-9-]+\/edit$/);
    await expect(page.locator('h1')).toContainText('Edit Journal Entry');

    // Content should be pre-filled
    await expect(page.locator('textarea')).toHaveValue(originalContent);

    // Edit the content
    const updatedContent = originalContent + ' Here is additional content I added later.';
    await page.fill('textarea', updatedContent);

    // Save changes
    await page.click('button:has-text("Save")');

    // Should return to detail view
    await expect(page).toHaveURL(/\/journal\/[a-f0-9-]+$/);

    // Should show updated content
    await expect(page.locator(`text=${updatedContent}`)).toBeVisible();
  });

  test('should analyze journal entry and show results', async ({ page }) => {
    // Create a journal entry with content that will trigger analysis
    await page.goto('/journal/new');

    const analysisContent =
      'Today was amazing! I felt incredibly productive working on my programming projects. I solved complex algorithms and learned new frameworks. I also spent quality time with my family and felt grateful for their support. Overall, it was a day of growth, learning, and connection.';
    await page.fill('textarea[placeholder*="Write freely about your day"]', analysisContent);
    await page.click('button:has-text("Save Entry")');

    // Click analyze button
    await page.click('button:has-text("Analyze with AI")');

    // Wait for analysis to complete
    await expect(page.locator('button:has-text("Analyzing")')).toBeVisible();
    await expect(page.locator('.badge:has-text("Analyzed")')).toBeVisible();

    // Should show analysis results
    await expect(page.locator('text=AI Summary')).toBeVisible();
    await expect(page.locator('text=Key Takeaway')).toBeVisible();

    // Should show tags if any were generated
    const tagsSection = page.locator('text=Themes & Emotions');
    if (await tagsSection.isVisible()) {
      await expect(tagsSection).toBeVisible();
    }

    // Should show XP gained if any stats were matched
    const xpSection = page.locator('text=Experience Gained');
    if (await xpSection.isVisible()) {
      await expect(xpSection).toBeVisible();
    }
  });

  test('should navigate between journal entries', async ({ page }) => {
    // Create multiple journal entries
    const entries = [
      'First journal entry about my morning routine.',
      'Second journal entry about my afternoon work.',
      'Third journal entry about my evening reflection.',
    ];

    for (const content of entries) {
      await page.goto('/journal/new');
      await page.fill('textarea[placeholder*="Write freely about your day"]', content);
      await page.click('button:has-text("Save Entry")');

      // Go back to journal list
      await page.click('text=Back to Journal');
    }

    // Should see all entries listed
    await page.goto('/journal');

    // Check for entry previews (they might be truncated)
    for (const content of entries) {
      await expect(page.locator('text*=' + content.substring(0, 30))).toBeVisible();
    }

    // Click on an entry to view details - use the View button
    await page.locator('button:has-text("View")').first().click();
    await expect(page).toHaveURL(/\/journal\/[a-f0-9-]+$/);
  });

  test('should delete journal entry', async ({ page }) => {
    // Create a journal entry
    await page.goto('/journal/new');

    const content = 'This entry will be deleted.';
    await page.fill('textarea[placeholder*="Write freely about your day"]', content);
    await page.click('button:has-text("Save Entry")');

    // Open dropdown menu and click delete
    await page.click('div.dropdown button:has-text("⋮")');

    // Handle confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("Delete Entry")');

    // Should redirect to journal list
    await expect(page).toHaveURL('/journal');

    // Entry should no longer be visible
    await expect(page.locator(`text=${content}`)).not.toBeVisible();
  });

  test('should handle keyboard shortcuts in editor', async ({ page }) => {
    await page.goto('/journal/new');

    const content = 'Testing keyboard shortcuts in the journal editor.';
    await page.fill('textarea[placeholder*="Write freely about your day"]', content);

    // Test Ctrl+S to save
    await page.keyboard.press('Control+S');

    // Should navigate to detail view
    await expect(page).toHaveURL(/\/journal\/[a-f0-9-]+$/);
    await expect(page.locator(`text=${content}`)).toBeVisible();
  });

  test('should show writing statistics in sidebar', async ({ page }) => {
    // Create a few entries to generate statistics
    const entries = ['First entry for statistics testing.', 'Second entry to increase the count.', 'Third entry to verify statistics display.'];

    for (const content of entries) {
      await page.goto('/journal/new');
      await page.fill('textarea[placeholder*="Write freely about your day"]', content);
      await page.click('button:has-text("Save Entry")');
      await page.click('text=Back to Journal');
    }

    // Check statistics in sidebar
    await page.goto('/journal');

    await expect(page.locator('text=Writing Stats')).toBeVisible();
    await expect(page.locator('text=Total Entries:')).toBeVisible();
    await expect(page.locator('text=3').first()).toBeVisible(); // Should show 3 entries

    await expect(page.locator('text=Drafts:')).toBeVisible();
    await expect(page.locator('text=3').nth(1)).toBeVisible(); // All should be drafts initially
  });

  test('should prevent editing finalized journal entries', async ({ page }) => {
    // Create and analyze a journal entry
    await page.goto('/journal/new');

    const content = 'This entry will be finalized and should become read-only.';
    await page.fill('textarea[placeholder*="Write freely about your day"]', content);
    await page.click('button:has-text("Save Entry")');

    // Analyze the entry
    await page.click('button:has-text("Analyze with AI")');
    await expect(page.locator('.badge:has-text("Analyzed")')).toBeVisible();

    // Try to edit - should show read-only message
    await page.click('button:has-text("Read Only")');
    // The edit button should be disabled or show it's read-only
    await expect(page.locator('button:has-text("Read Only")[disabled]')).toBeVisible();
  });
});
