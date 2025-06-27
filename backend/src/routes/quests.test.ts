import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'bun:test'
import { testClient } from 'hono/testing'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, quests, tasks, taskCompletions } from '../db/schema'
import { eq, and } from 'drizzle-orm'

// Generate UUIDs using crypto.randomUUID()
function generateUUID(): string {
  return crypto.randomUUID()
}

const client = testClient(app)

describe('Quest Management API Integration Tests - Task 3.5', () => {
  let testUserId: string
  let testCharacterId: string
  let testQuestId: string
  
  // Cleanup arrays
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupQuestIds: string[] = []
  const cleanupTaskIds: string[] = []

  beforeAll(async () => {
    console.log('Setting up quest management integration tests...')
    
    // Create test user
    const [user] = await db.insert(users).values({
      id: generateUUID(),
      email: 'quest-test@example.com',
      name: 'Quest Test User',
      timezone: 'UTC'
    }).returning()
    
    testUserId = user.id
    cleanupUserIds.push(user.id)
    
    // Create test character
    const [character] = await db.insert(characters).values({
      id: generateUUID(),
      userId: testUserId,
      name: 'Quest Hero',
      class: 'Adventurer',
      backstory: 'A brave adventurer seeking quests'
    }).returning()
    
    testCharacterId = character.id
    cleanupCharacterIds.push(character.id)
    
    // Create character stats for XP tracking
    const stat1 = {
      id: generateUUID(),
      characterId: testCharacterId,
      category: 'Physical Health',
      baseLevel: 1,
      currentXp: 50,
      isActive: true
    }
    
    const stat2 = {
      id: generateUUID(),
      characterId: testCharacterId,
      category: 'Mental Clarity',
      baseLevel: 1,
      currentXp: 30,
      isActive: true
    }
    
    await db.insert(characterStats).values(stat1)
    await db.insert(characterStats).values(stat2)
  })

  afterAll(async () => {
    console.log('Cleaning up quest management test data...')
    
    // Clean up in reverse dependency order
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasks).where(eq(tasks.id, taskId))
    }
    
    for (const questId of cleanupQuestIds) {
      await db.delete(quests).where(eq(quests.id, questId))
    }
    
    for (const characterId of cleanupCharacterIds) {
      await db.delete(characterStats).where(eq(characterStats.characterId, characterId))
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  describe('POST /api/quests - Create Quest', () => {
    test('should create a new quest with deadline', async () => {
      const questData = {
        userId: testUserId,
        title: 'Fitness Journey Quest',
        description: 'Build a healthy lifestyle through consistent exercise and nutrition',
        goalDescription: 'Complete 30 days of consistent exercise and healthy eating',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        progressNotes: 'Starting with daily walks and meal prep'
      }

      const response = await app.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.quest).toBeDefined()
      expect(result.data.quest.title).toBe(questData.title)
      expect(result.data.quest.description).toBe(questData.description)
      expect(result.data.quest.status).toBe('active')
      expect(result.data.quest.userId).toBe(testUserId)
      
      testQuestId = result.data.quest.id
      cleanupQuestIds.push(testQuestId)
    })

    test('should validate required fields', async () => {
      const response = await app.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
          // Missing required fields
        })
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
    })

    test('should validate user exists', async () => {
      const questData = {
        userId: generateUUID(),
        title: 'Test Quest',
        description: 'Test description',
        startDate: new Date().toISOString()
      }

      const response = await app.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questData)
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('User not found')
    })
  })

  describe('GET /api/quests - List Quests', () => {
    test('should list all quests for a user', async () => {
      // Create additional test quest
      const [additionalQuest] = await db.insert(quests).values({
        id: generateUUID(),
        userId: testUserId,
        title: 'Learning Quest',
        description: 'Master a new skill',
        startDate: new Date(),
        status: 'active'
      }).returning()
      
      cleanupQuestIds.push(additionalQuest.id)

      const response = await app.request(`/api/quests?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.quests).toBeArray()
      expect(result.data.quests.length).toBeGreaterThanOrEqual(2)
      
      // Check quest data includes progress information
      const quest = result.data.quests.find((q: any) => q.id === testQuestId)
      expect(quest).toBeDefined()
      expect(quest.progressSummary).toBeDefined()
      expect(quest.progressSummary.totalTasks).toBeDefined()
      expect(quest.progressSummary.completedTasks).toBeDefined()
      expect(quest.progressSummary.completionRate).toBeDefined()
      expect(quest.deadlineStatus).toBeDefined()
    })

    test('should filter quests by status', async () => {
      // Create completed quest
      const [completedQuest] = await db.insert(quests).values({
        id: generateUUID(),
        userId: testUserId,
        title: 'Completed Quest',
        description: 'Already finished',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        status: 'completed',
        completedAt: new Date()
      }).returning()
      
      cleanupQuestIds.push(completedQuest.id)

      const response = await app.request(`/api/quests?userId=${testUserId}&status=completed`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.quests).toBeArray()
      expect(result.data.quests.every((q: any) => q.status === 'completed')).toBe(true)
    })

    test('should include deadline monitoring information', async () => {
      // Create quest with approaching deadline
      const [urgentQuest] = await db.insert(quests).values({
        id: generateUUID(),
        userId: testUserId,
        title: 'Urgent Quest',
        description: 'Quest with approaching deadline',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: 'active'
      }).returning()
      
      cleanupQuestIds.push(urgentQuest.id)

      const response = await app.request(`/api/quests?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      const quest = result.data.quests.find((q: any) => q.id === urgentQuest.id)
      expect(quest).toBeDefined()
      expect(quest.deadlineStatus).toBeDefined()
      expect(['upcoming', 'urgent', 'overdue', 'none']).toContain(quest.deadlineStatus)
      
      if (quest.deadlineStatus !== 'none') {
        expect(quest.daysUntilDeadline).toBeNumber()
      }
    })
  })

  describe('GET /api/quests/:id - Get Quest Details', () => {
    test('should get detailed quest information with progress', async () => {
      // Add some tasks to the quest
      const [questTask1] = await db.insert(tasks).values({
        id: generateUUID(),
        userId: testUserId,
        title: 'Quest Task 1',
        description: 'First task for the quest',
        source: 'quest',
        sourceId: testQuestId,
        targetStats: ['Physical Health'],
        estimatedXp: 25,
        status: 'completed',
        completedAt: new Date()
      }).returning()
      
      const [questTask2] = await db.insert(tasks).values({
        id: generateUUID(),
        userId: testUserId,
        title: 'Quest Task 2',
        description: 'Second task for the quest',
        source: 'quest',
        sourceId: testQuestId,
        targetStats: ['Mental Clarity'],
        estimatedXp: 30,
        status: 'pending'
      }).returning()
      
      cleanupTaskIds.push(questTask1.id, questTask2.id)

      const response = await app.request(`/api/quests/${testQuestId}?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.quest).toBeDefined()
      expect(result.data.quest.id).toBe(testQuestId)
      
      // Should include detailed progress information
      expect(result.data.quest.progressSummary).toBeDefined()
      expect(result.data.quest.progressSummary.totalTasks).toBe(2)
      expect(result.data.quest.progressSummary.completedTasks).toBe(1)
      expect(result.data.quest.progressSummary.completionRate).toBe(50)
      
      // Should include associated tasks
      expect(result.data.quest.tasks).toBeArray()
      expect(result.data.quest.tasks.length).toBe(2)
      
      // Should include deadline information
      expect(result.data.quest.deadlineStatus).toBeDefined()
    })

    test('should return 404 for non-existent quest', async () => {
      const response = await app.request(`/api/quests/${generateUUID()}?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Quest not found')
    })

    test('should return 403 for unauthorized access', async () => {
      const otherUserId = generateUUID()
      
      const response = await app.request(`/api/quests/${testQuestId}?userId=${otherUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(403)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('PUT /api/quests/:id - Update Quest', () => {
    test('should update quest properties', async () => {
      const updateData = {
        userId: testUserId,
        title: 'Updated Fitness Journey',
        description: 'Enhanced fitness journey with new goals',
        progressNotes: 'Made great progress this week!'
      }

      const response = await app.request(`/api/quests/${testQuestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.quest.title).toBe(updateData.title)
      expect(result.data.quest.description).toBe(updateData.description)
      expect(result.data.quest.progressNotes).toBe(updateData.progressNotes)
    })

    test('should update quest status', async () => {
      const updateData = {
        userId: testUserId,
        status: 'paused'
      }

      const response = await app.request(`/api/quests/${testQuestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.quest.status).toBe('paused')
    })

    test('should handle quest completion', async () => {
      const updateData = {
        userId: testUserId,
        status: 'completed'
      }

      const response = await app.request(`/api/quests/${testQuestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.quest.status).toBe('completed')
      expect(result.data.quest.completedAt).toBeDefined()
    })
  })

  describe('DELETE /api/quests/:id - Delete Quest', () => {
    test('should delete a quest and handle associated tasks', async () => {
      // Create a quest to delete
      const [questToDelete] = await db.insert(quests).values({
        id: generateUUID(),
        userId: testUserId,
        title: 'Quest to Delete',
        description: 'This quest will be deleted',
        startDate: new Date(),
        status: 'active'
      }).returning()
      
      // Create task associated with this quest
      const [associatedTask] = await db.insert(tasks).values({
        id: generateUUID(),
        userId: testUserId,
        title: 'Associated Task',
        description: 'Task linked to quest',
        source: 'quest',
        sourceId: questToDelete.id,
        targetStats: ['Physical Health'],
        estimatedXp: 20,
        status: 'pending'
      }).returning()

      const response = await app.request(`/api/quests/${questToDelete.id}?userId=${testUserId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)

      // Verify quest is deleted
      const questCheck = await db
        .select()
        .from(quests)
        .where(eq(quests.id, questToDelete.id))
      
      expect(questCheck.length).toBe(0)

      // Verify associated task is converted to ad-hoc
      const taskCheck = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, associatedTask.id))
      
      expect(taskCheck.length).toBe(1)
      expect(taskCheck[0].source).toBe('ad-hoc')
      expect(taskCheck[0].sourceId).toBeNull()
      
      // Cleanup
      await db.delete(tasks).where(eq(tasks.id, associatedTask.id))
    })
  })

  describe('GET /api/quests/deadline-alerts - Deadline Monitoring', () => {
    test('should identify quests with approaching deadlines', async () => {
      // Create quest with deadline in 1 day (urgent)
      const [urgentQuest] = await db.insert(quests).values({
        id: generateUUID(),
        userId: testUserId,
        title: 'Urgent Deadline Quest',
        description: 'Quest with urgent deadline',
        startDate: new Date(),
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        status: 'active'
      }).returning()
      
      // Create quest with deadline in 5 days (upcoming)
      const [upcomingQuest] = await db.insert(quests).values({
        id: generateUUID(),
        userId: testUserId,
        title: 'Upcoming Deadline Quest',
        description: 'Quest with upcoming deadline',
        startDate: new Date(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: 'active'
      }).returning()
      
      cleanupQuestIds.push(urgentQuest.id, upcomingQuest.id)

      const response = await app.request(`/api/quests/deadline-alerts?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.alerts).toBeArray()
      
      // Should include both urgent and upcoming quests
      const urgentAlert = result.data.alerts.find((alert: any) => alert.quest.id === urgentQuest.id)
      const upcomingAlert = result.data.alerts.find((alert: any) => alert.quest.id === upcomingQuest.id)
      
      expect(urgentAlert).toBeDefined()
      expect(urgentAlert.priority).toBe('urgent')
      expect(urgentAlert.daysUntilDeadline).toBe(1)
      
      expect(upcomingAlert).toBeDefined()
      expect(upcomingAlert.priority).toBe('upcoming')
      expect(upcomingAlert.daysUntilDeadline).toBe(5)
    })

    test('should include quest progress in deadline alerts', async () => {
      const response = await app.request(`/api/quests/deadline-alerts?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      
      // Each alert should include progress information
      result.data.alerts.forEach((alert: any) => {
        expect(alert.quest).toBeDefined()
        expect(alert.quest.progressSummary).toBeDefined()
        expect(alert.quest.progressSummary.completionRate).toBeNumber()
        expect(alert.priority).toMatch(/^(urgent|upcoming|overdue)$/)
        expect(alert.daysUntilDeadline).toBeNumber()
      })
    })
  })
})
