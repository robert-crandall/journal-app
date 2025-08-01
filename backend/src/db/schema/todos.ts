import { pgTable, uuid, varchar, boolean, timestamp, text } from 'drizzle-orm/pg-core';
import { users } from './users';

// Simple todos table - lightweight one-off tasks for the homepage
export const simpleTodos = pgTable('simple_todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expirationTime: timestamp('expiration_time', { withTimezone: true }),
  source: varchar('source', { length: 50 }), // Optional source, e.g., "gpt:dm", "user", etc.
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
