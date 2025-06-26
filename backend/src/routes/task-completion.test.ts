import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, tasks, taskCompletions } from '../db/schema'
import { eq } from 'drizzle-orm'

describe('Task Completion System - Task 3.2', () => {
  let testUserId: string
  let testCharacterId: string
  let testStatId: string
  let testTaskId: string
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupTaskIds: string[] = []

  beforeEach(async () => {
    // Create test user
    const [user] = await db.insert(users).values({
      email: `test-completion-${Date.now()}@example.com`,
      name: 'Test User',
      timezone: 'UTC'
    }).returning()
    testUserId = user.id
    cleanupUserIds.push(user.id)

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Hero',
      class: 'Warrior',
      backstory: 'A brave warrior on their journey'
    }).returning()
    testCharacterId = character.id
    cleanupCharacterIds.push(character.id)

    // Create test character stat
    const [stat] = await db.insert(characterStats).values({
      characterId: testCharacterId,
      category: 'Physical Health',
      currentXp: 50,
      currentLevel: 1,
      totalXp: 50,
      description: 'Track physical fitness activities'
    }).returning()
    testStatId = stat.id

    // Create test task
    const [task] = await db.insert(tasks).values({
      userId: testUserId,
      title: 'Complete workout routine',
      description: 'Do 30 minutes of exercise',
      source: 'ai',
      targetStats: ['Physical Health'],
      estimatedXp: 25,
      status: 'pending'
    }).returning()
    testTaskId = task.id
    cleanupTaskIds.push(task.id)
  })

  afterEach(async () => {
    // Clean up test data
    await db.delete(taskCompletions).where(eq(taskCompletions.userId, testUserId))
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasks).where(eq(tasks.id, taskId))
    }
    for (const characterId of cleanupCharacterIds) {
      await db.delete(characterStats).where(eq(characterStats.characterId, characterId))
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  describe('POST /api/tasks/:id/complete - Task Completion', () => {
    it('should complete task and award immediate XP to targeted stats', async () => {
      const completionData = {
        userId: testUserId,
        actualXp: 30,
        statAwards: {
          'Physical Health': 30
        },
        feedback: 'Great workout session! I feel energized and accomplished.'
      }

      const response = await app.request(`/api/tasks/${testTaskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.taskCompletion).toBeDefined()
      expect(result.data.taskCompletion.actualXp).toBe(30)
      expect(result.data.taskCompletion.statAwards).toEqual({ 'Physical Health': 30 })

      // Check task status was updated
      expect(result.data.task.status).toBe('completed')
      expect(result.data.task.completedAt).toBeDefined()

      // Check XP notifications
      expect(result.data.xpNotifications).toBeDefined()
      expect(result.data.xpNotifications).toHaveLength(1)
      expect(result.data.xpNotifications[0].statCategory).toBe('Physical Health')
      expect(result.data.xpNotifications[0].xpAwarded).toBe(30)
      expect(result.data.xpNotifications[0].newTotalXp).toBe(80) // 50 + 30
      expect(result.data.xpNotifications[0].leveledUp).toBe(false)
    })

    it('should complete task and trigger level up with immediate notification', async () => {
      // Set up stat to be ready for level up (level 2 requires 300 total XP)
      await db.update(characterStats)
        .set({ 
          currentXp: 270, 
          totalXp: 270 
        })
        .where(eq(characterStats.id, testStatId))

      const completionData = {
        userId: testUserId,
        actualXp: 50,
        statAwards: {
          'Physical Health': 50
        },
        feedback: 'Great workout session! Feeling strong and accomplished.'
      }

      const response = await app.request(`/api/tasks/${testTaskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.xpNotifications[0].leveledUp).toBe(true)
      expect(result.data.xpNotifications[0].newLevel).toBe(2)
      expect(result.data.xpNotifications[0].newTotalXp).toBe(320) // 270 + 50
      expect(result.data.xpNotifications[0].levelTitle).toBeDefined()
    })

    it('should complete AI task and require feedback', async () => {
      const completionData = {
        userId: testUserId,
        actualXp: 25,
        statAwards: {
          'Physical Health': 25
        },
        feedback: 'Great workout, felt energized after!'
      }

      const response = await app.request(`/api/tasks/${testTaskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.taskCompletion.feedback).toBe('Great workout, felt energized after!')
      expect(result.data.feedbackRequired).toBe(true)
      expect(result.data.feedbackProcessed).toBe(true)
    })

    it('should handle non-AI task completion without feedback requirement', async () => {
      // Create a quest task (non-AI)
      const [questTask] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Quest workout',
        description: 'Part of fitness quest',
        source: 'quest',
        sourceId: '123e4567-e89b-12d3-a456-426614174000', // dummy quest ID
        targetStats: ['Physical Health'],
        estimatedXp: 25,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(questTask.id)

      const completionData = {
        userId: testUserId,
        actualXp: 25,
        statAwards: {
          'Physical Health': 25
        }
      }

      const response = await app.request(`/api/tasks/${questTask.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.feedbackRequired).toBe(false)
      expect(result.data.displayDuration).toBe(2000) // 2 seconds for non-AI tasks
    })

    it('should handle multiple stat awards in single task completion', async () => {
      // Create task that affects multiple stats
      const [multiStatTask] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Family hiking trip',
        description: 'Go hiking with family',
        source: 'ai',
        targetStats: ['Physical Health', 'Family Time'],
        estimatedXp: 40,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(multiStatTask.id)

      // Create Family Time stat
      const [familyStat] = await db.insert(characterStats).values({
        characterId: testCharacterId,
        category: 'Family Time',
        currentXp: 20,
        currentLevel: 1,
        totalXp: 20,
        description: 'Track family activities'
      }).returning()

      const completionData = {
        userId: testUserId,
        actualXp: 40,
        statAwards: {
          'Physical Health': 20,
          'Family Time': 20
        },
        feedback: 'Amazing family hike! Great exercise and quality time together.'
      }

      const response = await app.request(`/api/tasks/${multiStatTask.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.xpNotifications).toHaveLength(2)
      
      const physicalNotification = result.data.xpNotifications.find(
        (n: any) => n.statCategory === 'Physical Health'
      )
      const familyNotification = result.data.xpNotifications.find(
        (n: any) => n.statCategory === 'Family Time'
      )
      
      expect(physicalNotification.xpAwarded).toBe(20)
      expect(familyNotification.xpAwarded).toBe(20)
    })

    it('should validate user ownership of task', async () => {
      // Create another user
      const [anotherUser] = await db.insert(users).values({
        email: `other-${Date.now()}@example.com`,
        name: 'Other User',
        timezone: 'UTC'
      }).returning()
      cleanupUserIds.push(anotherUser.id)

      const completionData = {
        userId: anotherUser.id,
        actualXp: 25,
        statAwards: {
          'Physical Health': 25
        }
      }

      const response = await app.request(`/api/tasks/${testTaskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      expect(response.status).toBe(403)
      const result = await response.json()
      expect(result.message).toContain('Task does not belong to user')
    })

    it('should handle task already completed', async () => {
      // Mark task as completed
      await db.update(tasks)
        .set({ 
          status: 'completed', 
          completedAt: new Date() 
        })
        .where(eq(tasks.id, testTaskId))

      const completionData = {
        userId: testUserId,
        actualXp: 25,
        statAwards: {
          'Physical Health': 25
        }
      }

      const response = await app.request(`/api/tasks/${testTaskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.message).toContain('already completed')
    })

    it('should validate required feedback for AI tasks', async () => {
      const completionData = {
        userId: testUserId,
        actualXp: 25,
        statAwards: {
          'Physical Health': 25
        }
        // Missing feedback for AI task
      }

      const response = await app.request(`/api/tasks/${testTaskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.message).toContain('Feedback is required for AI-generated tasks')
    })

    it('should validate stat awards match character stats', async () => {
      const completionData = {
        userId: testUserId,
        actualXp: 25,
        statAwards: {
          'Nonexistent Stat': 25
        },
        feedback: 'This should fail due to invalid stat category.'
      }

      const response = await app.request(`/api/tasks/${testTaskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.message).toContain('Invalid stat category')
    })

    it('should handle completion without XP awards (todo tasks)', async () => {
      // Create a todo task
      const [todoTask] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Buy groceries',
        description: 'Get items from shopping list',
        source: 'todo',
        estimatedXp: 0,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(todoTask.id)

      const completionData = {
        userId: testUserId,
        actualXp: 0,
        statAwards: {}
      }

      const response = await app.request(`/api/tasks/${todoTask.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.taskCompletion.actualXp).toBe(0)
      expect(result.data.xpNotifications).toHaveLength(0)
      expect(result.data.displayDuration).toBe(1000) // 1 second for non-XP tasks
    })
  })

  describe('GET /api/tasks/completed - List Completed Tasks', () => {
    beforeEach(async () => {
      // Complete the test task
      await db.update(tasks)
        .set({ 
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(tasks.id, testTaskId))

      // Create task completion record
      await db.insert(taskCompletions).values({
        taskId: testTaskId,
        userId: testUserId,
        actualXp: 25,
        statAwards: { 'Physical Health': 25 },
        completedAt: new Date()
      })
    })

    it('should list completed tasks for user', async () => {
      const response = await app.request(`/api/tasks/completed?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.completedTasks).toHaveLength(1)
      expect(result.data.completedTasks[0].id).toBe(testTaskId)
      expect(result.data.completedTasks[0].status).toBe('completed')
      expect(result.data.completedTasks[0].completion).toBeDefined()
      expect(result.data.completedTasks[0].completion.actualXp).toBe(25)
    })

    it('should filter completed tasks by date range', async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const response = await app.request(
        `/api/tasks/completed?userId=${testUserId}&startDate=${today}&endDate=${today}`,
        { method: 'GET' }
      )

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.completedTasks).toHaveLength(1)
    })

    it('should calculate completion statistics', async () => {
      const response = await app.request(`/api/tasks/completed?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.data.stats).toBeDefined()
      expect(result.data.stats.totalCompleted).toBe(1)
      expect(result.data.stats.totalXpEarned).toBe(25)
      expect(result.data.stats.averageXpPerTask).toBe(25)
      expect(result.data.stats.completionsBySource).toEqual({ ai: 1 })
    })
  })

  describe('GET /api/tasks/:id/completion - Get Task Completion Details', () => {
    beforeEach(async () => {
      // Complete the test task
      await db.update(tasks)
        .set({ 
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(tasks.id, testTaskId))

      // Create task completion record
      await db.insert(taskCompletions).values({
        taskId: testTaskId,
        userId: testUserId,
        feedback: 'Great workout!',
        actualXp: 25,
        statAwards: { 'Physical Health': 25 },
        completedAt: new Date()
      })
    })

    it('should get detailed completion information', async () => {
      const response = await app.request(`/api/tasks/${testTaskId}/completion?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.task.id).toBe(testTaskId)
      expect(result.data.completion.feedback).toBe('Great workout!')
      expect(result.data.completion.actualXp).toBe(25)
      expect(result.data.completion.statAwards).toEqual({ 'Physical Health': 25 })
    })

    it('should handle non-existent completion', async () => {
      // Create uncompleted task
      const [uncompletedTask] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Uncompleted task',
        description: 'This task is not completed',
        source: 'ai',
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(uncompletedTask.id)

      const response = await app.request(`/api/tasks/${uncompletedTask.id}/completion?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.message).toContain('Task completion not found')
    })
  })
})
