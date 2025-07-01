# Copilot Instructions

## Core Principles

### 0. Development Flow
- For new features requiring product planning:
  - Refer to [create-prd.md](./instructions/create-prd.md) to create a PRD first
  - Use [generate-tasks.md](./instructions/generate-tasks.md) to break down the PRD into actionable tasks
  - Use [process-task-list.md](./instructions/process-task-list.md) to manage the task list and track progress
  - Integration tests should be written for each task as it is implemented.
- For new features without a PRD:
  - Use [generate-tasks.md](./instructions/generate-tasks.md) to break down the feature into actionable tasks
  - Use [process-task-list.md](./instructions/process-task-list.md) to manage the task list and track progress
  - Integration tests should be written for each task as it is implemented.
- For bug fixes:
  - Unit tests should be written to reproduce the bug
- For testing:
  - NEVER COPY BUSINESS LOGIC into a test file. Always import the business logic from the original source file.
  - Use [hono.test.instructions.md](./testing/hono.test.instructions.md) when implementing backend features
  - Use [sveltekit.test.instructions.md](./testing/sveltekit.test.instructions.md) when implementing frontend features
- Refer to the [knowledge base](../copilot/knowledge-base.md) for common patterns and practices

### 1. Context and Understanding
- **Always read relevant files first** before making changes
- **DRY (Don't Repeat Yourself)** is highly important. Do not duplicate code, types, or components.
- **SEARCH EXTENSIVELY** for existing implementations before writing new code:
  - Use semantic search: "How is authentication handled?"
  - Use lexical search: `query:content:"validateUser"` or `query:symbol:UserValidator`
  - Check related directories: `lib/`, `utils/`, `components/`, `types/`
- **Map existing patterns**: Understand how similar features are implemented
- **Identify reusable components**: Look for existing solutions before creating new ones
- **Trace type definitions**: Follow imports to understand the single source of truth
- Ask me to show you the codebase structure if you're unfamiliar with the project

### 2. Planning and Implementation (Single-Task Focus)
- **ONE FEATURE AT A TIME**: Never work on multiple features simultaneously
- **Integration-Test-Driven Development**:
  1. Understand the feature requirements completely
  2. Write integration test that makes real API calls BEFORE implementation
  3. Implement feature to make the test pass
  4. Verify all existing tests still pass
  5. Only then consider the task complete
- Break down complex features into smaller, testable increments
- Consider edge cases, error handling, and performance implications in tests
- Think about backwards compatibility and migration paths

### 3. Deep Thinking and Quality
- Use "think hard" or "ultrathink" when I need particularly thoughtful solutions
- Take time to consider multiple approaches and trade-offs
- Don't rush to the first solution - explore alternatives
- Consider the broader implications of changes across the codebase

## Testing Strategy (Integration-First Approach)

### Overall Testing Philosophy
- **Integration-First**: Primary testing through real HTTP requests and database operations
- **Test-Driven Development**: Write integration tests BEFORE implementing features
- **Real over Mock**: Use actual API calls, database operations, and user interactions
- **NO BUSINESS LOGIC IN TESTS**: Import and use actual business logic, never reimplement
- **Single Feature Focus**: Test one complete feature at a time before moving to the next

### Testing Requirements by Layer

#### Backend (Hono) Integration Tests
- See [hono.test.instructions.md](./testing/hono.test.instructions.md) for detailed guidance
- Use Hono's testing utilities with real HTTP requests (not mocked)
- Test complete request/response cycle including middleware
- Include proper database setup/teardown using Drizzle
- Test authentication, validation, and error handling in real scenarios
- Verify actual database state changes after operations

#### Frontend (SvelteKit) Integration Tests
- See [sveltekit.test.instructions.md](./testing/sveltekit.test.instructions.md) for detailed guidance
- Test form submissions with an actual browser environment
- Verify loading states and error handling from real API responses
- Test routing and navigation behavior

#### Test Completion Criteria
- New feature integration test passes
- ALL existing tests still pass (no regressions)
- Feature works end-to-end with real browser interactions
- Database operations are properly tested with actual data
- No mock data or fake responses used in tests

### Key Testing Principles
- **Real Database Operations**: Test with actual database connections, not mocks
- **Type-Safe Testing**: Leverage Hono's type system for frontend-backend integration
- **One Feature at a Time**: Never work on multiple features simultaneously
- **Test Data Management**: Use proper test database setup/teardown between tests
- **Never Modify Existing Tests**: Unless specifically requested or broken by intentional changes
- **Frequent Test Running**: Run tests continuously during development

### Feature Development Workflow
1. **Understand Requirements**: Break down feature into testable increments
2. **Write Integration Test FIRST**: Create test that makes real HTTP requests to test the feature
3. **Implement Feature**: Write code to make the integration test pass
4. **Verify All Tests Pass**: Ensure no regressions in existing functionality
5. **Complete Feature**: Only move to next feature when current is fully tested and working

## Code Quality Standards

### Code Style and Conventions
- Follow the existing code style and patterns in the project
- Use consistent naming conventions
- Write clear, self-documenting code with meaningful variable names
- Add comments for complex logic or business rules
- Follow language-specific best practices and idioms

### Error Handling and Robustness
- Implement proper error handling and validation
- Consider what could go wrong and handle those cases gracefully
- Use appropriate logging levels and meaningful error messages
- Don't ignore errors or use generic catch-all handlers

### Code Reuse and Maintainability
- **Single Source of Truth**: Every piece of logic, type, or component should have ONE authoritative location
- **Import Over Duplicate**: Always import existing code rather than duplicating it
- **Extend Over Rewrite**: Extend existing functionality rather than creating new implementations
- **Abstract Common Patterns**: When you see repeated code, immediately extract it to shared utilities
- **Consistent Import Paths**: Use consistent import patterns across the codebase
  - Types: Import from backend or shared type locations
  - Utilities: Import from `lib/utils/` or `backend/utils/`
  - Components: Import from `lib/components/`
- **Dependency Injection**: Use dependency injection patterns to avoid tight coupling

## DRY and Code Reuse Principles

### Before Writing New Code
- **SEARCH FIRST**: Always search the codebase for existing implementations before writing new code
- Use semantic code search to find similar functionality: "How is [functionality] implemented?"
- Use lexical search to find specific patterns: `query:content:"function namePattern"`
- Check for existing components, utilities, types, and patterns
- Look in `lib/`, `utils/`, `components/`, and `shared/` directories first

### Type Sharing and Imports
- **Frontend MUST import types directly from backend**: `import type { UserType } from '../backend/types'`
- **Never duplicate type definitions** - maintain single source of truth in backend
- Use Hono stacks for end-to-end type safety
- Import shared utilities and constants from their original location
- Create shared types in `backend/types/` for cross-cutting concerns

### Component and Utility Reuse
- **Before creating new components**: Search for existing components with similar functionality
- **Before writing utility functions**: Check `lib/utils/` and `backend/utils/` for existing implementations
- **Extend existing components** rather than creating new ones when possible
- **Abstract common patterns** into reusable utilities
- Use composition over duplication for component variations

### Copy/Paste is Forbidden
- **NEVER copy/paste code** - this breaks maintainability and type safety
- **NEVER duplicate logic** - extract to shared utilities instead
- **NEVER duplicate types** - import from single source of truth
- **NEVER duplicate components** - extend or compose existing ones
- **NEVER rewrite interfaces** - always import types directly from backend
- If you find yourself copying or duplicating code, stop and refactor into reusable abstractions

### Critical Type Safety Rule
- **ALWAYS import types directly from backend** - `import type { UserType } from '../../backend/src/db/schema'`
- **NEVER rewrite or duplicate type definitions** in frontend
- **NEVER create custom interfaces** that duplicate backend types
- **Fix typing issues by importing from backend** - do not create workarounds
- The backend is the single source of truth for all data types
- Frontend must directly import and use backend types to maintain end-to-end type safety

### Refactoring for DRY
- When you identify duplicate code, immediately refactor it into shared utilities
- Extract common patterns into reusable functions or components
- Move shared logic to appropriate locations (`lib/`, `utils/`, `shared/`)
- Update imports across the codebase when refactoring

## Development Workflow

### File Management (Single-Feature Focus)
- **Work on ONE feature at a time** - never make changes for multiple features simultaneously
- Make targeted, focused changes for the current feature only
- Keep related changes together in logical commits per feature
- Don't modify unrelated files unless necessary for the current feature
- **Test-First Rule**: Always write integration test before implementing feature

### Debugging and Problem Solving
- Start by understanding the problem thoroughly
- Reproduce issues when possible
- Use systematic debugging approaches
- Check logs, error messages, and stack traces carefully
- Test fixes thoroughly before considering them complete

## Collaboration Guidelines

### Communication Style
- Ask clarifying questions when requirements are unclear
- Explain your reasoning and approach
- Suggest alternatives when you see potential issues
- Be honest about limitations or uncertainties
- Provide context for your recommendations

## Backend Technology Stack (Hono + PostgreSQL + Drizzle)

### Technology Stack
- **Backend Framework**: Hono (prefer first-party middleware)
- **Database**: PostgreSQL with Drizzle ORM
- **Type Safety**: Hono stacks for end-to-end type safety. See [Hono Stacks](https://hono.dev/docs/concepts/stacks) for more details.
- **Middleware**: Use Hono's built-in middleware (JWT, logging, CORS) over third-party alternatives
  - **JWT**: See [middleware/jwt](https://hono.dev/docs/middleware/builtin/jwt) and [helpers/jwt](https://hono.dev/docs/helpers/jwt) for authentication
- **Project Structure**: Monorepo with backend/ folder containing the Hono API
- **Frontend Integration**: Frontend can directly import from Hono stacks for type-safe API calls

### Hono Best Practices

- See [hono.instructions.md](./instructions/hono.instructions.md) for detailed Hono best practices
- See [hono.llms.md](./references/hono.llms.md) for complete Hono documentation

#### Middleware Usage
- **Always prefer Hono first-party middleware** over external libraries
- Use `hono/jwt` for JWT authentication
- Use `hono/logger` for request logging
- Use `hono/cors` for CORS handling
- These are all built in. Sample import:
```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'
```
- Chain middleware in logical order (auth, logging, CORS, etc.)
- Create custom middleware for cross-cutting concerns specific to the app

#### API Structure and Routing
- Group related routes using `app.route()` for better organization
- Use nested routing for complex API structures
- Implement proper HTTP status codes and response formats
- Leverage Hono's built-in validation and error handling
- Use route-specific middleware where appropriate

#### Type Safety with Hono Stacks
- Define API types using Hono's type system
- Export types from backend for frontend consumption
- Use `hc` (Hono client) for type-safe API calls from frontend
- Maintain strict TypeScript configuration
- Define response schemas and validate them

### Database and Drizzle Best Practices

#### Schema Design
- Use Drizzle's schema definition for all database models
- Implement proper relationships using Drizzle's relational queries
- Use migrations for all schema changes
- Include proper indexes for performance-critical queries
- Use TypeScript enums for database enums when appropriate

#### Query Patterns
- Use Drizzle's query builder for complex queries
- Implement proper transaction handling for multi-step operations
- Use prepared statements for frequently-executed queries
- Implement proper connection pooling
- Use Drizzle's relationship queries instead of manual joins when possible

#### Database Connection Management
- Use environment variables for database configuration
- Implement proper connection pooling
- Handle database connection errors gracefully
- Use transactions for data consistency
- Implement proper database seeding for development/testing

### Development Environment
- **Bun**: Use version 1.2.x for development
- **Package Manager**: bun
- **TypeScript**: Strict mode enabled
- **Database**: PostgreSQL running in Docker
- **Environment Variables**: Use .env files for local development
- **Hot Reload**: Leverage Hono's development server features

### Monorepo Conventions
- Keep backend code in `backend/` directory
- Export types and client utilities from backend for frontend use
- Use consistent import paths across the monorepo
- Implement shared utilities in a common location
- Use workspace-level scripts for common operations

### API Design Patterns
- Follow RESTful conventions where appropriate
- Use consistent response formats across endpoints
- Implement proper error handling and status codes
- Use middleware for authentication, validation, and logging
- Group related functionality into route modules
- Use Hono's context for request-scoped data

---

## Frontend Framework Guidelines

### SvelteKit Best Practices (SPA Deployment)

- See [svelte5.instructions.md](./instructions/svelte5.instructions.md) for SvelteKit best practices
- See [sveltekit.llms.md](./references/sveltekit.llms.md) for complete SvelteKit documentation

#### Deployment Configuration
- **Target**: Single Page Application (SPA) deployment using `@sveltejs/adapter-static`
- Configure `svelte.config.js` with `adapter: adapter({ fallback: 'index.html' })`
- Set `prerender` to false for dynamic routes that need client-side routing
- Use `ssr: false` in `+layout.ts` or specific pages when full SPA behavior is needed

#### Project Structure and Organization
- Use SvelteKit's file-based routing system effectively for SPA navigation
- Organize components in logical directories (lib/components/, routes/, etc.)
- Use `+page.svelte` for routes and `+layout.svelte` for shared layouts
- Keep stores in `lib/stores/` and utilities in `lib/utils/`
- Use `$lib` alias for clean imports throughout the project

#### Type Safety and Integration
- Import types directly from `backend/` using monorepo structure
- Use Hono client (`hc`) for type-safe API calls
- ALL API calls should be made through `hc` for full type safety. ALL API calls should be made through an api client in a centralized location (e.g., `lib/api/`).
- Define proper TypeScript interfaces for component props
- Use SvelteKit's generated types (`$app/` modules) appropriately
- Leverage load functions for server-side data fetching when beneficial

#### State Management
- Use Svelte stores for global state management
- Prefer derived stores for computed values
- Use context API for component-specific shared state
- Implement proper store subscriptions and cleanup
- Use writable stores sparingly - prefer reactive declarations when possible

#### Component Development
- Keep components small and focused on single responsibilities
- Use proper prop validation and default values
- Implement consistent naming conventions for components and props
- Use slots effectively for component composition
- Prefer composition over inheritance patterns

#### Data Fetching and API Integration (SPA Mode)
- Use client-side data fetching in `onMount` or reactive statements for SPA behavior
- Implement proper error handling for API calls with user-friendly error states
- Use Hono client (`hc`) for all API communication with full type safety
- DO NOT CACHE API responses except authentication. The user should know if they are offline.
- Handle loading states and errors gracefully in components
- Consider using load functions only when absolutely necessary (prefer client-side fetching)

#### Responsive Design for iOS and Desktop
- **Mobile-First Approach**: Design for iOS Safari first, then enhance for desktop
- **Viewport Configuration**: Use proper viewport meta tag for iOS compatibility
- **Touch-Friendly UI**: Ensure minimum 44px touch targets for iOS guidelines
- **Safe Areas**: Handle iOS safe areas using CSS env() variables (safe-area-inset-*)
- **Responsive Breakpoints**: Use consistent breakpoints (mobile: <768px, desktop: ≥768px)
- **Flexible Layouts**: Use CSS Grid and Flexbox for responsive layouts
- **Typography Scaling**: Implement responsive typography that works on both platforms
- **Interactive Elements**: Ensure hover states work on desktop, touch states on mobile

#### Progressive Web App (PWA) Implementation
- **Service Worker**: Implement service worker for notifications. Do not implement caching or offline support.
- **Web App Manifest**: Create comprehensive manifest.json for PWA installation
- **iOS PWA Compatibility**: 
  - Use proper apple-touch-icon sizes (180x180px minimum)
  - Set apple-mobile-web-app-capable and apple-mobile-web-app-status-bar-style
  - Ensure standalone display mode works properly on iOS 16+
- **App Installation**: Do not provide instructions for adding to home screen. The users already know this.
- **Splash Screens**: Implement splash screens for iOS
- **Offline Experience**: Offline mode is not required. Do not implement caching or offline support.
- **Push Notifications**: Implement if needed (note iOS limitations for web apps)
- **App-like Navigation**: Use SPA routing to maintain app-like feel without page refreshes

#### Styling and UI System
- Use SvelteKit's scoped styling by default
- Implement consistent design system and component patterns
- Use CSS custom properties for theming and iOS compatibility
- Use Tailwind CSS for styling
- **iOS-Specific Styling**:
  - Handle iOS keyboard behavior and viewport changes
  - Use appropriate iOS-style animations and transitions
  - Implement proper focus states for accessibility
  - Handle iOS Safari quirks (bottom bar, zoom behavior)
- **Desktop Enhancements**:
  - Implement hover states and keyboard navigation
  - Use appropriate cursor styles
  - Consider larger click targets and spacing
- Ensure WCAG accessibility standards for both platforms

#### Performance Optimization (SPA Focus)
- **Bundle Optimization**: Use SvelteKit's code splitting for route-based chunks
- **Lazy Loading**: Implement dynamic imports for non-critical components
- **Asset Optimization**: Optimize images and assets for mobile and desktop viewing
- **Memory Management**: Be careful with store subscriptions and component cleanup
- **iOS Performance**: 
  - Optimize for iOS Safari's memory constraints
  - Use transform/opacity for animations (avoid layout thrashing)
  - Minimize JavaScript bundle size for faster loading on mobile networks
- **Caching Strategy**: Implement effective caching for API responses and static assets
- **Loading States**: Provide immediate feedback for better perceived performance

#### Development Workflow
- Use SvelteKit's hot module replacement effectively
- Implement proper error boundaries and error pages
- Use SvelteKit's built-in dev tools and debugging features
- Test components using Vitest or similar testing framework
- Follow SvelteKit's conventions for environment variables and configuration

#### Deployment and Build (SPA Configuration)
- **Static Adapter**: Configure `@sveltejs/adapter-static` with proper fallback
- **Build Optimization**: Ensure proper minification and asset optimization
- **PWA Assets**: Generate all required PWA icons and splash screens
- **Environment Configuration**: Handle API endpoints for different deployment environments
- **iOS Testing**: Test thoroughly on actual iOS devices and Safari
- **Service Worker Registration**: Ensure proper service worker registration and updates
- **App Store Guidelines**: Follow PWA guidelines for potential App Store submission
- **CDN Deployment**: Configure for static hosting with proper routing fallbacks

---

## Code Discovery Workflow

### Before Implementing Any Feature
1. **Semantic Search**: Search for concepts related to your feature
   - "How is user authentication implemented?"
   - "How are forms validated in this codebase?"
   - "How is data fetching handled?"

2. **Lexical Search**: Search for specific patterns or function names
   - `query:content:"validate" language:typescript`
   - `query:symbol:UserService`
   - `query:path:/.*utils.*/ content:"format"`

3. **Type Discovery**: Find existing type definitions
   - Search for related types: `query:content:"interface User"`
   - Check backend types: `backend/types/` directory
   - Look for Hono stack definitions

4. **Component Discovery**: Find existing UI components
   - Search component directory: `query:path:/.*components.*/`
   - Look for similar UI patterns: `query:content:"button" path:/.*components.*/`
   - Check for shared components: `lib/components/`

### Implementation Decision Tree
1. **Exact match exists**: Use the existing implementation
2. **Similar functionality exists**: Extend or compose the existing solution
3. **Partial match exists**: Extract common parts to shared utilities, extend for specific needs
4. **No match exists**: Create new implementation, but design for reusability

---

## Advanced Techniques

### Security Considerations
- Use Hono's JWT middleware for authentication with proper secret management
- Validate all inputs using Hono's built-in validators or Zod
- Use parameterized queries through Drizzle to prevent SQL injection
- Implement proper CORS policies using hono/cors
- Sanitize user inputs and validate against schema
- Store sensitive configuration in environment variables, never in code

### Maintenance and Refactoring
- Prefer small, incremental improvements over large rewrites
- Do not maintain backwards compatibility. Remove deprecated features and APIs. Everything is backed up in version control and should focus on the current state of the codebase, not on maintaining old features.
- Update dependencies regularly and safely
- Remove dead code and unused imports

## Iteration and Improvement

### Continuous Learning
- Product requirements are in `../copilot/prd-*.md`. Review them to understand the product vision and goals.
- Stay curious about new approaches and technologies
- Learn from mistakes and improve processes
- Keep up with best practices in the relevant technologies
- Share knowledge and learn from team members
- Use the file [knowledge-base.md](../copilot/knowledge-base.md) to document useful patterns, learnings, tips, and tricks
- Read the file [knowledge-base.md](../copilot/knowledge-base.md) to learn about the latest patterns and practices in the codebase

### Feedback Loop

- Run tests frequently during development
- Get early feedback on architectural decisions
- Iterate based on code reviews and user feedback
- Monitor and measure the impact of changes

---

## Usage Notes

When working with me:
1. **Focus on ONE task/feature at a time** - I will not work on multiple features simultaneously
2. **Integration-test-first approach** - I will write tests that make real API calls before implementing
3. **All tests must pass** - I will not consider any task complete until all tests pass
4. **Be specific** about what single feature you want to achieve
5. **Provide context** about the current state and desired outcome for that feature
6. **Ask for explanations** when you want to understand the reasoning behind the test or implementation
7. **Request alternatives** when you want to explore different approaches for the current feature
8. **Give feedback** on what works well and what doesn't

**My Development Process:**
1. Understand the single feature/task requirements
2. Write integration test that makes real HTTP requests to test the feature
3. Implement the feature to make the test pass
4. Verify ALL existing tests still pass
5. Only then consider the feature complete and ready for the next task

Remember: The goal is to build features incrementally with full integration test coverage, ensuring each feature works end-to-end before moving to the next one.
