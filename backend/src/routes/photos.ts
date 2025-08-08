import { Hono } from 'hono';
import { eq, desc, and, or } from 'drizzle-orm';
import { db } from '../db';
import { photos, journals, measurements } from '../db/schema';
import { jwtAuth } from '../middleware/auth';
import logger, { handleApiError } from '../utils/logger';
import { processImageUpload, deletePhotoFiles, type ProcessedFile } from '../utils/fileUpload';
import type {
  CreatePhotoRequest,
  UpdatePhotoRequest,
  PhotoResponse,
  ListPhotosRequest,
  ListPhotosResponse,
  PhotoUploadResponse,
  BulkPhotoUploadRequest,
  BulkPhotoUploadResponse,
} from '../../../shared/types/photos';
import { createPhotoSchema, updatePhotoSchema, listPhotosSchema, photoIdSchema } from '../validation/photos';

const photosRouter = new Hono();

// Apply authentication to all routes
photosRouter.use('*', jwtAuth);

/**
 * Upload a new photo
 * POST /photos
 */
photosRouter.post('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const formData = await c.req.formData();

    const file = formData.get('file') as File;
    const linkedType = formData.get('linkedType') as string;
    const linkedId = formData.get('linkedId') as string;
    const caption = formData.get('caption') as string | null;

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    if (!linkedType || !linkedId) {
      return c.json({ success: false, error: 'linkedType and linkedId are required' }, 400);
    }

    // Validate linkedType and linkedId
    const validatedData = createPhotoSchema.parse({
      linkedType,
      journalId: linkedType === 'journal' ? linkedId : undefined,
      measurementId: linkedType === 'measurement' ? linkedId : undefined,
      caption: caption || undefined,
    }) as CreatePhotoRequest;

    // Verify the linked entity exists and belongs to user
    if (linkedType === 'journal') {
      const journal = await db
        .select({ id: journals.id })
        .from(journals)
        .where(and(eq(journals.id, linkedId), eq(journals.userId, userId)))
        .limit(1);

      if (!journal.length) {
        return c.json({ success: false, error: 'Journal not found' }, 404);
      }
    } else if (linkedType === 'measurement') {
      const measurement = await db
        .select({ id: measurements.id })
        .from(measurements)
        .where(and(eq(measurements.id, linkedId), eq(measurements.userId, userId)))
        .limit(1);

      if (!measurement.length) {
        return c.json({ success: false, error: 'Measurement not found' }, 404);
      }
    }

    // Convert File to ProcessedFile
    const buffer = await file.arrayBuffer();
    const processedFile: ProcessedFile = {
      buffer: Buffer.from(buffer),
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
    };

    // Process the image upload - handle validation errors separately
    let uploadResult: any;
    try {
      uploadResult = await processImageUpload(processedFile);
    } catch (error: any) {
      // Check if it's a file validation error (not a Sharp/system error)
      if (
        error?.message?.includes('File too large') ||
        error?.message?.includes('Unsupported file format') ||
        error?.message?.includes('File must be an image')
      ) {
        return c.json({ success: false, error: error.message }, 400);
      }
      // Re-throw other errors to be handled by main catch block
      throw error;
    }

    // Create photo record in database
    const newPhoto = await db
      .insert(photos)
      .values({
        userId,
        linkedType: linkedType as 'journal' | 'measurement',
        journalId: linkedType === 'journal' ? linkedId : null,
        measurementId: linkedType === 'measurement' ? linkedId : null,
        filePath: uploadResult.filePath,
        thumbnailPath: uploadResult.thumbnailPath,
        originalFilename: uploadResult.originalFilename,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.fileSize,
        caption: caption || null,
      })
      .returning();

    const photo = newPhoto[0];

    const response: PhotoResponse = {
      ...photo,
      linkedType: photo.linkedType as 'journal' | 'measurement',
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    };

    logger.info(`Uploaded photo for user ${userId}`, {
      photoId: photo.id,
      linkedType,
      linkedId,
      filename: uploadResult.originalFilename,
    });

    const uploadResponse: PhotoUploadResponse = {
      success: true,
      photo: response,
    };

    return c.json(uploadResponse, 201);
  } catch (error) {
    return handleApiError(error, 'Failed to upload photo');
  }
});

