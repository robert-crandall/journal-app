# Copilot Instructions

## How We Work: The Core Philosophy

Our goal is to build robust, maintainable features with a consistent and predictable workflow. Follow these core principles above all else.

### 1. One Feature at a Time

- We work on one and only one feature from start to finish.
- Do not make changes unrelated to the current feature. This keeps our commits focused and our work testable.

### 2. The Feature Development Cycle

Every new feature **must** follow this specific, sequential order. Do not skip or reorder steps. Each step must be completed before starting the next.

1.  **Database Schema & Migration**: Define the schema changes in Drizzle, then generate and apply the database migration.
2.  **Backend API & Type Export**: Implement the Hono endpoints and business logic. Ensure all necessary types are exported for the frontend.
3.  **Backend Integration Tests**: Write tests to validate the new API, logic, and database interactions.
4.  **All backend tests must pass before moving on.** Run `bun run test` in backend
5.  **Frontend Implementation**: Build the SvelteKit components, importing types directly from the backend to ensure type safety.
6.  **Frontend E2E Tests**: Write end-to-end tests that simulate user interaction and verify the feature works from the browser to the database.
7.  **All frontend tests must pass before finalizing the feature.** Run `bun run test:e2e` in frontend
8.  **Test entire feature**: Run `bun run test` to validate the complete feature.
9.  **DELETE OLD CODE**: Never consider backwards compatibility. Never keep deprecated components. Delete old code.

Backend and Frontend can be checked with `bun run check` in the appropriate directory. Run this command whenever you make changes.

### 3. Document Key Decisions

- To ensure consistency, we document important architectural patterns and decisions.
- **Example**: If you decide that API endpoints should always get the `UserID` from the JWT token rather than a query parameter, document this rule so we apply it everywhere.

---

## Guiding Principles

These are the fundamental rules that support our development process.

### Search First, Code Second

- **DRY (Don't Repeat Yourself) is our most important code quality rule.**
- **Before writing any code**, search the repository for existing implementations. Look for reusable components, utilities, and types.
- Use semantic search for concepts (`"How is authentication handled?"`) and lexical search for specifics (`symbol:UserValidator`).

### Single Source of Truth for Types

- **NEVER duplicate types.** The backend is the single source of truth.
- The frontend **MUST** import all API and data types directly from the backend project.
- This is critical for maintaining end-to-end type safety. If you have a type error, fix it by importing the correct type.

### Rigorous, Layered Testing

- **Testing is a required step for every layer.** No feature is complete until it is fully tested according to the development cycle.
- Our primary focus is on **integration tests** that use real database connections and make real HTTP requests.
- Business logic should be imported into tests, **never copied or reimplemented**.

---

## Common Commands

Note: Always `cd` to the full path before running these commands.

- **Start backend and frontend server**: `bun run dev:force`
- **Run backend and frontend tests**: `bun run test`
- **Run backend tests**: `bun run test:backend`
- **Run E2E tests**: `bun run test:e2e`
- **Migrate databases for test**: This is not needed when running backend tests. `NODE_ENV=test bun run db:setup`
- **Reset database**: `NODE_ENV=test bun run db:reset`
