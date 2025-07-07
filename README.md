# LifeRPG - Gamified Personal Development App

A full-stack TypeScript application that turns personal development into a gamified, D&D-style experience with AI-powered task generation and character progression.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: tRPC, Drizzle ORM, PostgreSQL
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS 4, DaisyUI
- **Validation**: Zod
- **Testing**: Playwright (E2E)
- **Package Manager**: Bun

## Features

### Phase 1 (Implemented)
- ✅ User authentication (sign up, sign in, sign out)
- ✅ Character creation with class and backstory
- ✅ Basic todo/task system with XP rewards
- ✅ Stats tracking and leveling
- ✅ Dark/light/system theme support
- ✅ Clean Material Dashboard UI

### Planned Features
- AI Dungeon Master for daily task generation
- Family member integration for relationship quests
- Conversational journaling with AI analysis
- Long-term Quests and Experiments
- Weather API integration
- Advanced dashboard with XP animations

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- PostgreSQL database running
- Node.js 18+ (for compatibility)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd journal-app
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/journal_app"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

4. Generate and run database migrations:
```bash
bun run db:generate
bun run db:migrate
```

5. Start the development server:
```bash
bun dev
```

6. Visit [http://localhost:3000](http://localhost:3000)

## Development

### Database Commands

```bash
# Generate new migrations after schema changes
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Open Drizzle Studio (database GUI)
bun run db:studio
```

### Testing

```bash
# Run E2E tests
bun run test

# Run tests with UI
bun run test:ui
```

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── auth/           # Authentication pages
│   ├── character/      # Character management
│   └── api/            # API routes (tRPC, NextAuth)
├── components/         # Reusable React components
├── lib/                # Shared utilities
│   ├── db/             # Database schema and connection
│   ├── trpc/           # tRPC setup and router
│   ├── auth.ts         # NextAuth configuration
│   └── schemas.ts      # Zod validation schemas
└── types/              # TypeScript type definitions
```

## Design System

This app uses a "Clean Material Dashboard" design system optimized for desktop-first productivity interfaces:

- **Primary Color**: `#6200ea` (deep purple)
- **Secondary Color**: `#D700EA` (pinkish purple)  
- **Accent Color**: `#0013EA` (blue)
- **Layout**: 4-column responsive grid with contextual sidebars
- **Components**: Elevated cards, subtle gradients, micro-animations
- **Typography**: Clean hierarchy with proper contrast ratios

See `/.github/instructions/material-design.instructions.md` for detailed guidelines.

## Contributing

1. Follow the established patterns for tRPC procedures and React components
2. Use Zod schemas for all data validation
3. Maintain type safety across the full stack
4. Write E2E tests for critical user flows
5. Follow the Material Design guidelines for UI consistency

## License

This project is licensed under the MIT License.
