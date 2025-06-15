---
description: Minimal testing approach focused on CI/CD validation and E2E testing
applyTo: "**/*.{test,spec}.{js,ts,jsx,tsx,svelte}"
---

# Testing Guidelines - Minimal Unit Testing with E2E Focus

## Testing Philosophy

- Keep unit tests minimal and focused on CI/CD validation
- Primary testing should be done through end-to-end (E2E) tests
- Unit tests should catch basic breakages, not comprehensive behavior
- Focus on testing critical business logic and edge cases only
- Prefer integration tests over isolated unit tests when unit testing is needed

## Unit Testing Guidelines

### What TO Test (Minimal)
- Pure functions with complex logic or calculations
- Critical business logic that could break the application
- Error handling for edge cases
- Data transformation functions
- Validation functions
- Utility functions that are used across the application

### What NOT to Test
- Simple getters/setters
- Component rendering (leave to E2E tests)
- User interactions (leave to E2E tests)
- API calls (mock in unit tests, test in E2E)
- Database operations (test in integration/E2E tests)
- Third-party library integrations
- Simple pass-through functions

## Test Structure

### Keep Tests Simple
```typescript
// ✅ Good - tests core logic only
describe('calculateTotal', () => {
  it('should calculate total with tax', () => {
    expect(calculateTotal(100, 0.1)).toBe(110);
  });

  it('should handle zero values', () => {
    expect(calculateTotal(0, 0.1)).toBe(0);
  });
});

// ❌ Avoid - too detailed for minimal approach
describe('UserProfile component', () => {
  it('should render user name');
  it('should handle click events');
  it('should show loading state');
  // Leave these to E2E tests
});
```

### Test Critical Paths Only
- Test the "happy path" and obvious error cases
- Skip exhaustive edge case testing in unit tests
- Focus on functions that would break CI/CD if they fail

### Fast and Reliable
- Tests should run quickly (< 1 second per test suite)
- No external dependencies (database, network, filesystem)
- Use minimal mocking - prefer real implementations when possible

## E2E Testing Focus

### Primary Testing Strategy
- User workflows and critical business processes
- Cross-browser compatibility
- API integration testing
- Database operations and data persistence
- Authentication and authorization flows
- Performance and load testing

### E2E Test Organization
```typescript
// E2E tests should cover complete user journeys
describe('User Registration Flow', () => {
  it('should allow user to register, verify email, and login');
});

describe('E-commerce Purchase Flow', () => {
  it('should allow user to browse, add to cart, and checkout');
});
```

## Testing Tools and Setup

### Recommended Minimal Stack
- **Unit Testing**: Vitest (fast, minimal config)
- **E2E Testing**: Playwright (reliable, cross-browser)
- **Mocking**: Built-in mocks, avoid heavy mocking libraries

### CI/CD Integration
```javascript
// Example minimal test command for CI
{
  "scripts": {
    "test": "vitest --run --reporter=basic",
    "test:unit": "vitest --run src/**/*.{test,spec}.{js,ts}",
    "test:e2e": "playwright test",
    "test:ci": "npm run test:unit && npm run test:e2e"
  }
}
```

## When to Add Unit Tests

### Red Flags (Add Unit Tests)
- Function has complex conditional logic
- Mathematical calculations or algorithms
- Data parsing or transformation
- Validation logic with multiple rules
- Error handling with specific requirements

### Green Flags (Skip Unit Tests)
- Simple CRUD operations
- Basic component rendering
- Straightforward API calls
- Simple state management
- Styling and layout logic

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

## Coverage Goals

### Minimal Coverage Targets
- **Overall**: ~60-70% (focused on critical code)
- **Business Logic**: ~90% (core functions only)
- **Components**: ~30% (basic smoke tests only)
- **E2E Coverage**: Should cover 100% of critical user journeys

### Don't Chase 100% Coverage
- High coverage numbers are not the goal
- Focus on testing what matters for CI/CD stability
- Use coverage reports to find untested critical logic only

This approach ensures your CI/CD pipeline catches real breakages while keeping testing overhead minimal and maintainable.
