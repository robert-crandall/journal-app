import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { validator } from 'hono/validator'
import { z } from 'zod'
import { ScheduledTaskGenerationService } from '../services/scheduled-task-generation-service'

const app = new Hono()

const scheduledService = new ScheduledTaskGenerationService()

// Schema for scheduled generation request
const scheduledGenerationSchema = z.object({
  forceRegenerate: z.boolean().optional().default(false),
  targetUserIds: z.array(z.string().uuid()).optional(), // Optional list of specific users
})

// Schema for scheduling info request
const schedulingInfoSchema = z.object({
  includeStats: z.string().optional().transform(val => val === 'true'), // Convert string to boolean
  date: z.string().optional(), // Date for statistics (YYYY-MM-DD format)
})

/**
 * POST /api/scheduled/generate-daily-tasks
 * Trigger daily task generation for all users or specific users
 * This endpoint is called by schedulers (cron jobs, etc.)
 */
app.post(
  '/generate-daily-tasks',
  validator('json', (value, c) => {
    const result = scheduledGenerationSchema.safeParse(value)
    if (!result.success) {
      throw new HTTPException(400, { message: 'Invalid request body' })
    }
    return result.data
  }),
  async (c) => {
    try {
      const { forceRegenerate, targetUserIds } = c.req.valid('json')

      let result
      if (targetUserIds && targetUserIds.length > 0) {
        // Generate for specific users
        result = await scheduledService.generateTasksForUsers(targetUserIds, forceRegenerate)
      } else {
        // Generate for all eligible users
        result = await scheduledService.generateDailyTasksForAllUsers(forceRegenerate)
      }

      if (!result.success) {
        throw new HTTPException(500, { message: result.error || 'Failed to generate daily tasks' })
      }

      return c.json({
        success: true,
        data: result.data
      })
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      
      console.error('Error in scheduled daily task generation:', error)
      throw new HTTPException(500, { message: 'Internal server error during task generation' })
    }
  }
)

/**
 * GET /api/scheduled/eligible-users
 * Get list of users eligible for daily task generation
 * Used by schedulers to understand the user base
 */
app.get('/eligible-users', async (c) => {
  try {
    const users = await scheduledService.getEligibleUsers()

    return c.json({
      success: true,
      data: {
        users,
        totalUsers: users.length,
        timezones: Array.from(new Set(users.map(u => u.timezone))).sort()
      }
    })
  } catch (error) {
    console.error('Error getting eligible users:', error)
    throw new HTTPException(500, { message: 'Failed to get eligible users' })
  }
})

/**
 * GET /api/scheduled/info
 * Get scheduling configuration and optionally statistics
 * Used by external schedulers to understand timing requirements
 */
app.get(
  '/info',
  validator('query', (value, c) => {
    const result = schedulingInfoSchema.safeParse(value)
    if (!result.success) {
      throw new HTTPException(400, { message: 'Invalid query parameters' })
    }
    return result.data
  }),
  async (c) => {
    try {
      const { includeStats, date } = c.req.valid('query')

      const schedulingInfo = scheduledService.getSchedulingInfo()
      
      const response: any = {
        success: true,
        data: {
          scheduling: schedulingInfo
        }
      }

      if (includeStats) {
        const statsDate = date ? new Date(date) : new Date()
        const stats = await scheduledService.getGenerationStats(statsDate)
        response.data.statistics = stats
      }

      return c.json(response)
    } catch (error) {
      console.error('Error getting scheduling info:', error)
      throw new HTTPException(500, { message: 'Failed to get scheduling information' })
    }
  }
)

/**
 * GET /api/scheduled/stats
 * Get detailed statistics about task generation
 * Used for monitoring and debugging scheduled generation
 */
app.get(
  '/stats',
  validator('query', (value, c) => {
    const statsQuery = z.object({
      date: z.string().optional(), // YYYY-MM-DD format
      days: z.string().optional().default("7").transform(val => parseInt(val) || 7) // Number of days to look back
    })
    
    const result = statsQuery.safeParse(value)
    if (!result.success) {
      throw new HTTPException(400, { message: 'Invalid query parameters' })
    }
    return result.data
  }),
  async (c) => {
    try {
      const { date, days } = c.req.valid('query')

      const endDate = date ? new Date(date) : new Date()
      const stats = []

      // Get stats for each day in the range
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(endDate)
        currentDate.setDate(currentDate.getDate() - i)
        
        const dayStats = await scheduledService.getGenerationStats(currentDate)
        stats.push(dayStats)
      }

      return c.json({
        success: true,
        data: {
          statistics: stats,
          summary: {
            totalDays: days,
            averageTasksPerDay: stats.reduce((sum, s) => sum + s.totalTasksGenerated, 0) / days,
            averageUsersPerDay: stats.reduce((sum, s) => sum + s.usersWithTasks, 0) / days
          }
        }
      })
    } catch (error) {
      console.error('Error getting generation statistics:', error)
      throw new HTTPException(500, { message: 'Failed to get generation statistics' })
    }
  }
)

/**
 * POST /api/scheduled/test
 * Test endpoint for validating scheduled generation without affecting production
 * Returns what would happen without actually generating tasks
 */
app.post('/test', async (c) => {
  try {
    const eligibleUsers = await scheduledService.getEligibleUsers()
    const schedulingInfo = scheduledService.getSchedulingInfo()
    
    // Check which users already have tasks for today
    let usersWithTasks = 0
    let usersWithoutTasks = 0
    
    for (const user of eligibleUsers) {
      const hasTasksToday = await scheduledService.userHasTasksForToday(user.id)
      if (hasTasksToday) {
        usersWithTasks++
      } else {
        usersWithoutTasks++
      }
    }

    return c.json({
      success: true,
      data: {
        testMode: true,
        schedulingInfo,
        eligibleUsers: eligibleUsers.length,
        usersWithTasksToday: usersWithTasks,
        usersWithoutTasksToday: usersWithoutTasks,
        wouldGenerate: usersWithoutTasks,
        timezoneBreakdown: eligibleUsers.reduce((acc: any, user) => {
          acc[user.timezone] = (acc[user.timezone] || 0) + 1
          return acc
        }, {})
      }
    })
  } catch (error) {
    console.error('Error in scheduled generation test:', error)
    throw new HTTPException(500, { message: 'Failed to run generation test' })
  }
})

export default app
