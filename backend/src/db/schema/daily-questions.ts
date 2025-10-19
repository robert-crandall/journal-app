import { pgTable, uuid, text, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

// Daily questions table - stores personalized daily check-in questions for users
export const dailyQuestions = pgTable(
  'daily_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(), // The generated question to ask the user
    dateAssigned: date('date_assigned').notNull(), // Date this question applies to (YYYY-MM-DD)
    answered: boolean('answered').default(false).notNull(), // Whether the user has responded to this question
    contextSource: text('context_source'), // Summary of what journal entries/context inspired this question
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userId_dateAssigned_unique: {
      unique: ['userId', 'dateAssigned'],
    },
  }),
);

// Export the inferred types for use in shared types
export type DailyQuestion = typeof dailyQuestions.$inferSelect;
export type NewDailyQuestion = typeof dailyQuestions.$inferInsert;
