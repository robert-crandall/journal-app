import { z } from 'zod';

// Project creation validation
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  type: z.enum(['project', 'adventure'], {
    required_error: 'Project type is required',
  }),
  startDate: z.string().datetime('Invalid start date format').optional(),
  targetDate: z.string().datetime('Invalid target date format').optional(),
  goalId: z.string().uuid('Invalid goal ID').optional(),
  includeInAiGeneration: z.boolean().default(true),
});

// Project update validation
export const updateProjectSchema = createProjectSchema.partial().omit({ type: true }).extend({
  isActive: z.boolean().optional(),
  completionNotes: z.string().max(2000, 'Completion notes must be 2000 characters or less').optional(),
});

// Project subtask creation validation
export const createProjectSubtaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  sortOrder: z.number().int().min(0).default(0),
});

// Project subtask update validation
export const updateProjectSubtaskSchema = createProjectSubtaskSchema.partial().extend({
  isCompleted: z.boolean().optional(),
});

// Query validation for projects endpoints
export const projectsQuerySchema = z.object({
  type: z.enum(['project', 'adventure']).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  isCompleted: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  goalId: z.string().uuid('Invalid goal ID').optional(),
  includeSubtasks: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  includeRelations: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val > 0 && val <= 100), {
      message: 'Limit must be between 1 and 100',
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: 'Offset must be non-negative',
    }),
});
