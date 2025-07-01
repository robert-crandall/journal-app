import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, tasks } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

function generateUUID(): string {
  return crypto.randomUUID()
}

describe('Ad-Hoc Task Management API Integration Tests - Task 3.7', () => {
  let testUserId: string
  let testCharacterId: string
  let testStatIds: string[] = []
  let testTaskId: string
  const cleanupUserIds: string[] = []
  const cleanupTaskIds: string[] = []

  beforeEach(async () => {
    console.log('Setting up ad-hoc task management integration tests...')
    
    // Create test user
    const [user] = await db.insert(users).values({
      email: `test-adhoc-${Date.now()}@example.com`,
      name: 'Test User',
      timezone: 'UTC'
    }).returning()
    testUserId = user.id
    cleanupUserIds.push(user.id)

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Ad-Hoc Hero',
      class: 'Daily Warrior',
      backstory: 'A character who loves to track daily activities and build stats through consistent practice.'
    }).returning()
    testCharacterId = character.id

    // Create multiple test stats to link ad-hoc tasks to
    const statsToCreate = [
      {
        characterId: testCharacterId,
        category: 'Physical Health',
        currentXp: 50,
        currentLevel: 1,
        totalXp: 50,
        description: 'Track physical fitness activities like workouts, runs, and sports'
      },
      {
        characterId: testCharacterId,
        category: 'Mental Wellness',
        currentXp: 25,
        currentLevel: 1,
        totalXp: 25,
        description: 'Track meditation, reading, and mindfulness activities'
      },
      {
        characterId: testCharacterId,
        category: 'Adventure Spirit',
        currentXp: 75,
        currentLevel: 1,
        totalXp: 75,
        description: 'Track outdoor activities and exploration'
      }
    ]

    for (const statData of statsToCreate) {
      const [stat] = await db.insert(characterStats).values(statData).returning()
      testStatIds.push(stat.id)
    }
  })

  afterEach(async () => {
    console.log('Cleaning up ad-hoc task management test data...')
    
    // Clean up in reverse order of dependencies
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasks).where(eq(tasks.id, taskId))
    }
    
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  describe('POST /api/tasks/ad-hoc - Create Ad-Hoc Task', () => {
    it('should create an ad-hoc task tied to specific character stat', async () => {
      const adHocTaskData = {
        userId: testUserId,
        title: 'Morning Workout',
        description: '30-minute strength training session',
        statCategory: 'Physical Health',
        estimatedXp: 25
      }

      const response = await app.request('/api/tasks/ad-hoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adHocTaskData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.task.title).toBe(adHocTaskData.title)
      expect(result.data.task.source).toBe('ad-hoc')
      expect(result.data.task.sourceId).toBeNull()
      expect(result.data.task.targetStats).toEqual(['Physical Health'])
      expect(result.data.task.estimatedXp).toBe(25)
      expect(result.data.task.status).toBe('pending')
      
      // Verify stat linkage
      expect(result.data.statInfo).toBeDefined()
      expect(result.data.statInfo.category).toBe('Physical Health')
      expect(result.data.statInfo.description).toBeDefined()
      
      testTaskId = result.data.task.id
      cleanupTaskIds.push(testTaskId)
    })

    it('should validate required fields for ad-hoc tasks', async () => {
      const response = await app.request('/api/tasks/ad-hoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
        })
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
    })

    it('should validate user exists for ad-hoc tasks', async () => {
      const adHocTaskData = {
        userId: generateUUID(),
        title: 'Test Ad-Hoc Task',
        description: 'Test description',
        statCategory: 'Physical Health',
        estimatedXp: 20
      }

      const response = await app.request('/api/tasks/ad-hoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adHocTaskData)
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })

    it('should validate stat category exists for user', async () => {
      const adHocTaskData = {
        userId: testUserId,
        title: 'Invalid Stat Task',
        description: 'Task with non-existent stat',
        statCategory: 'Non-Existent Stat',
        estimatedXp: 20
      }

      const response = await app.request('/api/tasks/ad-hoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adHocTaskData)
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Stat category not found for this user')
    })

    it('should handle different stat categories', async () => {
      const mentalWellnessTask = {
        userId: testUserId,
        title: 'Daily Meditation',
        description: '15-minute mindfulness meditation',
        statCategory: 'Mental Wellness',
        estimatedXp: 20
      }

      const response = await app.request('/api/tasks/ad-hoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mentalWellnessTask)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.task.targetStats).toEqual(['Mental Wellness'])
      expect(result.data.statInfo.category).toBe('Mental Wellness')
      
      cleanupTaskIds.push(result.data.task.id)
    })
  })

  describe('GET /api/tasks/ad-hoc - List Ad-Hoc Tasks', () => {
    beforeEach(async () => {
      // Create several ad-hoc tasks for testing
      const adHocTasks = [
        {
          userId: testUserId,
          title: 'Morning Run',
          description: '5K morning jog',
          source: 'ad-hoc',
          targetStats: ['Physical Health'],
          estimatedXp: 30,
          status: 'pending'
        },
        {
          userId: testUserId,
          title: 'Evening Meditation',
          description: 'Mindfulness practice',
          source: 'ad-hoc',
          targetStats: ['Mental Wellness'],
          estimatedXp: 20,
          status: 'completed',
          completedAt: new Date()
        },
        {
          userId: testUserId,
          title: 'Nature Photography',
          description: 'Take photos during hike',
          source: 'ad-hoc',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 25,
          status: 'pending'
        }
      ]

      for (const taskData of adHocTasks) {
        const [task] = await db.insert(tasks).values(taskData).returning()
        cleanupTaskIds.push(task.id)
      }
    })

    it('should list all ad-hoc tasks for user with stat information', async () => {
      const response = await app.request(`/api/tasks/ad-hoc?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.tasks).toBeDefined()
      expect(Array.isArray(result.data.tasks)).toBe(true)
      expect(result.data.tasks.length).toBeGreaterThanOrEqual(3)

      // Verify each task has proper ad-hoc structure
      for (const task of result.data.tasks) {
        expect(task.source).toBe('ad-hoc')
        expect(task.sourceId).toBeNull()
        expect(task.targetStats).toBeDefined()
        expect(Array.isArray(task.targetStats)).toBe(true)
        expect(task.targetStats.length).toBe(1) // Ad-hoc tasks target single stats
        expect(task.statInfo).toBeDefined()
        expect(task.statInfo.category).toBe(task.targetStats[0])
      }
    })

    it('should filter ad-hoc tasks by status', async () => {
      const response = await app.request(`/api/tasks/ad-hoc?userId=${testUserId}&status=pending`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      
      for (const task of result.data.tasks) {
        expect(task.status).toBe('pending')
      }
    })

    it('should filter ad-hoc tasks by stat category', async () => {
      const response = await app.request(`/api/tasks/ad-hoc?userId=${testUserId}&statCategory=Physical Health`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      
      for (const task of result.data.tasks) {
        expect(task.targetStats).toContain('Physical Health')
      }
    })

    it('should provide stat summaries grouped by category', async () => {
      const response = await app.request(`/api/tasks/ad-hoc?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.statSummaries).toBeDefined()
      expect(Array.isArray(result.data.statSummaries)).toBe(true)

      // Should have summaries for each stat category
      for (const summary of result.data.statSummaries) {
        expect(summary.category).toBeDefined()
        expect(summary.totalTasks).toBeGreaterThanOrEqual(0)
        expect(summary.completedTasks).toBeGreaterThanOrEqual(0)
        expect(summary.pendingTasks).toBeGreaterThanOrEqual(0)
        expect(summary.totalXpEarned).toBeGreaterThanOrEqual(0)
        expect(summary.currentXp).toBeDefined()
        expect(summary.currentLevel).toBeDefined()
      }
    })
  })

  describe('GET /api/tasks/ad-hoc/:id - Get Ad-Hoc Task Details', () => {
    beforeEach(async () => {
      const [task] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Detailed Workout Task',
        description: 'Complex strength training routine with multiple exercises',
        source: 'ad-hoc',
        targetStats: ['Physical Health'],
        estimatedXp: 35,
        status: 'pending'
      }).returning()
      testTaskId = task.id
      cleanupTaskIds.push(task.id)
    })

    it('should get detailed ad-hoc task information with stat context', async () => {
      const response = await app.request(`/api/tasks/ad-hoc/${testTaskId}?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.task.id).toBe(testTaskId)
      expect(result.data.task.source).toBe('ad-hoc')

      // Should include detailed stat information
      expect(result.data.statInfo).toBeDefined()
      expect(result.data.statInfo.category).toBe('Physical Health')
      expect(result.data.statInfo.currentXp).toBeDefined()
      expect(result.data.statInfo.currentLevel).toBeDefined()
      expect(result.data.statInfo.description).toBeDefined()

      // Should include XP progression preview
      expect(result.data.xpPreview).toBeDefined()
      expect(result.data.xpPreview.currentXp).toBeDefined()
      expect(result.data.xpPreview.newXp).toBeDefined()
      expect(result.data.xpPreview.willLevelUp).toBeDefined()
    })

    it('should return 404 for non-existent ad-hoc task', async () => {
      const response = await app.request(`/api/tasks/ad-hoc/${generateUUID()}?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Task not found')
    })

    it('should return 403 for unauthorized access', async () => {
      const otherUserId = generateUUID()
      
      const response = await app.request(`/api/tasks/ad-hoc/${testTaskId}?userId=${otherUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(403)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('PUT /api/tasks/ad-hoc/:id - Update Ad-Hoc Task', () => {
    beforeEach(async () => {
      const [task] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Updatable Task',
        description: 'Original description',
        source: 'ad-hoc',
        targetStats: ['Physical Health'],
        estimatedXp: 25,
        status: 'pending'
      }).returning()
      testTaskId = task.id
      cleanupTaskIds.push(task.id)
    })

    it('should update ad-hoc task properties', async () => {
      const updateData = {
        userId: testUserId,
        title: 'Updated Workout Task',
        description: 'Updated with more detailed exercise plan',
        estimatedXp: 35
      }

      const response = await app.request(`/api/tasks/ad-hoc/${testTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.task.title).toBe(updateData.title)
      expect(result.data.task.description).toBe(updateData.description)
      expect(result.data.task.estimatedXp).toBe(updateData.estimatedXp)
    })

    it('should change stat category for ad-hoc task', async () => {
      const updateData = {
        userId: testUserId,
        statCategory: 'Mental Wellness'
      }

      const response = await app.request(`/api/tasks/ad-hoc/${testTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.task.targetStats).toEqual(['Mental Wellness'])
      expect(result.data.statInfo.category).toBe('Mental Wellness')
    })

    it('should validate stat category when updating', async () => {
      const updateData = {
        userId: testUserId,
        statCategory: 'Invalid Stat Category'
      }

      const response = await app.request(`/api/tasks/ad-hoc/${testTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Stat category not found for this user')
    })
  })

  describe('DELETE /api/tasks/ad-hoc/:id - Delete Ad-Hoc Task', () => {
    beforeEach(async () => {
      const [task] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Task to Delete',
        description: 'This task will be deleted',
        source: 'ad-hoc',
        targetStats: ['Physical Health'],
        estimatedXp: 20,
        status: 'pending'
      }).returning()
      testTaskId = task.id
      cleanupTaskIds.push(task.id)
    })

    it('should delete an ad-hoc task', async () => {
      const response = await app.request(`/api/tasks/ad-hoc/${testTaskId}?userId=${testUserId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.message).toBe('Ad-hoc task deleted successfully')

      // Verify task is deleted
      const checkResponse = await app.request(`/api/tasks/ad-hoc/${testTaskId}?userId=${testUserId}`, {
        method: 'GET'
      })
      expect(checkResponse.status).toBe(404)
    })

    it('should return 404 for non-existent task', async () => {
      const response = await app.request(`/api/tasks/ad-hoc/${generateUUID()}?userId=${testUserId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Task not found')
    })
  })

  describe('Ad-Hoc Task Differentiation from Dashboard Tasks', () => {
    it('should confirm ad-hoc tasks do not appear on main dashboard', async () => {
      // Create ad-hoc task
      const [adHocTask] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Hidden Ad-Hoc Task',
        description: 'This should not appear on dashboard',
        source: 'ad-hoc',
        targetStats: ['Physical Health'],
        estimatedXp: 25,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(adHocTask.id)

      // Check dashboard
      const dashboardResponse = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(dashboardResponse.status).toBe(200)
      const dashboardResult = await dashboardResponse.json()
      
      // Ad-hoc tasks should not appear on dashboard
      const adHocTasksOnDashboard = dashboardResult.data.tasks.filter((t: any) => t.source === 'ad-hoc')
      expect(adHocTasksOnDashboard.length).toBe(0)
    })

    it('should differentiate ad-hoc tasks from regular tasks in API structure', async () => {
      const response = await app.request(`/api/tasks/ad-hoc?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      // Ad-hoc tasks should have specific structure
      if (result.data.tasks.length > 0) {
        const adHocTask = result.data.tasks[0]
        expect(adHocTask.source).toBe('ad-hoc')
        expect(adHocTask.sourceId).toBeNull()
        expect(adHocTask.targetStats.length).toBe(1) // Single stat focus
        expect(adHocTask.statInfo).toBeDefined() // Direct stat linkage
      }
    })
  })

  describe('Stat-Specific XP Tracking', () => {
    it('should track XP progression per stat through ad-hoc tasks', async () => {
      // Create and complete ad-hoc tasks for different stats
      const physicalTask = {
        userId: testUserId,
        title: 'Gym Workout',
        description: 'Weight training session',
        statCategory: 'Physical Health',
        estimatedXp: 30
      }

      const mentalTask = {
        userId: testUserId,
        title: 'Reading Session',
        description: 'Read for 30 minutes',
        statCategory: 'Mental Wellness',
        estimatedXp: 20
      }

      // Create physical task
      const physicalResponse = await app.request('/api/tasks/ad-hoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(physicalTask)
      })
      expect(physicalResponse.status).toBe(201)
      const physicalResult = await physicalResponse.json()
      cleanupTaskIds.push(physicalResult.data.task.id)

      // Create mental task
      const mentalResponse = await app.request('/api/tasks/ad-hoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mentalTask)
      })
      expect(mentalResponse.status).toBe(201)
      const mentalResult = await mentalResponse.json()
      cleanupTaskIds.push(mentalResult.data.task.id)

      // Get stat summaries
      const summaryResponse = await app.request(`/api/tasks/ad-hoc?userId=${testUserId}`, {
        method: 'GET'
      })
      expect(summaryResponse.status).toBe(200)
      const summaryResult = await summaryResponse.json()

      // Verify stat tracking
      const physicalSummary = summaryResult.data.statSummaries.find((s: any) => s.category === 'Physical Health')
      const mentalSummary = summaryResult.data.statSummaries.find((s: any) => s.category === 'Mental Wellness')

      expect(physicalSummary).toBeDefined()
      expect(mentalSummary).toBeDefined()
      expect(physicalSummary.totalTasks).toBeGreaterThanOrEqual(1)
      expect(mentalSummary.totalTasks).toBeGreaterThanOrEqual(1)
    })
  })
})
