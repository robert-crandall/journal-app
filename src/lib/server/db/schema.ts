import { pgTable, uuid, integer, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User and Session tables
export const user = pgTable('user', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

// Character Stats (renameable virtues/traits/aspects)
export const characterStat = pgTable('character_stat', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	currentXp: integer('current_xp').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

// Self-Experiments (Quests)
export const experiment = pgTable('experiment', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	startDate: timestamp('start_date', { withTimezone: true, mode: 'date' }).notNull(),
	endDate: timestamp('end_date', { withTimezone: true, mode: 'date' }).notNull(),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

// Experiment Tasks
export const experimentTask = pgTable('experiment_task', {
	id: uuid('id').primaryKey().defaultRandom(),
	experimentId: uuid('experiment_id')
		.notNull()
		.references(() => experiment.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	targetCompletions: integer('target_completions').notNull().default(1),
	xpRewards: jsonb('xp_rewards').$type<Record<string, number>>().default({}), // { characterStatId: xpAmount }
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

// Task Completions
export const taskCompletion = pgTable('task_completion', {
	id: uuid('id').primaryKey().defaultRandom(),
	taskId: uuid('task_id')
		.notNull()
		.references(() => experimentTask.id, { onDelete: 'cascade' }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

// Content Tags
export const contentTag = pgTable('content_tag', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

// Tone Tags (predefined set)
export const toneTag = pgTable('tone_tag', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

// Journal Entries
export const journalEntry = pgTable('journal_entry', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title'),
	synopsis: text('synopsis'),
	summary: text('summary'),
	conversationData: jsonb('conversation_data').$type<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>().default([]),
	isProcessed: boolean('is_processed').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

// Junction tables for many-to-many relationships
export const journalContentTag = pgTable('journal_content_tag', {
	journalId: uuid('journal_id')
		.notNull()
		.references(() => journalEntry.id, { onDelete: 'cascade' }),
	tagId: uuid('tag_id')
		.notNull()
		.references(() => contentTag.id, { onDelete: 'cascade' })
});

export const journalToneTag = pgTable('journal_tone_tag', {
	journalId: uuid('journal_id')
		.notNull()
		.references(() => journalEntry.id, { onDelete: 'cascade' }),
	tagId: uuid('tag_id')
		.notNull()
		.references(() => toneTag.id, { onDelete: 'cascade' })
});

export const journalCharacterTag = pgTable('journal_character_tag', {
	journalId: uuid('journal_id')
		.notNull()
		.references(() => journalEntry.id, { onDelete: 'cascade' }),
	statId: uuid('stat_id')
		.notNull()
		.references(() => characterStat.id, { onDelete: 'cascade' }),
	xpGained: integer('xp_gained').notNull().default(5)
});

export const journalExperiment = pgTable('journal_experiment', {
	journalId: uuid('journal_id')
		.notNull()
		.references(() => journalEntry.id, { onDelete: 'cascade' }),
	experimentId: uuid('experiment_id')
		.notNull()
		.references(() => experiment.id, { onDelete: 'cascade' })
});

// Relations
export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	journalEntries: many(journalEntry),
	experiments: many(experiment),
	characterStats: many(characterStat),
	contentTags: many(contentTag),
	taskCompletions: many(taskCompletion)
}));

export const journalEntryRelations = relations(journalEntry, ({ one, many }) => ({
	user: one(user, {
		fields: [journalEntry.userId],
		references: [user.id]
	}),
	contentTags: many(journalContentTag),
	toneTags: many(journalToneTag),
	characterTags: many(journalCharacterTag),
	experiments: many(journalExperiment)
}));

export const experimentRelations = relations(experiment, ({ one, many }) => ({
	user: one(user, {
		fields: [experiment.userId],
		references: [user.id]
	}),
	tasks: many(experimentTask),
	journalEntries: many(journalExperiment)
}));

export const experimentTaskRelations = relations(experimentTask, ({ one, many }) => ({
	experiment: one(experiment, {
		fields: [experimentTask.experimentId],
		references: [experiment.id]
	}),
	completions: many(taskCompletion)
}));

export const characterStatRelations = relations(characterStat, ({ one, many }) => ({
	user: one(user, {
		fields: [characterStat.userId],
		references: [user.id]
	}),
	journalTags: many(journalCharacterTag)
}));

// Type exports
export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type JournalEntry = typeof journalEntry.$inferSelect;
export type Experiment = typeof experiment.$inferSelect;
export type ExperimentTask = typeof experimentTask.$inferSelect;
export type TaskCompletion = typeof taskCompletion.$inferSelect;
export type CharacterStat = typeof characterStat.$inferSelect;
export type ContentTag = typeof contentTag.$inferSelect;
export type ToneTag = typeof toneTag.$inferSelect;
