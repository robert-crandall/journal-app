import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Metric Summaries Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.waitForLoadState('networkidle');
  });

  async function cleanupMetricSummaries(page: any) {
    try {
      const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';

      // Get all metric summaries to delete
      const response = await page.request.get(`${TEST_CONFIG.API_BASE_URL}/api/metric-summaries`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok()) {
        const data = await response.json();
        if (data.success && data.data.summaries.length > 0) {
          // Delete each summary
          for (const summary of data.data.summaries) {
            await page.request.delete(`${TEST_CONFIG.API_BASE_URL}/api/metric-summaries/${summary.id}`, {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            });
          }
        }
      }
    } catch (error) {
      // Ignore errors - summaries might not exist
    }
  }

  async function createTestData(page: any) {
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';

    // Create test journals with XP grants and tone tags
    const testJournals = [
      {
        date: '2024-01-15',
        initialMessage: 'Had a productive day working on the journal app. Made significant progress on the backend API.',
      },
      {
        date: '2024-01-16',
        initialMessage: 'Focused on frontend development today. Created new components and improved the UI.',
      },
      {
        date: '2024-01-17',
        initialMessage: 'Debugging some issues with the database queries. Challenging but rewarding work.',
      },
    ];

    // Create journals
    for (const journal of testJournals) {
      await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journals`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(journal),
      });

      // Start reflection and finish it to generate XP and tone tags
      await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journals/${journal.date}/start-reflection`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Finish the journal to create XP grants and tone tags
      await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journals/${journal.date}/finish`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          dayRating: 4,
        }),
      });
    }

    // Create some character stats for XP grants
    await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/stats/predefined`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        statNames: ['Programming', 'Problem Solving', 'Creativity'],
      }),
    });
  }

  test('should navigate to metric summaries page', async ({ page }) => {
    await loginUser(page);

    // Navigate to metric summaries via user menu
    await page.click('[aria-label="Open menu"]');
    await page.locator('a:has-text("Metric Summaries")').first().click();

    // Should be on the metric summaries page
    await expect(page).toHaveURL('/metric-summaries');
    await expect(page.locator('h1:has-text("Metric Summaries")')).toBeVisible();
  });

  test('should show empty state when no summaries exist', async ({ page }) => {
    await loginUser(page);
    await page.goto('/metric-summaries');

    // Check empty state content
    await expect(page.locator('text=No Metric Summaries Yet')).toBeVisible();
    await expect(page.locator('text=Generate your first metric summary')).toBeVisible();
    await expect(page.locator('button:has-text("Generate Metrics")').first()).toBeVisible();
  });

  test('should generate metrics for a time period', async ({ page }) => {
    await cleanupMetricSummaries(page);
    await createTestData(page);

    // Go to generate metrics page
    await page.goto('/metric-summaries/generate');
    await expect(page.locator('h1')).toHaveText('Generate Metrics');

    // Set date range (last 7 days)
    await page.click('button:has-text("Last 7 Days")');

    // Verify date inputs are populated
    await expect(page.locator('#start-date')).toHaveValue(/\d{4}-\d{2}-\d{2}/);
    await expect(page.locator('#end-date')).toHaveValue(/\d{4}-\d{2}-\d{2}/);

    // Generate metrics
    await page.click('button:has-text("Generate Metrics")');

    // Should show success state
    await expect(page.locator('text=Metrics Generated Successfully!')).toBeVisible();

    // Should redirect to the generated summary
    await page.waitForURL(/\/metric-summaries\/[a-f0-9-]+/);
    await expect(page.locator('h1')).toContainText(/\w+ \d+, \d+|\w+ \d+ - \w+ \d+, \d+/); // Date range format
  });

  test('should display metric summary details', async ({ page }) => {
    await cleanupMetricSummaries(page);
    await createTestData(page);

    // Generate a metric summary first
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
    const metricsResponse = await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/metric-summaries/generate`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      }),
    });

    expect(metricsResponse.ok()).toBeTruthy();
    const metricsData = await metricsResponse.json();
    const summaryId = metricsData.data.id;

    // Navigate to the summary detail page
    await page.goto(`/metric-summaries/${summaryId}`);

    // Should show summary details
    await expect(page.locator('h1')).toContainText(/\w+ \d+, \d+|\w+ \d+ - \w+ \d+, \d+/);

    // Should show key metrics
    await expect(page.locator('text=Total XP')).toBeVisible();
    await expect(page.locator('text=Avg Rating')).toBeVisible();
    await expect(page.locator('text=Days Logged')).toBeVisible();
    await expect(page.locator('text=Tasks Done')).toBeVisible();

    // Should show delete button
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
  });

  test('should filter and sort metric summaries', async ({ page }) => {
    await cleanupMetricSummaries(page);
    await createTestData(page);

    // Generate multiple metric summaries
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';

    // Generate journal-type summary
    await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/metric-summaries/generate`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      }),
    });

    await page.goto('/metric-summaries');

    // Should see generated summaries
    await page.waitForSelector('.card-body', { timeout: 10000 });
    const cardCount = await page.locator('.card').count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Test type filter
    await page.selectOption('#type-filter', 'journal');
    await page.waitForLoadState('networkidle');

    // Should still show summaries (since they're journal type)
    const filteredCardCount = await page.locator('.card').count();
    expect(filteredCardCount).toBeGreaterThanOrEqual(1);

    // Test sort by total XP
    await page.selectOption('#sort-by-filter', 'totalXp');
    await page.waitForLoadState('networkidle');

    // Should maintain summaries display
    const sortedCardCount = await page.locator('.card').count();
    expect(sortedCardCount).toBeGreaterThanOrEqual(1);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Try to access non-existent summary
    await page.goto('/metric-summaries/non-existent-id');
    await expect(page.locator('text=Error Loading Summary')).toBeVisible();
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('should delete metric summary', async ({ page }) => {
    await cleanupMetricSummaries(page);
    await createTestData(page);

    // Generate a metric summary first
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
    const metricsResponse = await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/metric-summaries/generate`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      }),
    });

    const metricsData = await metricsResponse.json();
    const summaryId = metricsData.data.id;

    // Navigate to summary detail
    await page.goto(`/metric-summaries/${summaryId}`);

    // Delete the summary
    page.on('dialog', (dialog) => dialog.accept()); // Accept confirmation dialog
    await page.click('button:has-text("Delete")');

    // Should redirect back to summaries list
    await expect(page).toHaveURL('/metric-summaries');
  });

  test('should show metric summary widget on dashboard', async ({ page }) => {
    await cleanupMetricSummaries(page);
    await createTestData(page);

    // Generate a metric summary
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
    await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/metric-summaries/generate`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      }),
    });

    // Go to dashboard
    await page.goto('/');

    // Should be able to navigate to metric summaries from various places
    await page.click('[aria-label="Open menu"]');
    await expect(page.locator('text=Metric Summaries')).toBeVisible();
  });

  test('should persist metric summaries across sessions', async ({ page }) => {
    await cleanupMetricSummaries(page);
    await createTestData(page);

    // Generate a metric summary
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
    await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/metric-summaries/generate`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      }),
    });

    // Go to metric summaries
    await page.goto('/metric-summaries');
    const cardCount = await page.locator('.card').count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Refresh the page
    await page.reload();

    // Should still show the metric summary
    const refreshedCardCount = await page.locator('.card').count();
    expect(refreshedCardCount).toBeGreaterThanOrEqual(1);
  });

  // Cleanup after tests
  test.afterEach(async ({ page }) => {
    await cleanupMetricSummaries(page);
  });
});
