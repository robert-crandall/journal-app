import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  image: z.string().url().optional().nullable(),
  emailVerified: z.date().optional().nullable(),
});
