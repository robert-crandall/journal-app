import { pgTable, uuid, varchar, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userAttributes = pgTable(
  'user_attributes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 100 }).notNull(), // e.g. "priorities", "values", "motivators", "challenges"
    value: varchar('value', { length: 200 }).notNull(), // e.g. "family", "relaxing", "physical health"
    source: varchar('source', { length: 50 }).notNull().default('user_set'), // "user_set", "gpt_summary", "journal_analysis"
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Ensure unique (user_id, category, value) combinations
    uniqueUserAttribute: unique('unique_user_attribute').on(table.userId, table.category, table.value),
  }),
);
