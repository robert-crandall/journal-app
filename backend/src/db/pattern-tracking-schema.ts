import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, decimal, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users, tasks, taskCompletions, familyMembers } from './schema'

// Task completion patterns table for AI learning - Task 3.10
export const taskCompletionPatterns = pgTable('task_completion_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  
  // Pattern identification
  patternType: varchar('pattern_type', { length: 50 }).notNull(), // 'timing', 'task_type', 'difficulty', 'duration', 'weather', 'stat_preference'
  patternKey: varchar('pattern_key', { length: 100 }).notNull(), // 'morning_tasks', 'outdoor_activities', 'family_bonding'
  patternValue: jsonb('pattern_value'), // Additional pattern data
  
  // Pattern metrics
  totalOccurrences: integer('total_occurrences').notNull().default(0),
  successfulCompletions: integer('successful_completions').notNull().default(0),
  failedCompletions: integer('failed_completions').notNull().default(0),
  averageXpAwarded: decimal('average_xp_awarded', { precision: 5, scale: 2 }).default('0'),
  averageFeedbackSentiment: decimal('average_feedback_sentiment', { precision: 3, scale: 2 }).default('0'), // -1 to 1
  
  // Pattern strength and confidence
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('0'), // 0 to 1
  strength: varchar('strength', { length: 20 }).default('weak'), // weak, moderate, strong
  
  // AI recommendations
  recommendation: text('recommendation'), // Generated AI recommendation based on pattern
  shouldAvoid: boolean('should_avoid').default(false), // Mark patterns to avoid
  
  // Temporal tracking
  firstObserved: timestamp('first_observed', { withTimezone: true }).notNull().defaultNow(),
  lastObserved: timestamp('last_observed', { withTimezone: true }).notNull().defaultNow(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Task completion events for pattern analysis - Task 3.10
export const taskCompletionEvents = pgTable('task_completion_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  taskId: uuid('task_id').notNull(),
  completionId: uuid('completion_id'),
  
  // Event context for pattern detection
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'completed', 'skipped', 'failed'
  eventTimestamp: timestamp('event_timestamp', { withTimezone: true }).notNull(),
  
  // Contextual data for pattern analysis
  taskSource: varchar('task_source', { length: 50 }).notNull(),
  taskDifficulty: varchar('task_difficulty', { length: 20 }), // 'easy', 'medium', 'hard'
  estimatedDuration: integer('estimated_duration'), // minutes
  actualDuration: integer('actual_duration'), // minutes
  
  // Environmental context
  timeOfDay: varchar('time_of_day', { length: 20 }), // 'morning', 'afternoon', 'evening', 'night'
  dayOfWeek: varchar('day_of_week', { length: 10 }),
  weatherCondition: varchar('weather_condition', { length: 50 }),
  
  // User context
  userMood: varchar('user_mood', { length: 20 }), // extracted from feedback
  energyLevel: varchar('energy_level', { length: 20 }), // 'low', 'medium', 'high'
  previousTaskCompletion: boolean('previous_task_completion'), // did they complete the previous task?
  
  // Task performance
  xpAwarded: integer('xp_awarded').default(0),
  feedbackSentiment: decimal('feedback_sentiment', { precision: 3, scale: 2 }), // -1 to 1
  feedbackKeywords: jsonb('feedback_keywords'), // extracted keywords
  
  // Family interaction context (if applicable)
  involvesFamilyMember: uuid('involves_family_member'),
  familyMemberSatisfaction: varchar('family_member_satisfaction', { length: 20 }), // 'low', 'medium', 'high'
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Pattern insights for AI context - Task 3.10
export const patternInsights = pgTable('pattern_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  
  // Insight metadata
  insightType: varchar('insight_type', { length: 50 }).notNull(), // 'preference', 'avoid', 'optimal_timing', 'stat_focus'
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  
  // Supporting data
  supportingPatterns: jsonb('supporting_patterns'), // array of pattern IDs
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }).notNull(),
  evidenceCount: integer('evidence_count').notNull().default(0),
  
  // AI context for task generation
  aiContext: jsonb('ai_context'), // structured data for GPT prompt
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high
  
  // Insight lifecycle
  isActive: boolean('is_active').default(true),
  expires: timestamp('expires', { withTimezone: true }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations for new pattern tracking tables
export const taskCompletionPatternsRelations = relations(taskCompletionPatterns, ({ one, many }) => ({
  user: one(users, {
    fields: [taskCompletionPatterns.userId],
    references: [users.id],
  }),
}))

export const taskCompletionEventsRelations = relations(taskCompletionEvents, ({ one }) => ({
  user: one(users, {
    fields: [taskCompletionEvents.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [taskCompletionEvents.taskId],
    references: [tasks.id],
  }),
  completion: one(taskCompletions, {
    fields: [taskCompletionEvents.completionId],
    references: [taskCompletions.id],
  }),
  familyMember: one(familyMembers, {
    fields: [taskCompletionEvents.involvesFamilyMember],
    references: [familyMembers.id],
  }),
}))

export const patternInsightsRelations = relations(patternInsights, ({ one }) => ({
  user: one(users, {
    fields: [patternInsights.userId],
    references: [users.id],
  }),
}))
