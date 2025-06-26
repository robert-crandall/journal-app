---
description: SvelteKit frontend testing guide for junior developers, focusing on integration with Hono backend
applyTo: "frontend/**/*.{test,spec}.{js,ts,jsx,tsx,svelte}"
---

# SvelteKit Testing Guide for Junior Developers

This guide covers frontend testing strategies that complement your Hono backend integration tests, focusing on component integration, user interactions, and end-to-end workflows.

## Overview

Since your Hono backend already has comprehensive integration tests with real HTTP requests and database operations, the frontend testing strategy focuses on:

- **Component Integration**: Test components with real API calls to your backend
- **User Experience**: Test user interactions, form submissions, and UI logic
- **End-to-End Workflows**: Test complete user journeys across your application
- **Frontend-Specific Logic**: Test routing, state management, and client-side validation

## Testing Philosophy

### ✅ What TO Test in Frontend
- Component rendering with real API data
- User interactions and form submissions  
- Error handling and loading states
- Routing and navigation behavior
- Client-side validation (if any)
- State management (stores, reactive declarations)
- UI logic and user experience flows

### ❌ What NOT to Test in Frontend
- **Backend business logic** - Your Hono integration tests already cover this
- **Database operations** - Covered by backend tests
- **API endpoint logic** - Tested in your Hono integration tests
- **Server-side validation** - Backend responsibility

### Key Principle: NO BUSINESS LOGIC IN FRONTEND TESTS
Frontend tests should focus on UI behavior and user experience, not reimplementing backend logic.

## Setup

### Required Dependencies

```bash
# Core testing dependencies
bun add -D vitest jsdom @vitest/ui

# Component testing
bun add -D @testing-library/svelte @testing-library/jest-dom @testing-library/user-event

# E2E testing
bun add -D playwright @playwright/test

# SvelteKit testing utilities
bun add -D @sveltejs/adapter-static
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
  resolve: process.env.VITEST ? {
    conditions: ['browser']
  } : undefined
})
```

### Test Setup

```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock SvelteKit modules for testing
vi.mock('$app/environment', () => ({
  browser: false,
  dev: true,
}))

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
  pushState: vi.fn(),
  replaceState: vi.fn(),
}))

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(() => vi.fn())
  },
  navigating: {
    subscribe: vi.fn(() => vi.fn())
  }
}))

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})
```

## Component Integration Testing

### Basic Component Testing with Real API Calls

```typescript
// src/lib/components/UserProfile.test.ts
import { render, screen, waitFor } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import UserProfile from './UserProfile.svelte'

describe('UserProfile Component', () => {
  const user = userEvent.setup()

  it('should load and display user data from API', async () => {
    render(UserProfile, {
      props: { userId: 'test-user-123' }
    })
    
    // Test loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    // Wait for real API call to complete
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should handle API errors gracefully', async () => {
    render(UserProfile, {
      props: { userId: 'nonexistent-user' }
    })
    
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })
  })

  it('should allow editing user information', async () => {
    render(UserProfile, {
      props: { userId: 'test-user-123' }
    })
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    // Verify edit form appears
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    
    // Fill out form
    const nameInput = screen.getByRole('textbox', { name: /name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'John Smith')
    
    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    // Verify update (real API call to backend)
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument()
    })
  })
})
```

### Form Components with Validation

```typescript
// src/lib/components/CreateUserForm.test.ts
import { render, screen, waitFor } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import CreateUserForm from './CreateUserForm.svelte'

describe('CreateUserForm Component', () => {
  const user = userEvent.setup()

  it('should validate form fields client-side', async () => {
    render(CreateUserForm)
    
    const submitButton = screen.getByRole('button', { name: /create user/i })
    await user.click(submitButton)
    
    // Test client-side validation
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('should handle server validation errors', async () => {
    render(CreateUserForm)
    
    // Fill form with invalid data that passes client validation
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'Test User')
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'existing@example.com')
    
    const submitButton = screen.getByRole('button', { name: /create user/i })
    await user.click(submitButton)
    
    // Wait for server response (real API call)
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('should create user successfully', async () => {
    const mockOnSuccess = vi.fn()
    render(CreateUserForm, {
      props: { onSuccess: mockOnSuccess }
    })
    
    // Fill valid form data
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'New User')
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'newuser@example.com')
    await user.type(screen.getByLabelText(/password/i), 'validpassword123')
    
    const submitButton = screen.getByRole('button', { name: /create user/i })
    await user.click(submitButton)
    
    // Wait for successful creation
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        id: expect.any(String),
        name: 'New User',
        email: 'newuser@example.com'
      })
    })
  })
})
```

## Testing Svelte Runes and Reactive Logic

### Testing Reactive State

