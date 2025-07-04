import { pgTable, uuid, varchar, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

// Character stats table - defines the stats for a user's character
export const characterStats = pgTable('character_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  // Example activities stored as JSON array: [{ description: "Deadlift session", suggestedXp: 20 }]
  exampleActivities: jsonb('example_activities').$type<Array<{ description: string; suggestedXp: number }>>().default([]),
  currentLevel: integer('current_level').notNull().default(1),
  totalXp: integer('total_xp').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// XP grants table - tracks all XP grants for auditing and history
export const characterStatXpGrants = pgTable('character_stat_xp_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  statId: uuid('stat_id').notNull().references(() => characterStats.id, { onDelete: 'cascade' }),
  xpAmount: integer('xp_amount').notNull(),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'task', 'journal', 'adhoc', 'quest'
  sourceId: uuid('source_id'), // Optional reference to the source (task ID, journal entry ID, etc.)
  reason: text('reason'), // Optional GPT-generated reason or user comment
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Level titles table - GPT-generated humorous titles for each level
export const characterStatLevelTitles = pgTable('character_stat_level_titles', {
  id: uuid('id').primaryKey().defaultRandom(),
  statId: uuid('stat_id').notNull().references(() => characterStats.id, { onDelete: 'cascade' }),
  level: integer('level').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
