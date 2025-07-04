import { test, expect } from '@playwright/test';
import { loginUser, cleanupCharacter } from './test-helpers';
import { TEST_CONFIG } from './test-config';

test.describe('Stats System', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginUser(page);
    
    // Ensure we have a character
    await page.goto('/character');
    
    // Check if character exists
    const hasCharacter = await page.getByRole('button', { name: 'Edit Character' }).isVisible();
    
    if (!hasCharacter) {
      // Create a character for testing
      await page.fill('input[id="name"]', 'Test Character');
      await page.selectOption('select[id="class"]', 'Warrior'); // Choose Warrior for specific stat recommendations
      await page.fill('textarea[id="backstory"]', 'Test backstory for stats testing');
      await page.fill('textarea[id="goals"]', 'Test goals for stats testing');
      await page.click('button[type="submit"]');
      
      // Wait for character to be created
      await expect(page.getByRole('heading', { name: 'Test Character' })).toBeVisible();
    }
  });

  test('navigates to stats page and displays character info', async ({ page }) => {
    // Navigate to stats page
    await page.goto('/stats');
    
    // Verify page title is visible
    await expect(page.locator('h1:has-text("Stats Management")')).toBeVisible();
    
    // Verify character name and class are displayed
    await expect(page.locator('.card-title:has-text("Test Character")')).toBeVisible();
    await expect(page.locator('.badge:has-text("Warrior")')).toBeVisible();
  });
  
  test('creates a new custom stat', async ({ page }) => {
    // Navigate to stats page
    await page.goto('/stats');
    
    // Click create new stat button
    await page.getByRole('button', { name: 'Create New Stat' }).click();
    
    // Wait for modal to appear
    await expect(page.locator('.modal-box')).toBeVisible();
    
    // Fill out the form
    await page.fill('input[name="name"]', 'Test Stat');
    await page.fill('textarea[name="description"]', 'This is a test stat created by E2E test');
    
    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Wait for modal to disappear
    await expect(page.locator('.modal-box')).not.toBeVisible();
    
    // Verify the new stat appears in the list
    await expect(page.getByText('Test Stat')).toBeVisible();
    await expect(page.getByText('This is a test stat created by E2E test')).toBeVisible();
  });
  
  test('grants XP to a stat', async ({ page }) => {
    // Navigate to stats page
    await page.goto('/stats');
    
    // Create a stat first if none exists
    const noStats = await page.locator('text=You don\'t have any stats yet').isVisible();
    if (noStats) {
      // Create a stat first
      await page.getByRole('button', { name: 'Create New Stat' }).click();
      await expect(page.locator('.modal-box')).toBeVisible();
      await page.fill('input[name="name"]', 'XP Test Stat');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.locator('.modal-box')).not.toBeVisible();
    }
    
    // Get the first stat card
    const firstStatCard = page.locator('.card').first();
    
    // Get initial XP value (format might be like "XP: 0/100")
    const initialXpText = await firstStatCard.locator('text=XP:').innerText();
    const initialXpMatch = initialXpText.match(/XP: (\d+)/);
    const initialXp = initialXpMatch ? parseInt(initialXpMatch[1]) : 0;
    
    // Click grant XP button
    await firstStatCard.getByRole('button', { name: 'Grant XP' }).click();
    
    // Wait for dialog to appear
    await expect(page.locator('.modal-box')).toBeVisible();
    
    // Fill XP value
    await page.fill('input[type="number"]', '10');
    
    // Submit the form
    await page.getByRole('button', { name: 'Grant' }).click();
    
    // Wait for dialog to disappear
    await expect(page.locator('.modal-box')).not.toBeVisible();
    
    // Verify XP was granted (may need to wait for update)
    await page.waitForTimeout(500);
    
    const updatedXpText = await firstStatCard.locator('text=XP:').innerText();
    const updatedXpMatch = updatedXpText.match(/XP: (\d+)/);
    const updatedXp = updatedXpMatch ? parseInt(updatedXpMatch[1]) : 0;
    
    expect(updatedXp).toBeGreaterThan(initialXp);
  });
  
  test('assigns recommended stats from templates', async ({ page }) => {
    // Navigate to stats page
    await page.goto('/stats');
    
    // Count initial number of stats
    const statsCards = page.locator('.card:has-text("Level:")');
    const initialStatCount = await statsCards.count();
    
    // Click on "Assign Recommended Stats" button (in StatGroups component)
    await page.getByRole('button', { name: 'Assign Recommended Stats' }).click();
    
    // Wait for template selection dialog
    await expect(page.locator('.modal-box')).toBeVisible();
    
    // Select the first stat template
    await page.locator('.checkbox-primary').first().check();
    
    // Click assign button
    await page.getByRole('button', { name: 'Assign Selected Stats' }).click();
    
    // Wait for dialog to disappear and data to update
    await expect(page.locator('.modal-box')).not.toBeVisible();
    await page.waitForTimeout(500);
    
    // Count stats again
    const finalStatCards = page.locator('.card:has-text("Level:")');
    const finalStatCount = await finalStatCards.count();
    
    // Verify at least one new stat was added
    expect(finalStatCount).toBeGreaterThan(initialStatCount);
  });
  
  test('deletes a stat', async ({ page }) => {
    // Navigate to stats page
    await page.goto('/stats');
    
    // Create a stat first if none exists
    const noStats = await page.locator('text=You don\'t have any stats yet').isVisible();
    if (noStats) {
      // Create a stat first
      await page.getByRole('button', { name: 'Create New Stat' }).click();
      await expect(page.locator('.modal-box')).toBeVisible();
      await page.fill('input[name="name"]', 'Delete Test Stat');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.locator('.modal-box')).not.toBeVisible();
    }
    
    // Count initial number of stats
    const statsCards = page.locator('.card:has-text("Level:")');
    const initialStatCount = await statsCards.count();
    
    // Find the first delete button and click it
    await page.locator('.card').first().getByRole('button', { name: 'Delete' }).click();
    
    // Wait for confirmation dialog
    await expect(page.locator('.modal')).toBeVisible();
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Wait for dialog to disappear and data to update
    await expect(page.locator('.modal')).not.toBeVisible();
    await page.waitForTimeout(500);
    
    // Count stats again
    const finalStatCards = page.locator('.card:has-text("Level:")');
    const finalStatCount = await finalStatCards.count();
    
    // Verify one stat was deleted
    expect(finalStatCount).toBe(initialStatCount - 1);
  });
  
  test('levels up a stat', async ({ page }) => {
    // Navigate to stats page
    await page.goto('/stats');
    
    // Create a stat and grant enough XP for level up if needed
    const noStats = await page.locator('text=You don\'t have any stats yet').isVisible();
    if (noStats) {
      // Create stat
      await page.getByRole('button', { name: 'Create New Stat' }).click();
      await expect(page.locator('.modal-box')).toBeVisible();
      await page.fill('input[name="name"]', 'Level Up Test Stat');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.locator('.modal-box')).not.toBeVisible();
    }
    
    // Get the first stat card
    const firstStatCard = page.locator('.card').first();
    
    // Grant XP to enable level up (about 120 XP for level 1->2)
    await firstStatCard.getByRole('button', { name: 'Grant XP' }).click();
    await expect(page.locator('.modal-box')).toBeVisible();
    await page.fill('input[type="number"]', '120');
    await page.getByRole('button', { name: 'Grant' }).click();
    await expect(page.locator('.modal-box')).not.toBeVisible();
    await page.waitForTimeout(500);
    
    // Get initial level value
    const levelText = await firstStatCard.locator('text=Level:').innerText();
    const initialLevel = parseInt(levelText.replace('Level: ', ''));
    
    // Check if "Level Up" button is enabled (has enough XP)
    const levelUpButton = firstStatCard.getByRole('button', { name: 'Level Up' });
    const isLevelUpEnabled = await levelUpButton.isEnabled();
    
    if (isLevelUpEnabled) {
      // Click level up button
      await levelUpButton.click();
      await page.waitForTimeout(500);
      
      // Verify level increased
      const updatedLevelText = await firstStatCard.locator('text=Level:').innerText();
      const updatedLevel = parseInt(updatedLevelText.replace('Level: ', ''));
      
      expect(updatedLevel).toBe(initialLevel + 1);
    } else {
      // If button is not enabled, grant more XP and try again
      await firstStatCard.getByRole('button', { name: 'Grant XP' }).click();
      await expect(page.locator('.modal-box')).toBeVisible();
      await page.fill('input[type="number"]', '200');
      await page.getByRole('button', { name: 'Grant' }).click();
      await expect(page.locator('.modal-box')).not.toBeVisible();
      await page.waitForTimeout(500);
      
      // Now try level up again
      await firstStatCard.getByRole('button', { name: 'Level Up' }).click();
      await page.waitForTimeout(500);
      
      // Verify level increased
      const updatedLevelText = await firstStatCard.locator('text=Level:').innerText();
      const updatedLevel = parseInt(updatedLevelText.replace('Level: ', ''));
      
      expect(updatedLevel).toBe(initialLevel + 1);
    }
  });
});
