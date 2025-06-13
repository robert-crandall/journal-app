import { eq, and, between } from 'drizzle-orm'
import { db } from '../db'
import { experiments, dailyTasks } from '../db/schema'
import { CreateExperimentInput, UpdateExperimentInput, Experiment, DailyTask, CompleteDailyTaskInput } from '../types'
import { parseDate } from '../utils/helpers'
import { CharacterStatsService } from './character-stats.service'

export class ExperimentsService {
  static async create(userId: string, input: CreateExperimentInput): Promise<Experiment | null> {
    try {
      const [newExperiment] = await db.insert(experiments).values({
        userId,
        title: input.title,
        description: input.description,
        startDate: parseDate(input.startDate),
        endDate: parseDate(input.endDate),
        dailyTaskDescription: input.dailyTaskDescription,
      }).returning()

      return newExperiment
    } catch (error) {
      console.error('Create experiment error:', error)
      return null
    }
  }

  static async getByUserId(userId: string): Promise<Experiment[]> {
    try {
      return await db.query.experiments.findMany({
        where: eq(experiments.userId, userId),
        orderBy: (experiments, { desc }) => [desc(experiments.createdAt)]
      })
    } catch (error) {
      console.error('Get experiments error:', error)
      return []
    }
  }

  static async getById(id: string, userId: string): Promise<Experiment | null> {
    try {
      return await db.query.experiments.findFirst({
        where: and(
          eq(experiments.id, id),
          eq(experiments.userId, userId)
        )
      }) as Experiment | null
    } catch (error) {
      console.error('Get experiment error:', error)
      return null
    }
  }

  static async update(id: string, userId: string, input: UpdateExperimentInput): Promise<Experiment | null> {
    try {
      const updateData: any = {
        updatedAt: new Date()
      }

      if (input.title !== undefined) {
        updateData.title = input.title
      }

      if (input.description !== undefined) {
        updateData.description = input.description
      }

      if (input.startDate !== undefined) {
        updateData.startDate = parseDate(input.startDate)
      }

      if (input.endDate !== undefined) {
        updateData.endDate = parseDate(input.endDate)
      }

      if (input.dailyTaskDescription !== undefined) {
        updateData.dailyTaskDescription = input.dailyTaskDescription
      }

      const [updatedExperiment] = await db.update(experiments)
        .set(updateData)
        .where(and(
          eq(experiments.id, id),
          eq(experiments.userId, userId)
        ))
        .returning()

      return updatedExperiment || null
    } catch (error) {
      console.error('Update experiment error:', error)
      return null
    }
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await db.delete(experiments)
        .where(and(
          eq(experiments.id, id),
          eq(experiments.userId, userId)
        ))
        .returning()

      return result.length > 0
    } catch (error) {
      console.error('Delete experiment error:', error)
      return false
    }
  }

  static async getDailyTasks(experimentId: string): Promise<DailyTask[]> {
    try {
      return await db.query.dailyTasks.findMany({
        where: eq(dailyTasks.experimentId, experimentId),
        orderBy: (tasks, { desc }) => [desc(tasks.date)]
      })
    } catch (error) {
      console.error('Get daily tasks error:', error)
      return []
    }
  }

  static async completeDailyTask(
    experimentId: string, 
    input: CompleteDailyTaskInput
  ): Promise<DailyTask | null> {
    try {
      const taskDate = parseDate(input.date)
      
      // Check if task already exists for this date
      const existingTask = await db.query.dailyTasks.findFirst({
        where: and(
          eq(dailyTasks.experimentId, experimentId),
          eq(dailyTasks.date, taskDate)
        )
      })

      if (existingTask) {
        // Update existing task
        const [updatedTask] = await db.update(dailyTasks)
          .set({
            completed: input.completed,
            completedAt: input.completed ? new Date() : null,
            updatedAt: new Date()
          })
          .where(eq(dailyTasks.id, existingTask.id))
          .returning()

        // Award XP if completing for the first time
        if (input.completed && !existingTask.completed && existingTask.xpRewards && existingTask.xpRewards.length > 0) {
          for (const reward of existingTask.xpRewards) {
            await CharacterStatsService.addXp(reward.statId, reward.xp)
          }
        }

        return updatedTask
      } else {
        // Create new task
        const [newTask] = await db.insert(dailyTasks).values({
          experimentId,
          date: taskDate,
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
          xpRewards: [], // XP rewards will be set when experiment has stat mappings
        }).returning()

        return newTask
      }
    } catch (error) {
      console.error('Complete daily task error:', error)
      return null
    }
  }

  static async getTasksInDateRange(
    experimentId: string, 
    startDate: string, 
    endDate: string
  ): Promise<DailyTask[]> {
    try {
      return await db.query.dailyTasks.findMany({
        where: and(
          eq(dailyTasks.experimentId, experimentId),
          between(dailyTasks.date, parseDate(startDate), parseDate(endDate))
        ),
        orderBy: (tasks, { asc }) => [asc(tasks.date)]
      })
    } catch (error) {
      console.error('Get tasks in date range error:', error)
      return []
    }
  }
}
