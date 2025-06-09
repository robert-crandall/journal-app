import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table for authentication
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Enum for message roles
export const messageRoleEnum = pgEnum('message_role', ['user', 'gpt'])

// Journal sessions table
export const journalSessions = pgTable('journal_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  finalizedText: text('finalized_text'),
  title: varchar('title', { length: 255 }),
  summary: text('summary'),
  fullSummary: text('full_summary'),
})

// Journal messages table for conversation history
export const journalMessages = pgTable('journal_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => journalSessions.id).notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Journal tags table
export const journalTags = pgTable('journal_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).unique().notNull(),
})

// Junction table for journal entries and tags
export const journalEntryTags = pgTable('journal_entry_tags', {
  journalId: uuid('journal_id').references(() => journalSessions.id).notNull(),
  tagId: uuid('tag_id').references(() => journalTags.id).notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  journalSessions: many(journalSessions),
}))

export const journalSessionsRelations = relations(journalSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [journalSessions.userId],
    references: [users.id],
  }),
  messages: many(journalMessages),
  tags: many(journalEntryTags),
}))

export const journalMessagesRelations = relations(journalMessages, ({ one }) => ({
  session: one(journalSessions, {
    fields: [journalMessages.sessionId],
    references: [journalSessions.id],
  }),
}))

export const journalTagsRelations = relations(journalTags, ({ many }) => ({
  entries: many(journalEntryTags),
}))

export const journalEntryTagsRelations = relations(journalEntryTags, ({ one }) => ({
  journal: one(journalSessions, {
    fields: [journalEntryTags.journalId],
    references: [journalSessions.id],
  }),
  tag: one(journalTags, {
    fields: [journalEntryTags.tagId],
    references: [journalTags.id],
  }),
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type JournalSession = typeof journalSessions.$inferSelect
export type NewJournalSession = typeof journalSessions.$inferInsert
export type JournalMessage = typeof journalMessages.$inferSelect
export type NewJournalMessage = typeof journalMessages.$inferInsert
export type JournalTag = typeof journalTags.$inferSelect
export type NewJournalTag = typeof journalTags.$inferInsert
