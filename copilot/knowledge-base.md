# Knowledge Base

This file contains key insights, patterns, and best practices for the project.

## Critical Development Principles

### Type Safety Requirements (CRITICAL)

**NEVER REWRITE INTERFACES - ALWAYS IMPORT FROM BACKEND**

This is the most important rule in the codebase:

- **Frontend MUST import all types directly from backend**: `import type { User } from '../../backend/src/db/schema'`
- **NEVER create custom interfaces** that duplicate backend types
- **NEVER rewrite type definitions** - always import from the single source of truth
- **Fix typing issues by importing proper types** from backend, not by creating workarounds

### Error Handling

#### Backend Error Handling (Standard Pattern)

We use a standardized error handling approach in all API routes:

```typescript
import logger, { handleApiError } from '../utils/logger'

// In route handlers:
try {
  // Your code here
  return c.json({ success: true, data })
} catch (error) {
  // Standard error handling - logs the error and throws appropriate HTTPException
  handleApiError(error, 'Failed to perform operation')
}
```

The `handleApiError` utility:
1. Logs errors with appropriate level
2. Preserves HTTPExceptions when they occur
3. Wraps other errors with proper status codes
4. Suppresses excessive logging during tests

## Testing

### Testing Philosophy: NO MOCKS

**Date Added: June 29, 2025**

Tests should use real instances instead of mocks whenever possible:

- **✅ DO**: Use real database connections with test databases
- **✅ DO**: Make real API calls in integration tests
- **✅ DO**: Set up proper test environments that mimic production
- **❌ DON'T**: Use mocked database connections
- **❌ DON'T**: Mock API responses
- **❌ DON'T**: Create fake implementations that don't match real behavior

**Benefits of no-mock testing:**
- Tests that catch real integration issues
- Closer to real-world usage scenarios
- Improved confidence in test coverage
- Avoids maintaining both implementation and mock logic

**Implementation guidelines:**
1. Set up dedicated test databases for integration tests
2. Use environment variables to configure test settings
3. Ensure proper cleanup between test runs
4. Containerize dependencies when needed for test isolation

This approach ensures tests validate the actual system behavior rather than just verifying mock interactions.


## Architecture Decisions

### Error Handling Strategy

We follow a standardized error handling approach throughout the codebase:

1. **Central logging utility**: All logs go through the `logger` module
2. **Environment-aware logging**: Different log levels for development, production and tests
3. **Standard error handling pattern**: Use `handleApiError` in catch blocks
4. **HTTP exception preservation**: Original HTTP status codes are preserved
5. **Client vs. Server errors**: 4xx errors can be suppressed in tests, while 5xx always log
6. **Standardization scripts**: Use `scripts/standardize_all_error_handling.sh` to enforce pattern

The `handleApiError` function centralizes the common pattern:
```typescript
// Before standardization
catch (error) {
  logger.error('Error message:', error)
  if (error instanceof HTTPException) throw error
  throw new HTTPException(500, { message: 'User-friendly message' })
}

// After standardization
catch (error) {
  handleApiError(error, 'User-friendly message')
}
```

### Monorepo Structure
- Backend and frontend in same repo for tight coupling
- Frontend imports backend types directly
- Shared utilities when beneficial

### State Management
- Use Svelte stores for global state
- Prefer reactive declarations over complex state management
- Keep component state local when possible

### API Design
- RESTful endpoints where appropriate
- Consistent response structure with `success`, `data`, `error` fields
- Use HTTP status codes appropriately

### Database Design
- UUID primary keys for all entities
- Proper foreign key relationships
- Timestamp fields for audit trails
- Snake_case for database, camelCase for TypeScript

### JWT Authentication Standard

We've standardized on `userId` as the key for user identification in JWT tokens:

- **✅ DO**: Always use `userId` (not `id`) in JWT payload for user identification
- **✅ DO**: Structure JWT payloads consistently:
  ```typescript
  {
    userId: user.id,
    email: user.email,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expirationTime
  }
  ```
- **✅ DO**: Reference the `userId` property in all authentication middleware
- **❌ DON'T**: Use `id` for user identification in JWT tokens

**Reason for standardization:**
- Having both `id` and `userId` as keys in different parts of the codebase led to authentication failures
- Standardizing on `userId` makes the codebase more consistent and easier to maintain
- This avoids confusion between entity IDs and user IDs in the JWT context
