import { pgTable, uuid, varchar, text, jsonb, timestamp, date, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const journals = pgTable('journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(), // Date for the journal entry (YYYY-MM-DD)
  status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft' | 'in_review' | 'complete'
  initialMessage: text('initial_message'), // The initial freeform reflection
  chatSession: jsonb('chat_session'), // JSON array of chat messages
  summary: text('summary'), // GPT-generated summary
  title: text('title'), // GPT-generated title
  synopsis: text('synopsis'), // GPT-generated synopsis
  toneTags: jsonb('tone_tags'), // GPT-extracted emotional tone tags (max 2, constrained to fixed set)
  dayRating: integer('day_rating'), // User-provided rating of their day (1-5)
  inferredDayRating: integer('inferred_day_rating'), // AI-inferred rating of the day (1-5)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
