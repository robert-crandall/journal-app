import { zodValidatorWithErrorHandler } from '../utils/validation';
import { Hono } from 'hono';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { measurements, users } from '../db/schema';
import { jwtAuth } from '../middleware/auth';
import logger, { handleApiError } from '../utils/logger';
import { calculateAverageWaist, calculateBodyFatPercentage } from '../utils/bodyFat';
import type {
  CreateMeasurementRequest,
  UpdateMeasurementRequest,
  MeasurementResponse,
  ListMeasurementsRequest,
  ListMeasurementsResponse,
} from '../../../shared/types/measurements';
import type { Sex } from '../../../shared/types/users';
import { createMeasurementSchema, updateMeasurementSchema, listMeasurementsSchema, measurementIdSchema } from '../validation/measurements';

const measurementsRouter = new Hono();

// Apply authentication to all routes
measurementsRouter.use('*', jwtAuth);

/**
 * Create a new measurement
 * POST /measurements
 */
measurementsRouter.post('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json();

    // Validate the request body
    const validatedData = createMeasurementSchema.parse(body) as CreateMeasurementRequest;

    // Get user data for body fat calculation
    const user = await db
      .select({
        heightCm: users.heightCm,
        sex: users.sex,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const userData = user[0];

    // Calculate average waist measurement
    const waistCm = calculateAverageWaist(validatedData.waistAtNavelCm, validatedData.waistAboveNavelCm, validatedData.waistBelowNavelCm);

    // Calculate body fat percentage if we have required data
    let bodyFatPercentage: number | null = null;
    if (userData.sex && userData.heightCm && (userData.sex === 'male' || userData.sex === 'female')) {
      bodyFatPercentage = calculateBodyFatPercentage(userData.sex as Sex, waistCm, validatedData.neckCm || null, userData.heightCm, validatedData.hipCm);
    }

    // Store raw waist measurements in extra field
    const extra: Record<string, number> = validatedData.extra ? { ...validatedData.extra } : {};
    if (validatedData.waistAtNavelCm) extra.waist_at_navel_cm = validatedData.waistAtNavelCm;
    if (validatedData.waistAboveNavelCm) extra.waist_above_navel_cm = validatedData.waistAboveNavelCm;
    if (validatedData.waistBelowNavelCm) extra.waist_below_navel_cm = validatedData.waistBelowNavelCm;

    // Create the measurement
    const newMeasurement = await db
      .insert(measurements)
      .values({
        userId,
        recordedDate: validatedData.recordedDate || new Date().toISOString().split('T')[0],
        weightLbs: validatedData.weightLbs || null,
        neckCm: validatedData.neckCm || null,
        waistCm,
        hipCm: validatedData.hipCm || null,
        bodyFatPercentage,
        notes: validatedData.notes || null,
        extra: Object.keys(extra).length > 0 ? extra : null,
      })
      .returning();

    const measurement = newMeasurement[0];

    // Format response with raw waist measurements
    const response: MeasurementResponse = {
      ...measurement,
      createdAt: measurement.createdAt.toISOString(),
      updatedAt: measurement.updatedAt.toISOString(),
      extra: measurement.extra as Record<string, number> | null,
      waistAtNavelCm: validatedData.waistAtNavelCm,
      waistAboveNavelCm: validatedData.waistAboveNavelCm,
      waistBelowNavelCm: validatedData.waistBelowNavelCm,
    };

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to create measurement');
  }
});

/**
 * Get all measurements for the authenticated user
 * GET /measurements
 */
measurementsRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const query = c.req.query();

    // Validate query parameters
    const validatedQuery = listMeasurementsSchema.parse(query) as ListMeasurementsRequest;

    // Build the query
    let whereConditions = [eq(measurements.userId, userId)];

    if (validatedQuery.startDate) {
      whereConditions.push(gte(measurements.recordedDate, validatedQuery.startDate));
    }

    if (validatedQuery.endDate) {
      whereConditions.push(lte(measurements.recordedDate, validatedQuery.endDate));
    }

    const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

    // Get measurements with pagination
    const result = await db
      .select()
      .from(measurements)
      .where(whereClause)
      .orderBy(desc(measurements.recordedDate))
      .limit(validatedQuery.limit || 50)
      .offset(validatedQuery.offset || 0);

    // Get total count for pagination
    const countResult = await db.select({ count: measurements.id }).from(measurements).where(whereClause);

    // Format response with raw waist measurements
    const measurementResponses: MeasurementResponse[] = result.map((measurement) => {
      const extra = measurement.extra as Record<string, number> | null;
      return {
        ...measurement,
        createdAt: measurement.createdAt.toISOString(),
        updatedAt: measurement.updatedAt.toISOString(),
        extra: measurement.extra as Record<string, number> | null,
        waistAtNavelCm: extra?.waist_at_navel_cm,
        waistAboveNavelCm: extra?.waist_above_navel_cm,
        waistBelowNavelCm: extra?.waist_below_navel_cm,
      };
    });

    const response: ListMeasurementsResponse = {
      measurements: measurementResponses,
      total: countResult.length,
    };

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch measurements');
  }
});

