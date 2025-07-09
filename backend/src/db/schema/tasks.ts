import { pgTable, uuid, varchar, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { characterStats } from './stats';
import { familyMembers } from './family';

// Tasks table - unified task system supporting multiple source types
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Source information - what created this task
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'track_task', 'initiative_task', 'manual', 'todo'
  sourceId: uuid('source_id'), // Optional reference to quest, project, etc.
  
  // Task properties
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  dueDate: timestamp('due_date'),
  priority: integer('priority').default(1), // 1-5 priority scale
  
  // XP and stat linkage
  statId: uuid('stat_id').references(() => characterStats.id), // Optional stat for XP
  xpReward: integer('xp_reward').default(0), // XP to grant on completion
  
  // Family connection
  familyMemberId: uuid('family_member_id').references(() => familyMembers.id), // Optional family member link
  
  // Recurring task support
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurringType: varchar('recurring_type', { length: 20 }), // 'daily', 'weekly', 'monthly'
  recurringDays: text('recurring_days'), // JSON array of day numbers for weekly (0-6, Sunday=0)
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Task completion history - tracks completed instances of recurring tasks
export const taskCompletions = pgTable('task_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  xpGranted: integer('xp_granted').default(0).notNull(),
  notes: text('notes'), // Optional completion notes
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
