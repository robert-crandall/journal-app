import { z } from 'zod';

// Base measurement validation schema
export const measurementValidationSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  recordedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  weightLbs: z.number().positive().optional().nullable(),
  neckCm: z.number().positive().optional().nullable(),
  waistCm: z.number().positive().optional().nullable(),
  hipCm: z.number().positive().optional().nullable(),
  bodyFatPercentage: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  extra: z.record(z.string(), z.number()).optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Create measurement request schema
export const createMeasurementSchema = z.object({
  recordedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD format
  weightLbs: z.number().positive().optional(),
  neckCm: z.number().positive().optional(),
  // Raw waist inputs - will be averaged to calculate waistCm
  waistAtNavelCm: z.number().positive().optional(),
  waistAboveNavelCm: z.number().positive().optional(),
  waistBelowNavelCm: z.number().positive().optional(),
  hipCm: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  extra: z.record(z.string(), z.number()).optional(),
});

// Update measurement request schema
export const updateMeasurementSchema = z.object({
  recordedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD format
  weightLbs: z.number().positive().optional(),
  neckCm: z.number().positive().optional(),
  waistAtNavelCm: z.number().positive().optional(),
  waistAboveNavelCm: z.number().positive().optional(),
  waistBelowNavelCm: z.number().positive().optional(),
  hipCm: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  extra: z.record(z.string(), z.number()).optional(),
});

// List measurements request schema
export const listMeasurementsSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD format
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD format
  limit: z
    .string()
    .default('50')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0))
    .optional(),
});

// Measurement ID schema
export const measurementIdSchema = z.object({
  id: z.string().uuid(),
});

// Update user schema to include new fields
export const updateUserWithMeasurementFieldsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  avatar: z.string().optional(),
  gptTone: z.enum(['friendly', 'motivational', 'funny', 'serious', 'minimal', 'wholesome']).optional(),
  heightCm: z.number().positive().optional(),
  sex: z.enum(['male', 'female']).optional(),
});
