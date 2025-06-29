import { test, expect } from '@playwright/test'

test.describe('Quest and Experiment Management Interface - Task 6.9', () => {
  const userId = 'a0e1f2c3-d4b5-6c7d-8e9f-0a1b2c3d4e5f'
  let testQuestId: string
  let testExperimentId: string

  test.beforeEach(async ({ page }) => {
    // Navigate to the quests page
    await page.goto('/quests')
    await page.waitForLoadState('networkidle')
  })

  test('should display quest and experiment tabs with correct counts', async ({ page }) => {
    // Check that both tabs are visible
    await expect(page.locator('button:has-text("Quests")')).toBeVisible()
    await expect(page.locator('button:has-text("Experiments")')).toBeVisible()
    
    // Tabs should show counts in parentheses
    await expect(page.locator('button:has-text("Quests (")')).toBeVisible()
    await expect(page.locator('button:has-text("Experiments (")')).toBeVisible()
  })

  test('should show empty state for quests when none exist', async ({ page }) => {
    // Should be on quests tab by default
    await expect(page.locator('h3:has-text("No quests yet")')).toBeVisible()
    await expect(page.locator('text=Quests are long-term goals that generate ongoing tasks')).toBeVisible()
    await expect(page.locator('a:has-text("Create your first quest")')).toBeVisible()
  })

  test('should show empty state for experiments when switching tabs', async ({ page }) => {
    // Switch to experiments tab
    await page.locator('button:has-text("Experiments")').click()
    
    // Should show empty state
    await expect(page.locator('h3:has-text("No experiments yet")')).toBeVisible()
    await expect(page.locator('text=Experiments test specific hypotheses over a defined period')).toBeVisible()
    await expect(page.locator('a:has-text("Create your first experiment")')).toBeVisible()
  })

  test('should navigate to new quest creation form', async ({ page }) => {
    await page.locator('a:has-text("New Quest")').click()
    
    // Should be on the quest creation page
    await expect(page).toHaveURL('/quests/new?type=quest')
    await expect(page.locator('h1:has-text("New Quest")')).toBeVisible()
    
    // Should have quest-specific fields
    await expect(page.locator('label:has-text("Goal Description")')).toBeVisible()
    await expect(page.locator('input[placeholder*="30 outdoor adventures"]')).toBeVisible()
  })

  test('should navigate to new experiment creation form', async ({ page }) => {
    // Switch to experiments tab first
    await page.locator('button:has-text("Experiments")').click()
    await page.locator('a:has-text("New Experiment")').click()
    
    // Should be on the experiment creation page
    await expect(page).toHaveURL('/quests/new?type=experiment')
    await expect(page.locator('h1:has-text("New Experiment")')).toBeVisible()
    
    // Should have experiment-specific fields
    await expect(page.locator('label:has-text("Hypothesis")')).toBeVisible()
    await expect(page.locator('label:has-text("Duration (days)")')).toBeVisible()
    await expect(page.locator('input[placeholder*="7-day morning meditation"]')).toBeVisible()
  })

  test('should create a new quest with valid data', async ({ page }) => {
    await page.locator('a:has-text("New Quest")').click()
    
    // Fill out the quest form
    await page.fill('input[id="title"]', 'Complete 10 Hiking Adventures')
    await page.fill('textarea[id="description"]', 'Explore different hiking trails around the city')
    await page.fill('textarea[id="goalDescription"]', 'Become more connected with nature and improve fitness')
    
    // Set dates
    const today = new Date()
    const startDate = today.toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    
    await page.fill('input[id="startDate"]', startDate)
    await page.fill('input[id="endDate"]', endDate)
    
    // Create the quest
    await page.locator('button:has-text("Create Quest")').click()
    
    // Should redirect to quest detail page
    await page.waitForURL(/\/quests\/[a-f0-9-]+$/)
    await expect(page.locator('h1:has-text("Complete 10 Hiking Adventures")')).toBeVisible()
    await expect(page.locator('text=Quest')).toBeVisible()
    await expect(page.locator('text=Active')).toBeVisible()
  })

  test('should create a new experiment with valid data', async ({ page }) => {
    // Switch to experiments tab and create new experiment
    await page.locator('button:has-text("Experiments")').click()
    await page.locator('a:has-text("New Experiment")').click()
    
    // Fill out the experiment form
    await page.fill('input[id="title"]', '7-Day Morning Meditation')
    await page.fill('textarea[id="description"]', 'Meditate for 10 minutes every morning')
    await page.fill('textarea[id="hypothesis"]', 'Morning meditation will improve focus and reduce stress levels')
    
    // Duration should default to 7 days
    await expect(page.locator('input[id="duration"]')).toHaveValue('7')
    
    // Set start date
    const today = new Date()
    const startDate = today.toISOString().split('T')[0]
    await page.fill('input[id="startDate"]', startDate)
    
    // End date should be auto-calculated and disabled
    await expect(page.locator('input[id="endDate"]')).toBeDisabled()
    
    // Create the experiment
    await page.locator('button:has-text("Create Experiment")').click()
    
    // Should redirect to experiment detail page
    await page.waitForURL(/\/quests\/[a-f0-9-]+$/)
    await expect(page.locator('h1:has-text("7-Day Morning Meditation")')).toBeVisible()
    await expect(page.locator('text=Experiment')).toBeVisible()
    await expect(page.locator('text=Active')).toBeVisible()
    await expect(page.locator('text=Morning meditation will improve focus')).toBeVisible()
  })

  test('should validate required fields in quest creation', async ({ page }) => {
    await page.locator('a:has-text("New Quest")').click()
    
    // Try to submit without title
    await page.locator('button:has-text("Create Quest")').click()
    
    // Should show validation message
    await expect(page.locator('input[id="title"]:invalid')).toBeVisible()
  })

  test('should validate required fields in experiment creation', async ({ page }) => {
    await page.locator('button:has-text("Experiments")').click()
    await page.locator('a:has-text("New Experiment")').click()
    
    // Fill title but not hypothesis
    await page.fill('input[id="title"]', 'Test Experiment')
    
    // Try to submit without hypothesis
    await page.locator('button:has-text("Create Experiment")').click()
    
    // Should show validation message  
    await expect(page.locator('textarea[id="hypothesis"]:invalid')).toBeVisible()
  })

  test('should update experiment duration and auto-calculate end date', async ({ page }) => {
    await page.locator('button:has-text("Experiments")').click()
    await page.locator('a:has-text("New Experiment")').click()
    
    // Set start date
    const today = new Date()
    const startDate = today.toISOString().split('T')[0]
    await page.fill('input[id="startDate"]', startDate)
    
    // Change duration to 14 days
    await page.fill('input[id="duration"]', '14')
    
    // End date should be updated automatically
    const expectedEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await expect(page.locator('input[id="endDate"]')).toHaveValue(expectedEndDate)
    
    // Duration text should update
    await expect(page.locator('text=14 days')).toBeVisible()
  })

  test('should navigate back to quest list from creation form', async ({ page }) => {
    await page.locator('a:has-text("New Quest")').click()
    
    // Click back button
    await page.locator('button:has([data-testid="back-button"])').click()
    
    // Should be back on quest list page
    await expect(page).toHaveURL('/quests')
  })

  test('should navigate back to quest list using cancel button', async ({ page }) => {
    await page.locator('a:has-text("New Quest")').click()
    
    // Click cancel button
    await page.locator('button:has-text("Cancel")').click()
    
    // Should be back on quest list page
    await expect(page).toHaveURL('/quests')
  })

  test('should switch between quest and experiment tabs', async ({ page }) => {
    // Should start on quests tab
    await expect(page.locator('button:has-text("Quests")').locator('.bg-white')).toBeVisible()
    
    // Switch to experiments
    await page.locator('button:has-text("Experiments")').click()
    await expect(page.locator('button:has-text("Experiments")').locator('.bg-white')).toBeVisible()
    
    // Switch back to quests
    await page.locator('button:has-text("Quests")').click()
    await expect(page.locator('button:has-text("Quests")').locator('.bg-white')).toBeVisible()
  })

  test('should handle loading states during creation', async ({ page }) => {
    await page.locator('a:has-text("New Quest")').click()
    
    // Fill out minimal form
    await page.fill('input[id="title"]', 'Test Quest')
    
    // Start submission and check loading state
    const createButton = page.locator('button:has-text("Create Quest")')
    await createButton.click()
    
    // Should show loading state briefly
    await expect(page.locator('text=Creating...')).toBeVisible({ timeout: 1000 })
  })

  test('should display error message for invalid server response', async ({ page }) => {
    // Intercept API call to return error
    await page.route('/api/quests', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Invalid quest data' })
      })
    })
    
    await page.locator('a:has-text("New Quest")').click()
    await page.fill('input[id="title"]', 'Test Quest')
    await page.locator('button:has-text("Create Quest")').click()
    
    // Should show error message
    await expect(page.locator('text=Invalid quest data')).toBeVisible()
  })

  test('should show quest cards with proper information when data exists', async ({ page }) => {
    // Create a quest first to ensure we have data
    await page.goto('/quests/new?type=quest')
    await page.fill('input[id="title"]', 'Display Test Quest')
    await page.fill('textarea[id="description"]', 'Quest for testing display')
    await page.locator('button:has-text("Create Quest")').click()
    
    // Go back to quest list
    await page.goto('/quests')
    await page.waitForLoadState('networkidle')
    
    // Should show quest card instead of empty state
    await expect(page.locator('text=Display Test Quest')).toBeVisible()
    await expect(page.locator('text=Quest for testing display')).toBeVisible()
    await expect(page.locator('text=Active')).toBeVisible()
  })

  test('should show experiment cards with proper information when data exists', async ({ page }) => {
    // Create an experiment first
    await page.goto('/quests/new?type=experiment')
    await page.fill('input[id="title"]', 'Display Test Experiment')
    await page.fill('textarea[id="description"]', 'Experiment for testing display')
    await page.fill('textarea[id="hypothesis"]', 'This will work perfectly')
    await page.locator('button:has-text("Create Experiment")').click()
    
    // Go back to quest list and switch to experiments tab
    await page.goto('/quests')
    await page.locator('button:has-text("Experiments")').click()
    await page.waitForLoadState('networkidle')
    
    // Should show experiment card
    await expect(page.locator('text=Display Test Experiment')).toBeVisible()
    await expect(page.locator('text=Experiment for testing display')).toBeVisible()
    await expect(page.locator('text=This will work perfectly')).toBeVisible()
    await expect(page.locator('text=Active')).toBeVisible()
  })
})
