# Copilot Instructions for Journal App Project

## Project Overview

This is a chat-first life coaching app with a conversational assistant at its core. The app helps users track quests, experiments, tasks, and journal entries while providing AI-powered insights and guidance.

## Technology Stack

- **Backend**: Hono (TypeScript-based web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API
- **Frontend Options**: 
  - Option 1: SvelteUI (component library for Svelte)
  - Option 2: Expo Web (React Native for web)

## Architecture Design

This project uses a split architecture:
1. Hono backend providing RESTful and/or GraphQL APIs
2. Frontend client (SvelteUI or Expo Web) consuming these APIs

Hono will export an RPC client for the frontend to use, ensuring type safety and consistency across the application.

Write a test client in Hono that can be used to test the backend APIs. This client should be able to make requests to the backend and handle responses, including error handling. This will be an example of how to use the Hono backend APIs in a client application.

## Development Flow

- Create the feature in the backend first, ensuring it is tested.
- Add the feature to the client application, using the Hono RPC client for type safety. The client is `backend/src/client/index.ts`
- Add the feature to the client's test to ensure it works as expected. The test client is `backend/src/client/test.ts`
- Add the feature to the frontend UI, consuming the client, ensuring it is user-friendly and integrates well with the existing components.

## Backend Development Guidelines (Hono)

### Code Style & Structure

1. **Small, Focused Functions**
   - Write functions that do one thing well
   - Aim for functions under 20 lines where possible
   - Use descriptive function names that explain their purpose

2. **API Design**
   - Follow RESTful principles for resource naming
   - Use appropriate HTTP methods (GET, POST, PUT, DELETE, PATCH)
   - Return consistent response structures
   - Include proper error handling and status codes

3. **Route Organization**
   ```typescript
   // Example of organizing routes by resource
   import { Hono } from 'hono';
   
   const app = new Hono();
   
   // Group routes by resource
   const questsApi = new Hono()
     .get('/', getQuests)
     .get('/:id', getQuestById)
     .post('/', createQuest)
     .put('/:id', updateQuest)
     .delete('/:id', deleteQuest);
   
   // Mount resource routers
   app.route('/api/quests', questsApi);
   ```

4. **Middleware Usage**
   - Implement authentication middleware
   - Add request validation middleware
   - Use CORS middleware for cross-origin requests
   - Create logging middleware for debugging

5. **Request Validation**
   - Validate request parameters, query strings, and bodies
   - Return descriptive validation error messages
   - Use Zod or similar for schema validation
   ```typescript
   import { z } from 'zod';
   
   const questSchema = z.object({
     title: z.string().min(3).max(100),
     description: z.string().optional()
   });
   
   async function createQuest(c) {
     const result = questSchema.safeParse(await c.req.json());
     
     if (!result.success) {
       return c.json({ error: 'Validation failed', details: result.error }, 400);
     }
     
     // Process valid data
     const quest = await saveQuestToDatabase(result.data);
     return c.json({ data: quest }, 201);
   }
   ```

### Database Access with Drizzle

1. **Schema Definition**
   - Define clear, normalized schemas using Drizzle's schema definition language
   - Use appropriate field types and constraints
   - Implement relations between tables properly

2. **Query Structure**
   - Write clean, composable queries
   - Place database logic in separate modules
   - Handle errors gracefully with try/catch blocks

3. **Example Drizzle Usage**
   ```typescript
   // Define schema
   import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
   
   export const quests = pgTable('quests', {
     id: serial('id').primaryKey(),
     title: text('title').notNull(),
     description: text('description'),
     createdAt: timestamp('created_at').defaultNow()
   });
   
   // Query example
   import { db } from '../db';
   import { quests } from '../schema';
   import { eq } from 'drizzle-orm';
   
   export async function getQuestById(id: number) {
     try {
       const result = await db.select().from(quests).where(eq(quests.id, id)).limit(1);
       return result[0] || null;
     } catch (error) {
       console.error('Database error:', error);
       throw new Error('Failed to fetch quest');
     }
   }
   ```

### API Design for Feature Implementation

1. **Authentication & Authorization**
   - Implement JWT-based authentication
   - Create middleware to verify tokens
   - Add role-based authorization where needed

3. **Streaming Responses**
   - Implement streaming for AI-generated content
   - Use appropriate content-type headers
   - Handle client disconnections properly

4. **Error Handling**
   - Create consistent error response structure
   - Log errors with context for debugging
   - Don't expose sensitive information in error messages

## Feature-Specific Guidelines

### Conversational Assistant

1. **Backend Implementation**
   - Create endpoints for conversation history
   - Implement streaming responses for AI messages
   - Store conversation context efficiently

2. **Frontend Implementation**
   - Display typing indicators during AI response generation
   - Implement message threading and grouping
   - Support markdown and rich content in messages

### Journal Entries

1. **API Design**
   - Support draft saving and auto-saving
   - Implement endpoints for AI analysis
   - Create search endpoints with filtering capabilities

2. **Frontend Implementation**
   - Create a distraction-free writing environment
   - Implement rich text editing if needed
   - Show AI insights in a non-intrusive manner

### Quests & Experiments

1. **Data Structure**
   - Design endpoints that return appropriate related data
   - Implement proper filtering and pagination
   - Create endpoints for progress tracking

2. **User Experience**
   - Show clear visualizations of progress
   - Implement drag-and-drop for task prioritization
   - Create intuitive interfaces for task creation

## Testing Guidelines

1. **Backend Testing**
   - Write unit tests for business logic
   - Create API tests for endpoints
   - Implement integration tests for database interactions

2. **Frontend Testing**
   - Test component rendering and user interactions
   - Implement end-to-end tests for critical flows
   - Mock API responses for predictable testing

## Specific Implementation Notes

### Character Stats System

Implement a flexible system that:
- Allows custom stat definitions
- Tracks XP progression
- Associates stats with journal entries and tasks
- Provides visualizations of progress over time

### Task Management

Ensure tasks:
- Can be one-off or recurring
- Can be associated with quests, experiments, family members, and stats
- Have clear completion criteria and tracking

### Journal Analysis

When analyzing journal entries:
- Extract meaningful insights without excessive AI calls
- Create consistent tagging patterns
- Generate useful summaries for later reference

## For specific technology stacks, see the following instructions:

- [SvelteKit](instructions/sveltekit.instructions.md)
- [TailwindCSS](instructions/tailwindcss.instructions.md)
- [daisyUI](instructions/daisyui.instructions.md)
- [Drizzle ORM](references/drizzle-llms.md)
