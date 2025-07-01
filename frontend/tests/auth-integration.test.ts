import { test, expect } from '@playwright/test';

test.describe('Authentication Integration', () => {
  test('should register and login a new user', async ({ page }) => {
    // Go to the register page
    await page.goto('http://localhost:5173/register');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Register/);
    
    // Fill out the registration form
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'testpassword123';
    const name = 'Test User';
    
    await page.fill('input[type="text"]', name);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should redirect to home page after successful registration
    await page.waitForURL('http://localhost:5173/');
    
    // Now test login by going to login page
    await page.goto('http://localhost:5173/login');
    
    // Fill out login form
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Should redirect to home page after successful login
    await page.waitForURL('http://localhost:5173/');
  });
  
  test('should show error for invalid login', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.text-error, .error, [class*="error"]')).toBeVisible();
  });
});
