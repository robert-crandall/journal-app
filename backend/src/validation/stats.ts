import { z } from 'zod';

// Stat Group Schema
export const createStatGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const updateStatGroupSchema = createStatGroupSchema.partial();

// Stat Schema
export const createStatSchema = z.object({
  groupId: z.string().uuid('Invalid group ID').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  isCustom: z.boolean().optional(),
  currentXp: z.number().int().nonnegative().optional(),
  level: z.number().int().positive().optional(),
});

export const updateStatSchema = createStatSchema.partial();

// Stat Level Title Schema
export const createStatLevelTitleSchema = z.object({
  level: z.number().int().positive('Level must be a positive integer'),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
});

export const updateStatLevelTitleSchema = createStatLevelTitleSchema.partial();

// Sample Activity Schema
export const createSampleActivitySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  xpValue: z.number().int().positive('XP value must be a positive integer').optional(),
});

export const updateSampleActivitySchema = createSampleActivitySchema.partial();

// Stat Template Schema
export const createStatTemplateSchema = z.object({
  groupId: z.string().uuid('Invalid group ID').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  suggestedForClasses: z.string().optional(),
});

export const updateStatTemplateSchema = createStatTemplateSchema.partial();

// XP Grant Schema
export const grantXpSchema = z.object({
  statId: z.string().uuid('Invalid stat ID'),
  xp: z.number().int().positive('XP must be a positive integer'),
  reason: z.string().optional(),
});

// Level Up Schema
export const levelUpSchema = z.object({
  statId: z.string().uuid('Invalid stat ID'),
});

// Assign Template Stats Schema
export const assignTemplateStatsSchema = z.object({
  templateIds: z.array(z.string().uuid('Invalid template ID')),
});
