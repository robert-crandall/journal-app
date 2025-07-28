import { pgTable, uuid, text, date, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

// Weekly analyses table - combines journal summary, goal alignment, and metrics in one place
export const weeklyAnalyses = pgTable('weekly_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Period definition (Saturday to Friday for weeks)
  periodStartDate: date('period_start_date').notNull(),
  periodEndDate: date('period_end_date').notNull(),

  // Journal Summary Section
  journalSummary: text('journal_summary').notNull(), // Natural language summary of journal entries
  journalTags: jsonb('journal_tags').$type<string[]>().default([]), // Top tags from journal entries

  // Metrics Summary Section
  totalXpGained: integer('total_xp_gained').default(0).notNull(),
  tasksCompleted: integer('tasks_completed').default(0).notNull(),
  xpByStats: jsonb('xp_by_stats')
    .$type<
      Array<{
        statId: string;
        statName: string;
        xpGained: number;
      }>
    >()
    .default([]),
  toneFrequency: jsonb('tone_frequency')
    .$type<
      Array<{
        tone: string;
        count: number;
      }>
    >()
    .default([]),
  contentTagFrequency: jsonb('content_tag_frequency')
    .$type<
      Array<{
        tag: string;
        count: number;
      }>
    >()
    .default([]),

  // Goal Alignment Section
  alignmentScore: integer('alignment_score'), // Optional numeric 0-100 or null
  alignedGoals: jsonb('aligned_goals')
    .$type<
      Array<{
        goalId: string;
        goalTitle: string;
        evidence: string[]; // Evidence/excerpts from journals, tasks, etc.
      }>
    >()
    .default([]),
  neglectedGoals: jsonb('neglected_goals')
    .$type<
      Array<{
        goalId: string;
        goalTitle: string;
        reason?: string; // Optional reason for neglect
      }>
    >()
    .default([]),
  suggestedNextSteps: jsonb('suggested_next_steps').$type<string[]>().default([]),
  goalAlignmentSummary: text('goal_alignment_summary').notNull(), // Natural language summary of goal alignment

  // Optional combined reflection
  combinedReflection: text('combined_reflection'), // GPT-generated combined insight (stretch goal)

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
