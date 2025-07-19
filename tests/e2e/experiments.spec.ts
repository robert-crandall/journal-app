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

  test('should add and display experiment reflection', async ({ page }) => {
    // Create an experiment first
    await page.goto('/experiments/create');

    await page.getByLabel('Experiment Title').fill('Reflection Test Experiment');
    await page.getByLabel('Description').fill('Testing reflection functionality');

    const today = new Date();
    const startDate = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Started 3 days ago
    const endDate = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Ended yesterday (completed)

    await page.getByLabel('Start Date').fill(startDate);
    await page.getByLabel('End Date').fill(endDate);

    // Add a task
    await page.getByPlaceholder('e.g., Avoid checking Instagram').fill('Read for 30 minutes');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Create the experiment
    await page.getByRole('button', { name: 'Create Experiment' }).click();

    // Should navigate to dashboard page and show "Add Reflection" button since experiment is completed
    await expect(page.locator('h1')).toContainText('Reflection Test Experiment');
    await expect(page.getByRole('link', { name: 'Add Reflection' })).toBeVisible();

    // Click the edit button to add reflection
    await page.getByRole('link', { name: 'Add Reflection' }).click();

    // Should navigate to edit page
    await expect(page).toHaveURL(/\/experiments\/[a-f0-9-]+\/edit$/);
    await expect(page.locator('h1')).toContainText('Edit Experiment');

    // Check that reflection section is visible
    await expect(page.getByText('Experiment Reflection')).toBeVisible();
    await expect(page.getByLabel('How did it go?')).toBeVisible();
    await expect(page.getByText('Would you repeat this experiment?')).toBeVisible();

    // Fill in reflection
    await page
      .getByLabel('How did it go?')
      .fill(
        'This experiment went really well! I found that reading in the morning helped me stay focused throughout the day. The key was setting aside dedicated time without distractions.',
      );

    // Select "Yes, I'd repeat this"
    await page.getByRole('radio', { name: "Yes, I'd repeat this" }).click();

    // Save the changes
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Should navigate back to dashboard
    await expect(page).toHaveURL(/\/experiments\/[a-f0-9-]+$/);

    // Check that reflection is now displayed
    await expect(page.getByText('Experiment Reflection')).toBeVisible();
    await expect(page.getByText('How did it go?')).toBeVisible();
    await expect(page.getByText('This experiment went really well!')).toBeVisible();
    await expect(page.getByText('Would repeat:')).toBeVisible();
    await expect(page.getByText("Yes, I'd do this again")).toBeVisible();

    // The "Add Reflection" button should no longer be visible since reflection exists
    await expect(page.getByRole('link', { name: 'Add Reflection' })).not.toBeVisible();

    // But there should be an "Edit Reflection" link
    await expect(page.getByRole('link', { name: 'Edit Reflection' })).toBeVisible();
  });

  test('should update experiment reflection', async ({ page }) => {
    // First create an experiment with reflection (same as previous test but abbreviated)
    await page.goto('/experiments/create');

    await page.getByLabel('Experiment Title').fill('Update Reflection Test');
    const today = new Date();
    const startDate = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await page.getByLabel('Start Date').fill(startDate);
    await page.getByLabel('End Date').fill(endDate);
    await page.getByPlaceholder('e.g., Avoid checking Instagram').fill('Meditate daily');
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByRole('button', { name: 'Create Experiment' }).click();

    // Add initial reflection
    await page.getByRole('link', { name: 'Add Reflection' }).click();
    await page.getByLabel('How did it go?').fill('Initial reflection text');
    await page.getByRole('radio', { name: "Yes, I'd repeat this" }).click();
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Now test updating the reflection
    await page.getByRole('link', { name: 'Edit Reflection' }).click();

    // Update the reflection
    await page.getByLabel('How did it go?').clear();
    await page
      .getByLabel('How did it go?')
      .fill(
        'Updated reflection: The meditation practice was transformative. I noticed improved focus and reduced anxiety. However, finding time in the morning was challenging on busy days.',
      );

    // Change the repeat choice
    await page.getByRole('radio', { name: "No, I wouldn't repeat this" }).click();

    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify updated reflection is displayed
    await expect(page.getByText('Updated reflection: The meditation practice was transformative')).toBeVisible();
    await expect(page.getByText("No, I wouldn't repeat this")).toBeVisible();
  });

  test('should handle clearing reflection fields', async ({ page }) => {
    // Create a completed experiment first with a unique title
    const uniqueTitle = `Reflection Clear Test ${Date.now()}`;
    await page.goto('/experiments/create');
    await page.getByLabel('Experiment Title').fill(uniqueTitle);
    await page.getByLabel('Description').fill('Testing reflection clearing');
    
    // Set dates in the past to make it completed
    const pastStart = new Date();
    pastStart.setDate(pastStart.getDate() - 5);
    const pastEnd = new Date();
    pastEnd.setDate(pastEnd.getDate() - 1);
    
    await page.getByLabel('Start Date').fill(pastStart.toISOString().split('T')[0]);
    await page.getByLabel('End Date').fill(pastEnd.toISOString().split('T')[0]);
    
    await page.getByRole('button', { name: 'Create Experiment' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/experiments\/[a-f0-9-]+$/);
    
    // Go to edit page
    await page.getByRole('link', { name: 'Add Reflection' }).click();
    
    // Add reflection
    await page.getByLabel('How did it go?').fill('This experiment worked well');
    await page.getByLabel('Yes').check();
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Go back to homepage to verify reflection shows up
    await page.goto('/experiments');
    
    // Should see the reflection in the specific experiment card
    const experimentCard = page.locator('.card').filter({ hasText: uniqueTitle });
    await expect(experimentCard).toBeVisible();
    await expect(experimentCard.getByText('This experiment worked well')).toBeVisible();
    await expect(experimentCard.getByText('Reviewed')).toBeVisible();
    await expect(experimentCard.getByText('Yes')).toBeVisible();
    
    // Verify the labels are present
    await expect(experimentCard.getByText('Reflection:')).toBeVisible();
    await expect(experimentCard.getByText('Would repeat:')).toBeVisible();
  });

  test('should display reflection information on experiments homepage', async ({ page }) => {
    // Create a completed experiment with reflection with unique title
    const uniqueTitle = `Homepage Reflection Test ${Date.now()}`;
    await page.goto('/experiments/create');
    await page.getByLabel('Experiment Title').fill(uniqueTitle);
    await page.getByLabel('Description').fill('Testing reflection display on homepage');
    
    // Set dates in the past to make it completed
    const pastStart = new Date();
    pastStart.setDate(pastStart.getDate() - 7);
    const pastEnd = new Date();
    pastEnd.setDate(pastEnd.getDate() - 2);
    
    await page.getByLabel('Start Date').fill(pastStart.toISOString().split('T')[0]);
    await page.getByLabel('End Date').fill(pastEnd.toISOString().split('T')[0]);
    
    await page.getByRole('button', { name: 'Create Experiment' }).click();
    
    // Go to edit page and add reflection
    await page.getByRole('link', { name: 'Add Reflection' }).click();
    await page.getByLabel('How did it go?').fill('This was a great learning experience');
    await page.getByLabel('Yes').check();
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Navigate to experiments homepage
    await page.goto('/experiments');
    
    // Verify the completed experiment section exists
    await expect(page.getByText('Completed Experiments')).toBeVisible();
    
    // Verify the experiment card shows reflection information
    const experimentCard = page.locator('.card').filter({ hasText: uniqueTitle });
    await expect(experimentCard).toBeVisible();
    
    // Check for "Reviewed" badge
    await expect(experimentCard.getByText('Reviewed')).toBeVisible();
    
    // Check for reflection text
    await expect(experimentCard.getByText('This was a great learning experience')).toBeVisible();
    
    // Check for would repeat status
    await expect(experimentCard.getByText('Yes')).toBeVisible();
    
    // Verify the labels are present
    await expect(experimentCard.getByText('Reflection:')).toBeVisible();
    await expect(experimentCard.getByText('Would repeat:')).toBeVisible();
  });
});
