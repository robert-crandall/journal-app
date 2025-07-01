import { Hono } from 'hono'
import { db } from '../db/connection'
import { tasks, users } from '../db/schema'
import { eq, and, count } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'

const todosApp = new Hono()

// Validation schemas for todos (simplified - no XP/stat integration)
const createTodoSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().optional()
})

const updateTodoSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed', 'skipped']).optional()
})

const todoQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  status: z.enum(['pending', 'completed', 'skipped', 'all']).optional().default('all'),
  limit: z.string().optional().default('50').transform(val => {
    const num = Number(val)
    if (isNaN(num) || num < 1 || num > 100) {
      throw new Error('Limit must be between 1 and 100')
    }
    return num
  }),
  offset: z.string().optional().default('0').transform(val => {
    const num = Number(val)
    if (isNaN(num) || num < 0) {
      throw new Error('Offset must be 0 or greater')
    }
    return num
  })
})

const userIdQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format')
})

// POST /api/todos - Create new simple todo
todosApp.post('/', 
  zValidator('json', createTodoSchema),
  async (c) => {
    try {
      const data = c.req.valid('json')
      const { userId, title, description } = data

      // Verify user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        return c.json({ success: false, error: 'Unauthorized: User not found' }, 403)
      }

      // Create todo with enforced simple properties
      const [todo] = await db.insert(tasks).values({
        userId,
        title,
        description: description || null,
        source: 'todo',
        sourceId: null,
        targetStats: null, // Todos never have target stats
        estimatedXp: 0, // Todos never have XP
        status: 'pending'
      }).returning()

      return c.json({
        success: true,
        data: { todo }
      }, 201)

    } catch (error) {
      console.error('Error creating todo:', error)
      
      if (error instanceof HTTPException) {
        throw error
      }
      
      return c.json({ success: false, error: 'Failed to create todo' }, 500)
    }
  }
)

// GET /api/todos - List todos for user with filtering and summary
todosApp.get('/',
  zValidator('query', todoQuerySchema),
  async (c) => {
    try {
      const { userId, status, limit, offset } = c.req.valid('query')

      // Verify user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        return c.json({ success: false, error: 'Unauthorized: User not found' }, 403)
      }

      // Build query conditions
      let conditions = [
        eq(tasks.userId, userId),
        eq(tasks.source, 'todo')
      ]

      if (status !== 'all') {
        conditions.push(eq(tasks.status, status))
      }

      // Get total count for pagination
      const [totalCountResult] = await db
        .select({ count: count() })
        .from(tasks)
        .where(and(...conditions))

      const totalCount = Number(totalCountResult.count)

      // Get todos with pagination
      const todos = await db
        .select()
        .from(tasks)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(tasks.createdAt)

      // Calculate summary statistics
      const summaryConditions = [
        eq(tasks.userId, userId),
        eq(tasks.source, 'todo')
      ]

      const summaryQuery = await db
        .select({
          status: tasks.status,
          count: count()
        })
        .from(tasks)
        .where(and(...summaryConditions))
        .groupBy(tasks.status)

      const summary = {
        totalTodos: 0,
        pendingTodos: 0,
        completedTodos: 0,
        skippedTodos: 0,
        completionRate: 0
      }

      summaryQuery.forEach(row => {
        const count = Number(row.count)
        summary.totalTodos += count
        
        if (row.status === 'pending') summary.pendingTodos = count
        else if (row.status === 'completed') summary.completedTodos = count
        else if (row.status === 'skipped') summary.skippedTodos = count
      })

      // Calculate completion rate
      if (summary.totalTodos > 0) {
        summary.completionRate = Math.round((summary.completedTodos / summary.totalTodos) * 100)
      }

      return c.json({
        success: true,
        data: {
          todos,
          summary,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount
          }
        }
      })

    } catch (error) {
      console.error('Error fetching todos:', error)
      
      if (error instanceof HTTPException) {
        throw error
      }
      
      return c.json({ success: false, error: 'Failed to fetch todos' }, 500)
    }
  }
)

