import { pgTable, text, uuid, timestamp, integer, boolean, jsonb, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Character Stats (renameable: virtues, traits, aspects)
export const characterStats = pgTable('character_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  currentXp: integer('current_xp').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Self-experiments (quests)
export const experiments = pgTable('experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  dailyTaskDescription: text('daily_task_description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Daily tasks for experiments
export const dailyTasks = pgTable('daily_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  experimentId: uuid('experiment_id').references(() => experiments.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  xpRewards: jsonb('xp_rewards').$type<{ statId: string; xp: number }[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Content tags
export const contentTags = pgTable('content_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Tone tags (predefined set)
export const toneTags = pgTable('tone_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Journal entries
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }),
  summary: text('summary'),
  synopsis: text('synopsis'),
  conversationData: jsonb('conversation_data').$type<{
    messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
    isComplete: boolean;
  }>().notNull(),
  entryDate: timestamp('entry_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Junction table for journal entries and content tags
export const journalContentTags = pgTable('journal_content_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id, { onDelete: 'cascade' }).notNull(),
  contentTagId: uuid('content_tag_id').references(() => contentTags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Junction table for journal entries and tone tags
export const journalToneTags = pgTable('journal_tone_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id, { onDelete: 'cascade' }).notNull(),
  toneTagId: uuid('tone_tag_id').references(() => toneTags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Junction table for journal entries and character stats (for XP tracking)
export const journalCharacterStats = pgTable('journal_character_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id, { onDelete: 'cascade' }).notNull(),
  characterStatId: uuid('character_stat_id').references(() => characterStats.id, { onDelete: 'cascade' }).notNull(),
  xpGained: integer('xp_gained').default(5).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Junction table for journal entries and experiments (optional linking)
export const journalExperiments = pgTable('journal_experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id, { onDelete: 'cascade' }).notNull(),
  experimentId: uuid('experiment_id').references(() => experiments.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  characterStats: many(characterStats),
  experiments: many(experiments),
  contentTags: many(contentTags),
  journalEntries: many(journalEntries),
}))

export const characterStatsRelations = relations(characterStats, ({ one, many }) => ({
  user: one(users, {
    fields: [characterStats.userId],
    references: [users.id],
  }),
  journalCharacterStats: many(journalCharacterStats),
}))

export const experimentsRelations = relations(experiments, ({ one, many }) => ({
  user: one(users, {
    fields: [experiments.userId],
    references: [users.id],
  }),
  dailyTasks: many(dailyTasks),
  journalExperiments: many(journalExperiments),
}))

export const dailyTasksRelations = relations(dailyTasks, ({ one }) => ({
  experiment: one(experiments, {
    fields: [dailyTasks.experimentId],
    references: [experiments.id],
  }),
}))

export const contentTagsRelations = relations(contentTags, ({ one, many }) => ({
  user: one(users, {
    fields: [contentTags.userId],
    references: [users.id],
  }),
  journalContentTags: many(journalContentTags),
}))

export const toneTagsRelations = relations(toneTags, ({ many }) => ({
  journalToneTags: many(journalToneTags),
}))

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
  journalContentTags: many(journalContentTags),
  journalToneTags: many(journalToneTags),
  journalCharacterStats: many(journalCharacterStats),
  journalExperiments: many(journalExperiments),
}))

export const journalContentTagsRelations = relations(journalContentTags, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalContentTags.journalEntryId],
    references: [journalEntries.id],
  }),
  contentTag: one(contentTags, {
    fields: [journalContentTags.contentTagId],
    references: [contentTags.id],
  }),
}))

export const journalToneTagsRelations = relations(journalToneTags, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalToneTags.journalEntryId],
    references: [journalEntries.id],
  }),
  toneTag: one(toneTags, {
    fields: [journalToneTags.toneTagId],
    references: [toneTags.id],
  }),
}))

export const journalCharacterStatsRelations = relations(journalCharacterStats, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalCharacterStats.journalEntryId],
    references: [journalEntries.id],
  }),
  characterStat: one(characterStats, {
    fields: [journalCharacterStats.characterStatId],
    references: [characterStats.id],
  }),
}))

export const journalExperimentsRelations = relations(journalExperiments, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalExperiments.journalEntryId],
    references: [journalEntries.id],
  }),
  experiment: one(experiments, {
    fields: [journalExperiments.experimentId],
    references: [experiments.id],
  }),
}))
