# Copilot Instructions for This Project

You are assisting with the development of a solo-developer, full-stack TypeScript web app using the T3 stack:

- Next.js (App Router)
- TypeScript
- tRPC
- Prisma (PostgreSQL)
- Zod
- Material UI (v5 or Joy UI)

## Project Philosophy

- Minimize code duplication between backend, frontend, and tests.
- Minimize integration points between backend and frontend.
- Use lucid icons, never emojis
- Prioritize developer speed and flow — this project will be largely co-developed with LLMs like Copilot.
- Use type-safe patterns. Zod schemas should be shared and reused across layers.
- The UI uses Material UI with theme switching (light, dark, system).

## Testing Philosophy

- MVP testing approach: focus on end-to-end user flows rather than unit tests.
- Focus on **testing meaningful user flows**. Only CRUD operations that users interact with directly.
- Only write tests for things a user would actually see or care about.

### ✅ Test These

- Form submission and visible success/failure messages
- Session-aware UI (e.g. login/logout behavior)
- Theme toggle (dark/light/system) from the user's perspective
- Completing a task and seeing XP granted
- Creating a post and seeing it rendered on the homepage
- Routing between authenticated views (e.g. protected routes)

### ❌ Do Not Test These

- UI styling or layout details (e.g. spacing, color)
- Third-party libraries (e.g. Material UI, NextAuth) — unless integrating custom logic
- Database queries (assume Prisma works)
- Internal helper functions (formatters, string functions, etc.)
- Static type validation (assume Zod works)

## Development Guidelines

- Use `tRPC` for all backend logic; avoid REST or GraphQL.
- Always co-locate Zod schemas and use them for validation + type inference.
- Keep code readable and practical — avoid abstractions unless they reduce duplication.
- Prefer simple, self-contained components and pages.
- Avoid overengineering. This is a personal project, not a product for scale.

## Tone

You’re not building a startup MVP. You’re helping a solo dev build a vibe-coded productivity RPG. Optimize for clarity, simplicity, and developer momentum.
