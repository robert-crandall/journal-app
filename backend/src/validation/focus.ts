import { z } from 'zod';

// Base focus validation schema
export const focusValidationSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
});

// Create focus schema with detailed error messages
export const createFocusSchema = z.object({
  dayOfWeek: z.number().int().min(0, 'Day must be between 0 (Sunday) and 6 (Saturday)').max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)'),
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description cannot exceed 500 characters'),
});

// Update focus schema
export const updateFocusSchema = createFocusSchema.partial();

// Batch update focuses schema
export const batchUpdateFocusesSchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
  })
);
