import { test, expect } from '@playwright/test';

test.describe('SPA Routing and Build Process', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads and contains expected content
    await expect(page).toHaveTitle(/Welcome to Auth Template/);
    await expect(page.locator('h1')).toContainText('Welcome to Auth Template');
  });

  test('should navigate between routes without page reload', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to login page
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Login');
    
    // Navigate to register page
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1')).toContainText('Create Account');
    
    // Navigate back to home
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Welcome to Auth Template');
  });

  test('should handle direct URL access (SPA fallback)', async ({ page }) => {
    // Test direct navigation to a route
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Login');
    
    // Test direct navigation to register
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1')).toContainText('Create Account');
  });

  test('should apply theme correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that theme is applied to document
    const theme = await page.getAttribute('html', 'data-theme');
    expect(['light', 'dark']).toContain(theme);
    
    // Check that CSS is loaded and applied
    const bgColor = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBeTruthy();
  });

  test('should have proper meta tags for PWA', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('viewport-fit=cover');
    
    // Check theme-color meta tag
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();
    
    // Check if manifest link exists
    const manifest = await page.locator('link[rel="manifest"]');
    await expect(manifest).toBeVisible();
  });
});
