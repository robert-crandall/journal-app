import { pgTable, uuid, varchar, text, jsonb, timestamp, date } from 'drizzle-orm/pg-core';
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
  toneTags: varchar('tone_tags', { length: 1000 }), // JSON array of tone tags as string
  contentTags: varchar('content_tags', { length: 1000 }), // JSON array of content tags as string
  statTags: varchar('stat_tags', { length: 1000 }), // JSON array of stat tags as string
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
