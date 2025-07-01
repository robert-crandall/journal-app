# Knowledge Base

## Critical Development Principles

### Type Safety Requirements (CRITICAL)

**NEVER REWRITE INTERFACES - ALWAYS IMPORT FROM BACKEND**

This is the most important rule in the codebase:

- **Frontend MUST import all types directly from backend**: `import type { User } from '../../backend/src/db/schema'`
- **NEVER create custom interfaces** that duplicate backend types
- **NEVER rewrite type definitions** - always import from the single source of truth
- **Fix typing issues by importing proper types** from backend, not by creating workarounds

#### Examples:

✅ **CORRECT:**
```typescript
// frontend/src/routes/journal/+page.svelte
import type { JournalConversation, JournalEntry } from '../../../backend/src/db/schema'
import { api } from '$lib/api/client'

// Use the backend types directly
let conversation: JournalConversation | null = null
let messages: JournalEntry[] = []
```

❌ **WRONG:**
```typescript
// DON'T DO THIS - duplicating backend types
interface Conversation {
  id: string
  userId: string
  title?: string
  // ... duplicating backend schema
}
```

#### Backend Types Location:
- **Database entities**: `backend/src/db/schema.ts`
- **API response types**: Import from route files or create in backend shared types
- **Utility types**: `backend/src/types/` (create if needed)

#### Common Patterns:
```typescript
// Import Drizzle inferred types
import type { User, Character, JournalConversation, JournalEntry } from '../../backend/src/db/schema'

// Import Hono API types (if available)
import type { AppType } from '../../backend/src/index'

// Use Hono client for type-safe API calls
import { hc } from '@hono/hc'
const api = hc<AppType>('http://localhost:3000')
```

### Database Schema Patterns

#### Column Naming Convention
- Database uses **snake_case**: `user_id`, `created_at`, `updated_at`
- TypeScript schema uses **camelCase**: `userId`, `createdAt`, `updatedAt`
- SQL queries must use snake_case column names

#### Common Schema Patterns
```sql
-- Always use snake_case in raw SQL
INSERT INTO users (id, email, name, "created_at", "updated_at")
INSERT INTO characters (id, "user_id", name, class, "created_at", "updated_at")
INSERT INTO journal_conversations (id, "user_id", "is_active", "created_at", "updated_at")
```

### API Client Patterns

#### Hono Client Setup
```typescript
// lib/api/client.ts
import { hc } from '@hono/hc'
// Import backend types when available
// import type { AppType } from '../../../backend/src/index'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
export const api = hc<any>(API_BASE_URL) // Use any until proper typing is available
```

#### API Call Pattern
```typescript
// Correct API path structure for journal routes
const response = await api.journal.status.$get({
  query: { userId }
})

// NOT api.api.journal - this is incorrect
```

### Component Design Patterns

#### Single Responsibility
- Components should focus on one specific task
- Extract reusable logic into composable functions
- Use props for configuration, avoid deep prop drilling

#### Import Patterns
```typescript
// Always import backend types
import type { Character, CharacterStats } from '../../../backend/src/db/schema'

// Use consistent import aliases
import { api } from '$lib/api/client'
import { onMount } from 'svelte'
```

### Testing Patterns

#### Integration Test Structure
```typescript
// Use real API calls, not mocks
import { api } from '$lib/api/client'
import type { User } from '../../backend/src/db/schema'

test('should create journal conversation', async () => {
  const response = await api.journal['quick-start'].$post({
    json: { userId: TEST_USER_ID }
  })
  
  expect(response.ok).toBe(true)
  const data = await response.json()
  expect(data.success).toBe(true)
})
```

## Common Pitfalls and Solutions

### 1. Type Import Issues
**Problem**: Frontend type errors due to missing backend types
**Solution**: Always import types directly from backend schema

### 2. API Path Issues  
**Problem**: API calls failing due to incorrect client usage
**Solution**: Use correct Hono client path structure (`api.journal.endpoint` not `api.api.journal.endpoint`)

### 3. Database Column Naming
**Problem**: SQL queries failing due to case mismatch
**Solution**: Use snake_case in SQL, camelCase in TypeScript

### 4. Duplicate Logic
**Problem**: Same logic repeated across components
**Solution**: Extract to shared utilities, import from single source

## Useful Utilities and Patterns

### Date Handling
```typescript
// Always use ISO strings for API communication
const now = new Date().toISOString()

// Use date-fns for formatting in frontend
import { format } from 'date-fns'
const formatted = format(new Date(dateString), 'PPp')
```

### Error Handling
```typescript
// Consistent error handling pattern
try {
  const response = await api.someEndpoint.$post({ json: data })
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Operation failed')
  }
  return result.data
} catch (error) {
  console.error('Operation failed:', error)
  // Handle error appropriately
}
```

### Loading States
```typescript
// Consistent loading state pattern
let isLoading = false
let error = ''

async function performAction() {
  try {
    isLoading = true
    error = ''
    // API call here
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    isLoading = false
  }
}
```

## Architecture Decisions

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

## Testing Commands

### E2E Test Commands
```bash
# Run specific E2E test file
bun run test:e2e -- tests/e2e/family.test.ts

# Run all E2E tests
bun run test:e2e

# Run E2E tests in headed mode (visible browser)
bun run test:e2e --headed

# Run E2E tests for specific browser
bun run test:e2e --project=chromium
bun run test:e2e --project=webkit
```

### Unit Test Commands
```bash
# Run unit tests
bun test

# Run unit tests in watch mode
bun test --watch

# Run specific test file
bun test path/to/test.test.ts
```

### Test Debugging
- Use `--headed` flag to see browser during E2E tests
- Use `await page.pause()` in tests for debugging
- Check `test-results/` folder for screenshots and videos on failures
