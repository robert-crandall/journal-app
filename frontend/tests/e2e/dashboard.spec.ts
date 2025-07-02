import { test, expect } from '@playwright/test';

// Use real backend authentication instead of mocks
test.describe('Dashboard Homepage with Task Overview', () => {
	// Helper function to login
	async function loginUser(page: any) {
		await page.goto('/login');
		await page.fill('input[type="email"]', 'demo@example.com');
		await page.fill('input[type="password"]', 'demopassword123');
		await page.click('button[type="submit"]');
		await page.waitForURL('/');
	}

	test('should display unauthenticated landing page correctly', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('h1')).toContainText('Welcome to D&D Life');
		await expect(page.locator('text=⚔️ Login to Continue')).toBeVisible();
		await expect(page.locator('text=🎲 Start Your Adventure')).toBeVisible();
	});

	test('should display authenticated dashboard with all components', async ({ page }) => {
		await loginUser(page);
		await page.waitForLoadState('networkidle');

		// Verify we're on the dashboard and authenticated
		await expect(page.locator('text=Welcome back')).toBeVisible();
		
		// Most importantly: verify no "User ID is required" errors
		await expect(page.locator('text="User ID is required"')).not.toBeVisible();
		
		// Dashboard should show quick actions
		await expect(page.locator('text=Quick Actions')).toBeVisible();
		await expect(page.locator('text=View All Quests')).toBeVisible();
		await expect(page.locator('text=Manage Tasks')).toBeVisible();
	});

	test('should load dashboard components without authentication errors', async ({ page }) => {
		await loginUser(page);
		await page.waitForLoadState('networkidle');

		// The key test: verify no "User ID is required" errors
		await expect(page.locator('text="User ID is required"')).not.toBeVisible();
		
		// Verify we're seeing the authenticated dashboard content
		await expect(page.locator('text=Welcome back')).toBeVisible();
		await expect(page.locator('text=Quick Actions')).toBeVisible();
	});

	test('should handle API calls with JWT authentication', async ({ page }) => {
		await loginUser(page);
		await page.waitForLoadState('networkidle');

		// Check that the page loads without authentication errors
		await expect(page.locator('text="User ID is required"')).not.toBeVisible();
		await expect(page.locator('text="Authorization token required"')).not.toBeVisible();
		await expect(page.locator('text="Unauthorized"')).not.toBeVisible();
		
		// Verify successful dashboard load
		await expect(page.locator('text=Welcome back')).toBeVisible();
	});

	test('should have proper mobile responsiveness', async ({ page }) => {
		// Set iOS Safari viewport
		await page.setViewportSize({ width: 375, height: 812 });

		await loginUser(page);
		await page.waitForLoadState('networkidle');

		// Verify dashboard is visible and responsive on mobile
		await expect(page.locator('text=Welcome back')).toBeVisible();
		await expect(page.locator('text=Quick Actions')).toBeVisible();
		
		// Most importantly: no authentication errors on mobile
		await expect(page.locator('text="User ID is required"')).not.toBeVisible();
	});

	test('should handle loading states without errors', async ({ page }) => {
		await loginUser(page);
		await page.waitForLoadState('networkidle');

		// Verify no authentication or loading errors
		await expect(page.locator('text="User ID is required"')).not.toBeVisible();
		await expect(page.locator('text="Authorization token required"')).not.toBeVisible();
		await expect(page.locator('text="Error"')).not.toBeVisible();
		await expect(page.locator('text="Failed to load"')).not.toBeVisible();
		
		// Verify successful authentication and dashboard load
		await expect(page.locator('text=Welcome back')).toBeVisible();
	});
});
