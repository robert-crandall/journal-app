import { pgTable, text, timestamp, integer, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users and Family Members share the same table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  password: text('password'),
  name: text('name').notNull(),
  type: text('type', { enum: ['user', 'family'] }).notNull().default('user'),
  isFamily: boolean('is_family').notNull().default(false),
  gptContext: jsonb('gpt_context'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Attributes for both users and family members
export const attributes = pgTable('attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Focus areas for personal development
export const focuses = pgTable('focuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  statId: uuid('stat_id').references(() => stats.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  gptContext: jsonb('gpt_context'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Character stats for personal growth tracking
export const stats = pgTable('stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  emoji: text('emoji'),
  color: text('color'),
  value: integer('value').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tasks
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  focusId: uuid('focus_id').references(() => focuses.id, { onDelete: 'set null' }),
  statId: uuid('stat_id').references(() => stats.id, { onDelete: 'set null' }),
  familyMemberId: uuid('family_member_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date'),
  origin: text('origin', { enum: ['user', 'gpt', 'system'] }).notNull().default('user'),
  completedAt: timestamp('completed_at'),
  completionSummary: text('completion_summary'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Journal entries
export const journals = pgTable('journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  gptSummary: text('gpt_summary'),
  tags: jsonb('tags').$type<string[]>(),
  date: timestamp('date').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// A/B Testing Potions
export const potions = pgTable('potions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  hypothesis: text('hypothesis'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').notNull().default(true),
  gptAnalysis: text('gpt_analysis'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sessions for authentication
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  attributes: many(attributes),
  focuses: many(focuses),
  stats: many(stats),
  tasks: many(tasks),
  journals: many(journals),
  potions: many(potions),
  sessions: many(sessions),
}));

export const attributesRelations = relations(attributes, ({ one }) => ({
  user: one(users, { fields: [attributes.userId], references: [users.id] }),
}));

export const focusesRelations = relations(focuses, ({ one, many }) => ({
  user: one(users, { fields: [focuses.userId], references: [users.id] }),
  stat: one(stats, { fields: [focuses.statId], references: [stats.id] }),
  tasks: many(tasks),
}));

export const statsRelations = relations(stats, ({ one, many }) => ({
  user: one(users, { fields: [stats.userId], references: [users.id] }),
  focuses: many(focuses),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  focus: one(focuses, { fields: [tasks.focusId], references: [focuses.id] }),
  stat: one(stats, { fields: [tasks.statId], references: [stats.id] }),
  familyMember: one(users, { fields: [tasks.familyMemberId], references: [users.id] }),
}));

export const journalsRelations = relations(journals, ({ one }) => ({
  user: one(users, { fields: [journals.userId], references: [users.id] }),
}));

export const potionsRelations = relations(potions, ({ one }) => ({
  user: one(users, { fields: [potions.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertAttributeSchema = createInsertSchema(attributes);
export const selectAttributeSchema = createSelectSchema(attributes);
export const insertFocusSchema = createInsertSchema(focuses);
export const selectFocusSchema = createSelectSchema(focuses);
export const insertStatSchema = createInsertSchema(stats);
export const selectStatSchema = createSelectSchema(stats);
export const insertTaskSchema = createInsertSchema(tasks);
export const selectTaskSchema = createSelectSchema(tasks);
export const insertJournalSchema = createInsertSchema(journals);
export const selectJournalSchema = createSelectSchema(journals);
export const insertPotionSchema = createInsertSchema(potions);
export const selectPotionSchema = createSelectSchema(potions);
export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

// Custom validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  focusId: z.string().uuid().optional(),
  statId: z.string().uuid().optional(),
  familyMemberId: z.string().uuid().optional(),
});

export const completeTaskSchema = z.object({
  completionSummary: z.string().optional(),
});

export const createJournalSchema = z.object({
  content: z.string().min(1),
  date: z.string().datetime().optional(),
});

export const createFocusSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  statId: z.string().uuid().optional(),
  gptContext: z.any().optional(),
});

export const createFamilyMemberSchema = z.object({
  name: z.string().min(1),
});

export const createPotionSchema = z.object({
  title: z.string().min(1),
  hypothesis: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export const createAttributeSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const createStatSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  emoji: z.string().optional(),
  color: z.string().optional(),
});

export const updateStatSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  emoji: z.string().optional(),
  color: z.string().optional(),
  value: z.number().int().min(0).max(99).optional(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Attribute = typeof attributes.$inferSelect;
export type NewAttribute = typeof attributes.$inferInsert;
export type Focus = typeof focuses.$inferSelect;
export type NewFocus = typeof focuses.$inferInsert;
export type Stat = typeof stats.$inferSelect;
export type NewStat = typeof stats.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Journal = typeof journals.$inferSelect;
export type NewJournal = typeof journals.$inferInsert;
export type Potion = typeof potions.$inferSelect;
export type NewPotion = typeof potions.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
