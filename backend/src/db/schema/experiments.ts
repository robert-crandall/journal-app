import { pgTable, uuid, varchar, text, timestamp, integer, date } from 'drizzle-orm/pg-core';
import { users } from './users';
import { characterStats } from './stats';

// Experiments table - stores experiment definitions
export const experiments = pgTable('experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Experiment tasks table - stores daily tasks for experiments
export const experimentTasks = pgTable('experiment_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  experimentId: uuid('experiment_id')
    .notNull()
    .references(() => experiments.id, { onDelete: 'cascade' }),
  statId: uuid('stat_id').references(() => characterStats.id, { onDelete: 'set null' }), // Optional link to character stat
  description: varchar('description', { length: 500 }).notNull(),
  successMetric: integer('success_metric').default(1), // Number of times task should be completed during experiment
  xpReward: integer('xp_reward').default(0), // XP awarded per completion
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Experiment task completions table - tracks when tasks are completed
export const experimentTaskCompletions = pgTable('experiment_task_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => experimentTasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  completedDate: date('completed_date').notNull(),
  notes: text('notes'), // Optional notes about the completion
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
