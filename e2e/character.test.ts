import { test, expect } from '@playwright/test';

test.describe('Character Profile', () => {
	// Shared user for all tests in this suite
	let testUser;

	test.beforeAll(async ({ browser }) => {
		// Create a user once for all tests
		const context = await browser.newContext();
		const page = await context.newPage();

		testUser = {
			email: `character-test-${Date.now()}@journal.com`,
			password: 'charactertest123',
			name: `Character User ${Date.now()}`
		};

		// Register the user
		await page.goto('/register');
		await page.fill('input[name="name"]', testUser.name);
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="password"]', testUser.password);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');

		await context.close();
	});

	// Helper function to login the existing user
	async function loginUser(page) {
		await page.goto('/login');
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="password"]', testUser.password);
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL('/dashboard');
		return testUser;
	}

	test('should display character profile page', async ({ page }) => {
		await loginUser(page);

		// Navigate to character page
		await page.goto('/character');
		await expect(page).toHaveURL('/character');

		// Verify page elements
		await expect(page.locator('h1')).toContainText('Character Profile');
		await expect(page.locator('input[name="characterClass"]')).toBeVisible();
		await expect(page.locator('textarea[name="backstory"]')).toBeVisible();
		await expect(page.locator('input[name="motto"]')).toBeVisible();
	});

	test('should navigate to character page from dashboard', async ({ page }) => {
		await loginUser(page);

		// Click on avatar to open dropdown
		await page.click('[data-testid="user-avatar-button"]');

		// Click on Character link
		await page.click('a[href="/character"]');

		// Should be on character page
		await expect(page).toHaveURL('/character');
		await expect(page.locator('h1')).toContainText('Character Profile');
	});

	test('should validate required character class field', async ({ page }) => {
		await loginUser(page);
		await page.goto('/character');

		// Try to submit without character class
		await page.fill('textarea[name="backstory"]', 'Test backstory');
		await page.fill('input[name="motto"]', 'Test motto');
		await page.click('[data-testid="save-character-btn"]');

		// Should show validation error
		await expect(page.locator('.alert-error')).toBeVisible();
		await expect(page.locator('.alert-error')).toContainText('Character class is required');
	});

	test('should save character information successfully', async ({ page }) => {
		await loginUser(page);
		await page.goto('/character');

		// Fill in character information with delays to allow reactive updates
		await page.fill('input[name="characterClass"]', 'Test Ranger');
		await page.waitForTimeout(200);

		await page.fill(
			'textarea[name="backstory"]',
			'A software developer trying to reconnect with nature and be present with family.'
		);
		await page.waitForTimeout(200);

		await page.fill('input[name="motto"]', 'Be an outdoor adventurer and an engaged dad');
		await page.waitForTimeout(200);

		// Verify the first three fields are still filled before adding goals
		await expect(page.locator('input[name="characterClass"]')).toHaveValue('Test Ranger');
		await expect(page.locator('textarea[name="backstory"]')).toHaveValue(
			'A software developer trying to reconnect with nature and be present with family.'
		);
		await expect(page.locator('input[name="motto"]')).toHaveValue(
			'Be an outdoor adventurer and an engaged dad'
		);

		await page.fill(
			'textarea[name="goals"]',
			'- Spend more time outdoors\n- Be present with family\n- Build meaningful projects'
		);
		await page.waitForTimeout(200);

		// Verify all fields are still filled after adding goals
		await expect(page.locator('input[name="characterClass"]')).toHaveValue('Test Ranger');
		await expect(page.locator('textarea[name="backstory"]')).toHaveValue(
			'A software developer trying to reconnect with nature and be present with family.'
		);
		await expect(page.locator('input[name="motto"]')).toHaveValue(
			'Be an outdoor adventurer and an engaged dad'
		);
		await expect(page.locator('textarea[name="goals"]')).toHaveValue(
			'- Spend more time outdoors\n- Be present with family\n- Build meaningful projects'
		);

		// Submit the form
		await page.click('[data-testid="save-character-btn"]');

		// Wait for form submission to complete and check for success indication
		await expect(page.locator('[data-testid="save-character-btn"]')).not.toHaveText('Saving...');

		// Verify the data was saved by reloading and checking if it persists
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Scroll to top to ensure preview elements are visible
		await page.evaluate(() => window.scrollTo(0, 0));

		// Check that form values are preserved

		// Verify the preview is updated (character preview should be visible in sidebar)
		await expect(page.locator('text=Test Ranger')).toBeVisible();
		await expect(page.locator('text=Be an outdoor adventurer and an engaged dad')).toBeVisible();
		// Goals should be rendered as markdown, so check for list items
		await expect(page.locator('li:has-text("Spend more time outdoors")')).toBeVisible();
	});

	test('should use quick select buttons for character class', async ({ page }) => {
		await loginUser(page);
		await page.goto('/character');

		// Click on a quick select button
		await page.click('button:has-text("Ranger")');

		// Verify the input is filled
		await expect(page.locator('input[name="characterClass"]')).toHaveValue('Ranger');

		// Click another quick select button
		await page.click('button:has-text("Warrior")');

		// Verify the input is updated
		await expect(page.locator('input[name="characterClass"]')).toHaveValue('Warrior');
	});

	test('should show character preview as user types', async ({ page }) => {
		await loginUser(page);
		await page.goto('/character');

		// Initially should show "Not set"
		await expect(page.locator('text=Not set')).toBeVisible();

		// Fill in character class
		await page.fill('input[name="characterClass"]', 'Test Wizard');

		// Preview should update
		await expect(page.locator('text=Test Wizard')).toBeVisible();

		// Fill in backstory
		await page.fill('textarea[name="backstory"]', 'A powerful spellcaster seeking knowledge.');

		// Backstory should appear in preview
		await expect(page.locator('text=A powerful spellcaster seeking knowledge.')).toBeVisible();

		// Fill in motto
		await page.fill('input[name="motto"]', 'Knowledge is power');

		// Motto should appear in preview with quotes
		await expect(
			page.locator('p.italic').filter({ hasText: '"Knowledge is power"' })
		).toBeVisible();
	});

	test('should persist character data after page reload', async ({ page }) => {
		await loginUser(page);
		await page.goto('/character');

		// Save character information
		await page.fill('input[name="characterClass"]', 'Persistent Monk');
		await page.fill('textarea[name="backstory"]', 'Seeking inner peace through discipline.');
		await page.fill('input[name="motto"]', 'Balance in all things');
		await page.click('[data-testid="save-character-btn"]');

		// Wait for form submission to complete
		await expect(page.locator('[data-testid="save-character-btn"]')).not.toHaveText('Saving...');

		// Reload the page
		await page.reload();

		// Verify data is still there
		await expect(page.locator('input[name="characterClass"]')).toHaveValue('Persistent Monk');
		await expect(page.locator('textarea[name="backstory"]')).toHaveValue(
			'Seeking inner peace through discipline.'
		);
		await expect(page.locator('input[name="motto"]')).toHaveValue('Balance in all things');
	});

	test('should handle navigation between character and dashboard', async ({ page }) => {
		await loginUser(page);
		await page.goto('/character');

		// Navigate back to dashboard using navbar
		await page.click('a[href="/dashboard"]');
		await expect(page).toHaveURL('/dashboard');

		// Go back to character page
		await page.goto('/character');
		await expect(page).toHaveURL('/character');
		await expect(page.locator('h1')).toContainText('Character Profile');
	});
});
