import { z } from 'zod';

// Base photo validation schema
export const photoValidationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  linkedType: z.enum(['journal', 'measurement']),
  journalId: z.string().uuid().nullable(),
  measurementId: z.string().uuid().nullable(),
  filePath: z.string(),
  thumbnailPath: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  fileSize: z.string(),
  caption: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create photo request schema (for form data uploads)
export const createPhotoSchema = z.object({
  linkedType: z.enum(['journal', 'measurement']),
  journalId: z.string().uuid().optional(),
  measurementId: z.string().uuid().optional(),
  caption: z.string().max(500).optional(),
});

// Update photo request schema
export const updatePhotoSchema = z.object({
  caption: z.string().max(500).nullable().optional(),
});

// Photo ID schema
export const photoIdSchema = z.object({
  id: z.string().uuid(),
});

// List photos request schema
export const listPhotosSchema = z.object({
  linkedType: z.enum(['journal', 'measurement']).optional(),
  journalId: z.string().uuid().optional(),
  measurementId: z.string().uuid().optional(),
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

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any(), // Will be validated separately for actual File object
  linkedType: z.enum(['journal', 'measurement']),
  linkedId: z.string().uuid(), // Either journalId or measurementId
  caption: z.string().max(500).optional(),
});

// Bulk photo upload schema
export const bulkPhotoUploadSchema = z.object({
  linkedType: z.enum(['journal', 'measurement']),
  linkedId: z.string().uuid(),
  captions: z.array(z.string().max(500).optional()).optional(),
});
