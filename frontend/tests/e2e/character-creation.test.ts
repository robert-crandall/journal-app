import { test, expect } from '@playwright/test';

test.describe('Character Creation', () => {
	test('should complete character creation flow', async ({ page }) => {
		await page.goto('/character');

		// Should start at step 1 (welcome)
		await expect(page.getByText('Welcome to Your Adventure!')).toBeVisible();
		await expect(page.getByText('Get Started')).toBeVisible();

		// Step 1: Welcome - click Get Started
		await page.getByText('Get Started').click();

		// Step 2: Name input
		await expect(page.getByText("What's your character's name?")).toBeVisible();
		await page.getByPlaceholder('Enter your character name').fill('Test Hero');
		await page.getByText('Continue').click();

		// Step 3: Class selection - this auto-advances to stat customization
		await expect(page.getByText('Choose Your Character Class')).toBeVisible();
		await page.getByRole('button', { name: /The Achiever/ }).click();

		// Should auto-advance to stat customization
		await expect(page.getByText('Customize Your Stats')).toBeVisible();
		
		// Should have 3 pre-selected stats from "The Achiever" class
		await expect(page.getByText('Selected: 3/6')).toBeVisible();
		
		// Add one more stat
		await page.getByRole('button', { name: 'Mental Health' }).click();
		
		// Continue to backstory
		await page.getByText('Continue').click();

		// Step 5: Backstory
		await expect(page.getByText('Write Your Backstory')).toBeVisible();
		await page.getByPlaceholder('Describe your character\'s background').fill('A determined individual focused on personal growth and achievement.');
		await page.getByText('Continue').click();

		// Step 6: Review & Create
		await expect(page.getByText('Review Your Character')).toBeVisible();
		await expect(page.getByText('Test Hero')).toBeVisible();
		await expect(page.getByText('The Achiever')).toBeVisible();
		
		// Create the character
		await page.getByText('Create Character').click();

		// Should now show character display
		await expect(page.locator('h1').getByText('Test Hero')).toBeVisible();
		await expect(page.getByText('The Achiever')).toBeVisible();
		await expect(page.getByText('Character Stats')).toBeVisible();
		
		// Should show the backstory
		await expect(page.getByText('A determined individual focused on personal growth')).toBeVisible();
		
		// Should show at least 4 stat cards (3 from class + 1 added)
		// Updated to look for the StatCard component structure
		const statCards = page.locator('.stat-card');
		await expect(statCards).toHaveCount(4);
	});

	test('should allow going back through steps', async ({ page }) => {
		await page.goto('/character');

		// Go through first few steps
		await page.getByText('Get Started').click();
		await page.getByPlaceholder('Enter your character name').fill('Test Name');
		await page.getByText('Continue').click();
		
		// Should be at class selection
		await expect(page.getByText('Choose Your Character Class')).toBeVisible();
		
		// Go back to name step
		await page.getByText('Back').click();
		await expect(page.getByText("What's your character's name?")).toBeVisible();
		
		// Name should be preserved
		await expect(page.getByPlaceholder('Enter your character name')).toHaveValue('Test Name');
	});

	test('should enforce stat selection limits', async ({ page }) => {
		await page.goto('/character');

		// Navigate to stat customization
		await page.getByText('Get Started').click();
		await page.getByPlaceholder('Enter your character name').fill('Test');
		await page.getByText('Continue').click();
		await page.getByRole('button', { name: /The Achiever/ }).click();

		// Should be at stat customization with 3 pre-selected
		await expect(page.getByText('Selected: 3/6')).toBeVisible();

		// Try to add 3 more stats (should work)
		await page.getByRole('button', { name: 'Mental Health' }).click();
		await page.getByRole('button', { name: 'Social' }).click();
		await page.getByRole('button', { name: 'Creativity' }).click();

		// Should now be at limit
		await expect(page.getByText('Selected: 6/6')).toBeVisible();

		// Additional stats should be disabled
		const disabledStat = page.getByRole('button', { name: 'Travel' });
		await expect(disabledStat).toBeDisabled();
	});

	test('should validate required fields', async ({ page }) => {
		await page.goto('/character');

		// Go to name step
		await page.getByText('Get Started').click();
		
		// Continue button should be disabled with empty name
		const continueButton = page.getByText('Continue');
		await expect(continueButton).toBeDisabled();

		// Should enable after entering name
		await page.getByPlaceholder('Enter your character name').fill('Test');
		await expect(continueButton).toBeEnabled();
	});

	test('should allow creating new character after creation', async ({ page }) => {
		await page.goto('/character');

		// Complete character creation quickly
		await page.getByText('Get Started').click();
		await page.getByPlaceholder('Enter your character name').fill('First Character');
		await page.getByText('Continue').click();
		await page.getByRole('button', { name: /The Explorer/ }).click();
		await page.getByText('Continue').click(); // Skip backstory
		await page.getByText('Continue').click(); // Go to review
		await page.getByText('Create Character').click();

		// Should show character
		await expect(page.locator('h1').getByText('First Character')).toBeVisible();

		// Click create new character
		await page.getByText('Create New Character').click();

		// Should be back at step 1
		await expect(page.getByText('Welcome to Your Adventure!')).toBeVisible();
	});

	test('should display enhanced character stats dashboard', async ({ page }) => {
		await page.goto('/character');

		// Complete character creation quickly
		await page.getByText('Get Started').click();
		await page.getByPlaceholder('Enter your character name').fill('Stats Test Hero');
		await page.getByText('Continue').click();
		// Class selection auto-advances
		await page.getByRole('button', { name: /The Achiever/ }).click();
		// Skip stat customization 
		await page.getByText('Continue').click(); 
		// Skip backstory
		await page.getByText('Continue').click(); 
		// Create character
		await page.getByText('Create Character').click();

		// Should show enhanced stats dashboard
		await expect(page.getByText('Character Stats')).toBeVisible();
		
		// Should show stats ready to level up indicator
		await expect(page.getByText(/stats ready to level up/)).toBeVisible();
		
		// Should show sample activities guide
		await expect(page.getByText('Sample Activities & XP Guide')).toBeVisible();
		await expect(page.getByText('Physical Health & Adventure')).toBeVisible();
		await expect(page.getByText('Mental Health & Learning')).toBeVisible();
		await expect(page.getByText('Family Time & Social')).toBeVisible();
		await expect(page.getByText('Creativity & Personal Development')).toBeVisible();
		
		// Should show XP examples
		await expect(page.getByText('Morning walk/jog: 15-25 XP')).toBeVisible();
		await expect(page.getByText('Family game night: 40-60 XP')).toBeVisible();
		
		// Should show XP tips
		await expect(page.getByText('XP Tips:')).toBeVisible();
	});

	test('should handle level up functionality', async ({ page }) => {
		await page.goto('/character');

		// Complete character creation quickly
		await page.getByText('Get Started').click();
		await page.getByPlaceholder('Enter your character name').fill('Level Up Hero');
		await page.getByText('Continue').click();
		await page.getByRole('button', { name: /The Achiever/ }).click();
		await page.getByText('Continue').click();
		await page.getByText('Continue').click();
		await page.getByText('Create Character').click();

		// Look for any level up buttons (some stats randomly can level up)
		const levelUpButtons = page.locator('button:has-text("Level Up!")');
		const levelUpCount = await levelUpButtons.count();

		if (levelUpCount > 0) {
			// Click the first level up button
			await levelUpButtons.first().click();
			
			// Should show updated level (the stat should have changed)
			// We can't predict exact content due to randomness, but interface should still work
			await expect(page.getByText('Character Stats')).toBeVisible();
		}
	});
});
