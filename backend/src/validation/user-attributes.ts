import { z } from 'zod';

export const userAttributeSourceSchema = z.enum(['user_set', 'gpt_summary', 'journal_analysis']);

export const createUserAttributeSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  source: userAttributeSourceSchema.optional().default('user_set'),
});

export const updateUserAttributeSchema = z.object({
  value: z.string().min(1, 'Value is required').optional(),
  source: userAttributeSourceSchema.optional(),
});

export const bulkCreateUserAttributesSchema = z.object({
  attributes: z.array(
    z.object({
      value: z.string().min(1, 'Value is required'),
      source: userAttributeSourceSchema.optional().default('user_set'),
    }),
  ),
});

export const getUserAttributesQuerySchema = z.object({
  source: userAttributeSourceSchema.optional(), // Filter by source
});

export type CreateUserAttribute = z.infer<typeof createUserAttributeSchema>;
export type UpdateUserAttribute = z.infer<typeof updateUserAttributeSchema>;
export type BulkCreateUserAttributes = z.infer<typeof bulkCreateUserAttributesSchema>;
export type GetUserAttributesQuery = z.infer<typeof getUserAttributesQuerySchema>;
export type UserAttributeSource = z.infer<typeof userAttributeSourceSchema>;
