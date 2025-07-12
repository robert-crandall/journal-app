import { z } from 'zod';

const baseExperimentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});

const dateValidation = (data: { startDate: string; endDate: string }) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate >= startDate;
};

export const createExperimentSchema = baseExperimentSchema.extend({
  tasks: z.array(z.object({
    description: z.string().min(1, 'Task description is required').max(500, 'Task description must be 500 characters or less'),
    successMetric: z.number().int().min(1).default(1),
    xpReward: z.number().int().min(0).default(0),
  })).optional().default([]),
}).refine(dateValidation, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export const updateExperimentSchema = baseExperimentSchema.partial().refine((data) => {
  if (data.startDate && data.endDate) {
    return dateValidation({ startDate: data.startDate, endDate: data.endDate });
  }
  return true;
}, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export const createExperimentTaskSchema = z.object({
  description: z.string().min(1, 'Task description is required').max(500, 'Task description must be 500 characters or less'),
  successMetric: z.number().int().min(1).default(1),
  xpReward: z.number().int().min(0).default(0),
});

export const updateExperimentTaskSchema = createExperimentTaskSchema.partial();

export const completeExperimentTaskSchema = z.object({
  completedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Completed date must be in YYYY-MM-DD format'),
  notes: z.string().optional(),
});

export const getExperimentDashboardSchema = z.object({
  experimentId: z.string().uuid('Experiment ID must be a valid UUID'),
});