// GET /api/todos/:id - Get specific todo
todosApp.get('/:id',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const todoId = c.req.param('id')
      const { userId } = c.req.valid('query')

      if (!todoId) {
        return c.json({ success: false, error: 'Todo ID is required' }, 400)
      }

      // Verify user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        return c.json({ success: false, error: 'Unauthorized: User not found' }, 403)
      }

      // Get todo
      const todo = await db
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.id, todoId),
          eq(tasks.userId, userId),
          eq(tasks.source, 'todo')
        ))
        .limit(1)

      if (todo.length === 0) {
        return c.json({ success: false, error: 'Todo not found' }, 404)
      }

      return c.json({
        success: true,
        data: { todo: todo[0] }
      })

    } catch (error) {
      console.error('Error fetching todo:', error)
      
      if (error instanceof HTTPException) {
        throw error
      }
      
      return c.json({ success: false, error: 'Failed to fetch todo' }, 500)
    }
  }
)

// PUT /api/todos/:id - Update todo
todosApp.put('/:id',
  zValidator('json', updateTodoSchema),
  async (c) => {
    try {
      const todoId = c.req.param('id')
      const data = c.req.valid('json')
      const { userId, status, ...updateData } = data

      if (!todoId) {
        return c.json({ success: false, error: 'Todo ID is required' }, 400)
      }

      // Verify user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        return c.json({ success: false, error: 'Unauthorized: User not found' }, 403)
      }

      // Verify todo exists and belongs to user
      const existingTodo = await db
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.id, todoId),
          eq(tasks.userId, userId),
          eq(tasks.source, 'todo')
        ))
        .limit(1)

      if (existingTodo.length === 0) {
        return c.json({ success: false, error: 'Todo not found' }, 404)
      }

      // Prepare update data (force todo constraints)
      const todoUpdate: any = {
        ...updateData,
        updatedAt: new Date()
      }

      // Handle status change to completed
      if (status === 'completed' && existingTodo[0].status !== 'completed') {
        todoUpdate.status = 'completed'
        todoUpdate.completedAt = new Date()
      } else if (status && status !== 'completed') {
        todoUpdate.status = status
        // Clear completedAt if changing from completed to something else
        if (existingTodo[0].status === 'completed') {
          todoUpdate.completedAt = null
        }
      }

      // Update todo
      const [updatedTodo] = await db
        .update(tasks)
        .set(todoUpdate)
        .where(eq(tasks.id, todoId))
        .returning()

      return c.json({
        success: true,
        data: { todo: updatedTodo }
      })

    } catch (error) {
      console.error('Error updating todo:', error)
      
      if (error instanceof HTTPException) {
        throw error
      }
      
      return c.json({ success: false, error: 'Failed to update todo' }, 500)
    }
  }
)

// DELETE /api/todos/:id - Delete todo
todosApp.delete('/:id',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const todoId = c.req.param('id')
      const { userId } = c.req.valid('query')

      if (!todoId) {
        return c.json({ success: false, error: 'Todo ID is required' }, 400)
      }

      // Verify user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (user.length === 0) {
        return c.json({ success: false, error: 'Unauthorized: User not found' }, 403)
      }

      // Verify todo exists and belongs to user
      const existingTodo = await db
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.id, todoId),
          eq(tasks.userId, userId),
          eq(tasks.source, 'todo')
        ))
        .limit(1)

      if (existingTodo.length === 0) {
        return c.json({ success: false, error: 'Todo not found' }, 404)
      }

      // Delete todo
      await db
        .delete(tasks)
        .where(eq(tasks.id, todoId))

      return c.json({
        success: true,
        data: { message: 'Todo deleted successfully' }
      })

    } catch (error) {
      console.error('Error deleting todo:', error)
      
      if (error instanceof HTTPException) {
        throw error
      }
      
      return c.json({ success: false, error: 'Failed to delete todo' }, 500)
    }
  }
)

export default todosApp
