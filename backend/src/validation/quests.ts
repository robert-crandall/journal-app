import { z } from 'zod';

// Quest creation validation
export const createQuestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  type: z.enum(['quest', 'experiment'], {
    required_error: 'Quest type is required',
  }),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
  goalId: z.string().uuid('Invalid goal ID').optional(),
  dailyTaskTitle: z.string().max(255, 'Daily task title must be 255 characters or less').optional(),
  dailyTaskDescription: z.string().max(1000, 'Daily task description must be 1000 characters or less').optional(),
  dailyTaskXpReward: z.number().int().min(0).max(1000).default(0),
  includeInAiGeneration: z.boolean().default(true),
});

// Quest update validation
export const updateQuestSchema = createQuestSchema.partial().omit({ type: true }).extend({
  isActive: z.boolean().optional(),
});

// Quest completion validation
export const completeQuestSchema = z.object({
  conclusion: z.string().max(2000, 'Conclusion must be 2000 characters or less').optional(),
});

// Query validation for quests endpoints
export const questsQuerySchema = z.object({
  type: z.enum(['quest', 'experiment']).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  isCompleted: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  goalId: z.string().uuid('Invalid goal ID').optional(),
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
