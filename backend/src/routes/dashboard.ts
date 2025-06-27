import { Hono } from 'hono'
import { db } from '../db/connection'
import { tasks, quests, experiments, taskCompletions } from '../db/schema'
import { eq, and, desc, asc, sql, count, sum, isNull, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const dashboardApp = new Hono()

// Validation schemas
const dashboardQuerySchema = z.object({
  userId: z.string().uuid('Invalid userId format'),
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

// GET /api/dashboard - Aggregate dashboard with tasks from all sources
dashboardApp.get('/', async (c) => {
  try {
    // Manual validation with better error handling
    const userId = c.req.query('userId')
    if (!userId) {
      return c.json({ success: false, error: 'userId is required' }, 400)
    }

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return c.json({ success: false, error: 'Invalid userId format' }, 400)
    }

    const status = c.req.query('status') || 'all'
    const limitParam = c.req.query('limit') || '20'
    const offsetParam = c.req.query('offset') || '0'

    const limit = Number(limitParam)
    const offset = Number(offsetParam)

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return c.json({ success: false, error: 'Limit must be between 1 and 100' }, 400)
    }

    if (isNaN(offset) || offset < 0) {
      return c.json({ success: false, error: 'Offset must be 0 or greater' }, 400)
    }

    // Build query conditions for dashboard-visible tasks
    // Include: ai, quest, experiment, todo
    // Exclude: project, ad-hoc
    const dashboardSources = ['ai', 'quest', 'experiment', 'todo'] as const
    let whereConditions = [
      eq(tasks.userId, userId),
      inArray(tasks.source, dashboardSources)
    ]

    if (status !== 'all') {
      whereConditions.push(eq(tasks.status, status))
    }

    // Get total count for pagination
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(...whereConditions))

    const totalCount = Number(totalCountResult.count)

    // Main query to get tasks with source metadata
    const tasksQuery = await db
      .select({
        id: tasks.id,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        source: tasks.source,
        sourceId: tasks.sourceId,
        targetStats: tasks.targetStats,
        estimatedXp: tasks.estimatedXp,
        status: tasks.status,
        dueDate: tasks.dueDate,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        // Quest metadata
        questTitle: quests.title,
        questDescription: quests.description,
        questGoalDescription: quests.goalDescription,
        questStartDate: quests.startDate,
        questEndDate: quests.endDate,
        questStatus: quests.status,
        questCompletedAt: quests.completedAt,
        // Experiment metadata
        experimentTitle: experiments.title,
        experimentDescription: experiments.description,
        experimentHypothesis: experiments.hypothesis,
        experimentDuration: experiments.duration,
        experimentStartDate: experiments.startDate,
        experimentEndDate: experiments.endDate,
        experimentStatus: experiments.status,
        experimentResults: experiments.results,
        experimentCompletedAt: experiments.completedAt
      })
      .from(tasks)
      .leftJoin(quests, and(
        eq(tasks.sourceId, quests.id),
        eq(tasks.source, 'quest')
      ))
      .leftJoin(experiments, and(
        eq(tasks.sourceId, experiments.id),
        eq(tasks.source, 'experiment')
      ))
      .where(and(...whereConditions))
      .orderBy(
        // Priority order: overdue first, then by due date, then by creation date
        sql`CASE 
          WHEN ${tasks.dueDate} < NOW() AND ${tasks.status} = 'pending' THEN 1
          WHEN ${tasks.dueDate} IS NOT NULL THEN 2
          ELSE 3
        END`,
        asc(tasks.dueDate),
        desc(tasks.createdAt)
      )
      .limit(limit)
      .offset(offset)

    // Process tasks and add source metadata
    const processedTasks = tasksQuery.map(task => {
      const baseTask = {
        id: task.id,
        userId: task.userId,
        title: task.title,
        description: task.description,
        source: task.source,
        sourceId: task.sourceId,
        targetStats: task.targetStats,
        estimatedXp: task.estimatedXp,
        status: task.status,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }

      // Add source metadata if applicable
      let sourceMetadata = null

      if (task.source === 'quest' && task.questTitle) {
        sourceMetadata = {
          title: task.questTitle,
          description: task.questDescription,
          goalDescription: task.questGoalDescription,
          startDate: task.questStartDate,
          endDate: task.questEndDate,
          status: task.questStatus,
          completedAt: task.questCompletedAt
        }
      } else if (task.source === 'experiment' && task.experimentTitle) {
        // Calculate days remaining for active experiments
        const now = new Date()
        const endDate = task.experimentEndDate ? new Date(task.experimentEndDate) : 
          (task.experimentStartDate ? new Date(new Date(task.experimentStartDate).getTime() + (task.experimentDuration || 0) * 24 * 60 * 60 * 1000) : now)
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
        
        sourceMetadata = {
          type: 'experiment', // Key differentiation
          influencesAI: false, // Key differentiation: experiments don't influence AI
          title: task.experimentTitle,
          description: task.experimentDescription,
          hypothesis: task.experimentHypothesis,
          duration: task.experimentDuration,
          startDate: task.experimentStartDate,
          endDate: task.experimentEndDate,
          status: task.experimentStatus,
          results: task.experimentResults,
          completedAt: task.experimentCompletedAt,
          daysRemaining: task.experimentStatus === 'active' ? daysRemaining : null
        }
      }

      return {
        ...baseTask,
        ...(sourceMetadata && { sourceMetadata })
      }
    })

    // Calculate summary statistics
    const summaryQuery = await db
      .select({
        totalTasks: count(),
        totalEstimatedXp: sum(tasks.estimatedXp),
        source: tasks.source,
        status: tasks.status
      })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        inArray(tasks.source, dashboardSources)
      ))
      .groupBy(tasks.source, tasks.status)

    // Get earned XP from completions
    const earnedXpQuery = await db
      .select({
        totalEarnedXp: sum(taskCompletions.actualXp)
      })
      .from(taskCompletions)
      .innerJoin(tasks, eq(taskCompletions.taskId, tasks.id))
      .where(and(
        eq(taskCompletions.userId, userId),
        inArray(tasks.source, dashboardSources)
      ))

    const earnedXp = Number(earnedXpQuery[0]?.totalEarnedXp || 0)

    // Process summary statistics
    const tasksBySource: Record<string, number> = {}
    const tasksByStatus: Record<string, number> = {}
    let totalTasks = 0
    let totalEstimatedXp = 0

    summaryQuery.forEach(row => {
      const source = row.source
      const status = row.status
      const count = Number(row.totalTasks)
      const xp = Number(row.totalEstimatedXp || 0)

      tasksBySource[source] = (tasksBySource[source] || 0) + count
      tasksByStatus[status] = (tasksByStatus[status] || 0) + count
      totalTasks += count
      totalEstimatedXp += xp
    })

    const summary = {
      totalTasks,
      pendingTasks: tasksByStatus.pending || 0,
      completedTasks: tasksByStatus.completed || 0,
      skippedTasks: tasksByStatus.skipped || 0,
      totalEstimatedXp,
      earnedXp,
      tasksBySource,
      tasksByStatus
    }

    // Pagination info
    const pagination = {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    }

    return c.json({
      success: true,
      data: {
        tasks: processedTasks,
        summary,
        pagination
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return c.json({ success: false, error: 'Failed to fetch dashboard data' }, 500)
  }
})

export default dashboardApp
