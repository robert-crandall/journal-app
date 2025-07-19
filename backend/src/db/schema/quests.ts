import { pgTable, uuid, varchar, text, timestamp, date } from 'drizzle-orm/pg-core';
import { users } from './users';
import { experiments } from './experiments';
import { journals } from './journals';

// Quests table - stores quest definitions (long-term goal containers)
export const quests = pgTable('quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  summary: text('summary'), // Freeform description of the quest
  startDate: date('start_date').notNull(),
  endDate: date('end_date'), // Optional end date
  reflection: text('reflection'), // Freeform reflection notes
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active' | 'completed' | 'archived'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Junction table for quest-experiment relationships
export const questExperiments = pgTable('quest_experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  questId: uuid('quest_id')
    .notNull()
    .references(() => quests.id, { onDelete: 'cascade' }),
  experimentId: uuid('experiment_id')
    .notNull()
    .references(() => experiments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Junction table for quest-journal relationships
export const questJournals = pgTable('quest_journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  questId: uuid('quest_id')
    .notNull()
    .references(() => quests.id, { onDelete: 'cascade' }),
  journalId: uuid('journal_id')
    .notNull()
    .references(() => journals.id, { onDelete: 'cascade' }),
  linkedType: varchar('linked_type', { length: 20 }).notNull().default('automatic'), // 'automatic' | 'manual'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
