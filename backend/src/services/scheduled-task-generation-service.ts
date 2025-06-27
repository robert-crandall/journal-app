import { db } from '../db/connection'
import { users, characters, tasks as tasksTable } from '../db/schema'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { DailyTaskGenerationService } from './daily-task-generation-service'

export interface ScheduledGenerationResult {
  totalUsersProcessed: number
  successfulGenerations: number
  skippedUsers: number
  errors: Array<{
    userId: string
    error: string
  }>
}

export interface SchedulingInfo {
  recommendedTime: string
  frequency: string
  timezone: string
  description: string
}

export interface EligibleUser {
  id: string
  email: string
  name: string
  timezone: string
  zipCode?: string
}

/**
 * Service for scheduled automatic daily task generation across all users
 * Implements Task 4.11: Create scheduled daily task generation system
 */
export class ScheduledTaskGenerationService {
  private dailyTaskService: DailyTaskGenerationService

  constructor() {
    this.dailyTaskService = new DailyTaskGenerationService()
  }

  /**
   * Generate daily tasks for all eligible users
   * This is the main method called by the scheduler
   */
  async generateDailyTasksForAllUsers(forceRegenerate: boolean = false): Promise<{
    success: boolean
    data?: ScheduledGenerationResult
    error?: string
  }> {
    try {
      const eligibleUsers = await this.getEligibleUsers()
      
      const result: ScheduledGenerationResult = {
        totalUsersProcessed: eligibleUsers.length,
        successfulGenerations: 0,
        skippedUsers: 0,
        errors: []
      }

      // Process each user individually to avoid one failure affecting others
      for (const user of eligibleUsers) {
        try {
          // Check if user already has tasks for today (unless forcing regeneration)
          if (!forceRegenerate && await this.userHasTasksForToday(user.id)) {
            result.skippedUsers++
            continue
          }

          // Generate daily tasks for this user
          const taskGenResult = await this.dailyTaskService.generateDailyTasks({
            userId: user.id,
            forceRegenerate,
            zipCode: user.zipCode
          })

          if (taskGenResult.success) {
            result.successfulGenerations++
          } else {
            result.errors.push({
              userId: user.id,
              error: typeof taskGenResult.error === 'string' 
                ? taskGenResult.error 
                : taskGenResult.error?.message || 'Unknown error during task generation'
            })
          }
        } catch (error) {
          result.errors.push({
            userId: user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in scheduled generation'
      }
    }
  }

  /**
   * Get all users eligible for daily task generation
   * Users must have at least one character to be eligible
   */
  async getEligibleUsers(): Promise<EligibleUser[]> {
    try {
      const eligibleUsers = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          timezone: users.timezone,
          zipCode: users.zipCode
        })
        .from(users)
        .innerJoin(characters, eq(characters.userId, users.id))
        .where(eq(characters.isActive, true))
        .groupBy(users.id, users.email, users.name, users.timezone, users.zipCode)

      return eligibleUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone || 'UTC',
        zipCode: user.zipCode || undefined
      }))
    } catch (error) {
      console.error('Error getting eligible users:', error)
      return []
    }
  }

  /**
   * Check if a user already has AI-generated tasks for today
   * Made public for testing and monitoring purposes
   */
  async userHasTasksForToday(userId: string): Promise<boolean> {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      const existingTasks = await db
        .select({ id: tasksTable.id })
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.userId, userId),
            eq(tasksTable.source, 'ai'),
            gte(tasksTable.createdAt, startOfDay),
            lte(tasksTable.createdAt, endOfDay)
          )
        )

      return existingTasks.length > 0
    } catch (error) {
      console.error('Error checking existing tasks for user:', userId, error)
      return false // Err on the side of generating tasks
    }
  }

  /**
   * Get scheduling configuration information
   * Used by external schedulers to understand timing requirements
   */
  getSchedulingInfo(): SchedulingInfo {
    return {
      recommendedTime: '6:00 AM user local time',
      frequency: 'daily',
      timezone: 'per-user',
      description: 'Automated daily task generation system that creates 2 tasks per user (1 adventure + 1 family) every morning at 6 AM in their local timezone'
    }
  }

  /**
   * Generate tasks for a specific list of users
   * Useful for batch processing or testing specific user groups
   */
  async generateTasksForUsers(
    userIds: string[], 
    forceRegenerate: boolean = false
  ): Promise<{
    success: boolean
    data?: ScheduledGenerationResult
    error?: string
  }> {
    try {
      const eligibleUsers = await this.getEligibleUsers()
      const targetUsers = eligibleUsers.filter(user => userIds.includes(user.id))

      const result: ScheduledGenerationResult = {
        totalUsersProcessed: targetUsers.length,
        successfulGenerations: 0,
        skippedUsers: 0,
        errors: []
      }

      for (const user of targetUsers) {
        try {
          if (!forceRegenerate && await this.userHasTasksForToday(user.id)) {
            result.skippedUsers++
            continue
          }

          const taskGenResult = await this.dailyTaskService.generateDailyTasks({
            userId: user.id,
            forceRegenerate,
            zipCode: user.zipCode
          })

          if (taskGenResult.success) {
            result.successfulGenerations++
          } else {
            result.errors.push({
              userId: user.id,
              error: typeof taskGenResult.error === 'string' 
                ? taskGenResult.error 
                : taskGenResult.error?.message || 'Unknown error during task generation'
            })
          }
        } catch (error) {
          result.errors.push({
            userId: user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in targeted generation'
      }
    }
  }

  /**
   * Get statistics about the last scheduled generation run
   * Useful for monitoring and debugging
   */
  async getGenerationStats(date?: Date): Promise<{
    date: string
    totalTasksGenerated: number
    usersWithTasks: number
    averageTasksPerUser: number
  }> {
    const targetDate = date || new Date()
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)

    try {
      const generatedTasks = await db
        .select({
          userId: tasksTable.userId,
          taskCount: tasksTable.id
        })
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.source, 'ai'),
            gte(tasksTable.createdAt, startOfDay),
            lte(tasksTable.createdAt, endOfDay)
          )
        )

      const uniqueUsers = new Set(generatedTasks.map(t => t.userId))
      const totalTasks = generatedTasks.length
      const usersWithTasks = uniqueUsers.size

      return {
        date: targetDate.toISOString().split('T')[0],
        totalTasksGenerated: totalTasks,
        usersWithTasks,
        averageTasksPerUser: usersWithTasks > 0 ? totalTasks / usersWithTasks : 0
      }
    } catch (error) {
      console.error('Error getting generation stats:', error)
      return {
        date: targetDate.toISOString().split('T')[0],
        totalTasksGenerated: 0,
        usersWithTasks: 0,
        averageTasksPerUser: 0
      }
    }
  }
}
