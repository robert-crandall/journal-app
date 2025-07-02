import { Hono } from 'hono'
import { db } from '../db/connection'
import { quests, tasks, users, taskCompletions } from '../db/schema'
import { eq, and, desc, asc, sql, count, isNull, isNotNull, gte, lte, or } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { jwtAuth, getUserId } from '../middleware/auth'

const questsApp = new Hono()

// Validation schemas
const createQuestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().optional(),
  goalDescription: z.string().optional(),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format').optional(),
  progressNotes: z.string().optional()
})

const updateQuestSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  goalDescription: z.string().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['active', 'completed', 'paused', 'abandoned']).optional(),
  progressNotes: z.string().optional()
})

const questQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'paused', 'abandoned', 'all']).optional().default('all')
})

// Helper function to calculate deadline status
function calculateDeadlineStatus(endDate: Date | null): { status: string; daysUntil: number | null } {
  if (!endDate) {
    return { status: 'none', daysUntil: null }
  }

  const now = new Date()
  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'overdue', daysUntil: Math.abs(diffDays) }
  } else if (diffDays <= 2) {
    return { status: 'urgent', daysUntil: diffDays }
  } else if (diffDays <= 7) {
    return { status: 'upcoming', daysUntil: diffDays }
  } else {
    return { status: 'normal', daysUntil: diffDays }
  }
}

