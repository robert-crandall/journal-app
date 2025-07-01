import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '../db/connection'
import { users, characters } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'
import app from '../index'

/**
 * Quest and Experiment Management Integration Tests - Task 6.9
 * 
 * Tests the complete quest and experiment management interface including:
 * - List view with tabbed interface
 * - Create new quests and experiments
 * - View and edit individual items
 * - Status management
 * - Progress tracking
 * - API integration
 */

let userId: string
let characterId: string

let testQuestId: string
let testExperimentId: string

describe('Quest and Experiment Management End-to-End Integration - Task 6.9', () => {
  beforeAll(async () => {
    // Create test user and character
    const { user } = await createTestUser({
      email: 'quest-experiment-test@example.com',
      name: 'Quest Experiment Test User',
      timezone: 'UTC'
    })
    
    userId = user.id
    
    const [character] = await db.insert(characters).values({
      id: crypto.randomUUID(),
      userId: userId,
      name: 'Test Adventurer',
      class: 'Explorer',
      backstory: 'A brave explorer testing quest and experiment management'
    }).returning()
    
    characterId = character.id
    
    // Verify backend is running
    const response = await app.request(`/api/quests?userId=${userId}`)
    expect(response.ok).toBe(true)
  })

  afterAll(async () => {
    // Clean up test data
    if (testQuestId) {
      await app.request(`/api/quests/${testQuestId}?userId=${userId}`, { method: 'DELETE' })
    }
    if (testExperimentId) {
      await app.request(`/api/experiments/${testExperimentId}?userId=${userId}`, { method: 'DELETE' })
    }
    
    // Clean up test user and character
    if (characterId) {
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    if (userId) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  describe('Complete Quest Management Workflow', () => {
    test('should create a new quest via API', async () => {
      const questData = {
        userId,
        title: 'Complete 30 Outdoor Adventures',
        description: 'Experience nature and build outdoor skills through various activities',
        goalDescription: 'Complete 30 different outdoor adventures including hiking, camping, and rock climbing',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        progressNotes: 'Starting with local hiking trails'
      }

      const response = await app.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questData)
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.quest.id).toBeDefined()
      expect(result.data.quest.title).toBe(questData.title)
      expect(result.data.quest.status).toBe('active')

      testQuestId = result.data.quest.id
    })

    test('should retrieve quest details for viewing/editing', async () => {
      const response = await app.request(`/api/quests/${testQuestId}?userId=${userId}`)
      
      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.quest.id).toBe(testQuestId)
      expect(result.data.quest.title).toBe('Complete 30 Outdoor Adventures')
      expect(result.data.quest.status).toBe('active')
      expect(result.data.quest.goalDescription).toBeDefined()
    })

    test('should update quest status (simulating status management)', async () => {
      const response = await app.request(`/api/quests/${testQuestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          status: 'paused'
        })
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.quest.status).toBe('paused')
    })

    test('should update quest details (simulating edit functionality)', async () => {
      const updatedTitle = 'Complete 40 Outdoor Adventures - Updated Goal'
      const response = await app.request(`/api/quests/${testQuestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: updatedTitle,
          description: 'Updated description with more specific goals'
        })
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.quest.title).toBe(updatedTitle)
    })

    test('should list all quests for dashboard view', async () => {
      const response = await app.request(`/api/quests?userId=${userId}`)
      
      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.quests)).toBe(true)
      expect(result.data.quests.length).toBeGreaterThan(0)
      
      // Find our test quest
      const testQuest = result.data.quests.find((q: any) => q.id === testQuestId)
      expect(testQuest).toBeDefined()
      expect(testQuest.status).toBe('paused')
      expect(testQuest.title).toBe('Complete 40 Outdoor Adventures - Updated Goal')
    })

    test('should filter quests by status for organized dashboard', async () => {
      const response = await app.request(`/api/quests?userId=${userId}&status=paused`)
      
      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.quests)).toBe(true)
      
      // All returned quests should be paused
      result.data.quests.forEach((quest: any) => {
        expect(quest.status).toBe('paused')
      })
    })
  })

  describe('Complete Experiment Management Workflow', () => {
    test('should create a new experiment via API', async () => {
      const experimentData = {
        userId,
        title: 'Morning Meditation Practice',
        description: 'Test if daily morning meditation improves focus and productivity',
        hypothesis: 'If I meditate for 10 minutes every morning, then my focus and productivity will improve throughout the day',
        duration: 30, // 30 days
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      const response = await app.request('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experimentData)
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiment.id).toBeDefined()
      expect(result.data.experiment.title).toBe(experimentData.title)
      expect(result.data.experiment.status).toBe('active')
      expect(result.data.experiment.duration).toBe(30)

      testExperimentId = result.data.experiment.id
    })

    test('should retrieve experiment details for viewing/editing', async () => {
      const response = await app.request(`/api/experiments/${testExperimentId}?userId=${userId}`)
      
      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiment.id).toBe(testExperimentId)
      expect(result.data.experiment.title).toBe('Morning Meditation Practice')
      expect(result.data.experiment.status).toBe('active')
      expect(result.data.experiment.hypothesis).toBeDefined()
      expect(result.data.experiment.duration).toBe(30)
    })

    test('should complete experiment with results (simulating completion workflow)', async () => {
      const response = await app.request(`/api/experiments/${testExperimentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          status: 'completed',
          results: 'Daily meditation significantly improved my focus and reduced afternoon energy crashes. I felt more centered and productive throughout the 30-day period.'
        })
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiment.status).toBe('completed')
      expect(result.data.experiment.results).toBeDefined()
    })

    test('should update experiment details (simulating edit functionality)', async () => {
      const response = await app.request(`/api/experiments/${testExperimentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'Morning Meditation Practice - Completed',
          description: 'Successfully tested if daily morning meditation improves focus and productivity'
        })
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiment.title).toBe('Morning Meditation Practice - Completed')
    })

    test('should list all experiments for dashboard view', async () => {
      const response = await app.request(`/api/experiments?userId=${userId}`)
      
      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.experiments)).toBe(true)
      expect(result.data.experiments.length).toBeGreaterThan(0)
      
      // Find our test experiment
      const testExperiment = result.data.experiments.find((e: any) => e.id === testExperimentId)
      expect(testExperiment).toBeDefined()
      expect(testExperiment.status).toBe('completed')
      expect(testExperiment.results).toBeDefined()
    })

    test('should filter experiments by status for organized dashboard', async () => {
      const response = await app.request(`/api/experiments?userId=${userId}&status=completed`)
      
      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.experiments)).toBe(true)
      
      // All returned experiments should be completed
      result.data.experiments.forEach((experiment: any) => {
        expect(experiment.status).toBe('completed')
      })
    })
  })

  describe('User Interface Integration Validation', () => {
    test('should validate quest data structure matches UI requirements', async () => {
      const response = await app.request(`/api/quests/${testQuestId}?userId=${userId}`)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      const quest = result.data.quest
      
      // Validate quest structure for UI display
      expect(quest).toHaveProperty('id')
      expect(quest).toHaveProperty('userId')
      expect(quest).toHaveProperty('title')
      expect(quest).toHaveProperty('description')
      expect(quest).toHaveProperty('goalDescription')
      expect(quest).toHaveProperty('status')
      expect(quest).toHaveProperty('startDate')
      expect(quest).toHaveProperty('endDate')
      expect(quest).toHaveProperty('createdAt')
      expect(quest).toHaveProperty('updatedAt')
      
      // Validate status is one of valid values that UI can handle
      expect(['active', 'paused', 'completed', 'abandoned']).toContain(quest.status)
    })

    test('should validate experiment data structure matches UI requirements', async () => {
      const response = await app.request(`/api/experiments/${testExperimentId}?userId=${userId}`)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      const experiment = result.data.experiment
      
      // Validate experiment structure for UI display
      expect(experiment).toHaveProperty('id')
      expect(experiment).toHaveProperty('userId')
      expect(experiment).toHaveProperty('title')
      expect(experiment).toHaveProperty('description')
      expect(experiment).toHaveProperty('hypothesis')
      expect(experiment).toHaveProperty('duration')
      expect(experiment).toHaveProperty('status')
      expect(experiment).toHaveProperty('startDate')
      expect(experiment).toHaveProperty('endDate')
      expect(experiment).toHaveProperty('results')
      expect(experiment).toHaveProperty('createdAt')
      expect(experiment).toHaveProperty('updatedAt')
      
      // Validate status is one of valid values that UI can handle
      expect(['active', 'paused', 'completed', 'abandoned']).toContain(experiment.status)
      
      // Validate duration is a positive number for UI calculations
      expect(typeof experiment.duration).toBe('number')
      expect(experiment.duration).toBeGreaterThan(0)
    })

    test('should calculate timeline information for UI display', async () => {
      const response = await app.request(`/api/experiments/${testExperimentId}?userId=${userId}`)
      const result = await response.json()
      
      const experiment = result.data.experiment
      const startDate = new Date(experiment.startDate)
      const endDate = new Date(experiment.endDate)
      const durationInMs = experiment.duration * 24 * 60 * 60 * 1000 // Convert days to milliseconds
      
      // End date should be start date + duration (for UI timeline calculations)
      const expectedEndDate = new Date(startDate.getTime() + durationInMs)
      
      // Allow for small differences due to timing
      const timeDifference = Math.abs(endDate.getTime() - expectedEndDate.getTime())
      expect(timeDifference).toBeLessThan(60 * 1000) // Less than 1 minute difference
    })
  })

  describe('Quest and Experiment Management Dashboard Features', () => {
    test('should maintain separate collections for dashboard tabs', async () => {
      // Get both quests and experiments for dashboard
      const questsResponse = await app.request(`/api/quests?userId=${userId}`)
      const experimentsResponse = await app.request(`/api/experiments?userId=${userId}`)
      
      expect(questsResponse.ok).toBe(true)
      expect(experimentsResponse.ok).toBe(true)
      
      const questsResult = await questsResponse.json()
      const experimentsResult = await experimentsResponse.json()
      
      expect(questsResult.success).toBe(true)
      expect(experimentsResult.success).toBe(true)
      
      // Quest should not appear in experiments list
      const questInExperiments = experimentsResult.data.experiments.find((e: any) => e.id === testQuestId)
      expect(questInExperiments).toBeUndefined()
      
      // Experiment should not appear in quests list
      const experimentInQuests = questsResult.data.quests.find((q: any) => q.id === testExperimentId)
      expect(experimentInQuests).toBeUndefined()
    })

    test('should support status-based filtering for dashboard organization', async () => {
      // Test quest status filtering
      const activeQuestsResponse = await app.request(`/api/quests?userId=${userId}&status=active`)
      const pausedQuestsResponse = await app.request(`/api/quests?userId=${userId}&status=paused`)
      
      expect(activeQuestsResponse.ok).toBe(true)
      expect(pausedQuestsResponse.ok).toBe(true)
      
      const activeQuestsResult = await activeQuestsResponse.json()
      const pausedQuestsResult = await pausedQuestsResponse.json()
      
      // Validate filtering works correctly
      activeQuestsResult.data.quests.forEach((quest: any) => {
        expect(quest.status).toBe('active')
      })
      
      pausedQuestsResult.data.quests.forEach((quest: any) => {
        expect(quest.status).toBe('paused')
      })
      
      // Test experiment status filtering
      const completedExperimentsResponse = await app.request(`/api/experiments?userId=${userId}&status=completed`)
      expect(completedExperimentsResponse.ok).toBe(true)
      
      const completedExperimentsResult = await completedExperimentsResponse.json()
      completedExperimentsResult.data.experiments.forEach((experiment: any) => {
        expect(experiment.status).toBe('completed')
      })
    })

    test('should provide proper error responses for UI error handling', async () => {
      // Test 404 handling for non-existent quest
      const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
      const questResponse = await app.request(`/api/quests/${nonExistentId}?userId=${userId}`)
      
      expect(questResponse.ok).toBe(false)
      expect(questResponse.status).toBe(404)
      
      // Test 404 handling for non-existent experiment
      const experimentResponse = await app.request(`/api/experiments/${nonExistentId}?userId=${userId}`)
      
      expect(experimentResponse.ok).toBe(false)
      expect(experimentResponse.status).toBe(404)
      
      // Test validation errors for malformed data
      const invalidQuestResponse = await app.request(`/api/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }) // Missing required fields
      })
      
      expect(invalidQuestResponse.ok).toBe(false)
      expect(invalidQuestResponse.status).toBe(400)
    })
  })

  describe('Status Management Workflow', () => {
    test('should support complete quest status lifecycle', async () => {
      const validStatuses = ['active', 'paused', 'completed', 'abandoned']
      
      for (const status of validStatuses) {
        const response = await app.request(`/api/quests/${testQuestId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            status
          })
        })

        expect(response.ok).toBe(true)
        const result = await response.json()
        expect(result.success).toBe(true)
        expect(result.data.quest.status).toBe(status)
      }
    })

    test('should support complete experiment status lifecycle', async () => {
      const validStatuses = ['active', 'paused', 'completed', 'abandoned']
      
      for (const status of validStatuses) {
        const response = await app.request(`/api/experiments/${testExperimentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            status
          })
        })

        expect(response.ok).toBe(true)
        const result = await response.json()
        expect(result.success).toBe(true)
        expect(result.data.experiment.status).toBe(status)
      }
    })
  })

  describe('CRUD Operations Validation', () => {
    test('should demonstrate complete CRUD workflow for quests', async () => {
      // CREATE - Already tested above
      
      // READ - Get quest details
      const readResponse = await app.request(`/api/quests/${testQuestId}?userId=${userId}`)
      expect(readResponse.ok).toBe(true)
      
      // UPDATE - Update quest details
      const updateResponse = await app.request(`/api/quests/${testQuestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'Final Updated Quest Title'
        })
      })
      expect(updateResponse.ok).toBe(true)
      
      // Verify update worked
      const verifyResponse = await app.request(`/api/quests/${testQuestId}?userId=${userId}`)
      const verifyResult = await verifyResponse.json()
      expect(verifyResult.data.quest.title).toBe('Final Updated Quest Title')
      
      // DELETE will be handled in cleanup
    })

    test('should demonstrate complete CRUD workflow for experiments', async () => {
      // CREATE - Already tested above
      
      // READ - Get experiment details
      const readResponse = await app.request(`/api/experiments/${testExperimentId}?userId=${userId}`)
      expect(readResponse.ok).toBe(true)
      
      // UPDATE - Update experiment details
      const updateResponse = await app.request(`/api/experiments/${testExperimentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'Final Updated Experiment Title'
        })
      })
      expect(updateResponse.ok).toBe(true)
      
      // Verify update worked
      const verifyResponse = await app.request(`/api/experiments/${testExperimentId}?userId=${userId}`)
      const verifyResult = await verifyResponse.json()
      expect(verifyResult.data.experiment.title).toBe('Final Updated Experiment Title')
      
      // DELETE will be handled in cleanup
    })
  })
})
