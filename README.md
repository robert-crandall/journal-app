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
- PostgreSQL database (for full functionality)
- Node.js 18+ (for compatibility)

### Quick Start (UI Development Only)

For development and testing the UI without database functionality:

1. Clone the repository:
```bash
git clone <your-repo-url>
cd journal-app
```

2. Install dependencies:
```bash
bun install
```

3. Start the development server:
```bash
bun dev
```

4. Visit [http://localhost:3000](http://localhost:3000)

**Note**: Without database setup, you can explore the UI but authentication and data persistence won't work.

### Full Setup (Database Required)

For complete functionality including authentication and data persistence:

1. **Set up PostgreSQL database:**
```bash
# Create database
createdb journal_app

# Or using PostgreSQL CLI:
psql -c "CREATE DATABASE journal_app;"
```

2. **Configure environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/journal_app"
NEXTAUTH_SECRET="generate-a-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Generate and run database migrations:**
```bash
# Generate migration files from schema
bun run db:generate

# Apply migrations to database  
bun run db:migrate
```

4. **Start the development server:**
```bash
bun dev
```

5. **Test the full flow:**
   - Sign up for a new account
   - Create your character
   - Add some todos and complete them
   - See XP tracking in action

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

#### UI Tests (No Database Required)
```bash
# Run E2E tests for UI components and navigation
bun run test

# Run tests with UI
bun run test:ui
```

**Current E2E Tests Cover:**
- ✅ Landing page display and navigation
- ✅ Auth form UI and client-side validation  
- ✅ Theme toggle functionality
- ✅ Page routing and transitions

**Full Authentication Tests:**
- ❌ Require database setup (currently skipped)
- ❌ Would test complete sign up → sign in → dashboard flow

#### Manual Testing Checklist

Without database:
- [ ] Landing page loads with proper styling
- [ ] Navigation between auth pages works
- [ ] Theme toggle cycles through light/dark/system
- [ ] Form validation shows appropriate error messages

With database:
- [ ] User can sign up successfully
- [ ] User can sign in with correct credentials  
- [ ] User sees character creation prompt
- [ ] Character creation saves and redirects to dashboard
- [ ] Todo creation, completion, and XP tracking works
- [ ] User can sign out and back in

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
