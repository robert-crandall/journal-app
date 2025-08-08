import sharp from 'sharp';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, extname, basename } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { env } from '../env';

// Configuration
const UPLOAD_DIR = env.UPLOAD_DIR;
const THUMBNAIL_WIDTH = 512;
const THUMBNAIL_QUALITY = 85;

// Supported image formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.heic', '.heif'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export interface FileUploadResult {
  filePath: string;
  thumbnailPath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: string;
}

export interface ProcessedFile {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  size: number;
}

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Validate file format and size
 */
export function validateImageFile(file: ProcessedFile): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  // Check file extension
  const ext = extname(file.originalFilename).toLowerCase();
  if (!SUPPORTED_FORMATS.includes(ext)) {
    return { isValid: false, error: `Unsupported file format. Supported: ${SUPPORTED_FORMATS.join(', ')}` };
  }

  // Check MIME type
  if (!file.mimeType.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' };
  }

  return { isValid: true };
}

/**
 * Generate unique filename with proper extension
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = extname(originalFilename);
  const nameWithoutExt = basename(originalFilename, ext);
  return `${nameWithoutExt}_${randomUUID()}${ext}`;
}

/**
 * Create thumbnail from image buffer
 */
export async function createThumbnail(imageBuffer: Buffer, originalPath: string): Promise<string> {
  const ext = extname(originalPath);
  const thumbnailFilename = `thumb_${basename(originalPath, ext)}.webp`; // Always use WebP for thumbnails
  const thumbnailPath = join(UPLOAD_DIR, thumbnailFilename);

  await sharp(imageBuffer)
    .rotate() // Auto-orient based on EXIF
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_WIDTH, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: THUMBNAIL_QUALITY })
    .toFile(thumbnailPath);

  return thumbnailFilename;
}

/**
 * Process and save uploaded image file
 */
export async function processImageUpload(file: ProcessedFile): Promise<FileUploadResult> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Ensure upload directory exists
  await ensureUploadDir();

  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(file.originalFilename);
  const filePath = join(UPLOAD_DIR, uniqueFilename);

  // Save original file
  await writeFile(filePath, file.buffer);

  // Create thumbnail
  const thumbnailFilename = await createThumbnail(file.buffer, uniqueFilename);

  return {
    filePath: uniqueFilename, // Store relative path only
    thumbnailPath: thumbnailFilename, // Store relative path only
    originalFilename: file.originalFilename,
    mimeType: file.mimeType,
    fileSize: file.size.toString(),
  };
}

/**
 * Delete photo files from filesystem
 */
export async function deletePhotoFiles(filePath: string, thumbnailPath: string): Promise<void> {
  try {
    const fullFilePath = join(UPLOAD_DIR, filePath);
    const fullThumbnailPath = join(UPLOAD_DIR, thumbnailPath);

    // Delete original file
    try {
      await unlink(fullFilePath);
    } catch (error) {
      console.warn(`Failed to delete original file: ${fullFilePath}`, error);
    }

    // Delete thumbnail
    try {
      await unlink(fullThumbnailPath);
    } catch (error) {
      console.warn(`Failed to delete thumbnail: ${fullThumbnailPath}`, error);
    }
  } catch (error) {
    console.error('Error deleting photo files:', error);
    throw error;
  }
}

/**
 * Get full file URL for serving
 */
export function getFileUrl(filename: string): string {
  return `${env.BASE_URL}/uploads/${filename}`;
}

/**
 * Get file stats for existing files
 */
export async function getFileStats(filePath: string): Promise<{ exists: boolean; size?: number }> {
  try {
    const fullPath = join(UPLOAD_DIR, filePath);
    if (!existsSync(fullPath)) {
      return { exists: false };
    }

    const stats = await import('fs').then((fs) => fs.promises.stat(fullPath));
    return { exists: true, size: stats.size };
  } catch {
    return { exists: false };
  }
}
