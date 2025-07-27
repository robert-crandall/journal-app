import { pgTable, uuid, varchar, text, integer, date, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

// Goal alignment summaries table - tracks how well user aligns with goals over time periods
export const goalAlignmentSummaries = pgTable('goal_alignment_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Period definition
  periodStartDate: date('period_start_date').notNull(),
  periodEndDate: date('period_end_date').notNull(),
  
  // Alignment metrics
  alignmentScore: integer('alignment_score'), // Optional numeric 0-100 or null
  
  // Goal analysis (stored as JSON arrays)
  alignedGoals: jsonb('aligned_goals').$type<Array<{
    goalId: string;
    goalTitle: string;
    evidence: string[]; // Evidence/excerpts from journals, tasks, etc.
  }>>().default([]),
  
  neglectedGoals: jsonb('neglected_goals').$type<Array<{
    goalId: string;
    goalTitle: string;
    reason?: string; // Optional reason for neglect
  }>>().default([]),
  
  suggestedNextSteps: jsonb('suggested_next_steps').$type<string[]>().default([]),
  
  // Generated summary text
  summary: text('summary').notNull(), // Natural language summary of the week's alignment
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
