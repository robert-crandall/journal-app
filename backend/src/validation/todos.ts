import { z } from 'zod';

export const createSimpleTodoSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
});

export const updateSimpleTodoSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or less').optional(),
  isCompleted: z.boolean().optional(),
});

export const completeSimpleTodoSchema = z.object({
  isCompleted: z.boolean(),
});
