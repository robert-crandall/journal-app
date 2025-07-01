import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { createTestUser } from '../utils/test-helpers'

import { 
  users, 
  characters, 
  characterStats as characterStatsTable, 
  familyMembers as familyMembersTable, 
  goals as goalsTable, 
  tasks as tasksTable
} from '../db/schema'
import { eq, and } from 'drizzle-orm'

// Simple UUID generator for tests
function generateUUID(): string {
  return crypto.randomUUID()
}

describe('Scheduled Task Generation API Integration Tests - Task 4.11', () => {
  let testUserId: string
  let testCharacterId: string
  
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupStatIds: string[] = []
  const cleanupFamilyMemberIds: string[] = []
  const cleanupGoalIds: string[] = []
  const cleanupTaskIds: string[] = []

  beforeAll(async () => {
    // Create test user
    const testUserData = await createTestUser({
      id: generateUUID(),
      email: 'scheduled-api-test@example.com',
      name: 'Scheduled API Test User',
      timezone: 'UTC',
      zipCode: '10001'
    })

    testUserId = testUserData.user.id
    cleanupUserIds.push(testUserId)

    // Create test character
    const [character] = await db.insert(characters).values({
      id: generateUUID(),
      userId: testUserId,
      name: 'Test Hero',
      class: 'Adventure Explorer',
      backstory: 'A scheduled API test character'
    }).returning()
    
    testCharacterId = character.id
    cleanupCharacterIds.push(character.id)
    
    // Create character stats
    const statsToCreate = [
      {
        characterId: testCharacterId,
        category: 'Adventure Spirit',
        currentXp: 100,
        currentLevel: 1,
        totalXp: 100,
        description: 'Tracks outdoor adventures'
      },
      {
        characterId: testCharacterId,
        category: 'Family Bonding',
        currentXp: 50,
        currentLevel: 1,
        totalXp: 50,
        description: 'Tracks family time'
      }
    ]
    
    for (const statData of statsToCreate) {
      const [stat] = await db.insert(characterStatsTable).values(statData).returning()
      cleanupStatIds.push(stat.id)
    }

    // Create family members
    const [member] = await db.insert(familyMembersTable).values({
      userId: testUserId,
      name: 'Alice',
      age: 10,
      interests: ['art', 'reading'],
      interactionFrequency: 'daily',
      lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }).returning()
    cleanupFamilyMemberIds.push(member.id)

    // Create user goals
    const [goal] = await db.insert(goalsTable).values({
      userId: testUserId,
      title: 'Stay active outdoors',
      description: 'Get outside more often',
      priority: 'high',
      status: 'active',
      relatedStats: ['Adventure Spirit']
    }).returning()
    cleanupGoalIds.push(goal.id)
  })

  afterAll(async () => {
    // Clean up in reverse order to respect foreign keys
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasksTable).where(eq(tasksTable.id, taskId))
    }
    for (const goalId of cleanupGoalIds) {
      await db.delete(goalsTable).where(eq(goalsTable.id, goalId))
    }
    for (const familyMemberId of cleanupFamilyMemberIds) {
      await db.delete(familyMembersTable).where(eq(familyMembersTable.id, familyMemberId))
    }
    for (const statId of cleanupStatIds) {
      await db.delete(characterStatsTable).where(eq(characterStatsTable.id, statId))
    }
    for (const characterId of cleanupCharacterIds) {
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  beforeEach(async () => {
    // Clear any existing AI tasks for clean testing
    await db.delete(tasksTable).where(
      and(
        eq(tasksTable.userId, testUserId),
        eq(tasksTable.source, 'ai')
      )
    )
  })

  describe('POST /api/scheduled/generate-daily-tasks', () => {
    it('should generate daily tasks for all users', async () => {
      const req = new Request('http://localhost/api/scheduled/generate-daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRegenerate: false })
      })
      
      const response = await app.request(req)
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.totalUsersProcessed).toBeGreaterThan(0)

      // The actual task generation depends on AI availability
      // Test that the endpoint structure works correctly
      expect(typeof data.data.successfulGenerations).toBe('number')
      expect(typeof data.data.skippedUsers).toBe('number')
      expect(Array.isArray(data.data.errors)).toBe(true)
    })

    it('should support force regeneration', async () => {
      const req = new Request('http://localhost/api/scheduled/generate-daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRegenerate: true })
      })
      
      const response = await app.request(req)
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
    })

    it('should support targeting specific users', async () => {
      const req = new Request('http://localhost/api/scheduled/generate-daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          forceRegenerate: false,
          targetUserIds: [testUserId]
        })
      })
      
      const response = await app.request(req)
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.totalUsersProcessed).toBe(1)
    })

    it('should validate request body', async () => {
      const req = new Request('http://localhost/api/scheduled/generate-daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          invalidField: 'invalid',
          targetUserIds: ['not-a-uuid']
        })
      })
      
      const response = await app.request(req)
      expect(response.status).toBe(400)
    })

    it('should handle empty target user list', async () => {
      const req = new Request('http://localhost/api/scheduled/generate-daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          forceRegenerate: false,
          targetUserIds: []
        })
      })
      
      const response = await app.request(req)
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      // Should process all users when empty array provided
      expect(data.data.totalUsersProcessed).toBeGreaterThan(0)
    })
  })

  describe('GET /api/scheduled/eligible-users', () => {
    it('should return list of eligible users', async () => {
      const req = new Request('http://localhost/api/scheduled/eligible-users')
      const response = await app.request(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(Array.isArray(data.data.users)).toBe(true)
      expect(typeof data.data.totalUsers).toBe('number')
      expect(Array.isArray(data.data.timezones)).toBe(true)

      // Should include our test user
      const testUser = data.data.users.find((u: any) => u.id === testUserId)
      expect(testUser).toBeDefined()
      expect(testUser.email).toBe('scheduled-api-test@example.com')
      expect(testUser.timezone).toBe('UTC')
      expect(testUser.zipCode).toBe('10001')
    })

    it('should group users by timezone', async () => {
      const req = new Request('http://localhost/api/scheduled/eligible-users')
      const response = await app.request(req)
      const data = await response.json()
      
      expect(data.data.timezones).toContain('UTC')
      expect(data.data.timezones.every((tz: string) => typeof tz === 'string')).toBe(true)
    })
  })

  describe('GET /api/scheduled/info', () => {
    it('should return scheduling configuration', async () => {
      const req = new Request('http://localhost/api/scheduled/info')
      const response = await app.request(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data.scheduling).toBeDefined()
      
      const scheduling = data.data.scheduling
      expect(scheduling.recommendedTime).toBe('6:00 AM user local time')
      expect(scheduling.frequency).toBe('daily')
      expect(scheduling.timezone).toBe('per-user')
      expect(scheduling.description).toContain('daily task generation')
    })

    it('should include statistics when requested', async () => {
      const req = new Request('http://localhost/api/scheduled/info?includeStats=true')
      const response = await app.request(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data.scheduling).toBeDefined()
      expect(data.data.statistics).toBeDefined()
      
      const stats = data.data.statistics
      expect(typeof stats.date).toBe('string')
      expect(typeof stats.totalTasksGenerated).toBe('number')
      expect(typeof stats.usersWithTasks).toBe('number')
      expect(typeof stats.averageTasksPerUser).toBe('number')
    })

    it('should support custom date for statistics', async () => {
      const testDate = '2024-06-15'
      const req = new Request(`http://localhost/api/scheduled/info?includeStats=true&date=${testDate}`)
      const response = await app.request(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.data.statistics.date).toBe(testDate)
    })
  })

  describe('GET /api/scheduled/stats', () => {
    it('should return generation statistics', async () => {
      const req = new Request('http://localhost/api/scheduled/stats')
      const response = await app.request(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(Array.isArray(data.data.statistics)).toBe(true)
      expect(data.data.summary).toBeDefined()
      
      const summary = data.data.summary
      expect(typeof summary.totalDays).toBe('number')
      expect(typeof summary.averageTasksPerDay).toBe('number')
      expect(typeof summary.averageUsersPerDay).toBe('number')
      
      // Default should be 7 days
      expect(data.data.statistics).toHaveLength(7)
      expect(summary.totalDays).toBe(7)
    })

    it('should support custom date range', async () => {
      const req = new Request('http://localhost/api/scheduled/stats?days=3&date=2024-06-15')
      const response = await app.request(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.data.statistics).toHaveLength(3)
      expect(data.data.summary.totalDays).toBe(3)
    })

    it('should handle invalid query parameters', async () => {
      const req = new Request('http://localhost/api/scheduled/stats?days=invalid')
      const response = await app.request(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Should default to 7 when invalid days provided
      expect(data.data.statistics).toHaveLength(7)
    })
  })

  describe('POST /api/scheduled/test', () => {
    it('should provide test information without generating tasks', async () => {
      const req = new Request('http://localhost/api/scheduled/test', { method: 'POST' })
      const response = await app.request(req)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.data.testMode).toBe(true)
      expect(data.data.schedulingInfo).toBeDefined()
      expect(typeof data.data.eligibleUsers).toBe('number')
      expect(typeof data.data.usersWithTasksToday).toBe('number')
      expect(typeof data.data.usersWithoutTasksToday).toBe('number')
      expect(typeof data.data.wouldGenerate).toBe('number')
      expect(data.data.timezoneBreakdown).toBeDefined()
      
      // Should indicate it would generate for our test user (since we cleared tasks in beforeEach)
      expect(data.data.wouldGenerate).toBeGreaterThan(0)
    })

    it('should show timezone breakdown', async () => {
      const req = new Request('http://localhost/api/scheduled/test', { method: 'POST' })
      const response = await app.request(req)
      const data = await response.json()
      
      expect(data.data.timezoneBreakdown).toBeDefined()
      expect(typeof data.data.timezoneBreakdown.UTC).toBe('number')
      expect(data.data.timezoneBreakdown.UTC).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const req = new Request('http://localhost/api/scheduled/generate-daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json'
      })
      
      const response = await app.request(req)
      expect(response.status).toBe(400)
    })

    it('should validate UUID format in targetUserIds', async () => {
      const req = new Request('http://localhost/api/scheduled/generate-daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetUserIds: ['not-a-uuid', 'also-not-uuid']
        })
      })
      
      const response = await app.request(req)
      expect(response.status).toBe(400)
    })
  })
})
