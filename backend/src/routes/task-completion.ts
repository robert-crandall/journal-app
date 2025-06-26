import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/connection'
import { tasks, taskCompletions, users, characters, characterStats } from '../db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import { calculateLevelFromTotalXp, calculateTotalXpForLevel } from '../utils/xp-calculator'
import { generateLevelTitle } from '../services/ai-level-titles'

const taskCompletionRoutes = new Hono()

// Validation schemas
const completeTaskSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  actualXp: z.number().min(0, 'Actual XP must be non-negative'),
  statAwards: z.record(z.string(), z.number().min(0)).default({}),
  feedback: z.string().optional()
})

const userIdQuerySchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID')
})

const completedTasksQuerySchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0')
})

// POST /api/tasks/:id/complete - Complete a task and award XP
taskCompletionRoutes.post('/:id/complete', async (c) => {
  try {
    const taskId = c.req.param('id')
    
    // Validate UUID format
    if (!taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return c.json({ 
        success: false, 
        message: 'Invalid task ID format. Must be a valid UUID.' 
      }, 400)
    }

    const body = await c.req.json()
    const validation = completeTaskSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validation.error.errors 
      }, 400)
    }

    const { userId, actualXp, statAwards, feedback } = validation.data

    // Validate user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'User not found' 
      }, 404)
    }

    // Get task and validate ownership
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
    if (!task) {
      return c.json({ 
        success: false, 
        message: 'Task not found' 
      }, 404)
    }

    if (task.userId !== userId) {
      return c.json({ 
        success: false, 
        message: 'Task does not belong to user' 
      }, 403)
    }

    if (task.status === 'completed') {
      return c.json({ 
        success: false, 
        message: 'Task is already completed' 
      }, 400)
    }

    // Validate feedback for AI tasks
    if (task.source === 'ai' && !feedback) {
      return c.json({ 
        success: false, 
        message: 'Feedback is required for AI-generated tasks' 
      }, 400)
    }

    // Get user's character and stats for validation
    const [character] = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1)
    if (!character) {
      return c.json({ 
        success: false, 
        message: 'Character not found for user' 
      }, 404)
    }

    // Get all character stats for validation and XP awards
    const characterStatsList = await db.select()
      .from(characterStats)
      .where(eq(characterStats.characterId, character.id))

    const statCategoryMap = new Map(
      characterStatsList.map(stat => [stat.category, stat])
    )

    // Validate stat awards reference existing character stats
    for (const statCategory of Object.keys(statAwards)) {
      if (!statCategoryMap.has(statCategory)) {
        return c.json({ 
          success: false, 
          message: `Invalid stat category: ${statCategory}. Must match existing character stats.` 
        }, 400)
      }
    }

    // Process completion in a transaction
    const result = await db.transaction(async (tx) => {
      // Update task status
      const [updatedTask] = await tx.update(tasks)
        .set({ 
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(tasks.id, taskId))
        .returning()

      // Create task completion record
      const [taskCompletion] = await tx.insert(taskCompletions)
        .values({
          taskId,
          userId,
          feedback: feedback || null,
          actualXp,
          statAwards,
          completedAt: new Date()
        })
        .returning()

      // Award XP to character stats and collect notifications
      const xpNotifications = []
      
      for (const [statCategory, xpAmount] of Object.entries(statAwards)) {
        const stat = statCategoryMap.get(statCategory)!
        
        const newTotalXp = stat.totalXp + xpAmount
        const newLevel = calculateLevelFromTotalXp(newTotalXp)
        const leveledUp = newLevel > stat.currentLevel
        
        // Calculate new current XP (resets on level up)
        const previousLevelTotalXp = newLevel > 1 ? calculateTotalXpForLevel(newLevel - 1) : 0
        const newCurrentXp = newTotalXp - previousLevelTotalXp
        
        // Generate level title if leveled up
        let levelTitle: string | undefined
        if (leveledUp) {
          try {
            levelTitle = await generateLevelTitle({
              statCategory,
              newLevel,
              characterClass: character.class,
              characterBackstory: character.backstory || undefined
            })
          } catch (error) {
            console.warn('Failed to generate level title:', error)
            // Continue without title - it's optional
          }
        }
        
        // Update the stat
        await tx.update(characterStats)
          .set({
            currentXp: newCurrentXp,
            currentLevel: newLevel,
            totalXp: newTotalXp,
            ...(leveledUp && levelTitle ? { levelTitle } : {})
          })
          .where(eq(characterStats.id, stat.id))

        // Add to notifications
        xpNotifications.push({
          statId: stat.id,
          statCategory,
          xpAwarded: xpAmount,
          newTotalXp,
          newLevel,
          leveledUp,
          ...(leveledUp && levelTitle ? { levelTitle } : {})
        })
      }

      return { updatedTask, taskCompletion, xpNotifications }
    })

    // Determine display duration and feedback requirements
    const feedbackRequired = task.source === 'ai'
    const feedbackProcessed = feedbackRequired && !!feedback
    const hasXpAwards = Object.keys(statAwards).length > 0 && actualXp > 0
    
    // Display duration logic
    let displayDuration = 1000 // 1 second for simple tasks
    if (hasXpAwards) {
      displayDuration = feedbackRequired ? 5000 : 2000 // 5 seconds for AI with feedback, 2 for others with XP
    }

    return c.json({
      success: true,
      data: {
        task: result.updatedTask,
        taskCompletion: result.taskCompletion,
        xpNotifications: result.xpNotifications,
        feedbackRequired,
        feedbackProcessed,
        displayDuration
      }
    })

  } catch (error) {
    console.error('Error completing task:', error)
    return c.json({ 
      success: false, 
      message: 'Internal server error' 
    }, 500)
  }
})

