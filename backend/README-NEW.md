# Journal App Backend

This is the backend API for the Journal App, built with Hono, Drizzle ORM, and PostgreSQL.

## Features Implemented (Phase 1)

### Authentication & User Management
- ✅ User registration with email and password
- ✅ User login with JWT token generation
- ✅ Password reset functionality (token-based)
- ✅ Protected routes with JWT middleware
- ✅ User profile management

### User Context System
- ✅ Key-value context storage for personalized AI interactions
- ✅ CRUD operations for user context
- ✅ Support for multiple context categories

### User Preferences & Theming
- ✅ Theme selection (supports all daisyUI themes)
- ✅ Accent color customization
- ✅ Timezone preferences
- ✅ Persistent preferences across sessions

## Tech Stack

- **Framework**: Hono (TypeScript web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcryptjs for password hashing
- **Validation**: Zod schemas
- **Runtime**: Bun

## Getting Started

### Prerequisites

- Bun installed
- PostgreSQL database running
- Node.js (for compatibility if needed)

### Installation

1. Install dependencies:
   ```bash
   bun install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your database connection string and JWT secret.

4. Generate and run database migrations:
   ```bash
   bun run db:generate
   bun run db:push
   ```

5. Start the development server:
   ```bash
   bun run dev
   ```

The API will be available at `http://localhost:3001`.

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/password-reset/request` - Request password reset
- `POST /auth/password-reset/confirm` - Confirm password reset

### User Profile (Protected)
- `GET /auth/me` - Get current user profile
- `PUT /auth/me` - Update user profile

### User Context (Protected)
- `GET /auth/me/context` - Get user context
- `PUT /auth/me/context` - Update user context

### User Preferences (Protected)
- `GET /auth/me/preferences` - Get user preferences
- `PUT /auth/me/preferences` - Update user preferences

## Testing

Run the test client to verify all endpoints:

```bash
bun run test-client
```

This will create a test user and verify all authentication and user management features.

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (Text, Unique)
- `password_hash` (Text)
- `first_name` (Text, Optional)
- `last_name` (Text, Optional)
- `is_email_verified` (Boolean)
- `created_at` (Timestamp with timezone)
- `updated_at` (Timestamp with timezone)

### User Context Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `key` (Text) - Context category (e.g., "About me", "Goals")
- `values` (JSONB) - Array of context values
- `created_at` (Timestamp with timezone)
- `updated_at` (Timestamp with timezone)

### User Preferences Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key, Unique)
- `theme` (Text) - daisyUI theme name
- `accent_color` (Text) - Accent color preference
- `timezone` (Text) - User's timezone
- `created_at` (Timestamp with timezone)
- `updated_at` (Timestamp with timezone)

### Password Reset Tokens Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `token` (Text, Unique)
- `expires_at` (Timestamp with timezone)
- `used` (Boolean)
- `created_at` (Timestamp with timezone)

## Development Tools

- `bun run dev` - Start development server with hot reload
- `bun run db:generate` - Generate database migrations
- `bun run db:push` - Push schema changes to database
- `bun run db:studio` - Open Drizzle Studio for database management
- `bun run test-client` - Run API tests

## Next Steps

This Phase 1 implementation provides the foundation for:

1. **User Authentication & Management** - Complete ✅
2. **User Context System** - Complete ✅
3. **Theme Customization** - Complete ✅
4. **Password Reset** - Complete ✅

Ready for Phase 2 features:
- Conversational Assistant
- Journal Entries
- Quests & Experiments
- Tasks Management
- Character Stats System
