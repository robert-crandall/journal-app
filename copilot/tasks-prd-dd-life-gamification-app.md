# Tasks: D&D Life Gamification App

## Relevant Files

- `backend/src/db/schema.ts` - Database schema definitions for all entities (users, characters, stats, tasks, journals, etc.)
- `backend/src/db/schema.test.ts` - Integration tests for database schema and relationships
- `backend/src/db/connection.ts` - Database connection setup with Drizzle ORM and schema integration
- `backend/src/db/seed.ts` - Database seeding script with sample data
- `backend/src/env.ts` - Environment variable configuration and validation
- `backend/drizzle.config.ts` - Drizzle migration configuration
- `backend/src/db/migrations/0000_icy_scarlet_spider.sql` - Initial database migration file
- `backend/src/routes/auth.ts` - Authentication routes and user management
- `backend/src/routes/auth.test.ts` - Unit tests for authentication endpoints
- `backend/src/routes/character.ts` - Character creation, stats management, and XP tracking endpoints
- `backend/src/routes/character.test.ts` - Unit tests for character management endpoints
- `backend/src/routes/tasks.ts` - Task management endpoints (CRUD, completion, feedback)
- `backend/src/routes/tasks.test.ts` - Unit tests for task management endpoints
- `backend/src/routes/ai.ts` - AI integration endpoints for task generation and journal processing
- `backend/src/routes/ai.test.ts` - Unit tests for AI integration endpoints
- `backend/src/routes/journal.ts` - Journal system endpoints (conversations, entries, XP extraction)
- `backend/src/routes/journal.test.ts` - Unit tests for journal system endpoints
- `backend/src/services/ai-service.ts` - OpenAI GPT integration service
- `backend/src/services/ai-service.test.ts` - Unit tests for AI service
- `backend/src/services/ai-task-generation-integration.test.ts` - Comprehensive integration tests for AI task generation (Task 4.12)
- `backend/src/services/daily-task-generation-service.ts` - Daily task generation orchestration service
- `backend/src/services/daily-task-generation-service.test.ts` - Unit tests for daily task generation service
- `backend/src/services/ai-context-service.ts` - User context gathering service for AI task generation
- `backend/src/services/ai-context-service.test.ts` - Unit tests for AI context service
- `backend/src/services/scheduled-task-generation-service.ts` - Scheduled task generation for all users
- `backend/src/services/scheduled-task-generation-service.test.ts` - Unit tests for scheduled task generation service
- `backend/src/services/enhanced-task-generation.test.ts` - Integration tests for enhanced AI task features (Tasks 4.7-4.9)
- `backend/src/services/project-context-integration.test.ts` - Integration tests for project context integration (Task 4.10)
- `backend/src/services/weather-service.ts` - Weather API integration service
- `backend/src/services/weather-service.test.ts` - Unit tests for weather service
- `backend/src/utils/xp-calculator.ts` - XP and level progression calculation utilities
- `backend/src/utils/xp-calculator.test.ts` - Unit tests for XP calculation utilities
- `frontend/src/routes/+layout.svelte` - Main app layout with navigation
- `frontend/src/routes/+page.svelte` - Homepage dashboard with tasks and quick journal access
- `frontend/src/routes/+page.test.ts` - Unit tests for homepage dashboard
- `frontend/src/routes/character/+page.svelte` - Character creation and management page
- `frontend/src/routes/character/+page.test.ts` - Unit tests for character page
- `frontend/src/routes/tasks/+page.svelte` - Task management page (ad-hoc tasks)
- `frontend/src/routes/tasks/+page.test.ts` - Unit tests for task management page
- `frontend/src/routes/journal/+page.svelte` - Journal conversation interface
- `frontend/src/routes/journal/+page.test.ts` - Unit tests for journal interface
- `frontend/src/routes/quests/+page.svelte` - Quest and experiment management page
- `frontend/src/routes/quests/+page.test.ts` - Unit tests for quest management page
- `frontend/src/routes/quests/[id]/+page.svelte` - Individual quest/experiment dashboard
- `frontend/src/routes/quests/[id]/+page.test.ts` - Unit tests for quest dashboard
- `frontend/src/lib/components/TaskCard.svelte` - Reusable task display component
- `frontend/src/lib/components/TaskCard.test.ts` - Unit tests for TaskCard component
- `frontend/src/lib/components/XPProgress.svelte` - XP and level display component
- `frontend/src/lib/components/XPProgress.test.ts` - Unit tests for XPProgress component
- `frontend/src/lib/components/StatCard.svelte` - Character stat display component
- `frontend/src/lib/components/StatCard.test.ts` - Unit tests for StatCard component
- `frontend/src/lib/stores/character.ts` - Character state management store
- `frontend/src/lib/stores/character.test.ts` - Unit tests for character store
- `frontend/src/lib/stores/tasks.ts` - Task state management store
- `frontend/src/lib/stores/tasks.test.ts` - Unit tests for task store
- `frontend/src/lib/api/client.ts` - Hono client setup for type-safe API calls
- `frontend/src/lib/api/client.test.ts` - Unit tests for API client
- `frontend/src/lib/utils/date-helpers.ts` - Timezone-aware date utility functions
- `frontend/src/lib/utils/date-helpers.test.ts` - Unit tests for date utilities

