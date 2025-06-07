# Journal App Backend

A Hono-based backend API for the personal development journal application with GPT-powered task generation.

## Features

- **GPT-Generated Daily Tasks**: AI-powered personalized task generation using OpenAI
- **Focus-Based Planning**: Tasks aligned with daily focus areas
- **Family Connection Tasks**: Tasks that promote bonding with family members
- **XP & Leveling System**: Gamified progress tracking with stats and levels
- **Feedback Loop**: User feedback and emotions inform future task generation

## Setup

### Install Dependencies
```sh
bun install
```

### Environment Configuration
Copy the example environment file:
```sh
cp .env.example .env
```

Edit `.env` and add your configuration:
- `OPENAI_API_KEY`: Your OpenAI API key for GPT task generation
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT authentication

### Database Setup
```sh
# Generate and run migrations
bun run db:generate
bun run db:migrate
```

### Development Server
```sh
bun run dev
```

Server runs at http://localhost:3000

## API Endpoints

### Daily Tasks
- `GET /api/tasks/daily` - Get or generate today's personalized tasks
- `POST /api/tasks/:id/complete` - Complete a task with optional feedback and emotion

### Task Completion Schema
```json
{
  "status": "complete|skipped|failed",
  "completionSummary": "Optional summary",
  "feedback": "User feedback for GPT learning",
  "emotionTag": "joy|frustration|satisfaction|etc"
}
```

## GPT Task Generation

The system generates two types of daily tasks:

1. **Primary Task**: Aligned with your daily focus area
2. **Connection Task**: Focused on relationships and emotional well-being

### Task Generation Process

1. Checks if today's tasks already exist
2. If not, gathers user context:
   - Current focus and goals
   - User stats and progress
   - Family member information
   - Recent task history and feedback
3. Sends context to OpenAI GPT-4
4. Generates personalized tasks
5. Saves tasks to database with linked stats for XP

### Fallback Behavior

If OpenAI API is unavailable or not configured, the system falls back to mock task generation to ensure the app remains functional.

## Development

The backend uses:
- **Hono**: Fast web framework
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Primary database
- **OpenAI SDK**: GPT integration
- **Bun**: Runtime and package manager
