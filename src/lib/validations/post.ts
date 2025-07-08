import { z } from 'zod';

export const PostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  published: z.boolean().default(false),
});
