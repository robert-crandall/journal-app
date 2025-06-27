import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { db } from '../db/connection'
import { tasks, taskCompletions, users, quests, experiments } from '../db/schema'
import { eq, and, or, inArray } from 'drizzle-orm'

// Validation schemas
const createTaskSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  source: z.enum(['ai', 'quest', 'experiment', 'todo', 'ad-hoc', 'external'], {
    errorMap: () => ({ message: 'Source must be one of: ai, quest, experiment, todo, ad-hoc, external' })
  }),
  sourceId: z.string().uuid().optional(),
  targetStats: z.array(z.string()).optional().nullable(),
  estimatedXp: z.number().int().min(0).default(0),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'completed', 'skipped']).default('pending'),
})

const updateTaskSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  targetStats: z.array(z.string()).optional().nullable(),
  estimatedXp: z.number().int().min(0).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(['pending', 'completed', 'skipped']).optional(),
  completedAt: z.string().datetime().optional().nullable(),
})

const taskQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  status: z.enum(['pending', 'completed', 'skipped']).optional(),
  source: z.enum(['ai', 'quest', 'experiment', 'todo', 'ad-hoc', 'external']).optional(),
  dashboard: z.string().transform(val => val === 'true').optional(), // Filter for dashboard display
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).optional(),
})

const userIdQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

const app = new Hono()

// POST /api/tasks - Create new task
app.post('/',
  zValidator('json', createTaskSchema),
  async (c) => {
    try {
      const data = c.req.valid('json')
      const { userId, sourceId, dueDate, ...taskData } = data

      // Verify user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        throw new HTTPException(403, { message: 'Unauthorized: User not found' })
      }

      // If sourceId is provided, verify it exists and belongs to user
      if (sourceId) {
        if (data.source === 'quest') {
          const quest = await db
            .select()
            .from(quests)
            .where(and(eq(quests.id, sourceId), eq(quests.userId, userId)))
            .limit(1)

          if (quest.length === 0) {
            throw new HTTPException(400, { message: 'Invalid quest ID or quest does not belong to user' })
          }
        } else if (data.source === 'experiment') {
          const experiment = await db
            .select()
            .from(experiments)
            .where(and(eq(experiments.id, sourceId), eq(experiments.userId, userId)))
            .limit(1)

          if (experiment.length === 0) {
            throw new HTTPException(400, { message: 'Invalid experiment ID or experiment does not belong to user' })
          }
        }
      }

      // Create the task
      const [task] = await db.insert(tasks).values({
        userId,
        sourceId: sourceId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        ...taskData,
      }).returning()

      return c.json({
        success: true,
        data: task
      }, 201)

    } catch (error) {
      console.error('Error creating task:', error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to create task' })
    }
  })

// GET /api/tasks - List tasks with filtering
app.get('/',
  zValidator('query', taskQuerySchema),
  async (c) => {
    try {
      const query = c.req.valid('query')
      const { userId, status, source, dashboard, limit = 50, offset = 0 } = query

      // Verify user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        throw new HTTPException(403, { message: 'Unauthorized: User not found' })
      }

      // Build query conditions
      const conditions = [eq(tasks.userId, userId)]

      if (status) {
        conditions.push(eq(tasks.status, status))
      }

      if (source) {
        conditions.push(eq(tasks.source, source))
      }

      // Dashboard filter excludes ad-hoc tasks (they have their own page)
      if (dashboard) {
        conditions.push(or(
          eq(tasks.source, 'ai'),
          eq(tasks.source, 'quest'),
          eq(tasks.source, 'experiment'),
          eq(tasks.source, 'todo')
        )!)
      }

      const tasksList = await db
        .select()
        .from(tasks)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(tasks.createdAt)

      return c.json({
        success: true,
        data: tasksList
      })

    } catch (error) {
      console.error('Error fetching tasks:', error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to fetch tasks' })
    }
  })

// GET /api/tasks/:id - Get specific task
app.get('/:id',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const taskId = c.req.param('id')
      const { userId } = c.req.valid('query')

      // Validate UUID format for taskId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(taskId)) {
        throw new HTTPException(404, { message: 'Task not found' })
      }

      // Verify user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        throw new HTTPException(403, { message: 'Unauthorized: User not found' })
      }

      // Check if task exists first
      const taskExists = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1)

      if (taskExists.length === 0) {
        throw new HTTPException(404, { message: 'Task not found' })
      }

      // Check if task belongs to user
      if (taskExists[0].userId !== userId) {
        throw new HTTPException(403, { message: 'Unauthorized: Task does not belong to user' })
      }

      return c.json({
        success: true,
        data: taskExists[0]
      })

    } catch (error) {
      console.error('Error fetching task:', error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to fetch task' })
    }
  })

// PUT /api/tasks/:id - Update task
app.put('/:id',
  zValidator('json', updateTaskSchema),
  async (c) => {
    try {
      const taskId = c.req.param('id')
      const data = c.req.valid('json')
      const { userId, completedAt, dueDate, ...updateData } = data

      // Verify user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        throw new HTTPException(403, { message: 'Unauthorized: User not found' })
      }

      // Verify task exists and belongs to user
      const existingTask = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .limit(1)

      if (existingTask.length === 0) {
        throw new HTTPException(404, { message: 'Task not found' })
      }

      // Prepare update data
      const updateFields: any = { ...updateData }
      
      if (completedAt !== undefined) {
        updateFields.completedAt = completedAt ? new Date(completedAt) : null
      }
      
      if (dueDate !== undefined) {
        updateFields.dueDate = dueDate ? new Date(dueDate) : null
      }

      updateFields.updatedAt = new Date()

      const [updatedTask] = await db
        .update(tasks)
        .set(updateFields)
        .where(eq(tasks.id, taskId))
        .returning()

      return c.json({
        success: true,
        data: updatedTask
      })

    } catch (error) {
      console.error('Error updating task:', error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to update task' })
    }
  })

// DELETE /api/tasks/:id - Delete task (maintains loose coupling)
app.delete('/:id',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const taskId = c.req.param('id')
      const { userId } = c.req.valid('query')

      // Verify user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        throw new HTTPException(403, { message: 'Unauthorized: User not found' })
      }

      // Verify task exists and belongs to user
      const existingTask = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .limit(1)

      if (existingTask.length === 0) {
        throw new HTTPException(404, { message: 'Task not found' })
      }

      // Delete the task (task completions remain due to loose coupling design)
      await db.delete(tasks).where(eq(tasks.id, taskId))

      return c.json({
        success: true,
        message: 'Task deleted successfully'
      })

    } catch (error) {
      console.error('Error deleting task:', error)
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to delete task' })
    }
  })

export default app
