import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { goals } from './goals';

// Quests table - long-term commitments and short-term experiments
export const quests = pgTable('quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Quest type: 'quest' for long-term commitments, 'experiment' for time-boxed trials
  type: varchar('type', { length: 20 }).notNull(), // 'quest' or 'experiment'
  
  // Timeline
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  
  // For experiments: conclusion after completion
  conclusion: text('conclusion'),
  
  // Optional link to a goal
  goalId: uuid('goal_id').references(() => goals.id),
  
  // Daily task configuration (for recurring quest tasks)
  dailyTaskTitle: varchar('daily_task_title', { length: 255 }),
  dailyTaskDescription: text('daily_task_description'),
  dailyTaskXpReward: integer('daily_task_xp_reward').default(0),
  
  // Whether this quest should influence GPT task generation
  includeInAiGeneration: boolean('include_in_ai_generation').default(true).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