/**
 * Get a specific measurement by ID
 * GET /measurements/:id
 */
measurementsRouter.get('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { id } = measurementIdSchema.parse({ id: c.req.param('id') });

    const result = await db
      .select()
      .from(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.userId, userId)))
      .limit(1);

    if (!result.length) {
      return c.json({ success: false, error: 'Measurement not found' }, 404);
    }

    const measurement = result[0];
    const extra = measurement.extra as Record<string, number> | null;

    const response: MeasurementResponse = {
      ...measurement,
      createdAt: measurement.createdAt.toISOString(),
      updatedAt: measurement.updatedAt.toISOString(),
      extra: measurement.extra as Record<string, number> | null,
      waistAtNavelCm: extra?.waist_at_navel_cm,
      waistAboveNavelCm: extra?.waist_above_navel_cm,
      waistBelowNavelCm: extra?.waist_below_navel_cm,
    };

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch measurement');
  }
});

/**
 * Update a measurement
 * PUT /measurements/:id
 */
measurementsRouter.put('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { id } = measurementIdSchema.parse({ id: c.req.param('id') });
    const body = await c.req.json();

    // Validate the request body
    const validatedData = updateMeasurementSchema.parse(body) as UpdateMeasurementRequest;

    // Check if measurement exists and belongs to user
    const existingMeasurement = await db
      .select()
      .from(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.userId, userId)))
      .limit(1);

    if (!existingMeasurement.length) {
      return c.json({ success: false, error: 'Measurement not found' }, 404);
    }

    // Get user data for body fat calculation
    const user = await db
      .select({
        heightCm: users.heightCm,
        sex: users.sex,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userData = user[0];

    // Calculate average waist measurement
    const waistCm = calculateAverageWaist(validatedData.waistAtNavelCm, validatedData.waistAboveNavelCm, validatedData.waistBelowNavelCm);

    // Calculate body fat percentage if we have required data
    let bodyFatPercentage: number | null = null;
    if (userData.sex && userData.heightCm && (userData.sex === 'male' || userData.sex === 'female')) {
      bodyFatPercentage = calculateBodyFatPercentage(userData.sex as Sex, waistCm, validatedData.neckCm || null, userData.heightCm, validatedData.hipCm);
    }

    // Store raw waist measurements in extra field
    const extra: Record<string, number> = validatedData.extra ? { ...validatedData.extra } : {};
    if (validatedData.waistAtNavelCm) extra.waist_at_navel_cm = validatedData.waistAtNavelCm;
    if (validatedData.waistAboveNavelCm) extra.waist_above_navel_cm = validatedData.waistAboveNavelCm;
    if (validatedData.waistBelowNavelCm) extra.waist_below_navel_cm = validatedData.waistBelowNavelCm;

    // Update the measurement
    const updatedMeasurement = await db
      .update(measurements)
      .set({
        recordedDate: validatedData.recordedDate,
        weightLbs: validatedData.weightLbs,
        neckCm: validatedData.neckCm,
        waistCm,
        hipCm: validatedData.hipCm,
        bodyFatPercentage,
        notes: validatedData.notes,
        extra: Object.keys(extra).length > 0 ? extra : null,
        updatedAt: new Date(),
      })
      .where(eq(measurements.id, id))
      .returning();

    const measurement = updatedMeasurement[0];

    // Format response with raw waist measurements
    const response: MeasurementResponse = {
      ...measurement,
      createdAt: measurement.createdAt.toISOString(),
      updatedAt: measurement.updatedAt.toISOString(),
      extra: measurement.extra as Record<string, number> | null,
      waistAtNavelCm: validatedData.waistAtNavelCm,
      waistAboveNavelCm: validatedData.waistAboveNavelCm,
      waistBelowNavelCm: validatedData.waistBelowNavelCm,
    };

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to update measurement');
  }
});

/**
 * Delete a measurement
 * DELETE /measurements/:id
 */
measurementsRouter.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const { id } = measurementIdSchema.parse({ id: c.req.param('id') });

    // Check if measurement exists and belongs to user
    const existingMeasurement = await db
      .select()
      .from(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.userId, userId)))
      .limit(1);

    if (!existingMeasurement.length) {
      return c.json({ success: false, error: 'Measurement not found' }, 404);
    }

    // Delete the measurement
    await db.delete(measurements).where(eq(measurements.id, id));

    return c.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to delete measurement');
  }
});

export default measurementsRouter;