// GET /api/tasks/completed - List completed tasks with completion details
taskCompletionRoutes.get('/completed', async (c) => {
  try {
    const query = c.req.query()
    const validation = completedTasksQuerySchema.safeParse(query)
    
    if (!validation.success) {
      return c.json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validation.error.errors 
      }, 400)
    }

    const { userId, startDate, endDate, limit, offset } = validation.data

    // Validate user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'User not found' 
      }, 404)
    }

    // Build query conditions
    let whereConditions = [
      eq(tasks.userId, userId),
      eq(tasks.status, 'completed')
    ]

    // Add date filters if provided
    if (startDate) {
      whereConditions.push(gte(tasks.completedAt, new Date(startDate + 'T00:00:00.000Z')))
    }
    if (endDate) {
      whereConditions.push(lte(tasks.completedAt, new Date(endDate + 'T23:59:59.999Z')))
    }

    // Get completed tasks with completion details
    const completedTasks = await db.select({
      task: tasks,
      completion: taskCompletions
    })
    .from(tasks)
    .leftJoin(taskCompletions, eq(tasks.id, taskCompletions.taskId))
    .where(and(...whereConditions))
    .orderBy(desc(tasks.completedAt))
    .limit(limit)
    .offset(offset)

    // Calculate statistics
    const statsQuery = await db.select({
      totalCompleted: sql<number>`count(*)`,
      totalXpEarned: sql<number>`coalesce(sum(${taskCompletions.actualXp}), 0)`,
      sourceBreakdown: sql<string>`${tasks.source}`
    })
    .from(tasks)
    .leftJoin(taskCompletions, eq(tasks.id, taskCompletions.taskId))
    .where(and(...whereConditions))
    .groupBy(tasks.source)

    const stats = {
      totalCompleted: statsQuery.reduce((sum, row) => sum + Number(row.totalCompleted), 0),
      totalXpEarned: statsQuery.reduce((sum, row) => sum + Number(row.totalXpEarned), 0),
      averageXpPerTask: 0,
      completionsBySource: {} as Record<string, number>
    }

    // Calculate average XP and source breakdown
    for (const row of statsQuery) {
      stats.completionsBySource[row.sourceBreakdown] = Number(row.totalCompleted)
    }

    if (stats.totalCompleted > 0) {
      stats.averageXpPerTask = Math.round(stats.totalXpEarned / stats.totalCompleted)
    }

    // Format response
    const formattedTasks = completedTasks.map(({ task, completion }) => ({
      ...task,
      completion
    }))

    return c.json({
      success: true,
      data: {
        completedTasks: formattedTasks,
        stats,
        pagination: {
          limit,
          offset,
          hasMore: formattedTasks.length === limit
        }
      }
    })

  } catch (error) {
    console.error('Error fetching completed tasks:', error)
    return c.json({ 
      success: false, 
      message: 'Internal server error' 
    }, 500)
  }
})

// GET /api/tasks/:id/completion - Get specific task completion details
taskCompletionRoutes.get('/:id/completion', async (c) => {
  try {
    const taskId = c.req.param('id')
    
    // Validate UUID format
    if (!taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return c.json({ 
        success: false, 
        message: 'Invalid task ID format. Must be a valid UUID.' 
      }, 400)
    }

    const query = c.req.query()
    const validation = userIdQuerySchema.safeParse(query)
    
    if (!validation.success) {
      return c.json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validation.error.errors 
      }, 400)
    }

    const { userId } = validation.data

    // Validate user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'User not found' 
      }, 404)
    }

    // Get task and completion details
    const result = await db.select({
      task: tasks,
      completion: taskCompletions
    })
    .from(tasks)
    .leftJoin(taskCompletions, eq(tasks.id, taskCompletions.taskId))
    .where(and(
      eq(tasks.id, taskId),
      eq(tasks.userId, userId)
    ))
    .limit(1)

    if (result.length === 0) {
      return c.json({ 
        success: false, 
        message: 'Task not found' 
      }, 404)
    }

    const { task, completion } = result[0]

    if (!completion) {
      return c.json({ 
        success: false, 
        message: 'Task completion not found' 
      }, 404)
    }

    return c.json({
      success: true,
      data: {
        task,
        completion
      }
    })

  } catch (error) {
    console.error('Error fetching task completion:', error)
    return c.json({ 
      success: false, 
      message: 'Internal server error' 
    }, 500)
  }
})

export { taskCompletionRoutes }
