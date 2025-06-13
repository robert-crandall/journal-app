# Type Sharing Between Frontend and Backend

This project demonstrates how to share TypeScript types between a Next.js frontend and a backend in a monorepo structure.

## Setup

### 1. TypeScript Path Mapping

In `frontend/tsconfig.json`, we've added a path mapping to reference the backend:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@backend/*": ["../backend/src/*"]
    }
  }
}
```

### 2. Frontend Types File

The `frontend/src/types/index.ts` file imports and re-exports types from the backend:

```typescript
// Import shared types from backend
import type {
  User as BackendUser,
  JournalEntry as BackendJournalEntry,
  // ... other types
} from '@backend/types'

// Re-export backend types with cleaner names
export type User = BackendUser
export type JournalEntry = BackendJournalEntry
// ... other re-exports

// Frontend-specific types
export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}
```

## Benefits

✅ **No Code Duplication**: Types are defined once in the backend and reused in the frontend
✅ **Type Safety**: Changes to backend types are automatically reflected in the frontend
✅ **Single Source of Truth**: Database schema changes propagate through the entire application
✅ **Better Maintainability**: No need to manually sync types between frontend and backend

## Usage

In your frontend components, import types as usual:

```typescript
import { User, JournalEntry, ApiResponse } from '@/types'

function MyComponent() {
  const [user, setUser] = useState<User | null>(null)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  // ...
}
```

## Type Categories

### Shared Types (from backend)
- Entity types: `User`, `JournalEntry`, `Experiment`, etc.
- API types: `ApiResponse`, `AuthResponse`
- Input types: `CreateUserInput`, `LoginInput`, etc.

### Frontend-Only Types
- Component props: `LoadingSpinnerProps`, `ErrorMessageProps`
- State types: `AuthState`, `JournalState`
- UI types: `Theme`, `ConfirmDialogProps`

## Important Notes

1. **Date Handling**: Backend uses `Date` objects, but when serialized over HTTP, they become strings. Handle this conversion appropriately in your API client.

2. **Optional Fields**: Pay attention to optional vs required fields - the backend schema is the source of truth.

3. **Build Process**: The frontend build process can access backend types at compile time, but doesn't bundle the backend code.

4. **IDE Support**: Full IntelliSense and type checking works across the monorepo boundary.
