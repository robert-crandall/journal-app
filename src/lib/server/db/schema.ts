import { pgTable, text, timestamp, date, uuid, integer, json } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  // Character fields for gamification
  characterClass: text('character_class'),
  backstory: text('backstory'),
  motto: text('motto'),
  goals: text('goals'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const content = pgTable('content', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stats = pgTable('stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'), // Lucide icon name (e.g., 'dumbbell', 'brain', 'heart')
  exampleActivities: json('example_activities').$type<Record<string, { description: string; suggestedXp: number }[]>>(), // JSON object with category keys and activity arrays
  currentXp: integer('current_xp').notNull().default(0),
  currentLevel: integer('current_level').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const statActivities = pgTable('stat_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  statId: uuid('stat_id')
    .notNull()
    .references(() => stats.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  suggestedXp: integer('suggested_xp').notNull().default(10),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const xpGrants = pgTable('xp_grants', {
  id: uuid('id').defaultRandom().primaryKey(),
  statId: uuid('stat_id')
    .notNull()
    .references(() => stats.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  sourceType: text('source_type').notNull(), // 'task', 'journal', 'adhoc', 'quest'
  sourceId: uuid('source_id'), // Optional reference to source
  comment: text('comment'), // Optional comment or GPT-generated reason
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const statLevelTitles = pgTable('stat_level_titles', {
  id: uuid('id').defaultRandom().primaryKey(),
  statId: uuid('stat_id')
    .notNull()
    .references(() => stats.id, { onDelete: 'cascade' }),
  level: integer('level').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  tags: json('tags').$type<string[]>(),
  active: integer('active').notNull().default(1), // SQLite-style boolean (0/1)
  archived: integer('archived').notNull().default(0), // SQLite-style boolean (0/1)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const familyMembers = pgTable('family_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(), // e.g., 'eldest son', 'wife', 'daughter'
  birthday: date('birthday'), // Optional
  likes: json('likes').$type<string[]>().default([]), // Array of likes
  dislikes: json('dislikes').$type<string[]>().default([]), // Array of dislikes
  energyLevel: text('energy_level'), // Optional: 'active', 'creative', 'low-key', etc.
  lastInteraction: timestamp('last_interaction', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const familyTaskFeedback = pgTable('family_task_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyMemberId: uuid('family_member_id')
    .notNull()
    .references(() => familyMembers.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id'), // Optional reference to task (when tasks are implemented)
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  liked: integer('liked').notNull(), // SQLite-style boolean (0/1)
  notes: text('notes'), // Freeform feedback
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const familyConnectionXp = pgTable('family_connection_xp', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyMemberId: uuid('family_member_id')
    .notNull()
    .references(() => familyMembers.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  source: text('source').notNull(), // 'task' | 'journal'
  xp: integer('xp').notNull(),
  comment: text('comment'), // Optional comment about the interaction
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Content = typeof content.$inferSelect;
export type Stat = typeof stats.$inferSelect;
export type StatActivity = typeof statActivities.$inferSelect;
export type XpGrant = typeof xpGrants.$inferSelect;
export type StatLevelTitle = typeof statLevelTitles.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type FamilyTaskFeedback = typeof familyTaskFeedback.$inferSelect;
export type FamilyConnectionXp = typeof familyConnectionXp.$inferSelect;
