import { test, expect } from '@playwright/test';
import { loginUser } from './test-helpers';

// Helper function to clean up any existing focuses
async function cleanupFocuses(page) {
  try {
    // Instead of UI interaction, let's use the API directly if possible
    // If there's no direct API access in the test, we'll use a more efficient UI approach

    // Navigate to focus page just once
    await page.goto('/focus');
    await page.waitForLoadState('networkidle');

    // Check if there are any focuses to delete
    const deleteButtons = page.locator('button[aria-label="Delete focus"]');
    const count = await deleteButtons.count();

    if (count === 0) {
      // No focuses to clean up
      return;
    }

    // If there are focuses, delete them one by one but with a more efficient approach
    for (let i = 0; i < Math.min(count, 10); i++) {
      // Limit to 10 iterations for safety
      // Always get the first delete button (as they'll shift as we delete)
      const deleteButton = page.locator('button[aria-label="Delete focus"]').first();

      // Check if it exists before proceeding
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Wait for the confirmation dialog to appear
        await page.waitForSelector('.card-title:has-text("Confirm Delete")');

        // Use a more specific selector for the Delete button in the confirmation dialog
        // Target the button inside the card with "Confirm Delete" title
        const confirmDeleteButton = page.locator('.card:has(.card-title:has-text("Confirm Delete")) button.btn-error:has-text("Delete")');

        await confirmDeleteButton.click();

        // Wait for deletion to complete
        await page.waitForLoadState('networkidle');
        // Add a small delay to ensure the UI updates
        await page.waitForTimeout(300);
      } else {
        // No more delete buttons found
        break;
      }
    }
  } catch (error) {
    // If cleanup fails, continue with tests
    console.warn('Focus cleanup failed:', error);
  }
}

