import { z } from 'zod';

// Valid attribute sources
const attributeSourceSchema = z.enum(['user_set', 'gpt_summary', 'journal_analysis']);

// Create user attribute validation schema
export const createUserAttributeSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100, 'Category cannot exceed 100 characters'),
  value: z.string().min(1, 'Value is required').max(200, 'Value cannot exceed 200 characters'),
  source: attributeSourceSchema.optional().default('user_set'),
});

// Update user attribute validation schema
export const updateUserAttributeSchema = createUserAttributeSchema.partial();

// Query parameter schemas
export const getUserAttributesSchema = z.object({
  category: z.string().optional(),
  source: attributeSourceSchema.optional(),
});

// For GPT inference
export const inferredAttributeSchema = z.object({
  category: z.string().min(1).max(100),
  value: z.string().min(1).max(200),
  importance: z.number().min(1).max(5).optional(),
});

export const attributeInferenceResultSchema = z.object({
  attributes: z.array(inferredAttributeSchema),
  reasoning: z.string().optional(),
});
