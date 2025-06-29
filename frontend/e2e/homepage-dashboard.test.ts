import { test, expect } from '@playwright/test'

test.describe('Homepage Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
  })

  test('displays dashboard layout correctly', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check main title
    await expect(page.locator('h1').first()).toContainText('Your Dashboard')
    
    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible()
    
    // Check main sections are present (either loading state or content)
    await expect(page.locator('text=Today\'s Challenges')).toBeVisible()
    await expect(page.locator('text=Your Stats')).toBeVisible()
    await expect(page.locator('text=Today\'s Journal')).toBeVisible()
  })

  test('handles loading states properly', async ({ page }) => {
    // Initially should show loading or content
    await page.waitForTimeout(100) // Brief wait for initial render
    
    // Should eventually show either content or error (not stuck in loading)
    await page.waitForFunction(() => {
      const loadingElement = document.querySelector('text=Loading your quest...')
      const errorElement = document.querySelector('text=Error loading dashboard')
      const contentElement = document.querySelector('text=Today\'s Challenges')
      
      return !loadingElement || errorElement || contentElement
    }, { timeout: 10000 })
  })

  test('displays quick stats cards', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForLoadState('networkidle')
    
    // Look for stats cards (should be visible even if no data)
    const statsCards = [
      'Today\'s Tasks',
      'Character Level', 
      'Total XP',
      'Stats Tracked'
    ]
    
    for (const statName of statsCards) {
      await expect(page.locator(`text=${statName}`)).toBeVisible()
    }
  })

  test('navigation works correctly', async ({ page }) => {
    // Test desktop navigation (if screen is wide enough)
    const desktopNav = page.locator('aside nav')
    if (await desktopNav.isVisible()) {
      await expect(desktopNav.locator('text=Dashboard')).toBeVisible()
      await expect(desktopNav.locator('text=Character')).toBeVisible()
      await expect(desktopNav.locator('text=Journal')).toBeVisible()
    }
    
    // Test mobile navigation (should always be present)
    const mobileNav = page.locator('nav').last()
    await expect(mobileNav).toBeVisible()
  })

  test('theme toggle works', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Find theme toggle button
    const themeButton = page.locator('button[aria-label="Toggle theme"]').first()
    await expect(themeButton).toBeVisible()
    
    // Get initial theme state
    const htmlElement = page.locator('html')
    const initialHasDark = await htmlElement.evaluate(el => el.classList.contains('dark'))
    
    // Click theme toggle
    await themeButton.click()
    
    // Wait a moment for theme to change
    await page.waitForTimeout(100)
    
    // Check that theme changed
    const newHasDark = await htmlElement.evaluate(el => el.classList.contains('dark'))
    expect(newHasDark).not.toBe(initialHasDark)
  })

  test('handles API errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/dashboard**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Server error' })
      })
    })
    
    await page.route('**/api/characters/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json', 
        body: JSON.stringify({ success: false, error: 'Server error' })
      })
    })
    
    // Reload page to trigger API calls
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should show error state
    await expect(page.locator('text=Error loading dashboard')).toBeVisible()
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible()
  })

  test('journal link works', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Find and click journal link
    const journalLink = page.locator('a:has-text("Write Entry")')
    await expect(journalLink).toBeVisible()
    
    // Click should navigate to journal page
    await journalLink.click()
    await expect(page).toHaveURL('/journal')
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Mobile header should be visible
    await expect(page.locator('header')).toBeVisible()
    
    // Desktop sidebar should be hidden
    const desktopSidebar = page.locator('aside')
    await expect(desktopSidebar).toBeHidden()
    
    // Mobile navigation should be visible
    const mobileNav = page.locator('nav').last()
    await expect(mobileNav).toBeVisible()
    
    // Content should be responsive
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })
})