// Helper to get a day name from day of week index
function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for the login and cleanup (30 seconds)
    test.setTimeout(30000);

    await loginUser(page);
    await cleanupFocuses(page);

    // Reset to default timeout
    test.setTimeout(10000);
  });

  test('should display the focus page with navigation', async ({ page }) => {
    // Navigate to focus page
    await page.goto('/focus');
    await expect(page).toHaveURL('/focus');

    // Check page loads with basic structure
    await expect(page.locator('h1')).toContainText('Daily Focus');
    await expect(page.locator('h2:has-text("Weekly Schedule")')).toBeVisible();

    // Verify we have the weekly schedule section
    await expect(page.locator('h2', { hasText: 'Weekly Schedule' })).toBeVisible();

    // Check for specific days without using the generic text locator
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Just check a few days to avoid ambiguity
    await expect(page.getByRole('button', { name: `Add focus for ${dayNames[0]}` })).toBeVisible();
    await expect(page.getByRole('button', { name: `Add focus for ${dayNames[3]}` })).toBeVisible();
    await expect(page.getByRole('button', { name: `Add focus for ${dayNames[6]}` })).toBeVisible();
  });

  test('should create a focus successfully', async ({ page }) => {
    await page.goto('/focus');

    // Find Monday's empty card and click it using a more specific selector
    const mondayCard = page.getByRole('button', { name: 'Add focus for Monday' });
    await mondayCard.click();

    // We should now see the editor for Monday
    await expect(page.locator('.card-title', { hasText: 'Create Focus for Monday' })).toBeVisible();

    // Fill out the form with test data
    const testTitle = `Test Focus ${Date.now()}`;
    const testDescription = 'This is a test focus description for Monday';

    await page.fill('#title', testTitle);
    await page.fill('#description', testDescription);

    // Submit the form
    await page.click('button:has-text("Save")');

    // Wait for the network to be idle after submission
    await page.waitForLoadState('networkidle');

    // The editor should be gone and we should see our new focus
    await expect(page.locator('.card-title', { hasText: 'Create Focus for Monday' })).not.toBeVisible();

    // Wait a moment for the card to appear
    await page.waitForTimeout(500);

    // Find the card with our title in it
    await expect(page.getByText(testTitle)).toBeVisible();

    // Also verify the description is visible
    await expect(page.getByText(testDescription)).toBeVisible();
  });

  test("should display today's focus in the Today's Focus section", async ({ page }) => {
    await page.goto('/focus');

    // Get today's day of week
    const today = new Date().getDay();
    const todayName = getDayName(today);

    // Create a focus for today
    await page.getByRole('button', { name: `Add focus for ${todayName}` }).click();

    const testTitle = `Today's Focus ${Date.now()}`;
    const testDescription = `This is a test focus description for ${todayName}`;

    await page.fill('#title', testTitle);
    await page.fill('#description', testDescription);
    await page.click('button:has-text("Save")');

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Check that the Today's Focus section is visible
    await expect(page.locator('h2', { hasText: "Today's Focus" })).toBeVisible();

    // Wait a moment for the card to appear
    await page.waitForTimeout(500);

    // Verify the title and description are visible
    await expect(page.getByText(testTitle)).toBeVisible();
    await expect(page.getByText(testDescription)).toBeVisible();

    // The Today badge should be visible
    await expect(page.locator('.badge', { hasText: 'Today' })).toBeVisible();
  });

  test('should edit a focus successfully', async ({ page }) => {
    await page.goto('/focus');

    // Create a focus for Friday first
    await page.getByRole('button', { name: 'Add focus for Friday' }).click();

    const initialTitle = `Friday Focus ${Date.now()}`;
    const initialDescription = 'Initial Friday focus description';

    await page.fill('#title', initialTitle);
    await page.fill('#description', initialDescription);
    await page.click('button:has-text("Save")');

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Wait a moment for the card to appear
    await page.waitForTimeout(500);

    // Verify the title and description are visible
    await expect(page.getByText(initialTitle)).toBeVisible();
    await expect(page.getByText(initialDescription)).toBeVisible();

    // Now edit it - find the card first, then the edit button within it
    await page.getByRole('button', { name: 'Edit focus' }).first().click();

    // Verify the edit form shows up with correct values
    await expect(page.locator('.card-title', { hasText: 'Edit Focus for Friday' })).toBeVisible();
    await expect(page.locator('#title')).toHaveValue(initialTitle);
    await expect(page.locator('#description')).toHaveValue(initialDescription);

    // Update values
    const updatedTitle = `Updated Friday Focus ${Date.now()}`;
    const updatedDescription = 'Updated Friday focus description';

    await page.fill('#title', updatedTitle);
    await page.fill('#description', updatedDescription);
    await page.click('button:has-text("Save")');

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Wait a moment for the update to appear
    await page.waitForTimeout(500);

    // Verify the updated title and description are visible
    await expect(page.getByText(updatedTitle)).toBeVisible();
    await expect(page.getByText(updatedDescription)).toBeVisible();

    // Original values should be gone
    await expect(page.getByText(initialTitle)).not.toBeVisible();
  });

  test('should delete a focus with confirmation', async ({ page }) => {
    await page.goto('/focus');

    // Create a focus for Wednesday first
    await page.getByRole('button', { name: 'Add focus for Wednesday' }).click();

    const testTitle = `Wednesday Focus ${Date.now()}`;
    const testDescription = 'Wednesday focus to be deleted';

    await page.fill('#title', testTitle);
    await page.fill('#description', testDescription);
    await page.click('button:has-text("Save")');

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Wait a moment for the card to appear
    await page.waitForTimeout(500);

    // Verify the title and description are visible
    await expect(page.getByText(testTitle)).toBeVisible();
    await expect(page.getByText(testDescription)).toBeVisible();

    // Delete it by clicking the delete button
    await page.getByRole('button', { name: 'Delete focus' }).first().click();

    // Verify confirmation dialog appears
    await expect(page.locator('.card-title', { hasText: 'Confirm Delete' })).toBeVisible();
    await expect(page.getByText('Are you sure you want to delete the focus for Wednesday?')).toBeVisible();

    // Confirm deletion - use a more specific selector for the Delete button in the confirmation dialog
    await page.locator('.card:has(.card-title:has-text("Confirm Delete")) button.btn-error:has-text("Delete")').click();

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Wait a moment for the deletion to take effect
    await page.waitForTimeout(500);

    // Verify the focus title and description are gone
    await expect(page.getByText(testTitle)).not.toBeVisible();
    await expect(page.getByText(testDescription, { exact: false })).not.toBeVisible();

    // Wednesday should now have an empty card again
    await expect(page.getByRole('button', { name: 'Add focus for Wednesday' })).toBeVisible();
  });

  test('should validate the focus form', async ({ page }) => {
    await page.goto('/focus');

    // Click on Tuesday to open the editor
    await page.getByRole('button', { name: 'Add focus for Tuesday' }).click();

    // Verify the form is visible first
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

    // Try to submit without filling in required fields
    // Let's use the browser's built-in validation
    await page.getByRole('button', { name: 'Save' }).click();

    // Browser validation should prevent form submission for empty required fields
    // We can check if we're still on the form
    await expect(page.locator('.card-title', { hasText: 'Create Focus for Tuesday' })).toBeVisible();

    // Fill in only the title and try to submit
    await page.fill('#title', 'Test Title Only');
    await page.getByRole('button', { name: 'Save' }).click();

    // Browser validation should still prevent submission
    await expect(page.locator('#description')).toBeVisible();

    // Fill in both fields and it should work
    await page.fill('#title', 'Complete Test Focus');
    await page.fill('#description', 'This is a valid focus with both required fields');
    await page.getByRole('button', { name: 'Save' }).click();

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Wait for the form to be submitted
    await page.waitForTimeout(500);

    // Form should close
    await expect(page.locator('.card-title', { hasText: 'Create Focus for Tuesday' })).not.toBeVisible();

    // Wait a moment for the card to appear
    await page.waitForTimeout(500);

    // Our focus should be visible
    await expect(page.getByText('Complete Test Focus')).toBeVisible();
    await expect(page.getByText('This is a valid focus with both required fields')).toBeVisible();
  });

  test('should cancel focus creation', async ({ page }) => {
    await page.goto('/focus');

    // Open editor for Thursday
    await page.getByRole('button', { name: 'Add focus for Thursday' }).click();

    // Fill in some data
    await page.fill('#title', 'Focus that will be cancelled');
    await page.fill('#description', 'This focus should not be created');

    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Editor should close without saving
    await expect(page.locator('.card-title', { hasText: 'Create Focus for Thursday' })).not.toBeVisible();

    // The focus should not be created
    await expect(page.getByText('Focus that will be cancelled')).not.toBeVisible();
    await expect(page.getByText('This focus should not be created')).not.toBeVisible();

    // Thursday should still have an empty card
    await expect(page.getByRole('button', { name: 'Add focus for Thursday' })).toBeVisible();
  });

  test('should create focuses for all days of the week', async ({ page }) => {
    await page.goto('/focus');

    // Create a focus for each day of the week
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dayName = getDayName(dayOfWeek);

      // Try to find the 'Add focus' button for this day
      const addButton = page.getByRole('button', { name: `Add focus for ${dayName}` });

      // Only add a focus if the day doesn't have one yet
      if (await addButton.isVisible()) {
        await addButton.click();

        // Fill out the form with day-specific data
        const testTitle = `${dayName} Focus ${Date.now()}`;
        const testDescription = `This is a test focus description for ${dayName}`;

        await page.fill('#title', testTitle);
        await page.fill('#description', testDescription);
        await page.getByRole('button', { name: 'Save' }).click();

        // Wait for network to be idle
        await page.waitForLoadState('networkidle');

        // Wait a moment for the card to appear
        await page.waitForTimeout(500);

        // Verify the title and description are visible
        await expect(page.getByText(testTitle)).toBeVisible();
        await expect(page.getByText(testDescription)).toBeVisible();
      }
    }

    // Verify we no longer have any "Add focus" buttons
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dayName = getDayName(dayOfWeek);
      await expect(page.getByRole('button', { name: `Add focus for ${dayName}` })).not.toBeVisible();
    }

    // All days should have a focus card with an edit button
    await expect(page.getByRole('button', { name: 'Edit focus' })).toHaveCount(7);
  });
});
