import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Journal Tone Tags Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.waitForLoadState('networkidle');
  });

  async function createJournalWithToneTags(page: any, date: string, toneTags: string[]) {
    // Get auth token
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';

    // Clean up any existing journal for this date
    try {
      await page.request.delete(`${TEST_CONFIG.API_BASE_URL}/api/journals/${date}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch (error) {
      // Ignore - journal might not exist
    }

    // Create a completed journal with tone tags directly via API
    const response = await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journals`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        date: date,
        initialMessage: 'Test journal content for tone tags',
      },
    });

    // Update the journal to completed status with tone tags
    await page.request.put(`${TEST_CONFIG.API_BASE_URL}/api/journals/${date}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        status: 'complete',
        title: 'Test Journal',
        synopsis: 'A test journal with tone tags',
        toneTags: toneTags,
        summary: 'This is a test journal entry.',
      },
    });
  }

  test('displays tone tags in completed journal', async ({ page }) => {
    const testDate = '2025-01-15';
    const testToneTags = ['happy', 'energized'];

    await createJournalWithToneTags(page, testDate, testToneTags);

    // Navigate to the journal
    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    // Should show completed journal
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();

    // Should display tone tags
    const toneTagsDisplay = page.locator('[data-testid="tone-tags-display"]');
    await expect(toneTagsDisplay).toBeVisible();

    // Should show the happy badge
    await expect(page.locator('.badge').filter({ hasText: /happy/i })).toBeVisible();
  });

  test('shows tone tag filtering UI', async ({ page }) => {
    // Navigate to journal listing page
    const testDate = '2025-01-15';
    const testToneTags = ['happy', 'energized'];

    await createJournalWithToneTags(page, testDate, testToneTags);

    await page.goto('/journal');
    await page.waitForLoadState('networkidle');

    // Open filters
    await page.locator('button').filter({ hasText: 'Filters' }).click();

    // Should show tone tag filtering section
    await expect(page.locator('text=Mood Tags')).toBeVisible();

    // Should show tone tag filter buttons
    await expect(page.locator('button').filter({ hasText: /^Happy$/i })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /^Calm$/i })).toBeVisible();
  });

  test('displays tone tags in journal dashboard', async ({ page }) => {
    const testDate = '2025-01-15';
    const testToneTags = ['happy', 'energized'];

    await createJournalWithToneTags(page, testDate, testToneTags);

    await page.goto('/journals');
    await page.waitForLoadState('networkidle');

    // Check if journal dashboard displays emotional insights section
    const dashboardElement = page.locator('[data-test-id="journal-dashboard"]');
    await expect(dashboardElement).toBeVisible();

    // Should show the emotional insights card
    await expect(page.locator('text=Emotional Insights')).toBeVisible();

    // Should show mood column in recent entries table
    await expect(page.locator('th').filter({ hasText: 'Mood' })).toBeVisible();
  });
});
