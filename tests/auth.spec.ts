import { test, expect } from '@playwright/test'

test.describe('Landing Page and UI', () => {
  test('should display landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/')

    // Should see landing page elements - use more specific selectors
    await expect(page.getByRole('heading', { name: 'LifeRPG' })).toBeVisible()
    await expect(page.getByText('Turn your life into an epic adventure')).toBeVisible()
    
    // Should see feature cards
    await expect(page.getByText('AI Quest Master')).toBeVisible()
    await expect(page.getByText('Family Bonds')).toBeVisible()
    await expect(page.getByText('Journal Insights')).toBeVisible()
    
    // Should have navigation buttons
    await expect(page.getByRole('link', { name: /start your journey/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /continue adventure/i })).toBeVisible()
  })

  test('should navigate to auth pages', async ({ page }) => {
    await page.goto('/')

    // Navigate to sign up
    await page.getByRole('link', { name: /start your journey/i }).click()
    await expect(page).toHaveURL('/auth/signup')
    await expect(page.getByText('Join the Adventure')).toBeVisible()

    // Navigate back to home
    await page.goto('/')

    // Navigate to sign in
    await page.getByRole('link', { name: /continue adventure/i }).click()
    await expect(page).toHaveURL('/auth/signin')
    await expect(page.getByText('Welcome Back')).toBeVisible()
  })

  test('should show theme toggle and navigation', async ({ page }) => {
    await page.goto('/')

    // Should see navigation
    await expect(page.getByText('LifeRPG').first()).toBeVisible()
    
    // Theme toggle should be visible
    const themeButtons = page.getByRole('button').filter({ hasText: /light|dark|system/i })
    await expect(themeButtons.first()).toBeVisible()
  })
})

test.describe('Authentication Forms (UI Only)', () => {
  test('should show sign up form with validation', async ({ page }) => {
    await page.goto('/auth/signup')

    // Form should be visible
    await expect(page.getByText('Join the Adventure')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your name')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()
    await expect(page.getByPlaceholder('Create a password')).toBeVisible()

    // Try to submit empty form to trigger validation
    await page.getByRole('button', { name: /create account/i }).click()

    // Should show validation errors (these are client-side Zod validations)
    await expect(page.getByText(/name is required/i)).toBeVisible()
  })

  test('should show sign in form', async ({ page }) => {
    await page.goto('/auth/signin')

    // Form should be visible
    await expect(page.getByText('Welcome Back')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/auth/signin')

    const passwordInput = page.getByPlaceholder('Enter your password')
    
    // Find the eye icon toggle button more specifically
    const passwordFieldContainer = page.locator('.relative').filter({ has: passwordInput })
    const toggleButton = passwordFieldContainer.locator('button').last()

    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click toggle to hide password again
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should navigate between auth pages', async ({ page }) => {
    // Start at sign in page
    await page.goto('/auth/signin')
    await expect(page.getByText('Welcome Back')).toBeVisible()

    // Click link to sign up
    await page.getByRole('link', { name: /sign up here/i }).click()
    await expect(page).toHaveURL('/auth/signup')
    await expect(page.getByText('Join the Adventure')).toBeVisible()

    // Click link to sign in
    await page.getByRole('link', { name: /sign in here/i }).click()
    await expect(page).toHaveURL('/auth/signin')
    await expect(page.getByText('Welcome Back')).toBeVisible()
  })
})

// Note: Full authentication flow tests would require:
// 1. A test database setup
// 2. Real environment variables 
// 3. Database migrations run
// These are commented out until database is configured:

/*
test.describe('Full Authentication Flow (Requires DB)', () => {
  test.skip('should allow user to sign up and sign in', async ({ page }) => {
    // This test would require:
    // - PostgreSQL running
    // - Database schema migrated
    // - Environment variables configured
    // - Potentially a test user cleanup strategy
    
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'
    const testName = 'Test User'

    // Navigate and sign up
    await page.goto('/auth/signup')
    await page.getByPlaceholder('Enter your name').fill(testName)
    await page.getByPlaceholder('Enter your email').fill(testEmail)
    await page.getByPlaceholder('Create a password').fill(testPassword)
    await page.getByRole('button', { name: /create account/i }).click()

    // Should redirect to character creation or dashboard
    await expect(page).toHaveURL('/')
    
    // ... rest of flow
  })
})
*/
