import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
	test('dashboard is responsive', async ({ page }) => {
		// Register a user first
		const testUser = {
			email: `responsive-${Date.now()}@example.com`,
			password: 'testpassword123',
			name: 'Responsive Test User'
		};

		await page.goto('/register');
		await page.fill('input[name="name"]', testUser.name);
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="password"]', testUser.password);
		await page.click('button[type="submit"]');

		// Test mobile dashboard
		await page.setViewportSize({ width: 375, height: 667 });
		await expect(page.locator('.navbar')).toBeVisible();
		await expect(page.locator('.hero')).toBeVisible();

		// Test that cards stack on mobile
		const cards = page.locator('.card');
		await expect(cards).toHaveCount(3);

		// Test tablet
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(page.locator('.grid')).toBeVisible();

		// Test desktop
		await page.setViewportSize({ width: 1920, height: 1080 });
		await expect(page.locator('.grid')).toBeVisible();
	});
});

test.describe('UI Component Tests', () => {
	test('DaisyUI components render correctly', async ({ page }) => {
		await page.goto('/');

		// Test navbar component
		await expect(page.locator('.navbar')).toBeVisible();
		await expect(page.locator('.navbar .btn-primary')).toBeVisible();

		// Test hero component
		await expect(page.locator('.hero')).toBeVisible();
		await expect(page.locator('.hero-content')).toBeVisible();
	});

	test('dropdown component works', async ({ page }) => {
		// Register and login to see user dropdown
		const dropdownUser = {
			email: `dropdown-${Date.now()}@example.com`,
			password: 'dropdowntest123',
			name: 'Dropdown Test User'
		};

		await page.goto('/register');
		await page.fill('input[name="name"]', dropdownUser.name);
		await page.fill('input[name="email"]', dropdownUser.email);
		await page.fill('input[name="password"]', dropdownUser.password);
		await page.click('button[type="submit"]');

		// Check avatar button
		const avatar = page.locator('.avatar');
		await expect(avatar).toBeVisible();

		// Click to open dropdown
		await page.click('[data-testid="user-avatar-button"]');

		// Check dropdown content using specific data-testid
		await expect(page.locator('[data-testid="user-dropdown-menu"]')).toBeVisible();

		// Check specific links within the dropdown menu
		await expect(
			page.locator('[data-testid="user-dropdown-menu"] a[href="/dashboard"]')
		).toBeVisible();
		await expect(
			page.locator('[data-testid="user-dropdown-menu"] button:has-text("Logout")')
		).toBeVisible();
	});

	test('theme classes are applied correctly', async ({ page }) => {
		await page.goto('/');

		// Check that base theme classes are present
		await expect(page.locator('.bg-base-200')).toBeVisible();
		await expect(page.locator('.navbar.bg-base-100')).toBeVisible(); // Be more specific about which bg-base-100 element

		// Check text classes
		await expect(page.locator('.text-5xl')).toBeVisible();
	});
});
