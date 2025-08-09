import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

const TEST_CONFIG = {
  API_BASE_URL: 'http://localhost:3001',
};

test.describe('Weekly Analysis Photos', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
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

  async function cleanupWeeklyAnalyses(page: any) {
    try {
      const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
      // Get all analyses and delete them
      const response = await page.request.get(`${TEST_CONFIG.API_BASE_URL}/api/weekly-analyses`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok()) {
        const analyses = await response.json();
        for (const analysis of analyses) {
          await page.request.delete(`${TEST_CONFIG.API_BASE_URL}/api/weekly-analyses/${analysis.id}`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
        }
      }
    } catch (error) {
      // Ignore errors - analyses might not exist
    }
  }

  test('should show photos in weekly analysis when journal entries have photos', async ({ page }) => {
    const testDate1 = '2024-02-05'; // Monday of a test week
    const testDate2 = '2024-02-07'; // Wednesday of same week

    // Clean up any existing data
    await cleanupJournal(page, testDate1);
    await cleanupJournal(page, testDate2);
    await cleanupWeeklyAnalyses(page);

    // Create first journal entry with photo
    await page.goto(`/journal/${testDate1}`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-test-id="journal-editor-textarea"]').fill('First journal entry with photo content.');
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Upload a photo to the first journal
    await page.getByText('Photos').click();

    // Create a small test image blob
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-photo-1.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    // Wait for upload to complete
    await expect(page.getByText('Photo uploaded successfully')).toBeVisible();

    // Finish the first journal entry
    await page.locator('[data-test-id="finish-journal-button"]').click();
    await page.locator('[data-test-id="confirm-finish-button"]').click();
    await page.waitForTimeout(3000);

    // Verify completion
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();

    // Create second journal entry with photo
    await page.goto(`/journal/${testDate2}`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-test-id="journal-editor-textarea"]').fill('Second journal entry with different photo.');
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Upload a photo to the second journal
    await page.getByText('Photos').click();

    const testImageBuffer2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

    await fileInput.setInputFiles({
      name: 'test-photo-2.png',
      mimeType: 'image/png',
      buffer: testImageBuffer2,
    });

    // Wait for upload to complete
    await expect(page.getByText('Photo uploaded successfully')).toBeVisible();

    // Finish the second journal entry
    await page.locator('[data-test-id="finish-journal-button"]').click();
    await page.locator('[data-test-id="confirm-finish-button"]').click();
    await page.waitForTimeout(3000);

    // Verify completion
    await expect(page.locator('[data-test-id="journal-complete"]')).toBeVisible();

    // Navigate to weekly analysis generation
    await page.goto('/weekly-analyses/generate');
    await page.waitForLoadState('networkidle');

    // Generate weekly analysis for the week containing our test dates
    await page.selectOption('select', 'weekly');
    await page.selectOption('select:nth-of-type(2)', 'custom');

    // Set custom date range to include our test dates
    await page.fill('input[type="date"]:first-of-type', '2024-02-05');
    await page.fill('input[type="date"]:last-of-type', '2024-02-09');

    // Generate analysis
    await page.getByRole('button', { name: 'Generate Analysis' }).click();

    // Wait for analysis to complete and redirect
    await expect(page).toHaveURL(/\/weekly-analyses\/[a-f0-9-]+/);
    await page.waitForLoadState('networkidle');

    // Verify the analysis page loads
    await expect(page.getByText('Weekly Analysis')).toBeVisible();

    // Check that photos section exists and has 2 photos
    await expect(page.getByText('Photos from this period (2)')).toBeVisible();

    // Check that both photos are displayed
    const photos = page.locator('img[alt*="Photo from 2024-02"]');
    await expect(photos).toHaveCount(2);

    // Verify photo thumbnails are loaded
    await expect(photos.first()).toHaveAttribute('src', /thumbnail/);
    await expect(photos.last()).toHaveAttribute('src', /thumbnail/);

    // Verify photos have proper dates
    await expect(page.getByText('2024-02-05')).toBeVisible(); // First journal date
    await expect(page.getByText('2024-02-07')).toBeVisible(); // Second journal date

    // Cleanup
    await cleanupJournal(page, testDate1);
    await cleanupJournal(page, testDate2);
    await cleanupWeeklyAnalyses(page);
  });

  test('should show empty state when no photos exist in the analysis period', async ({ page }) => {
    const testDate = '2024-02-12'; // Monday of a different week

    // Clean up any existing data
    await cleanupJournal(page, testDate);
    await cleanupWeeklyAnalyses(page);

    // Create journal entry without photo
    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-test-id="journal-editor-textarea"]').fill('Journal entry without photos.');
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Finish the journal entry
    await page.locator('[data-test-id="finish-journal-button"]').click();
    await page.locator('[data-test-id="confirm-finish-button"]').click();
    await page.waitForTimeout(3000);

    // Navigate to weekly analysis generation
    await page.goto('/weekly-analyses/generate');
    await page.waitForLoadState('networkidle');

    // Generate weekly analysis for the week containing our test date
    await page.selectOption('select', 'weekly');
    await page.selectOption('select:nth-of-type(2)', 'custom');

    // Set custom date range to include our test date
    await page.fill('input[type="date"]:first-of-type', '2024-02-12');
    await page.fill('input[type="date"]:last-of-type', '2024-02-16');

    // Generate analysis
    await page.getByRole('button', { name: 'Generate Analysis' }).click();

    // Wait for analysis to complete and redirect
    await expect(page).toHaveURL(/\/weekly-analyses\/[a-f0-9-]+/);
    await page.waitForLoadState('networkidle');

    // Verify the analysis page loads
    await expect(page.getByText('Weekly Analysis')).toBeVisible();

    // Check that photos section does NOT exist since no photos were uploaded
    await expect(page.getByText('Photos from this period')).not.toBeVisible();

    // Cleanup
    await cleanupJournal(page, testDate);
    await cleanupWeeklyAnalyses(page);
  });

  test('should allow clicking photos to view full size', async ({ page }) => {
    const testDate = '2024-02-19'; // Monday of another test week

    // Clean up any existing data
    await cleanupJournal(page, testDate);
    await cleanupWeeklyAnalyses(page);

    // Create journal entry with photo
    await page.goto(`/journal/${testDate}`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-test-id="journal-editor-textarea"]').fill('Journal entry for full size photo test.');
    await page.locator('[data-test-id="save-draft-button"]').click();
    await page.waitForTimeout(1000);

    // Upload a photo
    await page.getByText('Photos').click();

    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'full-size-test.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await expect(page.getByText('Photo uploaded successfully')).toBeVisible();

    // Finish the journal entry
    await page.locator('[data-test-id="finish-journal-button"]').click();
    await page.locator('[data-test-id="confirm-finish-button"]').click();
    await page.waitForTimeout(3000);

    // Generate analysis
    await page.goto('/weekly-analyses/generate');
    await page.waitForLoadState('networkidle');

    await page.selectOption('select', 'weekly');
    await page.selectOption('select:nth-of-type(2)', 'custom');
    await page.fill('input[type="date"]:first-of-type', '2024-02-19');
    await page.fill('input[type="date"]:last-of-type', '2024-02-23');

    await page.getByRole('button', { name: 'Generate Analysis' }).click();
    await expect(page).toHaveURL(/\/weekly-analyses\/[a-f0-9-]+/);
    await page.waitForLoadState('networkidle');

    // Verify photos section exists
    await expect(page.getByText('Photos from this period (1)')).toBeVisible();

    // Test clicking on photo opens full size (this will open in a new tab/window)
    const [newPage] = await Promise.all([page.waitForEvent('popup'), page.locator('button[title*="View photo from 2024-02-19"]').click()]);

    // Verify the new page opened with the full-size image URL
    expect(newPage.url()).toMatch(/\/api\/photos\//);

    await newPage.close();

    // Cleanup
    await cleanupJournal(page, testDate);
    await cleanupWeeklyAnalyses(page);
  });
});
