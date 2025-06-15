import { Context } from 'hono';
import { db } from '../db';
import { experiments } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { ExperimentInput, ApiResponse, Experiment } from '../types/api';

// Get all experiments for the current user
export async function getExperiments(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    
    const results = await db
      .select()
      .from(experiments)
      .where(eq(experiments.userId, currentUser.id))
      .orderBy(desc(experiments.createdAt));
    
    const response: ApiResponse<{ experiments: Experiment[] }> = {
      success: true,
      data: {
        experiments: results.map((exp: any) => ({
          ...exp,
          createdAt: exp.createdAt.toISOString(),
          updatedAt: exp.updatedAt.toISOString(),
          completedAt: exp.completedAt ? exp.completedAt.toISOString() : null,
        })),
      },
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Get experiments error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve experiments' });
  }
}

// Get a specific experiment by ID
export async function getExperimentById(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const experimentId = c.req.param('id');
    
    const result = await db
      .select()
      .from(experiments)
      .where(
        and(
          eq(experiments.id, experimentId),
          eq(experiments.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (result.length === 0) {
      throw new HTTPException(404, { message: 'Experiment not found' });
    }
    
    const experiment = result[0];
    
    const response: ApiResponse<{ experiment: Experiment }> = {
      success: true,
      data: {
        experiment: {
          ...experiment,
          createdAt: experiment.createdAt.toISOString(),
          updatedAt: experiment.updatedAt.toISOString(),
          completedAt: experiment.completedAt ? experiment.completedAt.toISOString() : null,
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get experiment by ID error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve experiment' });
  }
}

// Create a new experiment
export async function createExperiment(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json() as ExperimentInput;
    
    const result = await db.insert(experiments).values({
      userId: currentUser.id,
      title: body.title,
      description: body.description || null,
      startDate: body.startDate,
      endDate: body.endDate,
      successCriteria: body.successCriteria || null,
      isActive: true,
    }).returning();
    
    const experiment = result[0];
    
    const response: ApiResponse<{ experiment: Experiment }> = {
      success: true,
      data: {
        experiment: {
          ...experiment,
          createdAt: experiment.createdAt.toISOString(),
          updatedAt: experiment.updatedAt.toISOString(),
          completedAt: null,
        },
      },
    };
    
    return c.json(response, 201);
  } catch (error) {
    console.error('Create experiment error:', error);
    throw new HTTPException(500, { message: 'Failed to create experiment' });
  }
}

// Update an experiment
export async function updateExperiment(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const experimentId = c.req.param('id');
    const body = await c.req.json() as ExperimentInput;
    
    // Check if experiment exists and belongs to user
    const existingExperiment = await db
      .select()
      .from(experiments)
      .where(
        and(
          eq(experiments.id, experimentId),
          eq(experiments.userId, currentUser.id)
        )
      )
      .limit(1);
      
    if (existingExperiment.length === 0) {
      throw new HTTPException(404, { message: 'Experiment not found' });
    }
    
    const result = await db.update(experiments)
      .set({
        title: body.title,
        description: body.description || null,
        startDate: body.startDate,
        endDate: body.endDate,
        successCriteria: body.successCriteria || null,
        updatedAt: new Date(),
      })
      .where(eq(experiments.id, experimentId))
      .returning();
    
    const experiment = result[0];
    
    const response: ApiResponse<{ experiment: Experiment }> = {
      success: true,
      data: {
        experiment: {
          ...experiment,
          createdAt: experiment.createdAt.toISOString(),
          updatedAt: experiment.updatedAt.toISOString(),
          completedAt: experiment.completedAt ? experiment.completedAt.toISOString() : null,
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update experiment error:', error);
    throw new HTTPException(500, { message: 'Failed to update experiment' });
  }
}

// Complete an experiment with success/failure status
export async function completeExperiment(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const experimentId = c.req.param('id');
    
    // Get success value from request body
    const { isSuccessful } = await c.req.json() as { isSuccessful: boolean };
    
    // Check if experiment exists and belongs to user
    const existingExperiment = await db
      .select()
      .from(experiments)
      .where(
        and(
          eq(experiments.id, experimentId),
          eq(experiments.userId, currentUser.id)
        )
      )
      .limit(1);
      
    if (existingExperiment.length === 0) {
      throw new HTTPException(404, { message: 'Experiment not found' });
    }
    
    // Update experiment as completed
    const result = await db.update(experiments)
      .set({
        isActive: false,
        isSuccessful: isSuccessful,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(experiments.id, experimentId))
      .returning();
    
    const experiment = result[0];
    
    const response: ApiResponse<{ experiment: Experiment }> = {
      success: true,
      data: {
        experiment: {
          ...experiment,
          createdAt: experiment.createdAt.toISOString(),
          updatedAt: experiment.updatedAt.toISOString(),
          completedAt: experiment.completedAt!.toISOString(),
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Complete experiment error:', error);
    throw new HTTPException(500, { message: 'Failed to complete experiment' });
  }
}

// Delete an experiment
export async function deleteExperiment(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const experimentId = c.req.param('id');
    
    // Check if experiment exists and belongs to user
    const existingExperiment = await db
      .select()
      .from(experiments)
      .where(
        and(
          eq(experiments.id, experimentId),
          eq(experiments.userId, currentUser.id)
        )
      )
      .limit(1);
      
    if (existingExperiment.length === 0) {
      throw new HTTPException(404, { message: 'Experiment not found' });
    }
    
    // Delete experiment (cascade will handle relationships)
    await db.delete(experiments).where(eq(experiments.id, experimentId));
    
    return c.json({
      success: true,
      message: 'Experiment deleted successfully',
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete experiment error:', error);
    throw new HTTPException(500, { message: 'Failed to delete experiment' });
  }
}
