import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, tasks, quests, experiments, taskCompletions } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

describe('Dashboard API Integration Tests - Task 3.4', () => {
  let testUserId: string
  let testCharacterId: string
  let testQuestId: string
  let testExperimentId: string
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupTaskIds: string[] = []
  const cleanupQuestIds: string[] = []
  const cleanupExperimentIds: string[] = []

  beforeEach(async () => {
    // Create test user
    const testUserData = await createTestUser({
      email: `test-dashboard-${Date.now()}@example.com`,
      name: 'Test User',
      timezone: 'UTC'
    })
    testUserId = testUserData.user.id
    cleanupUserIds.push(testUserId)

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Hero',
      class: 'Ranger',
      backstory: 'An adventurous soul who loves family time'
    }).returning()
    testCharacterId = character.id
    cleanupCharacterIds.push(character.id)

    // Create character stats for XP tracking
    await db.insert(characterStats).values([
      {
        characterId: testCharacterId,
        category: 'Adventure Spirit',
        currentXp: 50,
        currentLevel: 1,
        totalXp: 50,
        description: 'Track outdoor adventures and exploration'
      },
      {
        characterId: testCharacterId,
        category: 'Family Time',
        currentXp: 30,
        currentLevel: 1,
        totalXp: 30,
        description: 'Track family interactions and bonding'
      }
    ])

    // Create test quest
    const [quest] = await db.insert(quests).values({
      userId: testUserId,
      title: 'Complete 5 Outdoor Adventures',
      description: 'Spend more time outside this month',
      goalDescription: 'Get outside and explore nature regularly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'active'
    }).returning()
    testQuestId = quest.id
    cleanupQuestIds.push(quest.id)

    // Create test experiment
    const [experiment] = await db.insert(experiments).values({
      userId: testUserId,
      title: 'Early Morning Routine',
      description: 'Try waking up at 6 AM for a week',
      hypothesis: 'Early morning routines will increase daily productivity',
      duration: 7,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'active'
    }).returning()
    testExperimentId = experiment.id
    cleanupExperimentIds.push(experiment.id)
  })

  afterEach(async () => {
    // Clean up test data
    await db.delete(taskCompletions).where(eq(taskCompletions.userId, testUserId))
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasks).where(eq(tasks.id, taskId))
    }
    for (const questId of cleanupQuestIds) {
      await db.delete(quests).where(eq(quests.id, questId))
    }
    for (const experimentId of cleanupExperimentIds) {
      await db.delete(experiments).where(eq(experiments.id, experimentId))
    }
    for (const characterId of cleanupCharacterIds) {
      await db.delete(characterStats).where(eq(characterStats.characterId, characterId))
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  describe('GET /api/dashboard - Aggregate Dashboard', () => {
    it('should aggregate tasks from all dashboard sources', async () => {
      // Create tasks from different sources
      const tasksToCreate = [
        // AI-generated task (should appear on dashboard)
        {
          title: 'Take a nature walk',
          description: 'AI-generated outdoor activity',
          source: 'ai',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 30,
          status: 'pending'
        },
        // Quest task (should appear on dashboard)
        {
          title: 'Visit local hiking trail',
          description: 'Part of outdoor adventures quest',
          source: 'quest',
          sourceId: testQuestId,
          targetStats: ['Adventure Spirit'],
          estimatedXp: 50,
          status: 'pending'
        },
        // Experiment task (should appear on dashboard)
        {
          title: 'Wake up at 6 AM',
          description: 'Part of early morning experiment',
          source: 'experiment',
          sourceId: testExperimentId,
          targetStats: ['Adventure Spirit'],
          estimatedXp: 20,
          status: 'pending'
        },
        // Simple todo (should appear on dashboard)
        {
          title: 'Buy groceries',
          description: 'Weekly grocery shopping',
          source: 'todo',
          estimatedXp: 0,
          status: 'pending'
        },
        // Project task (should NOT appear on dashboard)
        {
          title: 'Clean garage - sort tools',
          description: 'Part of garage cleaning project',
          source: 'project',
          estimatedXp: 0,
          status: 'pending'
        },
        // Ad-hoc task (should NOT appear on dashboard - separate page)
        {
          title: 'Quick workout',
          description: 'Daily exercise tracking',
          source: 'ad-hoc',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 25,
          status: 'pending'
        }
      ]

      for (const taskData of tasksToCreate) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          ...taskData
        }).returning()
        cleanupTaskIds.push(task.id)
      }

      const response = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.tasks).toBeDefined()
      expect(Array.isArray(result.data.tasks)).toBe(true)
      
      // Should include AI, quest, experiment, and todo tasks
      expect(result.data.tasks.length).toBe(4)
      
      const taskSources = result.data.tasks.map((task: any) => task.source)
      expect(taskSources).toContain('ai')
      expect(taskSources).toContain('quest')
      expect(taskSources).toContain('experiment')
      expect(taskSources).toContain('todo')
      
      // Should NOT include project or ad-hoc tasks
      expect(taskSources).not.toContain('project')
      expect(taskSources).not.toContain('ad-hoc')
    })

    it('should include quest and experiment metadata with tasks', async () => {
      // Create quest task
      const [questTaskRecord] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Hiking quest task',
        description: 'Part of outdoor quest',
        source: 'quest',
        sourceId: testQuestId,
        targetStats: ['Adventure Spirit'],
        estimatedXp: 40,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(questTaskRecord.id)

      // Create experiment task
      const [experimentTaskRecord] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Morning routine task',
        description: 'Part of early morning experiment',
        source: 'experiment',
        sourceId: testExperimentId,
        targetStats: ['Adventure Spirit'],
        estimatedXp: 25,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(experimentTaskRecord.id)

      const response = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      
      const questTaskResponse = result.data.tasks.find((t: any) => t.source === 'quest')
      expect(questTaskResponse).toBeDefined()
      expect(questTaskResponse.sourceMetadata).toBeDefined()
      expect(questTaskResponse.sourceMetadata.title).toBe('Complete 5 Outdoor Adventures')
      expect(questTaskResponse.sourceMetadata.endDate).toBeDefined()
      expect(questTaskResponse.sourceMetadata.status).toBe('active')

      const experimentTaskResponse = result.data.tasks.find((t: any) => t.source === 'experiment')
      expect(experimentTaskResponse).toBeDefined()
      expect(experimentTaskResponse.sourceMetadata).toBeDefined()
      expect(experimentTaskResponse.sourceMetadata.title).toBe('Early Morning Routine')
      expect(experimentTaskResponse.sourceMetadata.duration).toBe(7)
      expect(experimentTaskResponse.sourceMetadata.status).toBe('active')
    })

    it('should provide dashboard summary statistics', async () => {
      // Create tasks with different statuses and sources
      const tasksToCreate = [
        { source: 'ai', status: 'pending', estimatedXp: 30 },
        { source: 'quest', sourceId: testQuestId, status: 'completed', estimatedXp: 50 },
        { source: 'experiment', sourceId: testExperimentId, status: 'pending', estimatedXp: 20 },
        { source: 'todo', status: 'completed', estimatedXp: 0 }
      ]

      for (const taskData of tasksToCreate) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          title: `Test task ${taskData.source}`,
          description: 'Test task description',
          targetStats: taskData.estimatedXp > 0 ? ['Adventure Spirit'] : undefined,
          completedAt: taskData.status === 'completed' ? new Date() : undefined,
          ...taskData
        }).returning()
        cleanupTaskIds.push(task.id)

        // Create completion for completed tasks
        if (taskData.status === 'completed') {
          await db.insert(taskCompletions).values({
            taskId: task.id,
            userId: testUserId,
            actualXp: taskData.estimatedXp,
            statAwards: taskData.estimatedXp > 0 ? { 'Adventure Spirit': taskData.estimatedXp } : {},
            completedAt: new Date()
          })
        }
      }

      const response = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.summary).toBeDefined()
      
      const summary = result.data.summary
      expect(summary.totalTasks).toBe(4)
      expect(summary.pendingTasks).toBe(2)
      expect(summary.completedTasks).toBe(2)
      expect(summary.totalEstimatedXp).toBe(100) // 30 + 50 + 20 + 0
      expect(summary.earnedXp).toBe(50) // Only from completed tasks (50 + 0)
      expect(summary.tasksBySource).toBeDefined()
      expect(summary.tasksBySource.ai).toBe(1)
      expect(summary.tasksBySource.quest).toBe(1)
      expect(summary.tasksBySource.experiment).toBe(1)
      expect(summary.tasksBySource.todo).toBe(1)
    })

    it('should handle empty dashboard gracefully', async () => {
      const response = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.tasks).toEqual([])
      expect(result.data.summary.totalTasks).toBe(0)
      expect(result.data.summary.pendingTasks).toBe(0)
      expect(result.data.summary.completedTasks).toBe(0)
      expect(result.data.summary.totalEstimatedXp).toBe(0)
      expect(result.data.summary.earnedXp).toBe(0)
    })

    it('should filter tasks by status when requested', async () => {
      // Create tasks with different statuses
      const tasksData = [
        { title: 'Pending AI task', status: 'pending', source: 'ai' },
        { title: 'Completed AI task', status: 'completed', source: 'ai', completedAt: new Date() },
        { title: 'Skipped quest task', status: 'skipped', source: 'quest', sourceId: testQuestId }
      ]

      for (const taskData of tasksData) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          description: 'Test task',
          estimatedXp: 30,
          targetStats: ['Adventure Spirit'],
          ...taskData
        }).returning()
        cleanupTaskIds.push(task.id)
      }

      // Test pending tasks filter
      const pendingResponse = await app.request(`/api/dashboard?userId=${testUserId}&status=pending`, {
        method: 'GET'
      })

      expect(pendingResponse.status).toBe(200)
      const pendingResult = await pendingResponse.json()
      expect(pendingResult.success).toBe(true)
      expect(pendingResult.data.tasks.length).toBe(1)
      expect(pendingResult.data.tasks[0].status).toBe('pending')

      // Test completed tasks filter
      const completedResponse = await app.request(`/api/dashboard?userId=${testUserId}&status=completed`, {
        method: 'GET'
      })

      expect(completedResponse.status).toBe(200)
      const completedResult = await completedResponse.json()
      expect(completedResult.success).toBe(true)
      expect(completedResult.data.tasks.length).toBe(1)
      expect(completedResult.data.tasks[0].status).toBe('completed')
    })

    it('should support pagination for large task lists', async () => {
      // Create 15 tasks to test pagination
      for (let i = 0; i < 15; i++) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          title: `Task ${i + 1}`,
          description: `Test task number ${i + 1}`,
          source: 'ai',
          estimatedXp: 25,
          targetStats: ['Adventure Spirit'],
          status: 'pending'
        }).returning()
        cleanupTaskIds.push(task.id)
      }

      // Test first page
      const page1Response = await app.request(`/api/dashboard?userId=${testUserId}&limit=10&offset=0`, {
        method: 'GET'
      })

      expect(page1Response.status).toBe(200)
      const page1Result = await page1Response.json()
      expect(page1Result.success).toBe(true)
      expect(page1Result.data.tasks.length).toBe(10)
      expect(page1Result.data.pagination.total).toBe(15)
      expect(page1Result.data.pagination.limit).toBe(10)
      expect(page1Result.data.pagination.offset).toBe(0)
      expect(page1Result.data.pagination.hasMore).toBe(true)

      // Test second page
      const page2Response = await app.request(`/api/dashboard?userId=${testUserId}&limit=10&offset=10`, {
        method: 'GET'
      })

      expect(page2Response.status).toBe(200)
      const page2Result = await page2Response.json()
      expect(page2Result.success).toBe(true)
      expect(page2Result.data.tasks.length).toBe(5)
      expect(page2Result.data.pagination.hasMore).toBe(false)
    })

    it('should handle invalid user ID gracefully', async () => {
      const response = await app.request('/api/dashboard?userId=invalid-uuid', {
        method: 'GET'
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid userId format')
    })

    it('should require userId parameter', async () => {
      const response = await app.request('/api/dashboard', {
        method: 'GET'
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('userId is required')
    })

    it('should sort tasks by priority (due date, status, creation)', async () => {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      // Create tasks with different priorities
      const tasksData = [
        { 
          title: 'Overdue task', 
          dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
          status: 'pending', 
          source: 'ai',
          createdAt: now
        },
        { 
          title: 'Due tomorrow', 
          dueDate: tomorrow,
          status: 'pending', 
          source: 'quest',
          sourceId: testQuestId,
          createdAt: now
        },
        { 
          title: 'Due next week', 
          dueDate: nextWeek,
          status: 'pending', 
          source: 'experiment',
          sourceId: testExperimentId,
          createdAt: now
        },
        { 
          title: 'No due date', 
          dueDate: undefined,
          status: 'pending', 
          source: 'todo',
          createdAt: new Date(now.getTime() - 60 * 1000) // 1 minute ago
        }
      ]

      for (const taskData of tasksData) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          description: 'Test task',
          estimatedXp: 30,
          targetStats: taskData.source !== 'todo' ? ['Adventure Spirit'] : undefined,
          ...taskData
        }).returning()
        cleanupTaskIds.push(task.id)
      }

      const response = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.tasks.length).toBe(4)
      
      // Check sorting: overdue first, then by due date, then by creation date
      expect(result.data.tasks[0].title).toBe('Overdue task')
      expect(result.data.tasks[1].title).toBe('Due tomorrow')
      expect(result.data.tasks[2].title).toBe('Due next week')
      expect(result.data.tasks[3].title).toBe('No due date')
    })
  })
})
