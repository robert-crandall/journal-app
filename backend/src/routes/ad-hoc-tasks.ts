import { Hono } from 'hono'
import { db } from '../db/connection'
import { users, characters, characterStats, tasks } from '../db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'

// Input validation schemas
const createAdHocTaskSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  statCategory: z.string().min(1, 'Stat category is required'),
  estimatedXp: z.number().min(1, 'Estimated XP must be at least 1')
})

const updateAdHocTaskSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  statCategory: z.string().optional(),
  estimatedXp: z.number().min(1).optional()
})

const adHocTasksApp = new Hono()

// Create a new ad-hoc task
adHocTasksApp.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = createAdHocTaskSchema.parse(body)

    // Verify user exists
    const user = await db.select().from(users).where(eq(users.id, validatedData.userId)).limit(1)
    if (user.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    // Get user's character (needed for stat validation)
    const character = await db.select()
      .from(characters)
      .where(eq(characters.userId, validatedData.userId))
      .limit(1)

    if (character.length === 0) {
      return c.json({ success: false, error: 'Character not found for user' }, 404)
    }

    // Verify the stat category exists for this user
    const stat = await db.select()
      .from(characterStats)
      .where(and(
        eq(characterStats.characterId, character[0].id),
        eq(characterStats.category, validatedData.statCategory)
      ))
      .limit(1)

    if (stat.length === 0) {
      return c.json({ success: false, error: 'Stat category not found for this user' }, 400)
    }

    // Create the ad-hoc task
    const [newTask] = await db.insert(tasks).values({
      userId: validatedData.userId,
      title: validatedData.title,
      description: validatedData.description || '',
      source: 'ad-hoc',
      sourceId: null, // Ad-hoc tasks don't have a source entity
      targetStats: [validatedData.statCategory],
      estimatedXp: validatedData.estimatedXp,
      status: 'pending'
    }).returning()

    // Return task with stat information
    return c.json({
      success: true,
      data: {
        task: newTask,
        statInfo: {
          id: stat[0].id,
          category: stat[0].category,
          currentXp: stat[0].currentXp,
          currentLevel: stat[0].currentLevel,
          description: stat[0].description
        }
      }
    }, 201)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Error creating ad-hoc task:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

// List ad-hoc tasks for a user with filtering and stat summaries
adHocTasksApp.get('/', async (c) => {
  try {
    const userId = c.req.query('userId')
    const status = c.req.query('status')
    const statCategory = c.req.query('statCategory')

    if (!userId) {
      return c.json({ success: false, error: 'userId is required' }, 400)
    }

    // Verify user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (user.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    // Build query conditions
    const conditions = [
      eq(tasks.userId, userId),
      eq(tasks.source, 'ad-hoc')
    ]

    if (status) {
      conditions.push(eq(tasks.status, status as any))
    }

    if (statCategory) {
      // For ad-hoc tasks, targetStats contains single category
      conditions.push(eq(tasks.targetStats, [statCategory]))
    }

    // Get ad-hoc tasks
    const userTasks = await db.select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(tasks.createdAt)

    // Get user's character for stat information
    const character = await db.select()
      .from(characters)
      .where(eq(characters.userId, userId))
      .limit(1)

    let enrichedTasks: any[] = []
    let statSummaries: any[] = []

    if (character.length > 0) {
      // Get all character stats
      const allStats = await db.select()
        .from(characterStats)
        .where(eq(characterStats.characterId, character[0].id))

      // Create a stats lookup map
      const statsMap = new Map()
      allStats.forEach(stat => {
        statsMap.set(stat.category, stat)
      })

      // Enrich tasks with stat information
      enrichedTasks = userTasks.map(task => {
        const targetStats = task.targetStats as string[]
        const statInfo = statsMap.get(targetStats[0])
        return {
          ...task,
          statInfo: statInfo ? {
            id: statInfo.id,
            category: statInfo.category,
            currentXp: statInfo.currentXp,
            currentLevel: statInfo.currentLevel,
            description: statInfo.description
          } : null
        }
      })

      // Generate stat summaries
      statSummaries = allStats.map(stat => {
        const statTasks = userTasks.filter(task => {
          const targetStats = task.targetStats as string[]
          return targetStats[0] === stat.category
        })
        const completedTasks = statTasks.filter(task => task.status === 'completed')
        const pendingTasks = statTasks.filter(task => task.status === 'pending')
        const totalXpEarned = completedTasks.reduce((sum, task) => {
          // Use estimatedXp for completed tasks since awardedXp might not exist yet
          return sum + (task.estimatedXp || 0)
        }, 0)

        return {
          category: stat.category,
          description: stat.description,
          currentXp: stat.currentXp,
          currentLevel: stat.currentLevel,
          totalTasks: statTasks.length,
          completedTasks: completedTasks.length,
          pendingTasks: pendingTasks.length,
          totalXpEarned
        }
      })
    } else {
      enrichedTasks = userTasks
    }

    return c.json({
      success: true,
      data: {
        tasks: enrichedTasks,
        statSummaries,
        totalTasks: enrichedTasks.length,
        filters: {
          status,
          statCategory
        }
      }
    })

  } catch (error) {
    console.error('Error listing ad-hoc tasks:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

// Get specific ad-hoc task with detailed stat context
adHocTasksApp.get('/:id', async (c) => {
  try {
    const taskId = c.req.param('id')
    const userId = c.req.query('userId')

    if (!userId) {
      return c.json({ success: false, error: 'userId is required' }, 400)
    }

    // Get the task
    const task = await db.select()
      .from(tasks)
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.source, 'ad-hoc')
      ))
      .limit(1)

    if (task.length === 0) {
      return c.json({ success: false, error: 'Task not found' }, 404)
    }

    // Verify user owns this task
    if (task[0].userId !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    // Get user's character for stat information
    const character = await db.select()
      .from(characters)
      .where(eq(characters.userId, userId))
      .limit(1)

    if (character.length === 0) {
      return c.json({ success: false, error: 'Character not found' }, 404)
    }

    // Get the linked stat
    const targetStats = task[0].targetStats as string[]
    const stat = await db.select()
      .from(characterStats)
      .where(and(
        eq(characterStats.characterId, character[0].id),
        eq(characterStats.category, targetStats[0])
      ))
      .limit(1)

    const statInfo = stat.length > 0 ? {
      id: stat[0].id,
      category: stat[0].category,
      currentXp: stat[0].currentXp,
      currentLevel: stat[0].currentLevel,
      totalXp: stat[0].totalXp,
      description: stat[0].description
    } : null

    // Calculate XP progression preview
    const xpPreview = statInfo && task[0].estimatedXp ? {
      currentXp: statInfo.currentXp,
      newXp: statInfo.currentXp + task[0].estimatedXp,
      estimatedXpGain: task[0].estimatedXp,
      willLevelUp: (statInfo.currentXp + task[0].estimatedXp) >= (statInfo.currentLevel * 100) // Simple level up logic
    } : null

    return c.json({
      success: true,
      data: {
        task: task[0],
        statInfo,
        xpPreview
      }
    })

  } catch (error) {
    console.error('Error getting ad-hoc task:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

// Update an ad-hoc task
adHocTasksApp.put('/:id', async (c) => {
  try {
    const taskId = c.req.param('id')
    const body = await c.req.json()
    const validatedData = updateAdHocTaskSchema.parse(body)

    // Get the existing task
    const existingTask = await db.select()
      .from(tasks)
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.source, 'ad-hoc'),
        eq(tasks.userId, validatedData.userId)
      ))
      .limit(1)

    if (existingTask.length === 0) {
      return c.json({ success: false, error: 'Task not found' }, 404)
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title
    }
    
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }
    
    if (validatedData.estimatedXp !== undefined) {
      updateData.estimatedXp = validatedData.estimatedXp
    }

    // Handle stat category change
    if (validatedData.statCategory !== undefined) {
      // Get user's character for stat validation
      const character = await db.select()
        .from(characters)
        .where(eq(characters.userId, validatedData.userId))
        .limit(1)

      if (character.length === 0) {
        return c.json({ success: false, error: 'Character not found' }, 404)
      }

      // Verify the new stat category exists
      const stat = await db.select()
        .from(characterStats)
        .where(and(
          eq(characterStats.characterId, character[0].id),
          eq(characterStats.category, validatedData.statCategory)
        ))
        .limit(1)

      if (stat.length === 0) {
        return c.json({ success: false, error: 'Stat category not found for this user' }, 400)
      }

      updateData.targetStats = [validatedData.statCategory]
    }

    // Update the task
    const [updatedTask] = await db.update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning()

    // Get updated stat information
    const character = await db.select()
      .from(characters)
      .where(eq(characters.userId, validatedData.userId))
      .limit(1)

    let statInfo = null
    if (character.length > 0) {
      const updatedTargetStats = updatedTask.targetStats as string[]
      const stat = await db.select()
        .from(characterStats)
        .where(and(
          eq(characterStats.characterId, character[0].id),
          eq(characterStats.category, updatedTargetStats[0])
        ))
        .limit(1)

      if (stat.length > 0) {
        statInfo = {
          id: stat[0].id,
          category: stat[0].category,
          currentXp: stat[0].currentXp,
          currentLevel: stat[0].currentLevel,
          description: stat[0].description
        }
      }
    }

    return c.json({
      success: true,
      data: {
        task: updatedTask,
        statInfo
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Error updating ad-hoc task:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

// Delete an ad-hoc task
adHocTasksApp.delete('/:id', async (c) => {
  try {
    const taskId = c.req.param('id')
    const userId = c.req.query('userId')

    if (!userId) {
      return c.json({ success: false, error: 'userId is required' }, 400)
    }

    // Verify task exists and belongs to user
    const task = await db.select()
      .from(tasks)
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.source, 'ad-hoc'),
        eq(tasks.userId, userId)
      ))
      .limit(1)

    if (task.length === 0) {
      return c.json({ success: false, error: 'Task not found' }, 404)
    }

    // Delete the task
    await db.delete(tasks).where(eq(tasks.id, taskId))

    return c.json({
      success: true,
      data: {
        message: 'Ad-hoc task deleted successfully'
      }
    })

  } catch (error) {
    console.error('Error deleting ad-hoc task:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

export default adHocTasksApp
