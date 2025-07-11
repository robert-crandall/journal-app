---
description: Core development principles, patterns, and architectural decisions for the journal-app project
applyTo: '**/*.{js,ts,jsx,tsx,svelte}'
---

## Type Safety Requirements (CRITICAL)

- **NEVER rewrite interfaces - ALWAYS import from backend**
  - Frontend MUST import all types directly from backend: `import type { User } from '../../backend/src/db/schema'`
  - NEVER create custom interfaces that duplicate backend types
  - NEVER rewrite type definitions - always import from the single source of truth
  - Fix typing issues by importing proper types from backend, not by creating workarounds

```typescript
// ✅ DO: Import types from backend
import type { User } from '../../backend/src/db/schema';

interface UserProfileProps {
  user: User; // Use imported backend type
}

// ❌ DON'T: Duplicate backend types
interface User {
  // Never rewrite existing types
  id: string;
  email: string;
  name: string;
}
```

## Error Handling Standards

- **Use standardized error handling pattern in all API routes**
  - Import and use `handleApiError` utility for consistent error handling
  - Logs errors with appropriate level
  - Preserves HTTPExceptions when they occur
  - Wraps other errors with proper status codes
  - Suppresses excessive logging during tests

```typescript
// ✅ DO: Use standard error handling
import logger, { handleApiError } from '../utils/logger'

try {
  // Your code here
  return c.json({ success: true, data })
} catch (error) {
  handleApiError(error, 'Failed to perform operation')
}

## Testing Philosophy: NO MOCKS

- **Use real instances instead of mocks whenever possible**
  - Use real database connections with test databases
  - Make real API calls in integration tests
  - Set up proper test environments that mimic production
  
```typescript
// ✅ DO: Use real database in tests
import { db } from '../db';
import { users } from '../db/schema';

test('should create user', async () => {
  const user = await db
    .insert(users)
    .values({
      name: 'Test User',
      email: 'test@example.com',
    })
    .returning();

  expect(user[0].name).toBe('Test User');
});
```

## JWT Authentication Standards

- **Always use `userId` (not `id`) in JWT payload for user identification**
  - Structure JWT payloads consistently with userId, email, name, iat, exp
  - Reference the userId property in all authentication middleware
  - NEVER use `id` for user identification in JWT tokens

```typescript
// ✅ DO: Use consistent JWT structure
{
  userId: user.id,
  email: user.email,
  name: user.name,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + expirationTime
}
```

## API Design Standards

- **Use consistent response structure with success, data, error fields**
  - Use HTTP status codes appropriately
  - Follow RESTful endpoint conventions where appropriate
  - Maintain standardized error responses

```typescript
// ✅ DO: Consistent API responses
return c.json(
  {
    success: true,
    data: users,
  },
  200,
);

return c.json(
  {
    success: false,
    error: 'User not found',
  },
  404,
);
```

## Database Design Standards

- **Use UUID primary keys for all entities**
  - Implement proper foreign key relationships
  - Include timestamp fields for audit trails
  - Use timezone-aware timestamps
  - Use Date field for date-only values
  - Use snake_case for database columns, camelCase for TypeScript

```typescript
// ✅ DO: Proper database schema design
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

## State Management Guidelines

- **Use Svelte stores for global state, keep component state local when possible**
  - Prefer reactive declarations over complex state management
  - Import backend types for store type safety

```typescript
// ✅ DO: Type-safe Svelte stores
import type { User } from '../../backend/src/db/schema';
import { writable } from 'svelte/store';

export const currentUser = writable<User | null>(null);
```
