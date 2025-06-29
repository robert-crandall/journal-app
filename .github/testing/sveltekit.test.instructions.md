---
description: SvelteKit frontend testing guide for junior developers, focusing on integration with Hono backend
applyTo: "frontend/**/*.{test,spec}.{js,ts,jsx,tsx,svelte}"
---

# SvelteKit Testing Guide for Junior Developers

This guide covers frontend testing strategies that complement your Hono backend integration tests, focusing on component integration, user interactions, and end-to-end workflows.

## Overview

Since your Hono backend already has comprehensive integration tests with real HTTP requests and database operations, the frontend testing strategy focuses on **Real Browser Environment**.

Each test should setup expected data before hand. In an ideal state:

- Test will run in a real browser environment using Playwright
- Tests will use real API calls to the Hono backend, which is connected to a test database
- Test file will clean the database, then seed it
  - Each test in the file will return the database to a known state. If tests are adding tasks, returning to a known state will be clearing all tasks before each test run.

## Testing Philosophy

### ✅ What TO Test in Frontend
- User interactions and form submissions  
- Routing and navigation behavior
- State management (stores, reactive declarations)
- UI logic and user experience flows

### ❌ What NOT to Test in Frontend
- **Backend business logic** - Your Hono integration tests already cover this
- **Database operations** - Covered by backend tests
- **API endpoint logic** - Tested in your Hono integration tests
- **Server-side validation** - Backend responsibility
- **Components Integration Testing** - This requires duplicating API logic in tests, and LLMs are terrible at this.
- **Specific verbiage or content** - Focus on behavior, not text

### Key Principle: NO BUSINESS LOGIC IN FRONTEND TESTS
Frontend tests should focus on UI behavior and user experience, not reimplementing backend logic.

## Setup

### Required Dependencies

```bash
# E2E testing
bun add -D playwright @playwright/test
```

## End-to-End Testing with Playwright

### Setup Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
})
```

### Complete User Journey Tests

```typescript
// tests/e2e/user-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Management Workflow', () => {
  test('complete user CRUD operations', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'adminpassword')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Navigate to users
    await page.click('text=Users')
    await expect(page).toHaveURL('/users')
    
    // Create new user
    await page.click('text=Add User')
    await page.fill('[name="name"]', 'Test User')
    await page.fill('[name="email"]', 'testuser@example.com')
    await page.fill('[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    // Verify user appears in list
    await expect(page.locator('text=Test User')).toBeVisible()
    
    // Edit user
    await page.click('[data-testid="edit-user-testuser@example.com"]')
    await page.fill('[name="name"]', 'Updated Test User')
    await page.click('button[type="submit"]')
    
    // Verify update
    await expect(page.locator('text=Updated Test User')).toBeVisible()
    
    // Delete user
    await page.click('[data-testid="delete-user-testuser@example.com"]')
    await page.click('text=Confirm Delete') // Confirmation dialog
    
    // Verify deletion
    await expect(page.locator('text=Updated Test User')).not.toBeVisible()
  })

  test('handles form validation errors', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'adminpassword')
    await page.click('button[type="submit"]')
    
    await page.goto('/users')
    await page.click('text=Add User')
    
    // Submit empty form
    await page.click('button[type="submit"]')
    
    // Check client-side validation
    await expect(page.locator('text=Name is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    
    // Fill with duplicate email
    await page.fill('[name="name"]', 'Duplicate User')
    await page.fill('[name="email"]', 'admin@example.com') // Already exists
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Check server-side validation
    await expect(page.locator('text=Email already exists')).toBeVisible()
  })
})
```

### Mobile-Specific E2E Tests

```typescript
// tests/e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['iPhone 12'] })

test.describe('Mobile User Experience', () => {
  test('navigation works on mobile', async ({ page }) => {
    await page.goto('/')
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    await page.click('text=Users')
    await expect(page).toHaveURL('/users')
    
    // Test responsive design
    await expect(page.locator('[data-testid="users-grid"]')).toHaveClass(/mobile-grid/)
  })

  test('forms are touch-friendly', async ({ page }) => {
    await page.goto('/users/create')
    
    // Test minimum touch target sizes (44px minimum)
    const submitButton = page.locator('button[type="submit"]')
    const boundingBox = await submitButton.boundingBox()
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
  })
})
```

## Test Organization and Best Practices

### File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── UserProfile.svelte
│   │   ├── UserProfile.test.ts
│   │   ├── CreateUserForm.svelte
│   │   └── CreateUserForm.test.ts
│   ├── stores/
│   │   ├── userStore.svelte.js
│   │   └── userStore.test.ts
│   └── api/
│       ├── client.ts
│       └── client.test.ts
├── routes/
│   ├── users/
│   │   ├── +page.svelte
│   │   ├── +page.test.ts
│   │   └── create/
│   │       ├── +page.svelte
│   │       └── +page.test.ts
tests/
├── setup.ts
└── e2e/
    ├── user-management.spec.ts
    └── mobile.spec.ts
```

### Test Naming Conventions

```typescript
describe('ComponentName', () => {
  describe('User Interactions', () => {
    it('should handle click events correctly', async () => {})
    it('should validate form input on submit', async () => {})
  })

  describe('API Integration', () => {
    it('should load data from backend on mount', async () => {})
    it('should handle API errors gracefully', async () => {})
  })

  describe('State Management', () => {
    it('should update reactive state correctly', async () => {})
  })
})
```

### Custom Testing Utilities

```typescript
// tests/utils.ts
import { render } from '@testing-library/svelte'
import type { ComponentProps } from 'svelte'

// Utility for rendering components with common providers
export function renderWithProviders<T>(
  Component: T,
  props?: ComponentProps<T>,
  options?: {
    initialUser?: any
    initialRoute?: string
  }
) {
  // Setup common test providers (auth context, etc.)
  return render(Component, {
    props,
    context: new Map([
      ['user', options?.initialUser || null],
      ['route', options?.initialRoute || '/']
    ])
  })
}

// Utility for waiting for API calls in tests
export async function waitForApiCall(timeout = 5000) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}
```

## Running Tests

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### Test Execution Commands

```bash
# Run unit/integration tests
bun test

# Run E2E tests
bun test:e2e

# Run E2E tests with UI
bun test:e2e:ui

# Run all tests (CI pipeline)
bun test:all
```

## Integration with Backend Tests

### Test Data Management

```typescript
// tests/test-data.ts
// Share test data setup with your Hono backend tests
export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'adminpassword',
    name: 'Admin User'
  },
  regular: {
    email: 'user@example.com', 
    password: 'userpassword',
    name: 'Regular User'
  }
}

// Ensure frontend tests use same test data as backend
export async function setupTestData() {
  // This should match your backend test setup
  // Could call backend test setup endpoints
}
```
