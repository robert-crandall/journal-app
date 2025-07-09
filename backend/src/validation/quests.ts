import { z } from 'zod';

// Quest validation schemas
export const createQuestTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255, 'Task title must be 255 characters or less'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  xpAmount: z.number().int().min(1).max(100).default(5),
  statIds: z.array(z.string().uuid()).min(1, 'At least one stat must be selected'),
  order: z.number().int().min(0).optional(),
});

export const createQuestSchema = z.object({
  title: z.string().min(1, 'Quest title is required').max(255, 'Quest title must be 255 characters or less'),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  tasks: z.array(createQuestTaskSchema).min(1, 'At least one task is required'),
  statIds: z.array(z.string().uuid()).min(1, 'At least one stat must be selected for bonus XP'),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateQuestSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateQuestTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  xpAmount: z.number().int().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
  isCompleted: z.boolean().optional(),
});

// Parameter validation schemas
export const questIdSchema = z.object({
  questId: z.string().uuid(),
});

export const questTaskIdSchema = z.object({
  questId: z.string().uuid(),
  taskId: z.string().uuid(),
});

// Query parameter schemas
export const getQuestsQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'expired', 'archived', 'all']).default('active'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});
