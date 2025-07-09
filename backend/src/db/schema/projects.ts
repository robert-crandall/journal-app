import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { goals } from './goals';

// Projects table - practical maintenance and fun explorations
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Project type: 'project' for practical/maintenance, 'adventure' for fun/exploratory
  type: varchar('type', { length: 20 }).notNull(), // 'project' or 'adventure'
  
  // Timeline
  startDate: timestamp('start_date'),
  targetDate: timestamp('target_date'),
  completedAt: timestamp('completed_at'),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  
  // Optional link to a goal
  goalId: uuid('goal_id').references(() => goals.id),
  
  // Whether this project should be referenced by GPT for task suggestions
  includeInAiGeneration: boolean('include_in_ai_generation').default(true).notNull(),
  
  // Project completion notes
  completionNotes: text('completion_notes'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Project subtasks - tasks that belong to a project/adventure but don't grant XP
export const projectSubtasks = pgTable('project_subtasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Status
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  
  // Ordering
  sortOrder: integer('sort_order').default(0).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