### Notes

- Unit tests should typically be placed alongside the code files they are testing
- Use `bun test` to run all tests or `bun test [path]` for specific test files
- Integration tests will make real API calls to test end-to-end functionality
- Backend uses Hono with PostgreSQL and Drizzle ORM
- Frontend uses SvelteKit 5 with type-safe API integration via Hono client

## Tasks

- [x] 1.0 Database Schema and Core Infrastructure Setup
  - [x] 1.1 Set up PostgreSQL database with Drizzle ORM configuration
  - [x] 1.2 Create users table with UUID primary keys
  - [x] 1.3 Create characters table with class, backstory, and user relationships
  - [x] 1.4 Create character_stats table with categories, XP tracking, and level progression
  - [x] 1.5 Create family_members table with names, ages, interests
  - [x] 1.6 Create tasks table supporting multiple sources (AI, quest, experiment, todo, ad-hoc)
  - [x] 1.7 Create task_completions table with feedback and XP awards (loose coupling design)
  - [x] 1.7.1 Create family_members_interactions table with task, family_member id, and feedback (loose coupling design)
  - [x] 1.8 Create quests and experiments tables with timeline and progress tracking
  - [x] 1.9 Create journal_conversations and journal_entries tables with GPT processing results
  - [x] 1.10 Create daily_focuses and goals tables for AI context
  - [x] 1.11 Create projects table with associated tasks (non-dashboard)
  - [x] 1.12 Set up database migrations and seeding with sample data
  - [x] 1.13 Configure Hono backend with environment variables and database connection
  - [x] 1.14 Write integration tests for database schema and relationships

- [x] 2.0 Character System Implementation
  - [x] 2.1 Create character creation API endpoints with class selection and backstory
  - [x] 2.2 Implement custom character stats management with predefined categories
  - [x] 2.3 Build XP calculation utilities with Level N = ((N*(N+1))/2 × 100) Total XP formula
  - [x] 2.4 Create manual level-up trigger system to control pacing
  - [x] 2.5 Integrate GPT for generating humorous, contextual level titles
  - [x] 2.6 Implement stat progression tracking with individual XP and level storage
  - [x] 2.7 Create API endpoints for stat updates and XP awards
  - [ ] 2.8 Add sample stats and example activities for each category guidance (moved to frontend)
  - [x] 2.9 Build character dashboard API with current stats and progression
  - [x] 2.10 Write integration tests for character system endpoints

