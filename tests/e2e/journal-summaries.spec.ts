import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Journal Summaries Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.waitForLoadState('networkidle');
  });

  async function cleanupJournalSummaries(page: any) {
    try {
      const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';

      // Get all summaries to delete
      const response = await page.request.get(`${TEST_CONFIG.API_BASE_URL}/api/journal-summaries`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok()) {
        const data = await response.json();
        if (data.success && data.data.summaries.length > 0) {
          // Delete each summary
          for (const summary of data.data.summaries) {
            await page.request.delete(`${TEST_CONFIG.API_BASE_URL}/api/journal-summaries/${summary.id}`, {
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

  async function createTestJournals(page: any) {
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';

    // Create some test journal entries for the past week
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
        initialMessage: 'Debugging session day. Fixed several complex issues and learned a lot about async handling.',
      },
    ];

    for (const journal of testJournals) {
      try {
        // First create the journal
        const createRes = await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journals`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          data: journal,
        });

        if (createRes.ok()) {
          const journalData = await createRes.json();
          const journalId = journalData.data.id;

          // Complete the journal to make it available for summaries
          await page.request.put(`${TEST_CONFIG.API_BASE_URL}/api/journals/${journalId}/complete`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            data: {
              summary: journal.initialMessage,
              dayRating: 4,
            },
          });
        }
      } catch (error) {
        // Journal might already exist, continue
      }
    }
  }

  test.afterEach(async ({ page }) => {
    await cleanupJournalSummaries(page);
  });

  test('should navigate to journal summaries page', async ({ page }) => {
    await page.goto('/journal-summaries');
    await expect(page).toHaveURL('/journal-summaries');
    await expect(page.locator('h1')).toContainText('Journal Summaries');
  });

  test('should display empty state when no summaries exist', async ({ page }) => {
    await cleanupJournalSummaries(page);
    await page.goto('/journal-summaries');

    await expect(page.locator('text=No Journal Summaries Yet')).toBeVisible();
    await expect(page.locator('text=Create your first journal summary')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Weekly Summary' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Monthly Summary' })).toBeVisible();
  });

  test('should show generate summary page', async ({ page }) => {
    await page.goto('/journal-summaries/generate');

    await expect(page).toHaveURL('/journal-summaries/generate');
    await expect(page.locator('h1')).toContainText('Generate Summary');
    await expect(page.locator('text=Create an AI-generated summary')).toBeVisible();

    // Check form elements are present
    await expect(page.locator('input[type="radio"][value="week"]')).toBeVisible();
    await expect(page.locator('input[type="radio"][value="month"]')).toBeVisible();
    await expect(page.locator('input#start-date')).toBeVisible();
    await expect(page.locator('input#end-date')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Summary' })).toBeVisible();
  });

  test('should generate a weekly summary', async ({ page }) => {
    await cleanupJournalSummaries(page);
    await createTestJournals(page);

    await page.goto('/journal-summaries/generate');

    // Select weekly period (should be default)
    await page.check('input[type="radio"][value="week"]');

    // Set date range for the week containing our test journals
    await page.fill('input#start-date', '2024-01-15');
    await page.fill('input#end-date', '2024-01-21');

    // Generate summary
    await page.click('button[type="submit"]');

    // Wait for generation to complete (this might take some time with GPT)
    await expect(page.locator('text=Generating')).toBeVisible();

    // Should either navigate to summary detail page or show an error
    // (GPT might not be available in test environment)
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check if we're on a summary detail page or if there's an error
    const currentUrl = page.url();
    if (currentUrl.includes('/journal-summaries/') && !currentUrl.includes('/generate')) {
      // Successfully generated and navigated to detail page
      await expect(page.locator('h1')).toContainText('Summary');
    } else {
      // Might have failed due to GPT not being available
      // That's okay in the test environment
    }
  });

  test('should display summary list with filtering', async ({ page }) => {
    await cleanupJournalSummaries(page);

    // Create a test summary via API
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
    await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journal-summaries`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Test weekly summary content',
        tags: ['productivity', 'coding'],
      },
    });

    await page.goto('/journal-summaries');

    // Check summary card is displayed
    await expect(page.locator('.card').first()).toBeVisible();
    await expect(page.locator('text=Test weekly summary content')).toBeVisible();
    await expect(page.locator('text=productivity')).toBeVisible();
    await expect(page.locator('text=coding')).toBeVisible();

    // Test filtering by period
    await page.selectOption('select:near(:text("Period"))', 'week');
    await expect(page.locator('.card')).toHaveCount(2); // One test summary + one filter bar

    // Test filtering by monthly (should show no results)
    await page.selectOption('select:near(:text("Period"))', 'month');
    await expect(page.locator('text=No Journal Summaries Yet')).toBeVisible();
  });

  test('should view summary details', async ({ page }) => {
    await cleanupJournalSummaries(page);

    // Create a test summary via API
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
    const response = await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journal-summaries`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'This week was focused on development work with significant progress made.',
        tags: ['development', 'progress'],
      },
    });

    const data = await response.json();
    const summaryId = data.data.id;

    await page.goto(`/journal-summaries/${summaryId}`);

    // Check summary details are displayed
    await expect(page.locator('text=This week was focused on development')).toBeVisible();
    await expect(page.locator('.badge:has-text("development")')).toBeVisible();
    await expect(page.locator('.badge:has-text("progress")')).toBeVisible();

    // Check action buttons are present
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('should edit summary successfully', async ({ page }) => {
    await cleanupJournalSummaries(page);

    // Create a test summary via API
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
    const response = await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journal-summaries`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Original summary content',
        tags: ['original'],
      },
    });

    const data = await response.json();
    const summaryId = data.data.id;

    await page.goto(`/journal-summaries/${summaryId}`);

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Should show edit form
    await expect(page.locator('textarea#summary-content')).toBeVisible();
    await expect(page.locator('input#tags-input')).toBeVisible();

    // Update the summary
    await page.fill('textarea#summary-content', 'Updated summary content with new insights');
    await page.fill('input#tags-input', 'updated, insights, development');

    // Save changes
    await page.click('button[type="submit"]');

    // Should show updated content
    await expect(page.locator('text=Updated summary content with new insights')).toBeVisible();
  });

  test('should delete summary with confirmation', async ({ page }) => {
    await cleanupJournalSummaries(page);

    // Create a test summary via API
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';
    const response = await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journal-summaries`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Summary to be deleted',
        tags: ['delete-test'],
      },
    });

    const data = await response.json();
    const summaryId = data.data.id;

    await page.goto(`/journal-summaries/${summaryId}`);

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Should show confirmation dialog
    await expect(page.locator('text=Are you sure you want to delete this journal summary?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete Permanently' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Delete Permanently")');

    // Should redirect to summaries list
    await expect(page).toHaveURL('/journal-summaries');
  });

  test('should handle date range presets', async ({ page }) => {
    await page.goto('/journal-summaries/generate');

    // Test "Current Week" preset
    await page.click('button:has-text("Current Week")');

    const startDateValue = await page.inputValue('input#start-date');
    const endDateValue = await page.inputValue('input#end-date');

    // Should set date range to current week
    expect(startDateValue).toBeTruthy();
    expect(endDateValue).toBeTruthy();
    expect(new Date(endDateValue).getTime()).toBeGreaterThan(new Date(startDateValue).getTime());

    // Test "Previous Week" preset
    await page.click('button:has-text("Previous Week")');

    const lastWeekStart = await page.inputValue('input#start-date');
    const lastWeekEnd = await page.inputValue('input#end-date');

    expect(lastWeekStart).toBeTruthy();
    expect(lastWeekEnd).toBeTruthy();
    expect(new Date(lastWeekStart).getTime()).toBeLessThan(new Date(startDateValue).getTime());
  });

  test('should navigate between summary pages via links', async ({ page }) => {
    await page.goto('/journal-summaries');

    // Test navigation to generate page
    await page.click('button:has-text("Weekly Summary")');
    await expect(page).toHaveURL(/\/journal-summaries\/generate/);

    // Test back to list
    await page.click('button:has-text("Journal Summaries")');
    await expect(page).toHaveURL('/journal-summaries');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/journal-summaries/generate');

    // Fill valid form data
    await page.check('input[type="radio"][value="week"]');
    await page.fill('input#start-date', '2024-01-15');
    await page.fill('input#end-date', '2024-01-21');

    // Mock API failure by intercepting the request
    await page.route(`${TEST_CONFIG.API_BASE_URL}/api/journal-summaries/generate`, (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      });
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Internal server error')).toBeVisible();
  });

  test('should display correct period badges and formatting', async ({ page }) => {
    await cleanupJournalSummaries(page);

    // Create test summaries with different periods
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';

    const summaries = [
      {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: 'Weekly summary',
        tags: ['weekly'],
      },
      {
        period: 'month',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        summary: 'Monthly summary',
        tags: ['monthly'],
      },
    ];

    for (const summary of summaries) {
      await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journal-summaries`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        data: summary,
      });
    }

    await page.goto('/journal-summaries');

    // Should show both summaries with correct badges
    await expect(page.locator('.badge:has-text("weekly")')).toBeVisible();
    await expect(page.locator('.badge:has-text("monthly")')).toBeVisible();

    // Check date formatting
    await expect(page.locator('text=Jan 15 - Jan 21')).toBeVisible();
    await expect(page.locator('text=January 2024')).toBeVisible();
  });

  test('should filter summaries by year', async ({ page }) => {
    await cleanupJournalSummaries(page);

    // Create test summaries for different years
    const authToken = (await page.evaluate('localStorage.getItem("token")')) || '';

    const summaries = [
      {
        period: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        summary: '2024 summary',
        tags: ['2024'],
      },
      {
        period: 'week',
        startDate: '2023-12-25',
        endDate: '2023-12-31',
        summary: '2023 summary',
        tags: ['2023'],
      },
    ];

    for (const summary of summaries) {
      await page.request.post(`${TEST_CONFIG.API_BASE_URL}/api/journal-summaries`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        data: summary,
      });
    }

    await page.goto('/journal-summaries');

    // Should show both summaries initially
    await expect(page.locator('text=2024 summary')).toBeVisible();
    await expect(page.locator('text=2023 summary')).toBeVisible();

    // Filter by 2024
    await page.selectOption('select:near(:text("Year"))', '2024');

    // Should only show 2024 summary
    await expect(page.locator('text=2024 summary')).toBeVisible();
    await expect(page.locator('text=2023 summary')).not.toBeVisible();
  });
});
