import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { focuses } from './focus';

// Plans table - flexible container for organizing Projects, Adventures, Themes, etc.
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'project' | 'adventure' | 'theme' | 'other'
  description: text('description'), // optional long-form text
  focusId: uuid('focus_id').references(() => focuses.id, { onDelete: 'set null' }), // optional focus alignment
  isOrdered: boolean('is_ordered').default(false).notNull(), // determines if subtasks are sequential
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }), // last time a task was completed
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Plan subtasks table - individual tasks within a plan
export const planSubtasks = pgTable('plan_subtasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(), // short description
  description: text('description'), // optional markdown body
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  orderIndex: integer('order_index'), // nullable if unordered
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
