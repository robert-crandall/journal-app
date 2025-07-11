/**
 * Avatar utility functions for base64 image validation and processing
 */
import { z } from 'zod';

// Maximum file size in bytes (2MB)
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

// Allowed image formats
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates a base64 encoded image string
 * @param base64String - The base64 string to validate
 * @returns true if valid, throws error if invalid
 */
export function validateBase64Image(base64String: string): boolean {
  // Check if it's a valid base64 data URL
  const dataUrlRegex = /^data:([a-zA-Z0-9][a-zA-Z0-9\/+]*);base64,(.+)$/;
  const match = base64String.match(dataUrlRegex);

  if (!match) {
    throw new Error('Invalid base64 image format. Must be a data URL.');
  }

  const [, mimeType, base64Data] = match;

  // Validate MIME type
  if (!ALLOWED_FORMATS.includes(mimeType)) {
    throw new Error(`Unsupported image format. Allowed formats: ${ALLOWED_FORMATS.join(', ')}`);
  }

  // Validate base64 data format
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64Data)) {
    throw new Error('Invalid base64 data format');
  }

  // Validate base64 data
  try {
    const buffer = Buffer.from(base64Data, 'base64');

    // Check if the decoded length makes sense
    const expectedLength = Math.floor((base64Data.length * 3) / 4);
    if (Math.abs(buffer.length - expectedLength) > 2) {
      throw new Error('Invalid base64 data - length mismatch');
    }

    // Check file size
    if (buffer.length > MAX_AVATAR_SIZE) {
      throw new Error(`Image too large. Maximum size: ${MAX_AVATAR_SIZE / (1024 * 1024)}MB`);
    }

    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Invalid base64 data');
  }
}

/**
 * Creates a Zod schema for validating base64 avatar images
 */
export function createAvatarSchema() {
  return {
    avatar: z
      .string()
      .optional()
      .refine(
        (value: string | undefined) => {
          if (!value) return true; // Optional field
          try {
            validateBase64Image(value);
            return true;
          } catch {
            return false;
          }
        },
        {
          message: 'Invalid avatar image. Must be a base64 encoded image (JPEG, PNG, or WebP) under 2MB',
        },
      ),
  };
}
