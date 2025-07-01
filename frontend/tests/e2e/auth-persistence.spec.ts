import { test, expect, type Page } from '@playwright/test';

// Test suite for Authentication Persistence (Real auth flow, no mocks)
test.describe('Authentication Persistence', () => {
	test('should persist authentication across browser restart', async ({ browser }) => {
		let storageState: any;
		
		// Step 1: Create a new browser context and page
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		
		try {
			// Step 2: Navigate to homepage (should show login page since not authenticated)
			await page1.goto('/');
			await page1.waitForLoadState('networkidle');
			
			// Should see unauthenticated landing page
			await expect(page1.locator('text=Welcome to D&D Life')).toBeVisible();
			await expect(page1.locator('text=Login to Continue')).toBeVisible();
			
			// Step 3: Navigate to login page and perform real login
			await page1.goto('/login');
			await page1.waitForLoadState('networkidle');
			
			// Fill in login form with real test credentials
			await page1.fill('input[type="email"]', 'demo@example.com');
			await page1.fill('input[type="password"]', 'demopassword123');
			
			// Debug: Log form values before submission
			const emailValue = await page1.inputValue('input[type="email"]');
			const passwordValue = await page1.inputValue('input[type="password"]');
			console.log('Form values before submission:', { email: emailValue, password: 'hidden' });
			
			// Click login button and wait for network activity
			const [response] = await Promise.all([
				page1.waitForResponse(response => response.url().includes('/login')),
				page1.click('button[type="submit"]')
			]);
			
			console.log('Login API response:', response.status(), await response.text());
			
			// Wait for potential navigation after login
			await page1.waitForTimeout(2000); // Give time for auth store to update and navigation to occur
			
			// Wait for load state
			await page1.waitForLoadState('networkidle', { timeout: 10000 });
			
			// Step 4: Should be redirected to dashboard and see authenticated content
			// Check if we're on the dashboard and authenticated
			const currentUrl = page1.url();
			console.log('After login, current URL:', currentUrl);
			
			// Should NOT be on login page anymore
			expect(currentUrl).not.toContain('/login');
			
			// Should see authenticated dashboard content
			await expect(page1.locator('text=Welcome back')).toBeVisible({ timeout: 10000 });
			
			console.log('✅ Login successful - user is authenticated');
			
			// Step 5: Save storage state before closing context
			storageState = await context1.storageState();
			console.log('✅ Storage state saved:', Object.keys(storageState).length, 'properties');
			
			// Close the browser context (simulates closing browser)
			await context1.close();
			
			console.log('✅ Browser context closed (simulating browser restart)');
			
			// Step 6: Create a NEW browser context with preserved storage state
			const context2 = await browser.newContext({ storageState });
			const page2 = await context2.newPage();
			
			console.log('✅ New browser context created with preserved storage');
			
			// Step 7: Navigate to homepage again (should stay authenticated due to localStorage token)
			await page2.goto('/');
			await page2.waitForLoadState('networkidle');
			
			console.log('✅ Navigated to homepage in new browser context');
			
			// Step 8: Should STILL be authenticated and see dashboard, not login page
			const finalUrl = page2.url();
			console.log('After browser restart, current URL:', finalUrl);
			
			// This is the critical test - should NOT redirect to login
			expect(finalUrl).not.toContain('/login');
			
			// Should see authenticated dashboard content again
			await expect(page2.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
			
			console.log('✅ User remained authenticated after browser restart');
			
			// Cleanup
			await context2.close();
			
		} catch (error) {
			console.error('❌ Test failed:', error);
			throw error;
		}
	});
	
	test('should redirect to login when no valid token exists', async ({ browser }) => {
		// Create a fresh browser context with no authentication
		const context = await browser.newContext();
		const page = await context.newPage();
		
		try {
			// Navigate to homepage
			await page.goto('/');
			await page.waitForLoadState('networkidle');
			
			// Should see unauthenticated content
			await expect(page.locator('text=Welcome to D&D Life')).toBeVisible();
			await expect(page.locator('text=Login to Continue')).toBeVisible();
			
			// Should NOT see authenticated content
			await expect(page.locator('text=Welcome back')).not.toBeVisible();
			
			await context.close();
		} catch (error) {
			console.error('❌ Unauthenticated test failed:', error);
			throw error;
		}
	});
});
