# Journal App - Copilot Instructions

## Project Overview
This is a personal journaling application built with SvelteKit (frontend) and Hono (backend) using modern web technologies.

## Architecture
- **Frontend**: SvelteKit with TypeScript, Tailwind CSS 4, and daisyUI 5
- **Backend**: Hono with TypeScript, Drizzle ORM, and Postgres
- **Runtime**: Bun for package management and execution

## General Coding Standards

### Core Principles
- **Clarity Over Cleverness**: Write self-explanatory code, prioritize readability
- **Explicit > Implicit**: Make dependencies and behaviors visible, avoid magic
- **Single Responsibility**: Functions and modules should do one thing well
- **Separation of Concerns**: Organize by layer (routing, services, models)
- **Predictability**: Build consistent APIs with standard patterns
- **Low Coupling, High Cohesion**: Simple interfaces, avoid tight dependencies
- **Be Replaceable**: Design modules that can be swapped with minimal refactor

### Code Style
- Use TypeScript for all new code
- Follow functional programming principles where possible
- Use meaningful variable and function names
- Add comments for complex business logic
- Prefer immutable data patterns
- Default to simple solutions that can evolve over time

### Error Handling
- Use try/catch blocks for async operations
- Implement proper error boundaries where applicable
- Always log errors with contextual information
- Provide user-friendly error messages
- Use meaningful HTTP status codes and standardize error shapes

### File Organization
- Group by domain, then layer (e.g., `auth/controller`, `auth/service`)
- Keep components and route files thin
- Use index files for clean imports
- Separate business logic from UI components
- Push logic down to services, keep routes minimal

## Project-Specific Guidelines

### Database
- Use Drizzle ORM for all database operations
- Follow the existing schema patterns in `backend/src/db/schema.ts`
- Always handle database migrations properly
- Use transactions for multi-step operations
- Keep database logic in services or models only

### API Design
- Follow RESTful conventions for endpoints
- Use Hono's built-in validation and middleware
- Return consistent response formats
- Handle authentication and authorization properly
- Validation belongs at the route/controller layer
- Keep route files thin, push business logic to services
- Design for traceability: "What happens when X?" should be answerable quickly

### Frontend Development
- Use SvelteKit's file-based routing
- Leverage Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Follow component composition patterns
- Use the existing API client in `frontend/src/lib/api.ts`

### Styling
- Use Tailwind CSS 4 utilities for styling
- Leverage daisyUI 5 components when appropriate
- Follow mobile-first responsive design
- Maintain consistent spacing and typography

## Authentication & Security
- Use secure session management
- Validate all user inputs
- Implement proper CORS handling
- Follow security best practices for sensitive data

## Instruction files

- Use `.github/instructions/` for project-specific guidelines
