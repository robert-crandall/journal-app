import { z } from 'zod';

// User registration schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

// User login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Password reset confirm schema
export const passwordResetConfirmSchema = z.object({
  token: z.string().uuid('Invalid token format'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// User context schema
export const userContextSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  values: z.array(z.string()).min(1, 'At least one value is required'),
});

// User context update schema
export const updateUserContextSchema = z.object({
  contexts: z.array(userContextSchema),
});

// User preferences schema
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter']).default('light'),
  accentColor: z.enum(['blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'teal']).default('blue'),
  timezone: z.string().default('UTC'),
});

// Profile update schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type UserContextInput = z.infer<typeof userContextSchema>;
export type UpdateUserContextInput = z.infer<typeof updateUserContextSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
