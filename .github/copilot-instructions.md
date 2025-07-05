# Copilot Instructions

## How We Work: The Core Philosophy

Our goal is to build robust, maintainable features with a consistent and predictable workflow. Follow these core principles above all else.

### 1. One Feature at a Time

- We work on one and only one feature from start to finish.
- Do not make changes unrelated to the current feature. This keeps our commits focused and our work testable.

### 2. The Feature Development Cycle

Every new feature **must** follow this specific, sequential order. Do not skip or reorder steps. Each step must be completed before starting the next.

- Features have multiple tasks. Read **all** feature tasks before starting any work.
- Features are not complete until tests are written and pass. ALL tests must pass before merging.

### 3. Document Key Decisions

- To ensure consistency, we document important architectural patterns and decisions.
- When you encounter a situation with multiple valid approaches, make a decision, and then **document it following [self-improve.instructions.md](./instructions/self-improve.instructions.md)**.

---

## Guiding Principles

These are the fundamental rules that support our development process.

### Search First, Code Second

- **DRY (Don't Repeat Yourself) is our most important code quality rule.**
- **Before writing any code**, search the repository for existing implementations. Look for reusable components, utilities, and types.
- Use semantic search for concepts (`"How is authentication handled?"`) and lexical search for specifics (`symbol:UserValidator`).

### Single Source of Truth for Types

- **NEVER duplicate types.** SvelteKit server modules are the single source of truth.
- Client-side code **MUST** import all API and data types directly from server modules (`+page.server.ts`, `+layout.server.ts`, API routes).
- This is critical for maintaining end-to-end type safety. If you have a type error, fix it by importing the correct type from the server side.

### Rigorous, Layered Testing

- **Testing is a required step for user features.** E2E tests are required for all user-facing features.
- Our primary focus is on **integration tests** that use real database connections and make real HTTP requests.
- Business logic should be imported into tests, **never copied or reimplemented**.
