import { Hono } from 'hono'
import { db } from '../db/connection'
import { experiments, tasks, users } from '../db/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { z } from 'zod'

const app = new Hono()

// Validation schemas for experiments
const createExperimentSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000),
  hypothesis: z.string().min(1).max(500),
  duration: z.number().int().min(1).max(365), // Duration in days
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

const updateExperimentSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  hypothesis: z.string().min(1).max(500).optional(),
  status: z.enum(['active', 'paused', 'completed', 'abandoned']).optional(),
  results: z.string().max(1000).optional()
})

const experimentsQuerySchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['active', 'paused', 'completed', 'abandoned']).optional()
})

const experimentDetailQuerySchema = z.object({
  userId: z.string().uuid()
})

// Helper function to calculate experiment progress and timeline
function calculateExperimentProgress(experiment: any, associatedTasks: any[]) {
  const now = new Date()
  const startDate = new Date(experiment.startDate)
  const endDate = experiment.endDate ? new Date(experiment.endDate) : new Date(startDate.getTime() + experiment.duration * 24 * 60 * 60 * 1000)
  
  // Calculate days remaining
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
  
  // Calculate task progress
  const totalTasks = associatedTasks.length
  const completedTasks = associatedTasks.filter(task => task.status === 'completed').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  return {
    daysRemaining,
    progressSummary: {
      totalTasks,
      completedTasks,
      completionRate
    },
    timeline: {
      startDate: experiment.startDate,
      endDate: endDate.toISOString(),
      duration: experiment.duration,
      isOverdue: experiment.status === 'active' && daysRemaining === 0
    }
  }
}

// Helper function to add experiment metadata to tasks
function addExperimentMetadata(task: any, experiment: any) {
  const now = new Date()
  const endDate = experiment.endDate ? new Date(experiment.endDate) : new Date(new Date(experiment.startDate).getTime() + experiment.duration * 24 * 60 * 60 * 1000)
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
  
  return {
    ...task,
    sourceMetadata: {
      type: 'experiment',
      hypothesis: experiment.hypothesis,
      duration: experiment.duration,
      daysRemaining,
      status: experiment.status,
      influencesAI: false // Key differentiation: experiments don't influence AI task generation
    }
  }
}

// Create a new experiment
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = createExperimentSchema.parse(body)
    
    // Verify user exists
    const user = await db.select().from(users).where(eq(users.id, validatedData.userId)).limit(1)
    if (user.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }
    
    // Calculate end date if not provided
    const startDate = validatedData.startDate ? new Date(validatedData.startDate) : new Date()
    const endDate = validatedData.endDate ? new Date(validatedData.endDate) : new Date(startDate.getTime() + validatedData.duration * 24 * 60 * 60 * 1000)
    
    const [experiment] = await db.insert(experiments).values({
      userId: validatedData.userId,
      title: validatedData.title,
      description: validatedData.description,
      hypothesis: validatedData.hypothesis,
      duration: validatedData.duration,
      startDate,
      endDate,
      status: 'active',
      createdAt: new Date()
    }).returning()
    
    // Add experiment-specific metadata
    const experimentWithMetadata = {
      ...experiment,
      type: 'experiment',
      influencesAI: false,
      daysRemaining: Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))),
      progressSummary: {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0
      }
    }
    
    return c.json({
      success: true,
      data: { experiment: experimentWithMetadata }
    }, 201)
  } catch (error) {
    console.error('Error creating experiment:', error)
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    return c.json({ success: false, error: 'Failed to create experiment' }, 500)
  }
})

// Get all experiments for a user
app.get('/', async (c) => {
  try {
    const query = c.req.query()
    const validatedQuery = experimentsQuerySchema.parse(query)
    
    let whereConditions = [eq(experiments.userId, validatedQuery.userId)]
    
    if (validatedQuery.status) {
      whereConditions.push(eq(experiments.status, validatedQuery.status))
    }
    
    const userExperiments = await db.select()
      .from(experiments)
      .where(and(...whereConditions))
      .orderBy(desc(experiments.createdAt))
    
    // Get associated tasks for progress calculation
    const experimentsWithProgress = await Promise.all(
      userExperiments.map(async (experiment) => {
        const associatedTasks = await db.select()
          .from(tasks)
          .where(and(
            eq(tasks.sourceId, experiment.id),
            eq(tasks.source, 'experiment')
          ))
        
        const progress = calculateExperimentProgress(experiment, associatedTasks)
        
        return {
          ...experiment,
          type: 'experiment',
          influencesAI: false, // Key differentiation
          ...progress
        }
      })
    )
    
    return c.json({
      success: true,
      data: { experiments: experimentsWithProgress }
    })
  } catch (error) {
    console.error('Error fetching experiments:', error)
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, 400)
    }
    return c.json({ success: false, error: 'Failed to fetch experiments' }, 500)
  }
})

