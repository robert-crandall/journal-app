# Journal App Backend

A RESTful API backend for the personal journaling application built with Hono, TypeScript, Drizzle ORM, and PostgreSQL.

## 🚀 Quick Start

1. **Setup Environment**
   ```bash
   ./setup.sh
   ```
   Then update `.env` with your actual credentials.

2. **Start PostgreSQL**
   Make sure you have a PostgreSQL database running and accessible.

3. **Run Migrations**
   ```bash
   bun run db:generate  # Generate migration files
   bun run db:migrate   # Apply migrations to database
   ```

4. **Start Development Server**
   ```bash
   bun run dev
   ```

## 📡 API Endpoints

### Authentication

#### `POST /api/auth/register`
Register a new user.
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### `POST /api/auth/login`
Login with existing credentials.
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### `GET /api/auth/me`
Get current user info (requires Bearer token).

### Journal Management

All journal endpoints require authentication via `Authorization: Bearer <token>` header.

#### `POST /api/journal/start`
Start a new journal session.
```json
Response: {
  "session_id": "uuid",
  "started_at": "timestamp"
}
```

#### `POST /api/journal/reply`
Add a message to journal conversation.
```json
{
  "session_id": "uuid",
  "message": "Today was a great day..."
}
```

#### `POST /api/journal/submit`
Finalize and compile journal entry.
```json
{
  "session_id": "uuid"
}
```

#### `GET /api/journal/list`
Get list of user's journal entries.

#### `GET /api/journal/entry/:id`
Get specific journal entry with full details.

#### `PATCH /api/journal/entry/:id`
Update journal entry fields.
```json
{
  "title": "New Title",
  "summary": "Updated summary",
  "finalizedText": "Updated content"
}
```

## 🗄️ Database Schema

### Users
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password_hash` (String)
- `created_at` (Timestamp)

### Journal Sessions
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `started_at` (Timestamp)
- `submitted_at` (Timestamp, nullable)
- `finalized_text` (Text, nullable)
- `title` (String, nullable)
- `summary` (Text, nullable)
- `full_summary` (Text, nullable)

### Journal Messages
- `id` (UUID, Primary Key)
- `session_id` (UUID, Foreign Key)
- `role` (Enum: 'user' | 'gpt')
- `content` (Text)
- `created_at` (Timestamp)

### Journal Tags
- `id` (UUID, Primary Key)
- `name` (String, Unique)

### Journal Entry Tags (Junction Table)
- `journal_id` (UUID, Foreign Key)
- `tag_id` (UUID, Foreign Key)

## 🧠 GPT Integration

The app uses OpenAI's GPT-4 for:
- **Conversation Flow**: Generating empathetic follow-up questions
- **Journal Compilation**: Creating cohesive entries from conversations
- **Metadata Extraction**: Generating titles, summaries, and tags

## 🔧 Environment Variables

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/journal_app"
AUTH_SECRET="your-super-secret-jwt-key"
OPENAI_API_KEY="your-openai-api-key"
PORT=3001
NODE_ENV="development"
```

## 🛠️ Development Scripts

```bash
bun run dev           # Start development server
bun run db:generate   # Generate database migrations
bun run db:migrate    # Apply migrations
bun run db:studio     # Open Drizzle Studio
```

## 🏗️ Architecture

- **Framework**: Hono (ultrafast web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcrypt password hashing
- **AI Integration**: OpenAI GPT-4
- **Validation**: Zod schemas
- **Runtime**: Bun

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation with Zod
- CORS configuration
- SQL injection protection via Drizzle ORM
- User session isolation

## 📝 Error Handling

The API returns consistent error responses:
```json
{
  "error": "Error message",
  "details": "Additional context (in development)"
}
```

HTTP status codes used:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
