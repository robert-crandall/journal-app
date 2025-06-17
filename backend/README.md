# Journal App Backend

A TypeScript-based backend for a life coaching journal application using Hono, PostgreSQL, and Drizzle ORM.

## Architecture

This backend uses a **simplified architecture** with direct type sharing:

- **Backend**: Hono framework with TypeScript
- **Database**: PostgreSQL with Drizzle ORM  
- **Types**: Exported directly from backend for frontend consumption
- **Authentication**: JWT-based with middleware
- **Testing**: Comprehensive unit and integration tests with Bun

## Key Features

- ✅ **End-to-end type safety** via direct type imports
- ✅ **Comprehensive test coverage** (38 tests passing)
- ✅ **Clean API design** with consistent error handling
- ✅ **Database schema validation** with Zod
- ✅ **Authentication middleware** for protected routes
- ✅ **Real-world data modeling** for journal, tasks, users

## Direct Type Sharing

Instead of maintaining a separate client package, the frontend imports types directly from the backend:

```typescript
// Frontend imports types directly from backend
import type { 
  ApiResponse,
  User,
  Task,
  CreateTask,
  JournalEntry
} from '../../../backend/src/types';
```

This approach:
- ✅ Eliminates redundant code
- ✅ Ensures automatic type sync
- ✅ Simplifies maintenance
- ✅ Maintains full type safety

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile (protected)
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset

### Tasks
- `GET /api/tasks` - Get user tasks (protected)
- `POST /api/tasks` - Create new task (protected)
- `GET /api/tasks/:id` - Get specific task (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)

### Journal
- `GET /api/journal` - Get journal entries (protected)
- `POST /api/journal` - Create journal entry (protected)
- `GET /api/journal/:id` - Get specific entry (protected)
- `PUT /api/journal/:id` - Update entry (protected)
- `DELETE /api/journal/:id` - Delete entry (protected)

### Dashboard
- `GET /api/dashboard` - Get dashboard data (protected)

## Database Schema

- **Users**: Authentication and profile information
- **Tasks**: User tasks with due dates and completion status
- **Journal Entries**: User journal content with optional analysis
- **User Context**: Key-value user information for AI context
- **User Preferences**: Theme and UI preferences

## Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Database operations
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:push      # Push schema to database
bun run db:studio    # Open Drizzle Studio
```

## Testing

The test suite includes:

- **Authentication Tests**: Registration, login, protected routes
- **Task Tests**: CRUD operations, validation, authorization
- **Journal Tests**: Content management, access control
- **Dashboard Tests**: Data aggregation and display
- **End-to-End Tests**: Complete user journeys

All tests use a clean database state and test real HTTP requests against the Hono application.

## Environment Variables

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
```

## Type Safety

The backend exports all necessary types through `src/types/index.ts`:

- Request/Response types
- Entity types (User, Task, JournalEntry, etc.)
- Validation schemas (Zod)
- API response wrappers

The frontend can import these types directly, ensuring end-to-end type safety without code duplication.

## Error Handling

- Consistent error response format
- Proper HTTP status codes
- Validation error details
- Authentication error handling
- Database error handling

## Security

- JWT token authentication
- Password hashing with bcrypt
- Input validation with Zod
- SQL injection protection via Drizzle ORM
- CORS configuration for frontend

open http://localhost:3000
