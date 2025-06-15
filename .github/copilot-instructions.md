# Copilot Instructions for Journal App Project

## Project Overview

This is a chat-first life coaching app with a conversational assistant at its core. The app helps users track quests, experiments, tasks, and journal entries while providing AI-powered insights and guidance.

## Technology Stack

- **Framework**: SvelteKit 2 (full stack)
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API
- **Mobile Strategy**: Expo with PWA export

## General Development Guidelines

### Code Style & Structure

1. **Small, Focused Functions**
   - Write functions that do one thing well
   - Aim for functions under 20 lines where possible
   - Use descriptive function names that explain their purpose

2. **Readable Code**
   - Prioritize readability over clever solutions
   - Use descriptive variable names
   - Add comments for complex logic, but let clean code speak for itself
   - Use TypeScript types consistently for better code intelligence

3. **Modern JavaScript**
   - Use modern JavaScript features (optional chaining, nullish coalescing, etc.)
   - Employ async/await for asynchronous operations
   - Prefer const over let, avoid var

### SvelteKit 2 Best Practices

1. **Runes Mode Usage**
   - ALWAYS use the new Runes syntax instead of the older $ reactive declarations
   - Use `$state()` for reactive component state
   - Use `$derived()` for computed values
   - Use `$effect()` for side effects
   - Use `$props()` for component props with TypeScript validation

2. **Examples of Correct Runes Usage**
   ```javascript
   // CORRECT - Using Runes
   const count = $state(0);
   const doubled = $derived(count * 2);
   
   $effect(() => {
     console.log(`Count changed to ${count}`);
   });
   
   // INCORRECT - Using old $ syntax (DO NOT USE)
   // $: doubled = count * 2;
   // $: console.log(`Count changed to ${count}`);
   ```

3. **Component Design**
   - Create small, reusable components with clear responsibilities
   - Use component props for configuration, not global state
   - Leverage SvelteKit's layout system for shared UI elements

4. **Routing**
   - Use SvelteKit's file-based routing system
   - Place API endpoints in `/routes/api/` directories
   - Implement proper error handling with error.svelte files
   - Use load functions for data loading (server and/or client)

5. **Forms & Actions**
   - Use SvelteKit's enhanced form actions for form submissions
   - Implement proper validation both client-side and server-side
   - Use the new Attachments feature for more flexible form handling

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
   import { db } from '$lib/database';
   import { quests } from '$lib/schema';
   
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

## Feature-Specific Guidelines

### Conversational Assistant

1. **Prompt Engineering**
   - Structure prompts carefully for consistent AI responses
   - Include relevant context from user data
   - Implement fallback strategies for AI failures

2. **Response Handling**
   - Stream responses for chat-like experience
   - Implement message history with proper pagination
   - Handle errors gracefully with user-friendly messages

### Journal Entries

1. **Data Structure**
   - Store raw text content
   - Save AI-generated metadata (title, synopsis, tags) separately
   - Implement relations to other entities (stats, family, etc.)

2. **User Experience**
   - Focus on a distraction-free writing experience
   - Implement auto-save functionality
   - Provide clear feedback when AI is processing entries

### Quests & Experiments

1. **Progress Tracking**
   - Implement clear visual indicators of progress
   - Store milestone completion data
   - Track experiment metrics consistently

2. **Task Generation**
   - Structure context for the AI to generate relevant tasks
   - Deduplicate tasks against previously completed ones
   - Allow user verification before saving generated tasks

## Testing Guidelines

1. **Unit Tests**
   - Test small, focused functions individually
   - Mock external dependencies (AI API, database)
   - Focus on business logic correctness

2. **Integration Tests**
   - Test key user flows end-to-end
   - Verify database interactions work correctly
   - Test form submissions and validations

3. **Accessibility Testing**
   - Ensure keyboard navigation works properly
   - Verify screen reader compatibility
   - Maintain proper contrast and text sizing

## Documentation

1. **Code Documentation**
   - Document complex functions with JSDoc comments
   - Explain non-obvious design decisions
   - Keep documentation updated as code changes

2. **User Documentation**
   - Create clear onboarding instructions
   - Document feature usage with examples
   - Provide troubleshooting guidance

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

### Chat interface
- This should be inspired by the chat interface of ChatGPT
- The interface should be reusable across the app
- Each component that uses the chat interface should be able to pass in its own props, system prompt, history, and other relevant data
