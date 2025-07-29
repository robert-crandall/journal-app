import { z } from 'zod';

// Tag validation schemas
export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(100, 'Tag name must be 100 characters or less').trim(),
  source: z.enum(['user', 'discovered', 'system']).default('discovered'),
});

export const updateTagSchema = createTagSchema.partial();

// Goal tag relationships
export const createGoalTagSchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  tagId: z.string().uuid('Invalid tag ID'),
});

// Batch operations
export const batchCreateTagsSchema = z.object({
  tags: z.array(z.string().min(1).max(100).trim()).min(1, 'At least one tag is required').max(10, 'Cannot create more than 10 tags at once'),
});

export const batchAssignTagsSchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  tagNames: z.array(z.string().min(1).max(100).trim()).max(10, 'Cannot assign more than 10 tags at once'),
});
