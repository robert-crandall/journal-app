import { pgTable, uuid, varchar, timestamp, date, real, text, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const measurements = pgTable('measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  recordedDate: date('recorded_date').notNull(),
  
  // Core measurements
  weightLbs: real('weight_lbs'), // stored in pounds
  neckCm: real('neck_cm'),
  waistCm: real('waist_cm'), // averaged from other waist fields
  hipCm: real('hip_cm'), // optional, needed for female formulas
  
  bodyFatPercentage: real('body_fat_percentage'), // calculated at time of entry
  notes: text('notes'),
  
  // Extra measurements (optional and flexible)
  extra: jsonb('extra'), // e.g. { "waist_at_navel_cm": 93, "waist_above_navel_cm": 91, ... }
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
