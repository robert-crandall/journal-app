import { z } from 'zod';

// User validation schemas
export const userRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  timezone: z.string().optional().default('UTC'),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Character stats validation schema
export const characterStatSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

// Family member validation schema
export const familyMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  relationship: z.string().optional(),
});

// Tag validation schema
export const tagSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Quest validation schema
export const questSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

// Quest milestone validation schema
export const questMilestoneSchema = z.object({
  questId: z.string().uuid('Invalid quest ID'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  isCompleted: z.boolean().optional().default(false),
});

// Experiment validation schema
export const experimentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  successCriteria: z.string().optional(),
});

// Task validation schema
export const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  isRecurring: z.boolean().optional().default(false),
  recurrencePattern: z.record(z.any()).optional(),
  questId: z.string().uuid('Invalid quest ID').optional().nullable(),
  experimentId: z.string().uuid('Invalid experiment ID').optional().nullable(),
  familyMemberIds: z.array(z.string().uuid('Invalid family member ID')).optional(),
  characterStatIds: z.array(z.object({
    id: z.string().uuid('Invalid character stat ID'),
    xp: z.number().int().positive('XP must be a positive integer'),
  })).optional(),
});

// Journal entry validation schema
export const journalEntrySchema = z.object({
  content: z.string().min(1, 'Content is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  title: z.string().optional(),
  tagIds: z.array(z.string().uuid('Invalid tag ID')).optional(),
  familyMemberIds: z.array(z.string().uuid('Invalid family member ID')).optional(),
});

// Journal analysis validation schema
export const journalAnalysisSchema = z.object({
  journalEntryId: z.string().uuid('Invalid journal entry ID'),
});

// Conversation validation schema
export const conversationSchema = z.object({
  title: z.string().optional(),
});

// Message validation schema
export const messageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  content: z.string().min(1, 'Content is required'),
});

// User context validation schema
export const userContextSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
});
