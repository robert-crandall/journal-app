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

### Hono Client Usage

The Hono client has a specific API that differs from standard fetch API:

- **Use `header` (singular) not `headers` (plural)** when setting HTTP headers with the Hono client:

```typescript
// CORRECT: Use 'header' (singular) with Hono client
const response = await api.route.$get({
  header: {
    Authorization: `Bearer ${token}`
  }
});

// INCORRECT: Don't use 'headers' (plural) with Hono client
const response = await api.route.$get({
  headers: { // This won't work with Hono client
    Authorization: `Bearer ${token}`
  }
});
```

- **JWT token field names**: When working with JWT tokens, ensure consistency between token creation and validation:
  - Use `userId` field in JWT tokens

### User ID Field Naming Convention

We follow a standardized approach for user identification fields across the system:

- **Database schema**: Uses `id` as the primary key field
- **JWT tokens**: Use `userId` field internally for compatibility
- **Backend API responses**: Always return `id` field for consistency
- **Frontend models**: Use `id` consistently

When working with JWT payload, remember to map the field name:

```typescript
// Map userId from JWT payload to id in our User model
const user: User = {
  id: payload.userId || '', // JWT payload uses userId
  name: payload.name,
  email: payload.email,
  // other fields...
};
```

This standardization simplifies our codebase by using a single field name (`id`) throughout our API responses and frontend models.

### Database Design
- UUID primary keys for all entities
- Proper foreign key relationships
- Timestamp fields for audit trails
- Snake_case for database, camelCase for TypeScript
