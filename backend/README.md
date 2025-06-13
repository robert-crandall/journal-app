# Journal App Backend

A Hono-based backend API for the conversational journal application with GPT integration.

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- PostgreSQL database
- OpenAI API key

### Installation

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- `DATABASE_URL`: Your PostgreSQL connection string
- `OPENAI_API_KEY`: Your OpenAI API key
- `JWT_SECRET`: A secure random string for JWT signing

3. Generate database migrations:
```bash
bun run db:generate
```

4. Run database migrations:
```bash
bun run db:migrate
```

5. Seed predefined tone tags:
```bash
bun run db:seed
```

6. Start the development server:
```bash
bun run dev
```

The API will be available at `http://localhost:3001`

## 📊 Database

The application uses PostgreSQL with Drizzle ORM. The database schema includes:

- **users**: User accounts with authentication
- **character_stats**: RPG-style stats for personal development tracking
- **experiments**: Self-improvement experiments/quests
- **daily_tasks**: Daily checklist items for experiments
- **journal_entries**: Conversational journal entries with GPT integration
- **content_tags**: User-generated topic tags
- **tone_tags**: Predefined mood/emotion tags
- **Various junction tables**: For many-to-many relationships

## 🛠️ Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run db:generate` - Generate database migrations
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed predefined tone tags
- `bun run db:studio` - Open Drizzle Studio for database management

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update current user
- `DELETE /api/auth/me` - Delete current user

### Character Stats
- `POST /api/character-stats` - Create character stat
- `GET /api/character-stats` - Get user's character stats
- `GET /api/character-stats/:id` - Get specific character stat
- `PUT /api/character-stats/:id` - Update character stat
- `DELETE /api/character-stats/:id` - Delete character stat

### Experiments
- `POST /api/experiments` - Create experiment
- `GET /api/experiments` - Get user's experiments
- `GET /api/experiments/:id` - Get specific experiment
- `PUT /api/experiments/:id` - Update experiment
- `DELETE /api/experiments/:id` - Delete experiment
- `GET /api/experiments/:id/tasks` - Get experiment's daily tasks
- `POST /api/experiments/:id/tasks` - Complete/update daily task
- `GET /api/experiments/:id/tasks/range` - Get tasks in date range

### Journal
- `POST /api/journal` - Create journal entry
- `GET /api/journal` - Get user's journal entries
- `GET /api/journal/:id` - Get specific journal entry with full details
- `POST /api/journal/:id/continue` - Continue conversation for journal entry
- `PUT /api/journal/:id` - Update journal entry
- `DELETE /api/journal/:id` - Delete journal entry

### Tags
- `POST /api/tags/content` - Create content tag
- `GET /api/tags/content` - Get user's content tags
- `DELETE /api/tags/content/:id` - Delete content tag
- `GET /api/tags/tone` - Get all predefined tone tags

## 🔐 Authentication

The API uses JWT bearer tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🤖 GPT Integration

The journal system uses OpenAI's GPT-4 for:

1. **Conversational prompting**: Generating follow-up questions to deepen reflection
2. **Insight extraction**: Automatically extracting structured insights from conversations:
   - Title (6-10 words)
   - Summary (narrative rewrite in user's voice)
   - Synopsis (1-2 sentence overview)
   - Content tags (topic-based)
   - Tone tags (mood-based from predefined set)
   - Character tags (personal growth stats used/developed)

## 🏗️ Architecture

- **Framework**: Hono (ultrafast web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcryptjs password hashing
- **Validation**: Zod schemas
- **AI Integration**: OpenAI GPT-4
- **TypeScript**: Full end-to-end type safety

## 🚀 Deployment

1. Build the application:
```bash
bun run build
```

2. Set production environment variables

3. Run migrations in production:
```bash
bun run db:migrate
```

4. Start the production server:
```bash
bun run start
```

## 📝 Development Notes

- All UUIDs are v4
- All dates are timezone-aware (stored in UTC)
- Password hashing uses bcryptjs with 12 salt rounds
- XP system awards 5 XP per journal entry for associated character stats
- Conversation completion triggers automatic insight extraction
- Content tags are user-specific, tone tags are global predefined set

open http://localhost:3000