// Get specific experiment with detailed information
app.get('/:id', async (c) => {
  try {
    const experimentId = c.req.param('id')
    const query = c.req.query()
    const validatedQuery = experimentDetailQuerySchema.parse(query)
    
    const experiment = await db.select()
      .from(experiments)
      .where(eq(experiments.id, experimentId))
      .limit(1)
    
    if (experiment.length === 0) {
      return c.json({ success: false, error: 'Experiment not found' }, 404)
    }
    
    // Check authorization
    if (experiment[0].userId !== validatedQuery.userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }
    
    // Get associated tasks
    const associatedTasks = await db.select()
      .from(tasks)
      .where(and(
        eq(tasks.sourceId, experimentId),
        eq(tasks.source, 'experiment')
      ))
      .orderBy(desc(tasks.createdAt))
    
    const progress = calculateExperimentProgress(experiment[0], associatedTasks)
    
    const experimentWithDetails = {
      ...experiment[0],
      type: 'experiment',
      influencesAI: false, // Key differentiation
      ...progress,
      tasks: associatedTasks
    }
    
    return c.json({
      success: true,
      data: { experiment: experimentWithDetails }
    })
  } catch (error) {
    console.error('Error fetching experiment:', error)
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, 400)
    }
    return c.json({ success: false, error: 'Failed to fetch experiment' }, 500)
  }
})

// Update an experiment
app.put('/:id', async (c) => {
  try {
    const experimentId = c.req.param('id')
    const body = await c.req.json()
    const validatedData = updateExperimentSchema.parse(body)
    
    // Get current experiment
    const currentExperiment = await db.select()
      .from(experiments)
      .where(eq(experiments.id, experimentId))
      .limit(1)
    
    if (currentExperiment.length === 0) {
      return c.json({ success: false, error: 'Experiment not found' }, 404)
    }
    
    // Check authorization
    if (currentExperiment[0].userId !== validatedData.userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }
    
    // Prepare update data
    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.hypothesis !== undefined) updateData.hypothesis = validatedData.hypothesis
    if (validatedData.results !== undefined) updateData.results = validatedData.results
    
    // Handle status changes
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      
      // Set completion date for completed/abandoned experiments
      if (validatedData.status === 'completed' || validatedData.status === 'abandoned') {
        updateData.completedAt = new Date()
      }
    }
    
    const [updatedExperiment] = await db.update(experiments)
      .set(updateData)
      .where(eq(experiments.id, experimentId))
      .returning()
    
    // Get associated tasks for progress calculation
    const associatedTasks = await db.select()
      .from(tasks)
      .where(and(
        eq(tasks.sourceId, experimentId),
        eq(tasks.source, 'experiment')
      ))
    
    const progress = calculateExperimentProgress(updatedExperiment, associatedTasks)
    
    const experimentWithMetadata = {
      ...updatedExperiment,
      type: 'experiment',
      influencesAI: false,
      ...progress
    }
    
    return c.json({
      success: true,
      data: { experiment: experimentWithMetadata }
    })
  } catch (error) {
    console.error('Error updating experiment:', error)
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    return c.json({ success: false, error: 'Failed to update experiment' }, 500)
  }
})

// Delete an experiment (converts associated tasks to ad-hoc)
app.delete('/:id', async (c) => {
  try {
    const experimentId = c.req.param('id')
    const query = c.req.query()
    const validatedQuery = experimentDetailQuerySchema.parse(query)
    
    const experiment = await db.select()
      .from(experiments)
      .where(eq(experiments.id, experimentId))
      .limit(1)
    
    if (experiment.length === 0) {
      return c.json({ success: false, error: 'Experiment not found' }, 404)
    }
    
    // Check authorization
    if (experiment[0].userId !== validatedQuery.userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }
    
    // Convert associated tasks to ad-hoc tasks (preserve the tasks but remove experiment association)
    await db.update(tasks)
      .set({
        source: 'ad-hoc',
        sourceId: null
      })
      .where(and(
        eq(tasks.sourceId, experimentId),
        eq(tasks.source, 'experiment')
      ))
    
    // Delete the experiment
    await db.delete(experiments).where(eq(experiments.id, experimentId))
    
    return c.json({
      success: true,
      data: { message: 'Experiment deleted successfully' }
    })
  } catch (error) {
    console.error('Error deleting experiment:', error)
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, 400)
    }
    return c.json({ success: false, error: 'Failed to delete experiment' }, 500)
  }
})

export default app