- [ ] 3.0 Task Management System
  - [x] 3.1 Create comprehensive task CRUD API supporting all task types
  - [x] 3.2 Implement task completion system with immediate XP notifications
  - [x] 3.3 Build feedback system for AI-generated task completions
  - [x] 3.4 Create dashboard API aggregating tasks from all sources
  - [x] 3.5 Implement quest progress tracking with deadline monitoring
  - [x] 3.6 Build experiment task differentiation (shorter-term, no AI influence)
  - [x] 3.7 Create ad-hoc task system tied to specific character stats
  - [x] 3.8 Implement simple todos without XP/quest integration
  - [x] 3.9 Design extensible task source architecture for future API integrations
  - [x] 3.10 Build task completion pattern tracking for AI learning
  - [x] 3.11 Create family member management with interaction frequency preferences
  - [x] 3.12 Write integration tests for task management system

- [ ] 4.0 AI Integration and Daily Task Generation
  - [x] 4.1 Set up OpenAI GPT integration service with proper API key management
  - [x] 4.2 Create weather API integration with user provided zip code
  - [x] 4.3 Build AI context gathering system (class, backstory, goals, family, history)
  - [x] 4.4 Implement daily task generation: exactly 2 tasks (1 adventure + 1 family)
  - [x] 4.5 Create task generation logic considering weather, family interaction timing
  - [x] 4.7 Implement AI task specification with target stats and estimated XP
  - [x] 4.8 Create feedback processing system for AI learning and improvement
  - [x] 4.9 Build daily focus influence system for task generation priorities
  - [x] 4.10 Implement project context integration (influence but not dashboard display)
  - [x] 4.11 Create scheduled daily task generation system
  - [x] 4.12 Write integration tests for AI task generation

- [ ] 5.0 Journal System with Conversational Interface
  - [x] 5.1 Create conversational journal API with GPT integration
  - [x] 5.2 Implement smart follow-up question generation based on mood/content detection
  - [x] 5.3 Build conversation management with user-controlled ending
  - [x] 5.4 Create GPT processing for extracting summaries, synopses, and titles
  - [x] 5.5 Implement content tag system with preference for existing tags
  - [x] 5.6 Build character stat tag system using only existing user stats
  - [x] 5.7 Create XP award system for journal entries (including negative XP)
  - [x] 5.8 Implement journal entry storage with processed metadata
  - [x] 5.9 Build journal history and search functionality
  - [x] 5.10 Create quick journal access integration for homepage
  - [x] 5.11 Write integration tests for journal system

- [x] 6.0 Frontend Dashboard and User Interface
  - [x] 6.1 Set up SvelteKit frontend with Hono client for type-safe API calls
  - [x] 6.2 Create mobile-first responsive layout with iOS Safari optimization
  - [x] 6.3 Build homepage dashboard with today's tasks, XP progress, quick journal access
  - [x] 6.4 Implement character creation and management interface
  - [x] 6.5 Create task display components with card-based layout and completion states
  - [x] 6.6 Build XP progress visualization with immediate feedback (2-second notifications)
  - [x] 6.7 Implement character stats dashboard with color coding and level progression
  - [x] 6.7.1 Add sample stats and example activities for each category guidance
  - [x] 6.8 Create conversational journal interface with smart follow-up questions
  - [x] 6.9 Build quest and experiment management pages with dedicated dashboards
  - [ ] 6.10 Implement family member management interface
  - [ ] 6.11 Create daily focus setting system with sample focuses
  - [ ] 6.12 Build goals and projects management interface
  - [ ] 6.13 Implement ad-hoc task creation page
  - [x] 6.14 Create navigation system optimized for ADHD users (minimal decision fatigue)
  - [x] 6.15 Implement progressive disclosure design patterns
  - [x] 6.16 Add Lucide icons throughout interface (no emojis)
  - [ ] 6.17 Create loading states and error handling for all user interactions
  - [ ] 6.18 Write integration tests for frontend components and user flows
