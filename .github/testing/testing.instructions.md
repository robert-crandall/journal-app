---
description: Integration-first testing approach with real API calls and minimal unit testing
applyTo: "**/*.{test,spec}.{js,ts,jsx,tsx,svelte}"
---

# Testing Guidelines - Integration-First with Minimal Unit Testing

## Testing Philosophy

- **Integration-First**: Primary testing through real HTTP requests and database operations
- **Backend Integration Tests**: Test complete request/response cycle with real API calls
- **Frontend Component Integration**: Test components with real backend API calls
- **Minimal Unit Testing**: Only for pure functions and critical business logic
- **End-to-End Coverage**: Complete user journeys and cross-browser compatibility
- **NO BUSINESS LOGIC IN TESTS**: Don't reimplement backend logic in test files

## Testing Layers

### 1. Backend Integration Tests (Primary - Hono)
- **Real HTTP requests** to actual API endpoints using `app.request()` or `testClient()`
- **Real database operations** with proper setup/teardown
- **Complete middleware testing** including authentication, validation, CORS
- **Type-safe testing** with Hono's testing utilities
- **Test entire request/response cycle** from HTTP to database

### 2. Frontend Component Integration (SvelteKit)
- **Real API calls** to running backend during component tests
- **User interaction testing** with @testing-library/svelte
- **Form validation and submission** with actual server responses
- **Loading states and error handling** from real API responses
- **NO mocking of your own API** - test the actual integration

### 3. End-to-End Tests (Playwright)
- **Complete user journeys** across the entire application
- **Cross-browser compatibility** testing
- **Mobile-responsive behavior** and touch interactions
- **Authentication flows** and user session management
- **Performance and accessibility** validation

### 4. Unit Tests (Minimal)
- **Pure functions only** with complex logic or calculations
- **Utility functions** used across the application
- **Data transformation** and validation functions
- **Critical business logic** that could break CI/CD

## Integration Test Examples

### Backend API Testing (Hono)
```typescript
// ✅ Integration test with real HTTP requests
describe('Users API', () => {
  it('should create and retrieve user with real database', async () => {
    // Create user via real API call
    const createRes = await app.request('/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@test.com' }),
      headers: { 'Content-Type': 'application/json' }
    })
    
    expect(createRes.status).toBe(201)
    const created = await createRes.json()
    
    // Retrieve user via real API call
    const getRes = await app.request(`/users/${created.id}`)
    expect(getRes.status).toBe(200)
    
    const retrieved = await getRes.json()
    expect(retrieved).toEqual(created)
  })
})
```

### Frontend Component Testing (SvelteKit)
```typescript
// ✅ Component test with real API integration
describe('UserProfile Component', () => {
  it('should load user data from real API', async () => {
    render(UserProfile, { props: { userId: 'test-user-123' } })
    
    // Wait for real API call to complete
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })
})
```

### Minimal Unit Testing
```typescript
// ✅ Unit test for pure function only
describe('calculateTotal', () => {
  it('should calculate total with tax', () => {
    expect(calculateTotal(100, 0.1)).toBe(110)
  })
})

## Testing Strategy by Layer

### Backend (Hono) - Integration Focus
- **Real HTTP requests** using `app.request()` or `testClient()`
- **Actual database operations** with proper test database setup
- **Authentication flows** using real login endpoints (not mocked tokens)
- **Middleware testing** with complete request/response cycle
- **Error handling** with real API error responses

### Frontend (SvelteKit) - Component Integration
- **Real API calls** to running backend during component tests
- **User interactions** with actual form submissions and responses
- **Loading states** and error handling from real API responses
- **Routing and navigation** behavior testing
- **State management** with reactive declarations and stores

### E2E Tests - Complete User Journeys
```typescript
// ✅ E2E test covering complete workflow
describe('User Management Workflow', () => {
  it('should allow admin to create, edit, and delete users', async ({ page }) => {
    // Login with real credentials
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'adminpassword')
    await page.click('button[type="submit"]')
    
    // Navigate and perform operations
    await page.click('text=Users')
    await page.click('text=Add User')
    // ... complete workflow
  })
})
```

## Testing Tools and Setup

### Recommended Stack
- **Backend Integration**: Vitest + Hono testing utilities (`app.request()`, `testClient()`)
- **Frontend Integration**: Vitest + @testing-library/svelte + jsdom
- **E2E Testing**: Playwright with multiple browsers
- **Database**: Real test database with proper setup/teardown

### Key Principles
- **Real over Mock**: Use real HTTP requests, real database operations
- **Integration over Unit**: Focus on testing component interactions
- **Type Safety**: Leverage Hono's type-safe testing utilities
- **NO BUSINESS LOGIC IN TESTS**: Import and use actual business logic

### CI/CD Integration
```json
{
  "scripts": {
    "test": "vitest --run",
    "test:integration": "vitest --run src/**/*.{test,spec}.{js,ts}",
    "test:e2e": "playwright test",
    "test:ci": "npm run test:integration && npm run test:e2e"
  }
}
```

## When to Add Different Types of Tests

### Integration Tests (Primary - Always Add)
- **Backend API endpoints** - Test every route with real HTTP requests
- **Frontend components** that interact with APIs
- **Authentication and authorization** flows
- **Database operations** and data persistence
- **Middleware and validation** logic

### Unit Tests (Minimal - Only When Needed)
- **Pure functions** with complex algorithms or calculations
- **Utility functions** used across multiple components
- **Data transformation** functions with complex logic
- **Validation functions** with multiple rules

### E2E Tests (Complete Workflows)
- **Critical user journeys** that span multiple pages/components
- **Cross-browser compatibility** for supported browsers
- **Mobile responsiveness** and touch interactions
- **Performance-critical** user flows

### What NOT to Test
- **Simple getters/setters** - No value added
- **Mocked API calls** - Test real integration instead
- **Third-party library internals** - Trust the library's tests
- **Trivial functions** without business logic

## Test Naming and Organization

### Simple, Clear Names
```typescript
// ✅ Clear and minimal
describe('UserValidator', () => {
  it('rejects invalid email formats');
  it('accepts valid email formats');
});

// ❌ Too verbose for minimal approach
describe('UserValidator email validation functionality', () => {
  it('should return false when email does not contain @ symbol');
  it('should return false when email domain is missing');
  // etc.
});
```

### File Organization
- Place test files next to source files: `utils.ts` → `utils.test.ts`
- Use `.test.` suffix for unit tests
- Use `.e2e.` suffix for end-to-end tests
- Keep test files small and focused

## Coverage Goals and Philosophy

### Integration Coverage (Primary Goal)
- **Backend API Endpoints**: 100% of routes tested with real HTTP requests
- **Frontend Components**: All components that make API calls tested
- **Critical User Flows**: 100% coverage via E2E tests
- **Database Operations**: All CRUD operations tested with real database

### Unit Test Coverage (Minimal)
- **Pure Functions**: ~90% coverage of complex utility functions
- **Business Logic**: ~80% coverage of critical algorithms
- **Overall Unit Coverage**: ~30-40% (not the primary goal)

### Quality over Quantity
- **Real integration tests** are worth more than extensive unit tests
- **One integration test** can replace dozens of mocked unit tests
- **Focus on critical paths** that users actually experience
- **Test behavior, not implementation details**

### Don't Chase 100% Unit Coverage
- High unit test coverage numbers are misleading with integration-first approach
- Use coverage reports to find **untested critical logic only**
- **Integration tests provide better coverage** of real-world scenarios

This approach ensures your application works correctly in production while maintaining efficient and meaningful test coverage.
