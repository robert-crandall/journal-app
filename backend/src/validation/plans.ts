import { z } from 'zod';

export const createPlanSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  type: z.enum(['project', 'adventure', 'theme', 'other'], {
    required_error: 'Type is required',
    invalid_type_error: 'Type must be one of: project, adventure, theme, other',
  }),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  focusId: z.string().uuid('Focus ID must be a valid UUID').optional(),
  isOrdered: z.boolean().optional().default(false),
});

export const updatePlanSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less').optional(),
  type: z.enum(['project', 'adventure', 'theme', 'other']).optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  focusId: z.string().uuid('Focus ID must be a valid UUID').nullable().optional(),
  isOrdered: z.boolean().optional(),
});

export const createPlanSubtaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  orderIndex: z.number().int().min(0, 'Order index must be non-negative').optional(),
});

export const updatePlanSubtaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less').optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  isCompleted: z.boolean().optional(),
  orderIndex: z.number().int().min(0, 'Order index must be non-negative').optional(),
});

export const completePlanSubtaskSchema = z.object({
  isCompleted: z.boolean(),
});

export const reorderPlanSubtasksSchema = z.object({
  subtaskIds: z.array(z.string().uuid('Subtask ID must be a valid UUID')).min(1, 'At least one subtask ID is required'),
});
