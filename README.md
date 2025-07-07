# Gamified Life RPG

A full-stack TypeScript application that turns personal development into an engaging RPG experience.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: tRPC, Drizzle ORM
- **Database**: PostgreSQL
- **Authentication**: Lucia
- **UI**: Material UI v7
- **Testing**: Playwright
- **Validation**: Zod

## Features

- ✅ User authentication (register, login, logout)
- ✅ Dark/Light/System theme switching  
- ✅ Responsive Material UI design
- ✅ Type-safe end-to-end with tRPC
- ✅ Session management with Lucia
- 🚧 Character creation and stats system
- 🚧 Daily quest generation with AI
- 🚧 Journaling and reflection features

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd journal-app
   bun install
   ```

2. **Set up PostgreSQL database:**
   ```bash
   # Create database (adjust username/password as needed)
   createdb journal_app
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Run database migration:**
   ```bash
   bun run db:generate
   bun run db:migrate
   ```

5. **Start development server:**
   ```bash
   bun run dev
   ```

6. **Run tests:**
   ```bash
   bun run test
   ```

## Database Commands

- `bun run db:generate` - Generate migration files
- `bun run db:migrate` - Run pending migrations  
- `bun run db:studio` - Open Drizzle Studio

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── lib/                 # Utilities, auth, database
├── server/api/          # tRPC routers and procedures  
└── trpc/               # Client-side tRPC setup

copilot/                # Product requirements and roadmap
tests/                  # E2E tests with Playwright
```

## Authentication Flow

1. Users can register with email/password
2. Login creates a secure session with Lucia
3. Protected routes redirect to login if not authenticated
4. Session persists across browser restarts
5. Logout invalidates session and redirects

## Theme System

- **Light Mode**: Clean, professional appearance
- **Dark Mode**: Easy on the eyes for extended use
- **System Mode**: Follows OS preference automatically
- Preference saved in localStorage
- Smooth transitions between themes

## Development Guidelines

- Type safety is enforced end-to-end
- Use tRPC for all API communication
- Zod schemas define data validation
- Material UI provides consistent styling
- E2E tests cover critical user flows

---

Built with ❤️ for personal growth and adventure!
