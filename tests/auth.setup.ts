import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to the login page
  await page.goto('/login');

  // Fill in the registration form (assuming new user)
  await page.goto('/register');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
  
  // Verify we're logged in by checking for user email in nav
  await expect(page.locator('text=test@example.com')).toBeVisible();

  // Save the authentication state
  await page.context().storageState({ path: authFile });
});
