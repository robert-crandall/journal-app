import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table - Task 1.2
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  zipCode: varchar('zip_code', { length: 10 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Characters table - Task 1.3
export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  class: varchar('class', { length: 100 }).notNull(),
  backstory: text('backstory'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Character stats table - Task 1.4
export const characterStats = pgTable('character_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  currentXp: integer('current_xp').notNull().default(0),
  currentLevel: integer('current_level').notNull().default(1),
  totalXp: integer('total_xp').notNull().default(0),
  levelTitle: varchar('level_title', { length: 100 }), // AI-generated humorous level title
  description: text('description'),
  sampleActivities: jsonb('sample_activities'), // Array of example activities
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Family members table - Task 1.5
export const familyMembers = pgTable('family_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  age: integer('age'),
  interests: jsonb('interests'), // Array of interests
  interactionFrequency: varchar('interaction_frequency', { length: 50 }).default('weekly'), // daily, weekly, etc.
  lastInteraction: date('last_interaction'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Tasks table - Task 1.6
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  source: varchar('source', { length: 50 }).notNull(), // 'ai', 'quest', 'experiment', 'todo', 'ad-hoc', 'external'
  sourceId: uuid('source_id'), // Reference to quest, experiment, etc.
  targetStats: jsonb('target_stats'), // Array of stat categories this task affects
  estimatedXp: integer('estimated_xp').default(0),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, completed, skipped
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Task completions table - Task 1.7
export const taskCompletions = pgTable('task_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feedback: text('feedback'), // User feedback on the task
  actualXp: integer('actual_xp').notNull().default(0),
  statAwards: jsonb('stat_awards'), // Which stats received XP and how much
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Family member interactions table - Task 1.7.1
export const familyMemberInteractions = pgTable('family_member_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  familyMemberId: uuid('family_member_id').notNull().references(() => familyMembers.id, { onDelete: 'cascade' }),
  feedback: text('feedback'),
  interactionDate: date('interaction_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Quests table - Task 1.8
export const quests = pgTable('quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  goalDescription: text('goal_description'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, completed, paused, abandoned
  progressNotes: text('progress_notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Experiments table - Task 1.8
export const experiments = pgTable('experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  hypothesis: text('hypothesis'),
  duration: integer('duration'), // Duration in days
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, completed, abandoned
  results: text('results'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Journal conversations table - Task 1.9
export const journalConversations = pgTable('journal_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }),
  isActive: boolean('is_active').default(true),
  summary: text('summary'), // AI-generated summary
  synopsis: text('synopsis'), // AI-generated synopsis
  contentTags: jsonb('content_tags'), // AI-extracted tags
  statTags: jsonb('stat_tags'), // Character stats mentioned
  mood: varchar('mood', { length: 100 }), // AI-detected mood
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Journal entries table - Task 1.9
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => journalConversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user', 'assistant'
  xpAwarded: integer('xp_awarded').default(0), // Can be negative
  statAwards: jsonb('stat_awards'), // Which stats received XP
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Daily focuses table - Task 1.10
export const dailyFocuses = pgTable('daily_focuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  focus: text('focus').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  focusDate: date('focus_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Goals table - Task 1.10
export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  targetDate: timestamp('target_date', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, completed, paused, abandoned
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high
  relatedStats: jsonb('related_stats'), // Which character stats this goal relates to
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Projects table - Task 1.11
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, completed, paused, archived
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// External task sources table - Task 3.9
export const externalTaskSources = pgTable('external_task_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // calendar, project_management, fitness, notes, habits, time_tracking
  apiEndpoint: varchar('api_endpoint', { length: 500 }).notNull(),
  authType: varchar('auth_type', { length: 50 }).notNull(), // oauth2, api_key, basic_auth
  config: jsonb('config').notNull(), // API keys, tokens, client IDs, etc.
  mappingRules: jsonb('mapping_rules').notNull(), // Field mappings and transformation rules
  syncSchedule: varchar('sync_schedule', { length: 100 }), // Cron expression for auto-sync
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  nextSyncAt: timestamp('next_sync_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  errorCount: integer('error_count').default(0),
  lastError: text('last_error'),
  metadata: jsonb('metadata'), // Additional source-specific data
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// External task integrations table - Task 3.9
export const externalTaskIntegrations = pgTable('external_task_integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => externalTaskSources.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 255 }).notNull(), // ID from external system
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }), // Nullable - task can be deleted
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, inactive, error
  metadata: jsonb('metadata'), // External system specific data
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  familyMembers: many(familyMembers),
  tasks: many(tasks),
  quests: many(quests),
  experiments: many(experiments),
  journalConversations: many(journalConversations),
  journalEntries: many(journalEntries),
  dailyFocuses: many(dailyFocuses),
  goals: many(goals),
  projects: many(projects),
  taskCompletions: many(taskCompletions),
  externalTaskSources: many(externalTaskSources),
  externalTaskIntegrations: many(externalTaskIntegrations),
}))

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  stats: many(characterStats),
}))

export const characterStatsRelations = relations(characterStats, ({ one }) => ({
  character: one(characters, {
    fields: [characterStats.characterId],
    references: [characters.id],
  }),
}))

export const familyMembersRelations = relations(familyMembers, ({ one, many }) => ({
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
  interactions: many(familyMemberInteractions),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  completions: many(taskCompletions),
  familyInteractions: many(familyMemberInteractions),
}))

export const taskCompletionsRelations = relations(taskCompletions, ({ one }) => ({
  task: one(tasks, {
    fields: [taskCompletions.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskCompletions.userId],
    references: [users.id],
  }),
}))

export const familyMemberInteractionsRelations = relations(familyMemberInteractions, ({ one }) => ({
  task: one(tasks, {
    fields: [familyMemberInteractions.taskId],
    references: [tasks.id],
  }),
  familyMember: one(familyMembers, {
    fields: [familyMemberInteractions.familyMemberId],
    references: [familyMembers.id],
  }),
}))

export const questsRelations = relations(quests, ({ one, many }) => ({
  user: one(users, {
    fields: [quests.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}))

export const experimentsRelations = relations(experiments, ({ one, many }) => ({
  user: one(users, {
    fields: [experiments.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}))

export const journalConversationsRelations = relations(journalConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [journalConversations.userId],
    references: [users.id],
  }),
  entries: many(journalEntries),
}))

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  conversation: one(journalConversations, {
    fields: [journalEntries.conversationId],
    references: [journalConversations.id],
  }),
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
}))

export const dailyFocusesRelations = relations(dailyFocuses, ({ one }) => ({
  user: one(users, {
    fields: [dailyFocuses.userId],
    references: [users.id],
  }),
}))

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}))

export const externalTaskSourcesRelations = relations(externalTaskSources, ({ one, many }) => ({
  user: one(users, {
    fields: [externalTaskSources.userId],
    references: [users.id],
  }),
  integrations: many(externalTaskIntegrations),
}))

export const externalTaskIntegrationsRelations = relations(externalTaskIntegrations, ({ one }) => ({
  source: one(externalTaskSources, {
    fields: [externalTaskIntegrations.sourceId],
    references: [externalTaskSources.id],
  }),
  user: one(users, {
    fields: [externalTaskIntegrations.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [externalTaskIntegrations.taskId],
    references: [tasks.id],
  }),
}))