// Helper function to get quest progress
async function getQuestProgress(questId: string): Promise<{
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalEstimatedXp: number;
  earnedXp: number;
}> {
  // Get task counts
  const taskStats = await db
    .select({
      total: count(),
      completed: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'completed' THEN 1 END)`,
      totalXp: sql<number>`COALESCE(SUM(${tasks.estimatedXp}), 0)`
    })
    .from(tasks)
    .where(and(
      eq(tasks.sourceId, questId),
      eq(tasks.source, 'quest')
    ))

  const stats = taskStats[0] || { total: 0, completed: 0, totalXp: 0 }

  // Get earned XP from completions
  const earnedXpResult = await db
    .select({
      earnedXp: sql<number>`COALESCE(SUM(${taskCompletions.actualXp}), 0)`
    })
    .from(taskCompletions)
    .innerJoin(tasks, eq(taskCompletions.taskId, tasks.id))
    .where(and(
      eq(tasks.sourceId, questId),
      eq(tasks.source, 'quest')
    ))

  const earnedXp = earnedXpResult[0]?.earnedXp || 0
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return {
    totalTasks: Number(stats.total),
    completedTasks: Number(stats.completed),
    completionRate,
    totalEstimatedXp: Number(stats.totalXp),
    earnedXp: Number(earnedXp)
  }
}

// POST /api/quests - Create new quest
questsApp.post('/', jwtAuth, zValidator('json', createQuestSchema), async (c) => {
  try {
    const userId = getUserId(c)
    const data = c.req.valid('json')

    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = data.endDate ? new Date(data.endDate) : null

    if (endDate && endDate <= startDate) {
      return c.json({ success: false, error: 'End date must be after start date' }, 400)
    }

    // Create quest
    const [quest] = await db.insert(quests).values({
      userId: userId,
      title: data.title,
      description: data.description,
      goalDescription: data.goalDescription,
      startDate,
      endDate,
      progressNotes: data.progressNotes,
      status: 'active'
    }).returning()

    return c.json({
      success: true,
      data: { quest }
    }, 201)

  } catch (error) {
    console.error('Error creating quest:', error)
    
    if (error instanceof HTTPException) {
      throw error
    }
    
    return c.json({ success: false, error: 'Failed to create quest' }, 500)
  }
})

// GET /api/quests - List quests with progress and deadline monitoring
questsApp.get('/', jwtAuth, zValidator('query', questQuerySchema), async (c) => {
  try {
    const userId = getUserId(c)
    const { status } = c.req.valid('query')

    // Build where conditions
    let whereConditions = [eq(quests.userId, userId)]
    
    if (status !== 'all') {
      whereConditions.push(eq(quests.status, status))
    }

    // Get quests
    const questsResult = await db
      .select()
      .from(quests)
      .where(and(...whereConditions))
      .orderBy(desc(quests.createdAt))

    // Add progress and deadline information to each quest
    const questsWithProgress = await Promise.all(
      questsResult.map(async (quest) => {
        const progress = await getQuestProgress(quest.id)
        const deadlineInfo = calculateDeadlineStatus(quest.endDate)

        return {
          ...quest,
          progressSummary: progress,
          deadlineStatus: deadlineInfo.status,
          daysUntilDeadline: deadlineInfo.daysUntil
        }
      })
    )

    return c.json({
      success: true,
      data: { quests: questsWithProgress }
    })

  } catch (error) {
    console.error('Error fetching quests:', error)
    return c.json({ success: false, error: 'Failed to fetch quests' }, 500)
  }
})

// GET /api/quests/deadline-alerts - Get deadline monitoring alerts
questsApp.get('/deadline-alerts', jwtAuth, async (c) => {
  try {
    const userId = getUserId(c)

    // Get active quests with deadlines
    const activeQuests = await db
      .select()
      .from(quests)
      .where(and(
        eq(quests.userId, userId),
        eq(quests.status, 'active'),
        isNotNull(quests.endDate)
      ))
      .orderBy(asc(quests.endDate))

    // Filter and enhance quests that need deadline alerts
    const alerts = await Promise.all(
      activeQuests
        .map(async (quest) => {
          const deadlineInfo = calculateDeadlineStatus(quest.endDate)
          
          // Only include urgent, upcoming, or overdue quests
          if (['urgent', 'upcoming', 'overdue'].includes(deadlineInfo.status)) {
            const progress = await getQuestProgress(quest.id)
            
            return {
              quest: {
                ...quest,
                progressSummary: progress
              },
              priority: deadlineInfo.status,
              daysUntilDeadline: deadlineInfo.daysUntil
            }
          }
          
          return null
        })
        .filter(alert => alert !== null)
    )

    return c.json({
      success: true,
      data: { alerts }
    })

  } catch (error) {
    console.error('Error fetching deadline alerts:', error)
    
    return c.json({ success: false, error: 'Failed to fetch deadline alerts' }, 500)
  }
})

// GET /api/quests/:id - Get detailed quest information
questsApp.get('/:id', jwtAuth, async (c) => {
  try {
    const questId = c.req.param('id')
    const userId = getUserId(c)

    // Get quest (check existence first, then ownership)
    const [quest] = await db
      .select()
      .from(quests)
      .where(eq(quests.id, questId))

    if (!quest) {
      return c.json({ success: false, error: 'Quest not found' }, 404)
    }

    // Check ownership
    if (quest.userId !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    // Get quest progress
    const progress = await getQuestProgress(questId)
    
    // Get associated tasks
    const questTasks = await db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.sourceId, questId),
        eq(tasks.source, 'quest')
      ))
      .orderBy(asc(tasks.createdAt))

    // Calculate deadline information
    const deadlineInfo = calculateDeadlineStatus(quest.endDate)

    const questWithDetails = {
      ...quest,
      progressSummary: progress,
      deadlineStatus: deadlineInfo.status,
      daysUntilDeadline: deadlineInfo.daysUntil,
      tasks: questTasks
    }

    return c.json({
      success: true,
      data: { quest: questWithDetails }
    })

  } catch (error) {
    console.error('Error fetching quest:', error)
    
    if (error instanceof HTTPException) {
      throw error
    }
    
    return c.json({ success: false, error: 'Failed to fetch quest' }, 500)
  }
})

// PUT /api/quests/:id - Update quest
questsApp.put('/:id', jwtAuth, zValidator('json', updateQuestSchema), async (c) => {
  try {
    const questId = c.req.param('id')
    const userId = getUserId(c)
    const data = c.req.valid('json')

    // Verify quest exists and belongs to user
    const [existingQuest] = await db
      .select()
      .from(quests)
      .where(and(
        eq(quests.id, questId),
        eq(quests.userId, userId)
      ))

    if (!existingQuest) {
      return c.json({ success: false, error: 'Quest not found' }, 404)
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.goalDescription !== undefined) updateData.goalDescription = data.goalDescription
    if (data.progressNotes !== undefined) updateData.progressNotes = data.progressNotes
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate)

    // Handle status changes
    if (data.status !== undefined) {
      updateData.status = data.status
      
      // Set completedAt when marking as completed
      if (data.status === 'completed' && existingQuest.status !== 'completed') {
        updateData.completedAt = new Date()
      }
      
      // Clear completedAt when changing from completed to other status
      if (data.status !== 'completed' && existingQuest.status === 'completed') {
        updateData.completedAt = null
      }
    }

    // Update quest
    const [updatedQuest] = await db
      .update(quests)
      .set(updateData)
      .where(eq(quests.id, questId))
      .returning()

    return c.json({
      success: true,
      data: { quest: updatedQuest }
    })

  } catch (error) {
    console.error('Error updating quest:', error)
    
    if (error instanceof HTTPException) {
      throw error
    }
    
    return c.json({ success: false, error: 'Failed to update quest' }, 500)
  }
})

// DELETE /api/quests/:id - Delete quest
questsApp.delete('/:id', async (c) => {
  try {
    const questId = c.req.param('id')
    const userId = c.req.query('userId')

    if (!userId) {
      return c.json({ success: false, error: 'userId is required' }, 400)
    }

    // Verify quest exists and belongs to user
    const [existingQuest] = await db
      .select()
      .from(quests)
      .where(and(
        eq(quests.id, questId),
        eq(quests.userId, userId)
      ))

    if (!existingQuest) {
      return c.json({ success: false, error: 'Quest not found' }, 404)
    }

    // Convert associated tasks to ad-hoc tasks
    await db
      .update(tasks)
      .set({
        source: 'ad-hoc',
        sourceId: null,
        updatedAt: new Date()
      })
      .where(and(
        eq(tasks.sourceId, questId),
        eq(tasks.source, 'quest')
      ))

    // Delete quest
    await db.delete(quests).where(eq(quests.id, questId))

    return c.json({
      success: true,
      message: 'Quest deleted successfully. Associated tasks converted to ad-hoc tasks.'
    })

  } catch (error) {
    console.error('Error deleting quest:', error)
    
    if (error instanceof HTTPException) {
      throw error
    }
    
    return c.json({ success: false, error: 'Failed to delete quest' }, 500)
  }
})

export default questsApp
