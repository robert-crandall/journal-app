import { Context } from 'hono';
import { db } from '../db';
import { 
  tasks, taskFamilyMembers, taskCharacterStats,
  familyMembers, characterStats, quests, experiments
} from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { 
  TaskInput, ApiResponse, Task, FamilyMember,
  CharacterStat 
} from '../types/api';

// Get all tasks for the current user
export async function getTasks(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    
    const results = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, currentUser.id))
      .orderBy(desc(tasks.dueDate));
    
    // Map and return tasks
    const response: ApiResponse<{ tasks: Task[] }> = {
      success: true,
      data: {
        tasks: results.map((task: any) => ({
          ...task,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        })),
      },
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Get tasks error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve tasks' });
  }
}

// Get a specific task by ID with related data
export async function getTaskById(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const taskId = c.req.param('id');
    
    // Get the task
    const taskResult = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (taskResult.length === 0) {
      throw new HTTPException(404, { message: 'Task not found' });
    }

    // Get family members related to this task
    const taskFamilyMembersResult = await db
      .select({
        familyMember: familyMembers,
      })
      .from(taskFamilyMembers)
      .innerJoin(familyMembers, eq(taskFamilyMembers.familyMemberId, familyMembers.id))
      .where(eq(taskFamilyMembers.taskId, taskId));

    // Get character stats related to this task
    const taskCharacterStatsResult = await db
      .select({
        characterStat: characterStats,
        xpAmount: taskCharacterStats.xpAmount,
      })
      .from(taskCharacterStats)
      .innerJoin(characterStats, eq(taskCharacterStats.characterStatId, characterStats.id))
      .where(eq(taskCharacterStats.taskId, taskId));
    
    const task = taskResult[0];
    
    // Get additional data if task is related to quest or experiment
    let questData = null;
    let experimentData = null;
    
    if (task.questId) {
      const questResult = await db
        .select()
        .from(quests)
        .where(eq(quests.id, task.questId))
        .limit(1);
        
      if (questResult.length > 0) {
        questData = {
          id: questResult[0].id,
          title: questResult[0].title
        };
      }
    }
    
    if (task.experimentId) {
      const experimentResult = await db
        .select()
        .from(experiments)
        .where(eq(experiments.id, task.experimentId))
        .limit(1);
        
      if (experimentResult.length > 0) {
        experimentData = {
          id: experimentResult[0].id,
          title: experimentResult[0].title
        };
      }
    }
    
    const response: ApiResponse<{ task: Task }> = {
      success: true,
      data: {
        task: {
          ...task,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          completedAt: task.completedAt ? task.completedAt.toISOString() : null,
          familyMembers: taskFamilyMembersResult.map((tfm: { familyMember: FamilyMember & { createdAt: Date, updatedAt: Date } }) => ({
            ...tfm.familyMember,
            createdAt: tfm.familyMember.createdAt.toISOString(),
            updatedAt: tfm.familyMember.updatedAt.toISOString(),
          })),
          characterStats: taskCharacterStatsResult.map((tcs: { characterStat: CharacterStat & { createdAt: Date, updatedAt: Date }, xpAmount: number }) => ({
            characterStat: {
              ...tcs.characterStat,
              createdAt: tcs.characterStat.createdAt.toISOString(),
              updatedAt: tcs.characterStat.updatedAt.toISOString(),
            },
            xpAmount: tcs.xpAmount,
          })),
          quest: questData,
          experiment: experimentData
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get task by ID error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve task' });
  }
}

// Create a new task
export async function createTask(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json() as TaskInput;
    
    // Validate quest ID if provided
    if (body.questId) {
      const questResult = await db
        .select()
        .from(quests)
        .where(
          and(
            eq(quests.id, body.questId),
            eq(quests.userId, currentUser.id)
          )
        )
        .limit(1);
        
      if (questResult.length === 0) {
        throw new HTTPException(400, { message: 'Quest not found' });
      }
    }
    
    // Validate experiment ID if provided
    if (body.experimentId) {
      const experimentResult = await db
        .select()
        .from(experiments)
        .where(
          and(
            eq(experiments.id, body.experimentId),
            eq(experiments.userId, currentUser.id)
          )
        )
        .limit(1);
        
      if (experimentResult.length === 0) {
        throw new HTTPException(400, { message: 'Experiment not found' });
      }
    }
    
    // Insert task
    const result = await db.insert(tasks).values({
      userId: currentUser.id,
      title: body.title,
      description: body.description || null,
      dueDate: body.dueDate || null,
      isRecurring: body.isRecurring || false,
      recurrencePattern: body.recurrencePattern || null,
      questId: body.questId || null,
      experimentId: body.experimentId || null,
    }).returning();
    
    const task = result[0];
    
    // Add family members if provided
    if (body.familyMemberIds && body.familyMemberIds.length > 0) {
      // Verify all family members belong to the user
      const userFamilyMembers = await db
        .select()
        .from(familyMembers)
        .where(
          and(
            eq(familyMembers.userId, currentUser.id),
            sql`${familyMembers.id} IN (${body.familyMemberIds.join(', ')})`
          )
        );
      
      // Add verified family members to the task
      if (userFamilyMembers.length > 0) {
        const familyMemberValues = userFamilyMembers.map((fm: any) => ({
          taskId: task.id,
          familyMemberId: fm.id,
        }));
        
        await db.insert(taskFamilyMembers).values(familyMemberValues);
      }
    }
    
    // Add character stats if provided
    if (body.characterStatIds && body.characterStatIds.length > 0) {
      for (const statItem of body.characterStatIds) {
        // Verify character stat belongs to the user
        const userCharacterStat = await db
          .select()
          .from(characterStats)
          .where(
            and(
              eq(characterStats.userId, currentUser.id),
              eq(characterStats.id, statItem.id)
            )
          )
          .limit(1);
        
        if (userCharacterStat.length > 0) {
          await db.insert(taskCharacterStats).values({
            taskId: task.id,
            characterStatId: statItem.id,
            xpAmount: statItem.xp,
          });
        }
      }
    }
    
    const response: ApiResponse<{ task: Task }> = {
      success: true,
      data: {
        task: {
          ...task,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          completedAt: null,
        },
      },
    };
    
    return c.json(response, 201);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Create task error:', error);
    throw new HTTPException(500, { message: 'Failed to create task' });
  }
}

// Update a task
export async function updateTask(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const taskId = c.req.param('id');
    const body = await c.req.json() as TaskInput;
    
    // Check if the task exists and belongs to the user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, currentUser.id)
        )
      )
      .limit(1);
      
    if (existingTask.length === 0) {
      throw new HTTPException(404, { message: 'Task not found' });
    }
    
    // Validate quest ID if provided
    if (body.questId) {
      const questResult = await db
        .select()
        .from(quests)
        .where(
          and(
            eq(quests.id, body.questId),
            eq(quests.userId, currentUser.id)
          )
        )
        .limit(1);
        
      if (questResult.length === 0) {
        throw new HTTPException(400, { message: 'Quest not found' });
      }
    }
    
    // Validate experiment ID if provided
    if (body.experimentId) {
      const experimentResult = await db
        .select()
        .from(experiments)
        .where(
          and(
            eq(experiments.id, body.experimentId),
            eq(experiments.userId, currentUser.id)
          )
        )
        .limit(1);
        
      if (experimentResult.length === 0) {
        throw new HTTPException(400, { message: 'Experiment not found' });
      }
    }
    
    // Update task
    const result = await db.update(tasks)
      .set({
        title: body.title,
        description: body.description || null,
        dueDate: body.dueDate || null,
        isRecurring: body.isRecurring || false,
        recurrencePattern: body.recurrencePattern || null,
        questId: body.questId || null,
        experimentId: body.experimentId || null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();
    
    const task = result[0];
    
    // Update family members if provided
    if (body.familyMemberIds) {
      // Remove existing relationships
      await db.delete(taskFamilyMembers).where(eq(taskFamilyMembers.taskId, taskId));
      
      if (body.familyMemberIds.length > 0) {
        // Verify all family members belong to the user
        const userFamilyMembers = await db
          .select()
          .from(familyMembers)
          .where(
            and(
              eq(familyMembers.userId, currentUser.id),
              sql`${familyMembers.id} IN (${body.familyMemberIds.join(', ')})`
            )
          );
        
        // Add verified family members to the task
        if (userFamilyMembers.length > 0) {
          const familyMemberValues = userFamilyMembers.map((fm: any) => ({
            taskId: task.id,
            familyMemberId: fm.id,
          }));
          
          await db.insert(taskFamilyMembers).values(familyMemberValues);
        }
      }
    }
    
    // Update character stats if provided
    if (body.characterStatIds) {
      // Remove existing relationships
      await db.delete(taskCharacterStats).where(eq(taskCharacterStats.taskId, taskId));
      
      if (body.characterStatIds.length > 0) {
        for (const statItem of body.characterStatIds) {
          // Verify character stat belongs to the user
          const userCharacterStat = await db
            .select()
            .from(characterStats)
            .where(
              and(
                eq(characterStats.userId, currentUser.id),
                eq(characterStats.id, statItem.id)
              )
            )
            .limit(1);
          
          if (userCharacterStat.length > 0) {
            await db.insert(taskCharacterStats).values({
              taskId: task.id,
              characterStatId: statItem.id,
              xpAmount: statItem.xp,
            });
          }
        }
      }
    }
    
    const response: ApiResponse<{ task: Task }> = {
      success: true,
      data: {
        task: {
          ...task,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update task error:', error);
    throw new HTTPException(500, { message: 'Failed to update task' });
  }
}

// Complete a task
export async function completeTask(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const taskId = c.req.param('id');
    
    // Check if the task exists and belongs to the user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, currentUser.id)
        )
      )
      .limit(1);
      
    if (existingTask.length === 0) {
      throw new HTTPException(404, { message: 'Task not found' });
    }
    
    // Update task as completed
    const result = await db.update(tasks)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();
    
    const task = result[0];
    
    // Apply XP rewards to character stats if any
    const taskCharacterStatsResult = await db
      .select({
        characterStatId: taskCharacterStats.characterStatId,
        xpAmount: taskCharacterStats.xpAmount,
      })
      .from(taskCharacterStats)
      .where(eq(taskCharacterStats.taskId, taskId));
    
    // Award XP for each character stat
    for (const statItem of taskCharacterStatsResult) {
      await db.update(characterStats)
        .set({
          currentXP: sql`${characterStats.currentXP} + ${statItem.xpAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(characterStats.id, statItem.characterStatId));
    }
    
    const response: ApiResponse<{ task: Task }> = {
      success: true,
      data: {
        task: {
          ...task,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          completedAt: task.completedAt.toISOString(),
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Complete task error:', error);
    throw new HTTPException(500, { message: 'Failed to complete task' });
  }
}

// Delete a task
export async function deleteTask(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const taskId = c.req.param('id');
    
    // Check if the task exists and belongs to the user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, currentUser.id)
        )
      )
      .limit(1);
      
    if (existingTask.length === 0) {
      throw new HTTPException(404, { message: 'Task not found' });
    }
    
    // Delete task (cascade will handle relationships)
    await db.delete(tasks).where(eq(tasks.id, taskId));
    
    return c.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete task error:', error);
    throw new HTTPException(500, { message: 'Failed to delete task' });
  }
}
