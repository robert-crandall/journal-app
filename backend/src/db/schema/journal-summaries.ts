import { pgTable, uuid, varchar, text, date, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const journalSummaries = pgTable('journal_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  period: varchar('period', { length: 10 }).notNull(), // 'week' | 'month'
  startDate: date('start_date').notNull(), // Saturday for weeks, 1st of month for months
  endDate: date('end_date').notNull(), // Friday for weeks, last day of month
  summary: text('summary').notNull(), // Generated long-form summary (used for GPT context)
  tags: jsonb('tags'), // Optional: top tags extracted from entries (string[])
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
