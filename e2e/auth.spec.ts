import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'Test@123456';
  const testName = 'Test User';

  test.beforeEach(async ({ page }) => {
    // Start from the home page for each test
    await page.goto('/');
  });

  test('should register a new user, log out, and log back in', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.getByRole('link', { name: 'Register' }).first().click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();

    // Step 2: Fill out registration form
    await page.getByLabel('Name').fill(testName);
    await page.getByLabel('Email Address').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill(testPassword);
    await page.getByLabel('Confirm Password').fill(testPassword);

    // Capture request events to monitor registration network activity
    let registrationError: string | null = null;
    page.on('response', async (response) => {
      if (response.url().includes('auth') && response.request().method() === 'POST') {
        if (!response.ok()) {
          registrationError = `Registration API failed with status ${response.status()}: ${await response.text()}`;
        }
      }
    });

    // Step 3: Submit the form
    await page.getByRole('button', { name: 'Sign Up' }).click();
    
    // Step 4: Wait for registration to complete and redirect
    // Wait a bit to ensure any errors would show up
    await page.waitForTimeout(3000);
    
    // Check if there was a registration error
    if (registrationError) {
      console.error(registrationError);
    }
    
    // Look for error messages on the page
    const errorVisible = await page.getByText('error', { exact: false }).isVisible();
    if (errorVisible) {
      const errorText = await page.getByText('error', { exact: false }).textContent();
      console.log(`Error displayed: ${errorText}`);
    }

    // Step 5: Verify successful registration redirect to home page
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Step 6: Verify user is logged in - check for username in header
    await expect(page.getByText(testName, { exact: false })).toBeVisible();
    
    // Step 7: Log out
    await page.getByRole('button', { name: '', exact: true })
      .or(page.locator('text="Account"')
      .or(page.getByText(testName, { exact: false }))).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    
    // Step 8: Verify logout was successful - Register button should be visible
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    
    // Step 9: Navigate to login page
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL('/login');
    
    // Step 10: Login with the new account
    await page.getByLabel('Email Address').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Step 11: Verify login was successful - redirected to home
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Step 12: Verify user is logged in
    await expect(page.getByText(testEmail, { exact: false })
      .or(page.getByText(testName, { exact: false }))).toBeVisible();
  });
});
