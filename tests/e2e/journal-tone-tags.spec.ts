import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Journal Tone Tags Feature', () => {
  let testDate: string;

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.waitForLoadState('networkidle');
  });

  test.beforeAll(async ({ browser }) => {
    testDate = todaysDateString();
    const testToneTags = ['happy', 'energized'];

    // Create a context and page for setup
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginUser(page);
    await page.waitForLoadState('networkidle');
    await createJournalWithToneTags(page, testDate, testToneTags);
    await context.close();
  });

  function todaysDateString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  async function createJournalWithToneTags(page: any, date: string, toneTags: string[]) {
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
    try {
      await page.request.delete(`${TEST_CONFIG.API_BASE_URL}/api/journals/${date}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch {}
    await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journals`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        date: date,
        initialMessage: 'Test journal content for tone tags',
      },
    });
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
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');

    // Open filters
    await page.locator('button').filter({ hasText: 'Filters' }).click();

    // Should show tone tag filtering section
    await expect(page.locator('text=Mood Tags')).toBeVisible();

    // Should show tone tag filter buttons
    await expect(page.getByRole('button', { name: /Happy/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Calm/i })).toBeVisible();
  });
});
