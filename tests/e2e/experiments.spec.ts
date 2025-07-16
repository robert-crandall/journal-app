import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

test.describe('Experiments Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login the test user
    await loginUser(page);
  });

  test('should navigate to experiments page and create an experiment', async ({ page }) => {
    // Navigate to experiments
    await page.goto('/experiments');

    // Check the page loaded correctly
    await expect(page.locator('h1')).toContainText('Experiments');
    await expect(page.getByText('Short-lived self-improvement tests')).toBeVisible();

    // Click the first create experiment button we find
    await page.getByRole('link', { name: 'New Experiment' }).first().click();

    // Should navigate to create page
    await expect(page).toHaveURL(/\/experiments\/create$/);
    await expect(page.locator('h1')).toContainText('Create Experiment');
  });

  test('should view experiment dashboard with stats and progress', async ({ page }) => {
    // Create an experiment first by going to the create page
    await page.goto('/experiments/create');

    // Create a simple experiment
    await page.getByLabel('Experiment Title').fill('Dashboard Test Experiment');
    await page.getByLabel('Description').fill('Testing dashboard functionality');

    const today = new Date();
    const startDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Started 2 days ago
    const endDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Ends in 4 days (7 days total)

    await page.getByLabel('Start Date').fill(startDate);
    await page.getByLabel('End Date').fill(endDate);

    // Add a task
    await page.getByPlaceholder('e.g., Avoid checking Instagram').fill('Complete daily workout');
    await page.getByLabel('Success Metric').fill('1');
    await page.getByLabel('XP Reward').fill('25');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Create the experiment
    await page.getByRole('button', { name: 'Create Experiment' }).click();

    // Should navigate to dashboard page
    // await expect(page).toHaveURL(/\/experiments\/[a-f0-9-]+\$/);
    await expect(page.locator('h1')).toContainText('Dashboard Test Experiment');

    // Check dashboard stats are displayed
    await expect(page.getByText('Days Completed')).toBeVisible();
    await expect(page.getByText('Tasks Completed')).toBeVisible();
    await expect(page.getByText('Total XP Earned')).toBeVisible();
    await expect(page.getByText('Journal Entries').first()).toBeVisible();

    // Check task progress section
    await expect(page.getByText('Task Progress')).toBeVisible();
    await expect(page.getByText('Complete daily workout')).toBeVisible();

    // Check XP breakdown section
    await expect(page.getByText('XP Breakdown')).toBeVisible();
    await expect(page.getByText('From Tasks', { exact: true })).toBeVisible();
    await expect(page.getByText('From Journals', { exact: true })).toBeVisible();
  });

  test('should show validation errors for invalid experiment data', async ({ page }) => {
    await page.goto('/experiments/create');

    // The create button should be disabled when title is empty
    await expect(page.getByRole('button', { name: 'Create Experiment' })).toBeDisabled();

    // Fill title but use invalid date range
    await page.getByLabel('Experiment Title').fill('Invalid Date Test');

    const today = new Date();
    const startDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Future date
    const endDate = today.toISOString().split('T')[0]; // Past date relative to start

    await page.getByLabel('Start Date').fill(startDate);
    await page.getByLabel('End Date').fill(endDate);

    // Button should now be enabled since title is filled
    await expect(page.getByRole('button', { name: 'Create Experiment' })).toBeEnabled();

    await page.getByRole('button', { name: 'Create Experiment' }).click();

    // Should show validation error for invalid date range
    await expect(page.getByText('End date must be on or after start date')).toBeVisible();
  });
});
