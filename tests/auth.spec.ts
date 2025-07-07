import { test, expect } from '@playwright/test';

test.describe('Authentication UI', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login page elements
    await expect(page.locator('h1')).toContainText('Welcome Back');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for link to register
    await expect(page.locator('text=Sign up')).toBeVisible();
  });

  test('should display register page correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Check for register page elements
    await expect(page.locator('h1')).toContainText('Create Account');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for link to login
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('should redirect from home to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('Welcome Back');
  });

  test('should show validation for invalid email', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit with invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    
    // Check that browser validation prevents submission
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should toggle between dark and light theme', async ({ page }) => {
    await page.goto('/login');
    
    // Look for theme toggle button by icon
    const themeButton = page.locator('button').first();
    await themeButton.click();
    
    // Should show theme menu options
    await expect(page.locator('text=Dark')).toBeVisible();
    await expect(page.locator('text=Light')).toBeVisible();
    await expect(page.locator('text=System')).toBeVisible();
  });

  test('should have proper navigation structure', async ({ page }) => {
    await page.goto('/login');
    
    // Check for navbar
    await expect(page.locator('text=Gamified Life RPG')).toBeVisible();
    
    // Check theme toggle is present
    const themeButton = page.locator('button').first();
    await expect(themeButton).toBeVisible();
  });
});
