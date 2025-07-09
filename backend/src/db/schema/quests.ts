import { pgTable, uuid, varchar, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { characterStats } from './stats';

// Quests table - long-term challenges with multiple tasks
export const quests = pgTable('quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  isExpired: boolean('is_expired').default(false).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  bonusXpAwarded: boolean('bonus_xp_awarded').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('quests_user_id_idx').on(table.userId),
  activeIdx: index('quests_active_idx').on(table.isActive),
}));

// Quest stats - which stats this quest grants XP to
export const questStats = pgTable('quest_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  questId: uuid('quest_id')
    .notNull()
    .references(() => quests.id, { onDelete: 'cascade' }),
  statId: uuid('stat_id')
    .notNull()
    .references(() => characterStats.id, { onDelete: 'cascade' }),
  bonusXpAmount: integer('bonus_xp_amount').default(10).notNull(), // XP awarded on quest completion
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  questIdIdx: index('quest_stats_quest_id_idx').on(table.questId),
  statIdIdx: index('quest_stats_stat_id_idx').on(table.statId),
}));

// Quest tasks - individual tasks that make up a quest
export const questTasks = pgTable('quest_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  questId: uuid('quest_id')
    .notNull()
    .references(() => quests.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }), // Optional due date for individual tasks
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  xpAmount: integer('xp_amount').default(5).notNull(), // XP granted when task is completed
  order: integer('order').default(0).notNull(), // For ordering tasks within a quest
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  questIdIdx: index('quest_tasks_quest_id_idx').on(table.questId),
  orderIdx: index('quest_tasks_order_idx').on(table.questId, table.order),
}));

// Quest task stats - which stats each task grants XP to (many-to-many)
export const questTaskStats = pgTable('quest_task_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => questTasks.id, { onDelete: 'cascade' }),
  statId: uuid('stat_id')
    .notNull()
    .references(() => characterStats.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  taskIdIdx: index('quest_task_stats_task_id_idx').on(table.taskId),
  statIdIdx: index('quest_task_stats_stat_id_idx').on(table.statId),
}));
