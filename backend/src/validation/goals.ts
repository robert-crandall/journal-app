import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isArchived: z.boolean().default(false),
});

export const updateGoalSchema = createGoalSchema.partial();
