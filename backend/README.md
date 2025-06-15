# Journal App Backend

A TypeScript-based backend for the Journal App, a chat-first life coaching application with conversational AI assistant. Built with Hono, PostgreSQL, and Drizzle ORM.

## Features

- User authentication with JWT
- CRUD operations for quests, experiments, tasks, journal entries, and character stats
- AI-powered conversation assistant using OpenAI
- Type-safe API client for frontend integration
- RESTful API with proper validation and error handling
- Task management
- Character stats and XP tracking
- Family member tracking
- Conversational AI assistant

## Tech Stack

- [Hono](https://hono.dev) - Lightweight web framework
- [PostgreSQL](https://www.postgresql.org) - Database
- [Drizzle ORM](https://orm.drizzle.team) - Type-safe SQL query builder
- [OpenAI](https://openai.com) - AI integration
- [Zod](https://zod.dev) - Schema validation
- [Bun](https://bun.sh) - JavaScript runtime

## Setup

1. Clone the repository
2. Install dependencies:
   ```sh
   cd backend
   bun install
   ```
3. Create a `.env` file based on `.env.example`:
   ```sh
   cp .env.example .env
   ```
4. Update the `.env` with your own values
5. Start a PostgreSQL database (locally or using a cloud service)
6. Generate and run migrations:
   ```sh
   bun run db:generate
   bun run db:migrate
   ```
7. Run the development server:
   ```sh
   bun run dev
   ```

## API Client

The backend exports a typed client that can be used in the frontend to make API requests. This ensures end-to-end type safety between the frontend and backend.

### Example usage:

```typescript
import { JournalClient } from 'backend';

const client = new JournalClient('http://localhost:3000');

// Login
const { user, token } = await client.login({
  email: 'user@example.com',
  password: 'password123'
});

// Set token for authenticated requests
client.setToken(token);

// Get all quests
const { quests } = await client.getQuests();
```

## Test Client

The project includes a test client that demonstrates how to use the API. You can run it with:

```sh
RUN_TESTS=true bun run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `GET /api/me` - Get current user info

### Quests
- `GET /api/quests` - Get all quests
- `GET /api/quests/:id` - Get a specific quest with milestones
- `POST /api/quests` - Create a new quest
- `PUT /api/quests/:id` - Update a quest
- `POST /api/quests/:id/complete` - Complete a quest
- `DELETE /api/quests/:id` - Delete a quest
- `POST /api/quest-milestones` - Create a quest milestone
- `POST /api/quest-milestones/:id/complete` - Complete a milestone

### Journal
- `GET /api/journal` - Get all journal entries
- `GET /api/journal/:id` - Get a specific journal entry
- `POST /api/journal` - Create a journal entry
- `PUT /api/journal/:id` - Update a journal entry
- `DELETE /api/journal/:id` - Delete a journal entry
- `POST /api/journal/analyze` - Analyze a journal entry with AI

### Experiments
- `GET /api/experiments` - Get all experiments
- `GET /api/experiments/:id` - Get a specific experiment
- `POST /api/experiments` - Create a new experiment
- `PUT /api/experiments/:id` - Update an experiment
- `POST /api/experiments/:id/complete` - Complete an experiment (with success/failure status)
- `DELETE /api/experiments/:id` - Delete an experiment

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `POST /api/tasks/:id/complete` - Complete a task (awards XP to character stats)
- `DELETE /api/tasks/:id` - Delete a task

### Character Stats
- `GET /api/character-stats` - Get all character stats
- `GET /api/character-stats/:id` - Get a specific character stat
- `POST /api/character-stats` - Create a new character stat
- `PUT /api/character-stats/:id` - Update a character stat
- `DELETE /api/character-stats/:id` - Delete a character stat

### Conversations (AI Assistant)
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get a specific conversation with messages
- `POST /api/conversations` - Create a new conversation
- `PUT /api/conversations/:id` - Update a conversation
- `DELETE /api/conversations/:id` - Delete a conversation
- `POST /api/conversations/message` - Send a message and get AI response
- `GET /api/user-context` - Get user context for AI
- `POST /api/user-context` - Set user context for AI
- `DELETE /api/user-context/:key` - Delete user context

## Database Schema

The database schema includes tables for:
- Users
- Character stats
- Family members
- Tags
- Quests and milestones
- Experiments
- Tasks
- Journal entries
- Conversations with AI

## License

MIT License

open http://localhost:3000
