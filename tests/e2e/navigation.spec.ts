import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test.describe('Navigation Menu', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the login page and log in first
    await page.goto('/login');
    await page.fill('#email', TEST_CONFIG.USER.email);
    await page.fill('#password', TEST_CONFIG.USER.password);
    await page.click('button[type="submit"]');

    // Wait for successful login and redirect
    await expect(page).toHaveURL('/');

    // Ensure we have a logged-in state
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10000 });
  });

  test('should open and close navigation menu', async ({ page }) => {
    // Verify the menu button is visible when logged in
    const menuButton = page.locator('#nav-menu-btn');
    await expect(menuButton).toBeVisible();

    // Menu should not be visible initially
    const menu = page.locator('#nav-menu');
    await expect(menu).not.toBeVisible();

    // Click to open menu
    await menuButton.click();

    // Menu should now be visible
    await expect(menu).toBeVisible();

    // Verify menu content
    await expect(menu.locator('text=Signed in as')).toBeVisible();
    await expect(menu.locator(`text=${TEST_CONFIG.USER.email}`)).toBeVisible();
    await expect(menu.locator('text=Sign out')).toBeVisible();

    // Click button again to close menu
    await menuButton.click();

    // Menu should be hidden again
    await expect(menu).not.toBeVisible();
  });

  test('should close menu when clicking outside', async ({ page }) => {
    const menuButton = page.locator('#nav-menu-btn');
    const menu = page.locator('#nav-menu');

    // Open menu
    await menuButton.click();
    await expect(menu).toBeVisible();

    // For details/summary, clicking the button again closes it
    await menuButton.click();

    // Menu should be closed
    await expect(menu).not.toBeVisible();
  });

  test('should allow user to logout from menu', async ({ page }) => {
    const menuButton = page.locator('#nav-menu-btn');
    const menu = page.locator('#nav-menu');

    // Open menu
    await menuButton.click();
    await expect(menu).toBeVisible();

    // Click logout
    await menu.locator('text=Sign out').click();

    // Should redirect to home page and show unauthenticated state
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Modern Auth Template')).toBeVisible();
    // Use more specific selector to avoid conflicts
    await expect(page.locator('header a[href="/login"]')).toBeVisible();
    await expect(page.locator('header a[href="/register"]')).toBeVisible();
  });

  test('should show correct icon states', async ({ page }) => {
    const menuButton = page.locator('#nav-menu-btn');

    // Should always show menu icon (hamburger) since we removed dynamic icon switching
    await expect(menuButton.locator('svg')).toBeVisible();

    // Click to open menu
    await menuButton.click();

    // Should still show the svg icon
    await expect(menuButton.locator('svg')).toBeVisible();

    // Click to close menu
    await menuButton.click();

    // Should still show the svg icon
    await expect(menuButton.locator('svg')).toBeVisible();
  });

  test('should be accessible via keyboard', async ({ page }) => {
    const menuButton = page.locator('#nav-menu-btn');
    const menu = page.locator('#nav-menu');

    // Focus the menu button directly
    await menuButton.focus();
    await expect(menuButton).toBeFocused();

    // Press Enter to open menu
    await page.keyboard.press('Enter');
    await expect(menu).toBeVisible();

    // Press Enter again to close menu (details/summary behavior)
    await page.keyboard.press('Enter');
    await expect(menu).not.toBeVisible();
  });
});

test.describe('Navigation Menu - Guest User', () => {
  test('should not show menu button when not logged in', async ({ page }) => {
    await page.goto('/');

    // Should not see menu button
    const menuButton = page.locator('#nav-menu-btn');
    await expect(menuButton).not.toBeVisible();

    // Should see login/register buttons instead
    await expect(page.locator('header').getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'Register' })).toBeVisible();
  });
});
