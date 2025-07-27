import { pgTable, uuid, varchar, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userAttributes = pgTable(
  'user_attributes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    value: text('value').notNull(), // e.g. "Enjoys watching movies more on second watching"
    source: varchar('source', { length: 20 }).notNull().default('user_set'), // "user_set", "gpt_summary", "journal_analysis"
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// Export the inferred type for use in shared types
export type UserAttribute = typeof userAttributes.$inferSelect;
