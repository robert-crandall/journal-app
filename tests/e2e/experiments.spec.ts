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

  test('should create, view, and edit an experiment with tasks', async ({ page }) => {
    // Navigate to create experiment page
    await page.goto('/experiments/create');
    
    // Fill out experiment form
    await page.getByLabel('Experiment Title').fill('Test No Social Media Challenge');
    await page.getByLabel('Description').fill('Stay off social media platforms for one week to improve focus');
    
    // Set dates (today to 7 days from now)
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days total
    
    await page.getByLabel('Start Date').fill(startDate);
    await page.getByLabel('End Date').fill(endDate);
    
    // Add a task using the placeholder text to identify the field
    await page.getByPlaceholder('e.g., Avoid checking Instagram').fill('Avoid checking Instagram');
    await page.getByLabel('Success Metric').fill('1');
    await page.getByLabel('XP Reward').fill('10');
    await page.getByRole('button', { name: 'Add Task' }).click();
    
    // Verify task was added
    await expect(page.getByText('Avoid checking Instagram')).toBeVisible();
    await expect(page.getByText('10 XP per completion')).toBeVisible();
    
    // Create the experiment
    await page.getByRole('button', { name: 'Create Experiment' }).click();
    
    // Should navigate to experiment view page
    await expect(page).toHaveURL(/\/experiments\/[a-f0-9-]+$/);
    await expect(page.locator('h1')).toContainText('Test No Social Media Challenge');
    await expect(page.getByText('Stay off social media platforms')).toBeVisible();
    
    // Verify experiment details
    await expect(page.getByText('7 days')).toBeVisible();
    await expect(page.getByText('active')).toBeVisible();
    
    // Verify tasks are displayed
    await expect(page.getByText('Avoid checking Instagram')).toBeVisible();
    
    // Test edit functionality
    await page.getByRole('link', { name: 'Edit' }).click();
    
    // Should navigate to edit page
    await expect(page).toHaveURL(/\/experiments\/[a-f0-9-]+\/edit$/);
    await expect(page.locator('h1')).toContainText('Edit Experiment');
    
    // Verify form is populated with existing data
    await expect(page.getByLabel('Title')).toHaveValue('Test No Social Media Challenge');
    await expect(page.locator('#description')).toHaveValue('Stay off social media platforms for one week to improve focus');
    
    // Modify the experiment
    await page.getByLabel('Title').clear();
    await page.getByLabel('Title').fill('Enhanced No Social Media Challenge');
    
    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Should navigate back to view page with updated content
    await expect(page).toHaveURL(/\/experiments\/[a-f0-9-]+$/);
    await expect(page.locator('h1')).toContainText('Enhanced No Social Media Challenge');
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
    
    // Navigate to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    
    // Should navigate to dashboard page
    await expect(page).toHaveURL(/\/experiments\/[a-f0-9-]+\/dashboard$/);
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
    
    // Check journal entries section
    await expect(page.getByRole('heading', { name: 'Journal Entries' })).toBeVisible();
  });

  test('should handle experiment deletion', async ({ page }) => {
    // Create an experiment first
    await page.goto('/experiments/create');
    
    await page.getByLabel('Experiment Title').fill('Experiment to Delete');
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await page.getByLabel('Start Date').fill(startDate);
    await page.getByLabel('End Date').fill(endDate);
    
    await page.getByRole('button', { name: 'Create Experiment' }).click();
    
    // Should be on view page
    await expect(page.locator('h1')).toContainText('Experiment to Delete');
    
    // Set up dialog handler to confirm deletion
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete');
      await dialog.accept();
    });
    
    // Delete the experiment
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Should navigate back to experiments list
    await expect(page).toHaveURL(/\/experiments$/);
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
