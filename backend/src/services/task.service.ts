import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import { tasks } from '../db/schema';
import { CreateTaskInput, UpdateTaskInput } from '../lib/validation';

export class TaskService {
  /**
   * Create a new task for a user
   */
  static async createTask(userId: string, input: CreateTaskInput) {
    const [task] = await db.insert(tasks).values({
      userId,
      title: input.title,
      description: input.description || null,
      dueDate: input.dueDate || null,
    }).returning();

    return task;
  }

  /**
   * Get all tasks for a user
   */
  static async getUserTasks(userId: string, options?: {
    includeCompleted?: boolean;
    sortBy?: 'dueDate' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    const { includeCompleted = true, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    let whereConditions;

    if (!includeCompleted) {
      whereConditions = and(eq(tasks.userId, userId), eq(tasks.isCompleted, false));
    } else {
      whereConditions = eq(tasks.userId, userId);
    }

    // Apply sorting
    const sortColumn = sortBy === 'dueDate' ? tasks.dueDate : tasks.createdAt;
    const sortFunction = sortOrder === 'asc' ? asc : desc;
    
    const userTasks = await db.select().from(tasks)
      .where(whereConditions)
      .orderBy(sortFunction(sortColumn));
    
    return userTasks;
  }

  /**
   * Get tasks for dashboard (upcoming/overdue tasks)
   */
  static async getDashboardTasks(userId: string) {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    const userTasks = await db.select().from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.isCompleted, false)
      ))
      .orderBy(asc(tasks.dueDate), desc(tasks.createdAt));

    return userTasks;
  }

  /**
   * Get a specific task by ID (must belong to user)
   */
  static async getTaskById(taskId: string, userId: string) {
    const [task] = await db.select().from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    return task || null;
  }

  /**
   * Update a task
   */
  static async updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
    const updateData: any = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
    if (input.isCompleted !== undefined) {
      updateData.isCompleted = input.isCompleted;
      updateData.completedAt = input.isCompleted ? new Date() : null;
    }
    
    updateData.updatedAt = new Date();

    const [updatedTask] = await db.update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return updatedTask || null;
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string, userId: string) {
    const [deletedTask] = await db.delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return deletedTask || null;
  }

  /**
   * Toggle task completion status
   */
  static async toggleTaskComplete(taskId: string, userId: string) {
    const task = await this.getTaskById(taskId, userId);
    if (!task) return null;

    const newCompletedStatus = !task.isCompleted;
    
    return this.updateTask(taskId, userId, {
      isCompleted: newCompletedStatus
    });
  }

  /**
   * Get task statistics for a user
   */
  static async getTaskStats(userId: string) {
    const allTasks = await this.getUserTasks(userId);
    const completedTasks = allTasks.filter(task => task.isCompleted);
    const pendingTasks = allTasks.filter(task => !task.isCompleted);
    
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = pendingTasks.filter(task => 
      task.dueDate && task.dueDate < today
    );

    return {
      total: allTasks.length,
      completed: completedTasks.length,
      pending: pendingTasks.length,
      overdue: overdueTasks.length,
    };
  }
}
