import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, familyMembers, familyMemberInteractions, tasks } from '../db/schema'
import { eq } from 'drizzle-orm'
import { createTestUser } from '../utils/test-helpers'

describe('Family Members API Integration Tests - Task 3.11', () => {
  let testUserId: string
  const cleanupUserIds: string[] = []
  const cleanupFamilyMemberIds: string[] = []
  const cleanupTaskIds: string[] = []

  beforeEach(async () => {
    console.log('Setting up family members integration tests...')
    
    // Create test user
    const { user } = await createTestUser({
      email: `test-family-${Date.now()}@example.com`,
      name: 'Test User',
      timezone: 'UTC'
    })
    testUserId = user.id
    cleanupUserIds.push(testUserId)
  })

  afterEach(async () => {
    console.log('Cleaning up family members test data...')
    
    // Clean up family member interactions
    for (const familyMemberId of cleanupFamilyMemberIds) {
      await db.delete(familyMemberInteractions)
        .where(eq(familyMemberInteractions.familyMemberId, familyMemberId))
    }
    
    // Clean up family members
    for (const familyMemberId of cleanupFamilyMemberIds) {
      await db.delete(familyMembers)
        .where(eq(familyMembers.id, familyMemberId))
    }

    // Clean up tasks
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasks).where(eq(tasks.id, taskId))
    }
    
    // Clean up users
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
    
    // Reset arrays
    cleanupUserIds.length = 0
    cleanupFamilyMemberIds.length = 0
  })

  describe('Family Member CRUD Operations', () => {
    it('should create a new family member with basic information', async () => {
      const familyMemberData = {
        userId: testUserId,
        name: 'John Doe',
        age: 35,
        interests: ['reading', 'hiking', 'cooking'],
        interactionFrequency: 'weekly' as const
      }

      const response = await app.request('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(familyMemberData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('id')
      expect(result.data.name).toBe('John Doe')
      expect(result.data.age).toBe(35)
      expect(result.data.interests).toEqual(['reading', 'hiking', 'cooking'])
      expect(result.data.interactionFrequency).toBe('weekly')
      expect(result.data.userId).toBe(testUserId)
      
      cleanupFamilyMemberIds.push(result.data.id)
    })

    it('should create family member with minimal information', async () => {
      const familyMemberData = {
        userId: testUserId,
        name: 'Jane Smith'
      }

      const response = await app.request('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(familyMemberData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Jane Smith')
      expect(result.data.interactionFrequency).toBe('weekly') // default
      expect(result.data.age).toBeNull()
      expect(result.data.interests).toEqual([])
      
      cleanupFamilyMemberIds.push(result.data.id)
    })

    it('should validate required fields for family member creation', async () => {
      const invalidData = {
        userId: testUserId
        // Missing name
      }

      const response = await app.request('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
    })

    it('should validate user exists for family member creation', async () => {
      const familyMemberData = {
        userId: '123e4567-e89b-12d3-a456-426614174000', // Non-existent user
        name: 'Test Member'
      }

      const response = await app.request('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(familyMemberData)
      })

      expect(response.status).toBe(404)
      // Only parse JSON if response content type indicates JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json()
        expect(result.message).toContain('User not found')
      }
    })
  })

  describe('Family Member Listing and Details', () => {
    let familyMember1Id: string
    let familyMember2Id: string

    beforeEach(async () => {
      // Create test family members
      const [member1] = await db.insert(familyMembers).values({
        userId: testUserId,
        name: 'Alice Johnson',
        age: 28,
        interests: ['art', 'music'],
        interactionFrequency: 'daily'
      }).returning()
      familyMember1Id = member1.id
      cleanupFamilyMemberIds.push(familyMember1Id)

      const [member2] = await db.insert(familyMembers).values({
        userId: testUserId,
        name: 'Bob Wilson',
        age: 45,
        interests: ['sports', 'technology'],
        interactionFrequency: 'weekly',
        lastInteraction: '2025-06-20' // 7 days ago
      }).returning()
      familyMember2Id = member2.id
      cleanupFamilyMemberIds.push(familyMember2Id)
    })

    it('should list all family members for a user with interaction statistics', async () => {
      const response = await app.request(`/api/family-members?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.familyMembers).toHaveLength(2)
      expect(result.data.totalMembers).toBe(2)
      
      const alice = result.data.familyMembers.find((m: any) => m.name === 'Alice Johnson')
      const bob = result.data.familyMembers.find((m: any) => m.name === 'Bob Wilson')
      
      expect(alice).toBeDefined()
      expect(alice.interactionFrequency).toBe('daily')
      expect(alice.daysSinceLastInteraction).toBeNull() // Never interacted
      
      expect(bob).toBeDefined()
      expect(bob.interactionFrequency).toBe('weekly')
      expect(bob.daysSinceLastInteraction).toBeGreaterThan(0)
    })

    it('should get detailed family member information with interaction history', async () => {
      const response = await app.request(`/api/family-members/${familyMember1Id}?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.familyMember.name).toBe('Alice Johnson')
      expect(result.data.familyMember.age).toBe(28)
      expect(result.data.familyMember.interests).toEqual(['art', 'music'])
      expect(result.data.recentInteractions).toBeInstanceOf(Array)
      expect(result.data.interactionStats).toHaveProperty('total')
      expect(result.data.interactionStats).toHaveProperty('last30Days')
    })

    it('should return 404 for non-existent family member', async () => {
      const response = await app.request(`/api/family-members/123e4567-e89b-12d3-a456-426614174000?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(404)
    })

    it('should return 404 for unauthorized access to family member', async () => {
      // Create another user
      const { user: otherUser } = await createTestUser({
        email: `other-user-${Date.now()}@example.com`,
        name: 'Other User',
        timezone: 'UTC'
      })
      cleanupUserIds.push(otherUser.id)

      const response = await app.request(`/api/family-members/${familyMember1Id}?userId=${otherUser.id}`, {
        method: 'GET'
      })

      expect(response.status).toBe(404)
    })
  })

  describe('Family Member Updates', () => {
    let familyMemberId: string

    beforeEach(async () => {
      const [member] = await db.insert(familyMembers).values({
        userId: testUserId,
        name: 'Charlie Brown',
        age: 30,
        interests: ['reading'],
        interactionFrequency: 'weekly'
      }).returning()
      familyMemberId = member.id
      cleanupFamilyMemberIds.push(familyMemberId)
    })

    it('should update family member properties', async () => {
      const updateData = {
        userId: testUserId,
        name: 'Charlie Brown Jr.',
        age: 31,
        interests: ['reading', 'writing', 'traveling'],
        interactionFrequency: 'daily' as const
      }

      const response = await app.request(`/api/family-members/${familyMemberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Charlie Brown Jr.')
      expect(result.data.age).toBe(31)
      expect(result.data.interests).toEqual(['reading', 'writing', 'traveling'])
      expect(result.data.interactionFrequency).toBe('daily')
    })

    it('should update partial family member properties', async () => {
      const updateData = {
        userId: testUserId,
        interactionFrequency: 'monthly' as const
      }

      const response = await app.request(`/api/family-members/${familyMemberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Charlie Brown') // Unchanged
      expect(result.data.interactionFrequency).toBe('monthly') // Updated
    })

    it('should update last interaction date', async () => {
      const updateData = {
        userId: testUserId,
        lastInteraction: '2025-06-25'
      }

      const response = await app.request(`/api/family-members/${familyMemberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.lastInteraction).toBe('2025-06-25')
    })
  })

  describe('Family Member Deletion', () => {
    let familyMemberId: string

    beforeEach(async () => {
      const [member] = await db.insert(familyMembers).values({
        userId: testUserId,
        name: 'Delete Me',
        age: 25,
        interactionFrequency: 'weekly'
      }).returning()
      familyMemberId = member.id
      cleanupFamilyMemberIds.push(familyMemberId)
    })

    it('should delete family member successfully', async () => {
      const response = await app.request(`/api/family-members/${familyMemberId}?userId=${testUserId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.message).toContain('deleted successfully')

      // Verify deletion
      const getResponse = await app.request(`/api/family-members/${familyMemberId}?userId=${testUserId}`, {
        method: 'GET'
      })
      expect(getResponse.status).toBe(404)

      // Remove from cleanup array since it's already deleted
      const index = cleanupFamilyMemberIds.indexOf(familyMemberId)
      if (index > -1) cleanupFamilyMemberIds.splice(index, 1)
    })

    it('should handle non-existent family member deletion', async () => {
      const response = await app.request(`/api/family-members/00000000-0000-0000-0000-000000000000?userId=${testUserId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(404)
    })
  })

  describe('Interaction Alerts and Tracking', () => {
    let overdueFamilyMemberId: string
    let recentFamilyMemberId: string

    beforeEach(async () => {
      // Create overdue family member (daily interaction, last interaction 3 days ago)
      const [overdueMember] = await db.insert(familyMembers).values({
        userId: testUserId,
        name: 'Overdue Member',
        age: 40,
        interactionFrequency: 'daily',
        lastInteraction: '2025-06-24' // 3 days ago
      }).returning()
      overdueFamilyMemberId = overdueMember.id
      cleanupFamilyMemberIds.push(overdueFamilyMemberId)

      // Create recent family member (weekly interaction, last interaction 2 days ago)
      const [recentMember] = await db.insert(familyMembers).values({
        userId: testUserId,
        name: 'Recent Member',
        age: 30,
        interactionFrequency: 'weekly',
        lastInteraction: '2025-06-25' // 2 days ago
      }).returning()
      recentFamilyMemberId = recentMember.id
      cleanupFamilyMemberIds.push(recentFamilyMemberId)
    })

    it('should identify family members with overdue interactions', async () => {
      const response = await app.request(`/api/family-members/interaction-alerts?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.alerts).toBeInstanceOf(Array)
      expect(result.data.totalAlerts).toBeGreaterThan(0)
      
      // Should have alert for overdue daily member
      const overdueAlert = result.data.alerts.find((alert: any) => 
        alert.familyMember.name === 'Overdue Member'
      )
      expect(overdueAlert).toBeDefined()
      expect(overdueAlert.alertType).toBe('overdue')
      expect(overdueAlert.severity).toBe('high') // 3 days overdue for daily interaction
    })

    it('should record family interaction manually', async () => {
      const interactionData = {
        userId: testUserId,
        feedback: 'Had a great conversation about work',
        interactionDate: '2025-06-27'
      }

      const response = await app.request(`/api/family-members/${overdueFamilyMemberId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.feedback).toBe('Had a great conversation about work')
      expect(result.data.interactionDate).toBe('2025-06-27')
      expect(result.data.familyMemberId).toBe(overdueFamilyMemberId)

      // Verify family member's last interaction was updated
      const memberResponse = await app.request(`/api/family-members/${overdueFamilyMemberId}?userId=${testUserId}`, {
        method: 'GET'
      })
      expect(memberResponse.status).toBe(200)
      const memberResult = await memberResponse.json()
      expect(memberResult.data.familyMember.lastInteraction).toBe('2025-06-27')
    })

    it('should handle interaction frequency preferences correctly', async () => {
      // Test different frequency settings
      const frequencies = ['daily', 'weekly', 'biweekly', 'monthly']
      
      for (const frequency of frequencies) {
        const [member] = await db.insert(familyMembers).values({
          userId: testUserId,
          name: `${frequency} Member`,
          age: 25,
          interactionFrequency: frequency,
          lastInteraction: '2025-06-01' // 26 days ago
        }).returning()
        cleanupFamilyMemberIds.push(member.id)
      }

      const response = await app.request(`/api/family-members/interaction-alerts?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      // All should be overdue since last interaction was 26 days ago
      const alerts = result.data.alerts
      expect(alerts.length).toBeGreaterThanOrEqual(4) // At least 4 alerts for the 4 frequency types
      
      // Daily and weekly should be high severity, monthly should be medium or none
      const dailyAlert = alerts.find((a: any) => a.familyMember.name === 'daily Member')
      expect(dailyAlert?.severity).toBe('high')
      
      const weeklyAlert = alerts.find((a: any) => a.familyMember.name === 'weekly Member')
      expect(weeklyAlert?.severity).toBe('high')
    })
  })

  describe('Family Member Integration with Task System', () => {
    let familyMemberId: string

    beforeEach(async () => {
      const [member] = await db.insert(familyMembers).values({
        userId: testUserId,
        name: 'Integration Test Member',
        age: 35,
        interests: ['cooking', 'gardening'],
        interactionFrequency: 'weekly'
      }).returning()
      familyMemberId = member.id
      cleanupFamilyMemberIds.push(familyMemberId)
    })

    it('should support recording interactions with task context', async () => {
      // Create a real task to test task-based interaction recording
      const [task] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Family cooking task',
        description: 'Cook dinner together',
        source: 'quest',
        estimatedXp: 20,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(task.id)

      const interactionData = {
        userId: testUserId,
        taskId: task.id, // Real task ID
        feedback: 'Completed a cooking task together',
        interactionDate: '2025-06-27'
      }

      const response = await app.request(`/api/family-members/${familyMemberId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.feedback).toBe('Completed a cooking task together')
      expect(result.data.taskId).toBe(task.id)
      
      // Verify the interaction is retrievable in family member details
      const detailsResponse = await app.request(`/api/family-members/${familyMemberId}?userId=${testUserId}`, {
        method: 'GET'
      })
      const detailsResult = await detailsResponse.json()
      expect(detailsResult.data.interactionStats.total).toBe(1)
    })

    it('should provide family member data suitable for AI task generation', async () => {
      const response = await app.request(`/api/family-members?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      const member = result.data.familyMembers[0]
      
      // Verify data structure needed for AI task generation
      expect(member).toHaveProperty('name')
      expect(member).toHaveProperty('age')
      expect(member).toHaveProperty('interests')
      expect(member).toHaveProperty('interactionFrequency')
      expect(member).toHaveProperty('daysSinceLastInteraction')
      expect(member).toHaveProperty('isOverdue')
      
      // This data should be suitable for AI context
      expect(member.interests).toEqual(['cooking', 'gardening'])
      expect(member.interactionFrequency).toBe('weekly')
    })
  })
})