/**
 * Upload multiple photos
 * POST /photos/bulk
 */
photosRouter.post('/bulk', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const formData = await c.req.formData();

    const files = formData.getAll('files') as File[];
    const linkedType = formData.get('linkedType') as string;
    const linkedId = formData.get('linkedId') as string;

    // Parse captions array if provided
    let captions: (string | undefined)[] = [];
    const captionsString = formData.get('captions') as string;
    if (captionsString) {
      try {
        captions = JSON.parse(captionsString);
      } catch {
        captions = [];
      }
    }

    if (!files || files.length === 0) {
      return c.json({ success: false, errors: ['No files provided'] }, 400);
    }

    if (!linkedType || !linkedId) {
      return c.json({ success: false, errors: ['linkedType and linkedId are required'] }, 400);
    }

    // Validate linkedType and linkedId
    const validatedData = {
      linkedType,
      linkedId,
      captions,
    } as BulkPhotoUploadRequest;

    // Verify the linked entity exists and belongs to user
    if (linkedType === 'journal') {
      const journal = await db
        .select({ id: journals.id })
        .from(journals)
        .where(and(eq(journals.id, linkedId), eq(journals.userId, userId)))
        .limit(1);

      if (!journal.length) {
        return c.json({ success: false, errors: ['Journal not found'] }, 404);
      }
    } else if (linkedType === 'measurement') {
      const measurement = await db
        .select({ id: measurements.id })
        .from(measurements)
        .where(and(eq(measurements.id, linkedId), eq(measurements.userId, userId)))
        .limit(1);

      if (!measurement.length) {
        return c.json({ success: false, errors: ['Measurement not found'] }, 404);
      }
    }

    const uploadedPhotos: PhotoResponse[] = [];
    const errors: string[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const caption = captions[i] || null;

      try {
        // Convert File to ProcessedFile
        const buffer = await file.arrayBuffer();
        const processedFile: ProcessedFile = {
          buffer: Buffer.from(buffer),
          originalFilename: file.name,
          mimeType: file.type,
          size: file.size,
        };

        // Process the image upload - handle validation errors separately
        let uploadResult: any;
        try {
          uploadResult = await processImageUpload(processedFile);
        } catch (error: any) {
          // Check if it's a file validation error
          if (
            error?.message?.includes('File too large') ||
            error?.message?.includes('Unsupported file format') ||
            error?.message?.includes('File must be an image')
          ) {
            errors.push(`File ${file.name}: ${error.message}`);
            continue;
          }
          // Re-throw other errors
          throw error;
        }

        // Create photo record in database
        const newPhoto = await db
          .insert(photos)
          .values({
            userId,
            linkedType: linkedType as 'journal' | 'measurement',
            journalId: linkedType === 'journal' ? linkedId : null,
            measurementId: linkedType === 'measurement' ? linkedId : null,
            filePath: uploadResult.filePath,
            thumbnailPath: uploadResult.thumbnailPath,
            originalFilename: uploadResult.originalFilename,
            mimeType: uploadResult.mimeType,
            fileSize: uploadResult.fileSize,
            caption,
          })
          .returning();

        const photo = newPhoto[0];

        uploadedPhotos.push({
          ...photo,
          linkedType: photo.linkedType as 'journal' | 'measurement',
          createdAt: photo.createdAt.toISOString(),
          updatedAt: photo.updatedAt.toISOString(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${file.name}: ${errorMessage}`);
      }
    }

    logger.info(`Bulk uploaded ${uploadedPhotos.length}/${files.length} photos for user ${userId}`, {
      linkedType,
      linkedId,
      successCount: uploadedPhotos.length,
      totalCount: files.length,
    });

    const bulkResponse: BulkPhotoUploadResponse = {
      success: uploadedPhotos.length > 0,
      photos: uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
      successCount: uploadedPhotos.length,
      totalCount: files.length,
    };

    return c.json(bulkResponse, uploadedPhotos.length > 0 ? 201 : 400);
  } catch (error) {
    return handleApiError(error, 'Failed to bulk upload photos');
  }
});

/**
 * Get all photos for the authenticated user
 * GET /photos
 */
photosRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const query = c.req.query();

    // Validate query parameters
    const validatedQuery = listPhotosSchema.parse(query) as ListPhotosRequest;

    // Build the query
    let whereConditions = [eq(photos.userId, userId)];

    if (validatedQuery.linkedType) {
      whereConditions.push(eq(photos.linkedType, validatedQuery.linkedType));
    }

    if (validatedQuery.journalId) {
      whereConditions.push(eq(photos.journalId, validatedQuery.journalId));
    }

    if (validatedQuery.measurementId) {
      whereConditions.push(eq(photos.measurementId, validatedQuery.measurementId));
    }

    const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

    // Get photos with pagination
    const result = await db
      .select()
      .from(photos)
      .where(whereClause)
      .orderBy(desc(photos.createdAt))
      .limit(validatedQuery.limit || 50)
      .offset(validatedQuery.offset || 0);

    // Get total count for pagination
    const countResult = await db.select({ count: photos.id }).from(photos).where(whereClause);

    // Format response
    const photoResponses: PhotoResponse[] = result.map((photo) => ({
      ...photo,
      linkedType: photo.linkedType as 'journal' | 'measurement',
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    }));

    const response: ListPhotosResponse = {
      photos: photoResponses,
      total: countResult.length,
    };

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch photos');
  }
});

/**
 * Get a specific photo by ID
 * GET /photos/:id
 */
photosRouter.get('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { id } = photoIdSchema.parse({ id: c.req.param('id') });

    const result = await db
      .select()
      .from(photos)
      .where(and(eq(photos.id, id), eq(photos.userId, userId)))
      .limit(1);

    if (!result.length) {
      return c.json({ success: false, error: 'Photo not found' }, 404);
    }

    const photo = result[0];

    const response: PhotoResponse = {
      ...photo,
      linkedType: photo.linkedType as 'journal' | 'measurement',
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    };

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch photo');
  }
});

/**
 * Update a photo (caption only)
 * PUT /photos/:id
 */
photosRouter.put('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { id } = photoIdSchema.parse({ id: c.req.param('id') });
    const body = await c.req.json();

    // Validate the request body
    const validatedData = updatePhotoSchema.parse(body) as UpdatePhotoRequest;

    // Check if photo exists and belongs to user
    const existingPhoto = await db
      .select()
      .from(photos)
      .where(and(eq(photos.id, id), eq(photos.userId, userId)))
      .limit(1);

    if (!existingPhoto.length) {
      return c.json({ success: false, error: 'Photo not found' }, 404);
    }

    // Update the photo
    const updatedPhoto = await db
      .update(photos)
      .set({
        caption: validatedData.caption,
        updatedAt: new Date(),
      })
      .where(eq(photos.id, id))
      .returning();

    const photo = updatedPhoto[0];

    const response: PhotoResponse = {
      ...photo,
      linkedType: photo.linkedType as 'journal' | 'measurement',
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    };

    logger.info(`Updated photo ${id} for user ${userId}`);

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to update photo');
  }
});

/**
 * Delete a photo
 * DELETE /photos/:id
 */
photosRouter.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { id } = photoIdSchema.parse({ id: c.req.param('id') });

    // Check if photo exists and belongs to user
    const existingPhoto = await db
      .select()
      .from(photos)
      .where(and(eq(photos.id, id), eq(photos.userId, userId)))
      .limit(1);

    if (!existingPhoto.length) {
      return c.json({ success: false, error: 'Photo not found' }, 404);
    }

    const photo = existingPhoto[0];

    // Delete the photo files from filesystem
    try {
      await deletePhotoFiles(photo.filePath, photo.thumbnailPath);
    } catch (error) {
      logger.warn(`Failed to delete photo files for photo ${id}`, error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the photo record from database
    await db.delete(photos).where(eq(photos.id, id));

    logger.info(`Deleted photo ${id} for user ${userId}`);

    return c.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to delete photo');
  }
});

export default photosRouter;
