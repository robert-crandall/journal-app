import { pgTable, uuid, varchar, text, timestamp, date } from 'drizzle-orm/pg-core';
import { users } from './users';

export const familyMembers = pgTable('family_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  relationship: varchar('relationship', { length: 100 }).notNull(), // e.g., "eldest son", "wife", "mother"
  birthday: date('birthday'), // Optional birthday (date only, no time)
  likes: text('likes'), // Freeform text for likes/interests
  dislikes: text('dislikes'), // Freeform text for dislikes
  energyLevel: varchar('energy_level', { length: 50 }), // Optional personality trait, e.g., "active", "creative", "low-key"
  lastInteractionDate: timestamp('last_interaction_date'), // Auto-updated when tasks are completed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Family task feedback for tracking task outcomes
export const familyTaskFeedback = pgTable('family_task_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  familyMemberId: uuid('family_member_id').notNull().references(() => familyMembers.id),
  taskDescription: text('task_description').notNull(), // What was done
  feedback: text('feedback'), // "How did it go?" - freeform
  enjoyedIt: varchar('enjoyed_it', { length: 10 }), // "yes", "no", or null
  notes: text('notes'), // Additional notes about the experience
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
