import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { CreateExperimentSchema, UpdateExperimentSchema, CompleteDailyTaskSchema } from '../types'
import { ExperimentsService } from '../services/experiments.service'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { isValidUUID } from '../utils/helpers'

const experiments = new Hono()

// All routes require authentication
experiments.use('*', authMiddleware)

// Create experiment
experiments.post('/', zValidator('json', CreateExperimentSchema), async (c) => {
  const user = getUserFromContext(c)
  const input = c.req.valid('json')
  
  const newExperiment = await ExperimentsService.create(user.userId, input)
  
  if (!newExperiment) {
    throw new HTTPException(400, { message: 'Failed to create experiment' })
  }
  
  return c.json({
    success: true,
    data: newExperiment
  })
})

// Get all experiments for user
experiments.get('/', async (c) => {
  const user = getUserFromContext(c)
  
  const userExperiments = await ExperimentsService.getByUserId(user.userId)
  
  return c.json({
    success: true,
    data: userExperiments
  })
})

// Get experiment by ID
experiments.get('/:id', async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid experiment ID' })
  }
  
  const experiment = await ExperimentsService.getById(id, user.userId)
  
  if (!experiment) {
    throw new HTTPException(404, { message: 'Experiment not found' })
  }
  
  return c.json({
    success: true,
    data: experiment
  })
})

// Update experiment
experiments.put('/:id', zValidator('json', UpdateExperimentSchema), async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  const input = c.req.valid('json')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid experiment ID' })
  }
  
  const updatedExperiment = await ExperimentsService.update(id, user.userId, input)
  
  if (!updatedExperiment) {
    throw new HTTPException(404, { message: 'Experiment not found or update failed' })
  }
  
  return c.json({
    success: true,
    data: updatedExperiment
  })
})

// Delete experiment
experiments.delete('/:id', async (c) => {
  const user = getUserFromContext(c)
  const id = c.req.param('id')
  
  if (!isValidUUID(id)) {
    throw new HTTPException(400, { message: 'Invalid experiment ID' })
  }
  
  const success = await ExperimentsService.delete(id, user.userId)
  
  if (!success) {
    throw new HTTPException(404, { message: 'Experiment not found or delete failed' })
  }
  
  return c.json({
    success: true,
    message: 'Experiment deleted successfully'
  })
})

// Get daily tasks for experiment
experiments.get('/:id/tasks', async (c) => {
  const user = getUserFromContext(c)
  const experimentId = c.req.param('id')
  
  if (!isValidUUID(experimentId)) {
    throw new HTTPException(400, { message: 'Invalid experiment ID' })
  }
  
  // Verify experiment belongs to user
  const experiment = await ExperimentsService.getById(experimentId, user.userId)
  if (!experiment) {
    throw new HTTPException(404, { message: 'Experiment not found' })
  }
  
  const tasks = await ExperimentsService.getDailyTasks(experimentId)
  
  return c.json({
    success: true,
    data: tasks
  })
})

// Complete/update daily task
experiments.post('/:id/tasks', zValidator('json', CompleteDailyTaskSchema), async (c) => {
  const user = getUserFromContext(c)
  const experimentId = c.req.param('id')
  const input = c.req.valid('json')
  
  if (!isValidUUID(experimentId)) {
    throw new HTTPException(400, { message: 'Invalid experiment ID' })
  }
  
  // Verify experiment belongs to user
  const experiment = await ExperimentsService.getById(experimentId, user.userId)
  if (!experiment) {
    throw new HTTPException(404, { message: 'Experiment not found' })
  }
  
  const task = await ExperimentsService.completeDailyTask(experimentId, input)
  
  if (!task) {
    throw new HTTPException(400, { message: 'Failed to update daily task' })
  }
  
  return c.json({
    success: true,
    data: task
  })
})

// Get tasks in date range
experiments.get('/:id/tasks/range', async (c) => {
  const user = getUserFromContext(c)
  const experimentId = c.req.param('id')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  
  if (!isValidUUID(experimentId)) {
    throw new HTTPException(400, { message: 'Invalid experiment ID' })
  }
  
  if (!startDate || !endDate) {
    throw new HTTPException(400, { message: 'startDate and endDate query parameters are required' })
  }
  
  // Verify experiment belongs to user
  const experiment = await ExperimentsService.getById(experimentId, user.userId)
  if (!experiment) {
    throw new HTTPException(404, { message: 'Experiment not found' })
  }
  
  const tasks = await ExperimentsService.getTasksInDateRange(experimentId, startDate, endDate)
  
  return c.json({
    success: true,
    data: tasks
  })
})

export default experiments
