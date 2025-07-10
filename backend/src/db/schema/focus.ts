import { pgTable, uuid, varchar, integer, timestamp, foreignKey } from 'drizzle-orm/pg-core';
import { users } from './users';

// Daily focus table
export const focuses = pgTable('focuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, etc.
  title: varchar('title', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
