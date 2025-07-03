import { z } from 'zod';

// Base user validation schema
export const userValidationSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

// Registration schema with detailed error messages
export const registerSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
});

// Login schema
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  
  password: z.string()
    .min(1, 'Password is required'),
  
  rememberMe: z.boolean().optional().default(false)
});

export const updateUserValidationSchema = userValidationSchema.partial();
