import { pgTable, uuid, text, date, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

// Daily intents table - stores user's morning "most important thing" statements
export const dailyIntents = pgTable('daily_intents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(), // Date for which this intent applies
  importanceStatement: text('importance_statement').notNull(), // User's response to "What is the most important thing you can do today?"
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
