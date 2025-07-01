import { test, expect } from '@playwright/test';

test.describe('Authentication Integration', () => {
  test('should register and login a new user', async ({ page }) => {
    // Go to the register page
    await page.goto('/register');
    
    // Check if the page loads (match actual title)
    await expect(page).toHaveTitle(/Create Account/);
    
    // Fill out the registration form
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'testpassword123';
    const name = 'Test User';
    
    // Use more specific selectors based on our form structure
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    
    // Wait for form validation to complete
    await page.waitForTimeout(500);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait a moment to see if an error appears, or if we get redirected
    await page.waitForTimeout(3000);
    
    // Check if we're still on register page (indicating an error) or redirected
    const currentUrl = page.url();
    if (currentUrl.includes('/register')) {
      // Still on register page, check for error
      const errorElement = await page.locator('.alert-error');
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('Registration error:', errorText);
        throw new Error(`Registration failed with error: ${errorText}`);
      } else {
        throw new Error('Registration did not redirect and no error was shown');
      }
    }
    
    // Should have redirected to home page
    await expect(page).toHaveURL('/');
    
    // Now test login by going to login page
    await page.goto('/login');
    
    // Fill out login form
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    
    // Wait for form validation
    await page.waitForTimeout(500);
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Should redirect to home page after successful login
    await page.waitForURL('/', { timeout: 5000 });
  });
  
  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Try to login with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');
    
    // Should show error message - use our actual error class with higher timeout
    await expect(page.locator('.alert-error')).toBeVisible({ timeout: 10000 });
  });
});
