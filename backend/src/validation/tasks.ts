import { z } from 'zod';

// Task creation validation
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  sourceType: z.enum(['track_task', 'initiative_task', 'manual', 'todo'], {
    required_error: 'Source type is required',
  }),
  sourceId: z.string().uuid('Invalid source ID').optional(),
  dueDate: z.string().datetime('Invalid date format').optional(),
  priority: z.number().int().min(1).max(5).default(1),
  statId: z.string().uuid('Invalid stat ID').optional(),
  xpReward: z.number().int().min(0).max(1000).default(0),
  familyMemberId: z.string().uuid('Invalid family member ID').optional(),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurringDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
});

// Task update validation
export const updateTaskSchema = createTaskSchema.partial().omit({ sourceType: true });

// Task completion validation
export const completeTaskSchema = z.object({
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

// Query validation for tasks endpoints
export const tasksQuerySchema = z.object({
  sourceType: z.enum(['track_task', 'initiative_task', 'manual', 'todo']).optional(),
  sourceId: z.string().uuid('Invalid source ID').optional(),
  isCompleted: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  includeRelations: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  dueDate: z.string().datetime('Invalid date format').optional(),
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
