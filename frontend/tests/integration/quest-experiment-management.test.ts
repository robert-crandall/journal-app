import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'

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

const BASE_URL = 'http://localhost:3000'
const userId = 'a0e1f2c3-d4b5-6c7d-8e9f-0a1b2c3d4e5f'

let testQuestId: string
let testExperimentId: string

describe('Quest and Experiment Management Integration - Task 6.9', () => {
  beforeAll(async () => {
    // Verify backend is running
    const response = await fetch(`${BASE_URL}/api/quests?userId=${userId}`)
    expect(response.ok).toBe(true)
  })

  afterAll(async () => {
    // Clean up test data
    if (testQuestId) {
      await fetch(`${BASE_URL}/api/quests/${testQuestId}?userId=${userId}`, { method: 'DELETE' })
    }
    if (testExperimentId) {
      await fetch(`${BASE_URL}/api/experiments/${testExperimentId}?userId=${userId}`, { method: 'DELETE' })
    }
  })

  describe('Quest Management', () => {
    test('should create a new quest via API', async () => {
      const questData = {
        userId,
        title: 'Complete 30 Outdoor Adventures',
        description: 'Experience nature and build outdoor skills through various activities',
        goalDescription: 'Complete 30 different outdoor adventures including hiking, camping, and rock climbing',
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
      }

      const response = await fetch(`${BASE_URL}/api/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questData)
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.id).toBeDefined()
      expect(result.data.title).toBe(questData.title)
      expect(result.data.status).toBe('active')

      testQuestId = result.data.id
    })

    test('should retrieve quest details', async () => {
      const response = await fetch(`${BASE_URL}/api/quests/${testQuestId}?userId=${userId}`)
      
      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.quest.id).toBe(testQuestId)
      expect(result.data.quest.title).toBe('Complete 30 Outdoor Adventures')
      expect(result.data.quest.status).toBe('active')
      expect(result.data.quest.goalDescription).toBeDefined()
    })

    test('should update quest status', async () => {
      const response = await fetch(`${BASE_URL}/api/quests/${testQuestId}`, {
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
      expect(result.data.status).toBe('paused')
    })

    test('should list all quests for user', async () => {
      const response = await fetch(`${BASE_URL}/api/quests?userId=${userId}`)
      
      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.quests)).toBe(true)
      expect(result.data.quests.length).toBeGreaterThan(0)
      
      // Find our test quest
      const testQuest = result.data.quests.find((q: any) => q.id === testQuestId)
      expect(testQuest).toBeDefined()
      expect(testQuest.status).toBe('paused')
    })

    test('should filter quests by status', async () => {
      const response = await fetch(`${BASE_URL}/api/quests?userId=${userId}&status=paused`)
      
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

  describe('Experiment Management', () => {
    test('should create a new experiment via API', async () => {
      const experimentData = {
        userId,
        title: 'Morning Meditation Practice',
        description: 'Test if daily morning meditation improves focus and productivity',
        hypothesis: 'If I meditate for 10 minutes every morning, then my focus and productivity will improve throughout the day',
        duration: 30 // 30 days
      }

      const response = await fetch(`${BASE_URL}/api/experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experimentData)
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.id).toBeDefined()
      expect(result.data.title).toBe(experimentData.title)
      expect(result.data.status).toBe('active')
      expect(result.data.duration).toBe(30)

      testExperimentId = result.data.id
    })

    test('should retrieve experiment details', async () => {
      const response = await fetch(`${BASE_URL}/api/experiments/${testExperimentId}?userId=${userId}`)
      
      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiment.id).toBe(testExperimentId)
      expect(result.data.experiment.title).toBe('Morning Meditation Practice')
      expect(result.data.experiment.status).toBe('active')
      expect(result.data.experiment.hypothesis).toBeDefined()
      expect(result.data.experiment.duration).toBe(30)
    })

    test('should complete experiment with results', async () => {
      const response = await fetch(`${BASE_URL}/api/experiments/${testExperimentId}`, {
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
      expect(result.data.status).toBe('completed')
      expect(result.data.results).toBeDefined()
    })

    test('should list all experiments for user', async () => {
      const response = await fetch(`${BASE_URL}/api/experiments?userId=${userId}`)
      
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

    test('should filter experiments by status', async () => {
      const response = await fetch(`${BASE_URL}/api/experiments?userId=${userId}&status=completed`)
      
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

  describe('Error Handling and Validation', () => {
    test('should validate required fields for quest creation', async () => {
      const invalidQuestData = {
        userId,
        // Missing required title field
        description: 'Test description'
      }

      const response = await fetch(`${BASE_URL}/api/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidQuestData)
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    test('should validate required fields for experiment creation', async () => {
      const invalidExperimentData = {
        userId,
        title: 'Test Experiment',
        // Missing required hypothesis and duration fields
        description: 'Test description'
      }

      const response = await fetch(`${BASE_URL}/api/experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidExperimentData)
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    test('should return 404 for non-existent quest', async () => {
      const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
      const response = await fetch(`${BASE_URL}/api/quests/${nonExistentId}?userId=${userId}`)
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })

    test('should return 404 for non-existent experiment', async () => {
      const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
      const response = await fetch(`${BASE_URL}/api/experiments/${nonExistentId}?userId=${userId}`)
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })

    test('should prevent unauthorized access to quest', async () => {
      const unauthorizedUserId = 'unauthorized-user-id'
      const response = await fetch(`${BASE_URL}/api/quests/${testQuestId}?userId=${unauthorizedUserId}`)
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
    })

    test('should prevent unauthorized access to experiment', async () => {
      const unauthorizedUserId = 'unauthorized-user-id'
      const response = await fetch(`${BASE_URL}/api/experiments/${testExperimentId}?userId=${unauthorizedUserId}`)
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
    })
  })

  describe('Quest and Experiment Data Structure Validation', () => {
    test('should return properly structured quest data', async () => {
      const response = await fetch(`${BASE_URL}/api/quests/${testQuestId}?userId=${userId}`)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      const quest = result.data.quest
      
      // Validate quest structure
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
      
      // Validate status is one of valid values
      expect(['active', 'paused', 'completed', 'abandoned']).toContain(quest.status)
    })

    test('should return properly structured experiment data', async () => {
      const response = await fetch(`${BASE_URL}/api/experiments/${testExperimentId}?userId=${userId}`)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      const experiment = result.data.experiment
      
      // Validate experiment structure
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
      
      // Validate status is one of valid values
      expect(['active', 'paused', 'completed', 'abandoned']).toContain(experiment.status)
      
      // Validate duration is a positive number
      expect(typeof experiment.duration).toBe('number')
      expect(experiment.duration).toBeGreaterThan(0)
    })

    test('should calculate experiment end date based on duration', async () => {
      const response = await fetch(`${BASE_URL}/api/experiments/${testExperimentId}?userId=${userId}`)
      const result = await response.json()
      
      const experiment = result.data.experiment
      const startDate = new Date(experiment.startDate)
      const endDate = new Date(experiment.endDate)
      const durationInMs = experiment.duration * 24 * 60 * 60 * 1000 // Convert days to milliseconds
      
      // End date should be start date + duration
      const expectedEndDate = new Date(startDate.getTime() + durationInMs)
      
      // Allow for small differences due to timing
      const timeDifference = Math.abs(endDate.getTime() - expectedEndDate.getTime())
      expect(timeDifference).toBeLessThan(60 * 1000) // Less than 1 minute difference
    })
  })

  describe('Status Management', () => {
    test('should support all valid quest status transitions', async () => {
      const validStatuses = ['active', 'paused', 'completed', 'abandoned']
      
      for (const status of validStatuses) {
        const response = await fetch(`${BASE_URL}/api/quests/${testQuestId}`, {
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
        expect(result.data.status).toBe(status)
      }
    })

    test('should support all valid experiment status transitions', async () => {
      const validStatuses = ['active', 'paused', 'completed', 'abandoned']
      
      for (const status of validStatuses) {
        const response = await fetch(`${BASE_URL}/api/experiments/${testExperimentId}`, {
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
        expect(result.data.status).toBe(status)
      }
    })
  })

  describe('Quest and Experiment Differentiation', () => {
    test('should maintain separate collections for quests and experiments', async () => {
      // Get both quests and experiments
      const questsResponse = await fetch(`${BASE_URL}/api/quests?userId=${userId}`)
      const experimentsResponse = await fetch(`${BASE_URL}/api/experiments?userId=${userId}`)
      
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

    test('should have distinct data structures for quests vs experiments', async () => {
      const questResponse = await fetch(`${BASE_URL}/api/quests/${testQuestId}?userId=${userId}`)
      const experimentResponse = await fetch(`${BASE_URL}/api/experiments/${testExperimentId}?userId=${userId}`)
      
      const questResult = await questResponse.json()
      const experimentResult = await experimentResponse.json()
      
      const quest = questResult.data.quest
      const experiment = experimentResult.data.experiment
      
      // Quests should have goalDescription, experiments should have hypothesis and duration
      expect(quest).toHaveProperty('goalDescription')
      expect(quest).not.toHaveProperty('hypothesis')
      expect(quest).not.toHaveProperty('duration')
      
      expect(experiment).toHaveProperty('hypothesis')
      expect(experiment).toHaveProperty('duration')
      expect(experiment).not.toHaveProperty('goalDescription')
    })
  })
})
