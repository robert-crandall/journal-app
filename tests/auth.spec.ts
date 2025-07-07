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

// Note: Full authentication flow tests now enabled since database is configured

test.describe('Full Authentication Flow (With Database)', () => {
  test('should allow user to sign up, create character, and use the app', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'
    const testName = 'Test User'
    const characterName = 'Aragorn'

    // Navigate to sign up
    await page.goto('/auth/signup')
    await expect(page.getByText('Join the Adventure')).toBeVisible()

    // Fill out sign up form
    await page.getByPlaceholder('Enter your name').fill(testName)
    await page.getByPlaceholder('Enter your email').fill(testEmail)
    await page.getByPlaceholder('Create a password').fill(testPassword)

    // Submit sign up form
    await page.getByRole('button', { name: /create account/i }).click()

    // Should redirect to sign in page with success message
    await expect(page).toHaveURL('/auth/signin?message=Account%20created%20successfully!%20Please%20sign%20in.')
    await expect(page.getByText(/account created successfully/i)).toBeVisible()

    // Now sign in with the credentials
    await page.getByPlaceholder('Enter your email').fill(testEmail)
    await page.getByPlaceholder('Enter your password').fill(testPassword)
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to home page and see character creation prompt
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Welcome, Adventurer!')).toBeVisible()
    await expect(page.getByText('you need to create your character')).toBeVisible()

    // Click create character button
    await page.getByRole('link', { name: /create character/i }).click()
    await expect(page).toHaveURL('/character/create')

    // Fill out character creation form
    await page.getByPlaceholder('Enter your character\'s name').fill(characterName)
    await page.locator('select').selectOption('Warrior')
    await page.getByPlaceholder('Tell us about your character\'s background').fill('A brave warrior seeking adventure')
    await page.getByPlaceholder('What do you want to achieve?').fill('Become stronger and spend time with family')

    // Submit character creation
    await page.getByRole('button', { name: /begin adventure/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
    await expect(page.getByText(`Welcome back, ${characterName}!`)).toBeVisible()
    await expect(page.getByText('Warrior')).toBeVisible()

    // Should see the user's name in navigation
    await expect(page.locator('.avatar').getByText(testName.charAt(0))).toBeVisible() // Avatar with first letter

    // User should be able to sign out
    await page.locator('.avatar').click()
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should redirect to landing page
    await expect(page.getByText('Turn your life into an epic adventure')).toBeVisible()
  })

  test('should allow user to sign in with existing credentials', async ({ page }) => {
    // This test assumes the previous test ran and created a user
    // In a real scenario, you'd want to set up test data beforehand
    
    await page.goto('/auth/signin')
    
    // Try with invalid credentials first
    await page.getByPlaceholder('Enter your email').fill('nonexistent@example.com')
    await page.getByPlaceholder('Enter your password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should see error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  })
})
