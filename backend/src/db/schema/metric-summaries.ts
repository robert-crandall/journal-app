import { pgTable, uuid, varchar, integer, real, timestamp, date, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { journalSummaries } from './journal-summaries';
import { experiments } from './experiments';

// Metric summaries table - stores calculated metrics for time periods
export const metricSummaries = pgTable('metric_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // 'journal' | 'experiment'
  sourceId: uuid('source_id').notNull(), // journalSummaryId or experimentId

  // Period definition
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),

  // Core metrics
  totalXp: integer('total_xp').notNull().default(0),
  avgDayRating: real('avg_day_rating'), // Average day rating (1-5, can be null if no ratings)
  daysLogged: integer('days_logged').notNull().default(0),
  tasksCompleted: integer('tasks_completed').notNull().default(0),
  averageTasksPerDay: real('average_tasks_per_day').notNull().default(0),

  // JSON fields for complex data
  toneTagCounts: jsonb('tone_tag_counts').$type<Record<string, number>>().default({}), // e.g., {"calm": 3, "excited": 2}
  mostCommonTone: varchar('most_common_tone', { length: 50 }), // Most frequent tone tag
  xpByStat: jsonb('xp_by_stat').$type<Record<string, number>>().default({}), // e.g., {"strength": 45, "wisdom": 30}
  logStreak: jsonb('log_streak').$type<{ longest: number; current: number }>(), // Streak information

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
