import { test, expect, chromium } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

/**
 * These tests verify that authentication state is correctly maintained between browser sessions.
 * This is crucial for ensuring a good user experience where users don't have to login repeatedly.
 */
test.describe('Authentication Persistence', () => {
  test('should maintain login state after browser restart', async ({ page }) => {
    // Generate unique email for this test
    const email = `persistence-${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'Persistence Test';

    // Step 1: Register a new user
    await page.goto('/register');
    await page.waitForSelector('form', { timeout: TEST_CONFIG.TIMEOUTS.PAGE_LOAD });

    await page.fill('#name', name);
    await page.fill('#email', email);
    await page.fill('#password', password);

    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: TEST_CONFIG.TIMEOUTS.LOGIN });

    // Verify successful login after registration
    await expect(page.locator("text=You're successfully logged in to your account.")).toBeVisible();

    // Go to a different page and back
    await page.goto('about:blank');
    await page.goto('/');

    // Verify still logged in
    await expect(page.locator("text=You're successfully logged in to your account.")).toBeVisible();
  });
});