```typescript
// src/lib/stores/userStore.test.ts
import { flushSync } from 'svelte'
import { describe, it, expect } from 'vitest'
import { userStore } from './userStore.svelte.js'

describe('User Store', () => {
  it('should manage user state reactively', () => {
    const cleanup = $effect.root(() => {
      const store = userStore()
      
      // Test initial state
      expect(store.user).toBe(null)
      expect(store.isLoading).toBe(false)
      
      // Test loading state
      store.setLoading(true)
      flushSync()
      expect(store.isLoading).toBe(true)
      
      // Test setting user
      const testUser = { id: '1', name: 'Test User', email: 'test@example.com' }
      store.setUser(testUser)
      flushSync()
      
      expect(store.user).toEqual(testUser)
      expect(store.isLoading).toBe(false)
    })
    
    cleanup()
  })

  it('should compute derived values correctly', () => {
    const cleanup = $effect.root(() => {
      const store = userStore()
      
      // Test computed property
      expect(store.isLoggedIn).toBe(false)
      
      store.setUser({ id: '1', name: 'Test', email: 'test@example.com' })
      flushSync()
      
      expect(store.isLoggedIn).toBe(true)
    })
    
    cleanup()
  })
})
```

### Testing Components with Effects

```typescript
// src/lib/components/AutoSave.test.ts
import { render, screen } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'
import { flushSync } from 'svelte'
import { describe, it, expect, vi } from 'vitest'
import AutoSaveForm from './AutoSaveForm.svelte'

describe('AutoSaveForm Component', () => {
  it('should auto-save after user stops typing', async () => {
    const user = userEvent.setup()
    const mockSave = vi.fn()
    
    render(AutoSaveForm, {
      props: { onSave: mockSave }
    })
    
    const input = screen.getByRole('textbox')
    
    // Type some text
    await user.type(input, 'Hello world')
    
    // Wait for debounced auto-save (component uses $effect with setTimeout)
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    expect(mockSave).toHaveBeenCalledWith('Hello world')
  })
})
```

## Page-Level Integration Testing

### Testing SvelteKit Routes

```typescript
// src/routes/users/+page.test.ts
import { render, screen, waitFor } from '@testing-library/svelte'
import { describe, it, expect } from 'vitest'
import UsersPage from './+page.svelte'
import type { PageData } from './$types'

describe('Users Page', () => {
  it('should display users list from API', async () => {
    const mockData: PageData = {
      users: [] // Initial empty state
    }
    
    render(UsersPage, {
      props: { data: mockData }
    })
    
    // Test loading state
    expect(screen.getByText('Loading users...')).toBeInTheDocument()
    
    // Wait for real API call to populate data
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('should handle empty users list', async () => {
    const mockData: PageData = {
      users: []
    }
    
    render(UsersPage, {
      props: { data: mockData }
    })
    
    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
    })
  })
})
```

## Authentication Flow Testing

```typescript
// src/lib/components/LoginForm.test.ts
import { render, screen, waitFor } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import LoginForm from './LoginForm.svelte'

describe('LoginForm Component', () => {
  const user = userEvent.setup()

  it('should handle successful login', async () => {
    const mockOnLogin = vi.fn()
    render(LoginForm, {
      props: { onLogin: mockOnLogin }
    })
    
    // Fill login form
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'validpassword')
    
    const loginButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(loginButton)
    
    // Wait for real authentication API call
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        user: expect.objectContaining({
          email: 'user@example.com'
        }),
        token: expect.any(String)
      })
    })
  })

  it('should display login errors from API', async () => {
    render(LoginForm)
    
    // Try invalid credentials
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    
    const loginButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(loginButton)
    
    // Wait for API error response
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })
})
```

## API Client Testing

```typescript
// src/lib/api/client.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from './client'

describe('API Client Integration', () => {
  it('should make type-safe requests to backend', async () => {
    // Test that frontend client works with real Hono backend
    const response = await api.users.$get()
    expect(response.status).toBe(200)
    
    const users = await response.json()
    expect(Array.isArray(users)).toBe(true)
  })

  it('should handle authentication flow', async () => {
    // Test login through API client
    const loginResponse = await api.auth.login.$post({
      json: {
        email: 'test@example.com',
        password: 'testpassword'
      }
    })
    
    expect(loginResponse.status).toBe(200)
    const { token, user } = await loginResponse.json()
    
    expect(typeof token).toBe('string')
    expect(user.email).toBe('test@example.com')
    
    // Test authenticated request
    const profileResponse = await api.auth.profile.$get({}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    expect(profileResponse.status).toBe(200)
  })

  it('should handle API errors consistently', async () => {
    const response = await api.users['nonexistent-id'].$get()
    expect(response.status).toBe(404)
    
    const error = await response.json()
    expect(error.message).toBeDefined()
  })
})
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

# Run tests in watch mode during development
bun test:watch

# Run tests with UI for debugging
bun test:ui

# Run with coverage report
bun test:coverage

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

## Key Principles Summary

1. **Test User Experience, Not Implementation** - Focus on what users see and do
2. **Use Real API Calls** - Don't mock your own backend, test the integration
3. **Test Frontend Logic Only** - Don't duplicate backend business logic tests
4. **Progressive Enhancement** - Test that features work without JavaScript first
5. **Mobile-First Testing** - Ensure touch interactions and responsive design work
6. **Accessibility Testing** - Test keyboard navigation and screen reader compatibility
7. **Performance Awareness** - Test loading states and perceived performance

This approach ensures your SvelteKit frontend is thoroughly tested while avoiding duplication with your comprehensive Hono backend integration tests. The focus remains on user experience, UI logic, and the integration between frontend and backend systems.
