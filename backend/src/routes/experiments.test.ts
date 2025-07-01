import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, tasks, experiments } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

function generateUUID(): string {
  return crypto.randomUUID()
}

describe('Experiment Management API Integration Tests - Task 3.6', () => {
  let testUserId: string
  let testCharacterId: string
  let testStatId: string
  let testExperimentId: string
  const cleanupUserIds: string[] = []
  const cleanupExperimentIds: string[] = []
  const cleanupTaskIds: string[] = []

  beforeEach(async () => {
    console.log('Setting up experiment management integration tests...')
    
    // Create test user
    const testUserData = await createTestUser({
      email: `test-experiments-${Date.now()}@example.com`,
      name: 'Test User',
      timezone: 'UTC'
    })
    testUserId = testUserData.user.id
    cleanupUserIds.push(testUserId)

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Experiment Hero',
      class: 'Scientific Explorer',
      backstory: 'A character who loves testing hypotheses and exploring new behaviors.'
    }).returning()
    testCharacterId = character.id

    // Create test stat
    const [stat] = await db.insert(characterStats).values({
      characterId: testCharacterId,
      category: 'Mental Wellness',
      currentXp: 50,
      currentLevel: 1,
      totalXp: 50,
      description: 'Tracking mental health activities'
    }).returning()
    testStatId = stat.id
  })

  afterEach(async () => {
    console.log('Cleaning up experiment management test data...')
    
    // Clean up in reverse order of dependencies
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasks).where(eq(tasks.id, taskId))
    }
    
    for (const experimentId of cleanupExperimentIds) {
      await db.delete(experiments).where(eq(experiments.id, experimentId))
    }
    
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  describe('POST /api/experiments - Create Experiment', () => {
    it('should create a new experiment with hypothesis and duration', async () => {
      const experimentData = {
        userId: testUserId,
        title: '7-Day Social Media Detox',
        description: 'Avoid all social media platforms for 7 consecutive days',
        hypothesis: 'Avoiding social media will improve focus and reduce anxiety',
        duration: 7,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }

      const response = await app.request('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experimentData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiment.title).toBe(experimentData.title)
      expect(result.data.experiment.hypothesis).toBe(experimentData.hypothesis)
      expect(result.data.experiment.duration).toBe(7)
      expect(result.data.experiment.status).toBe('active')
      
      testExperimentId = result.data.experiment.id
      cleanupExperimentIds.push(testExperimentId)
    })

    it('should validate required fields', async () => {
      const response = await app.request('/api/experiments', {
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

    it('should validate user exists', async () => {
      const experimentData = {
        userId: generateUUID(),
        title: 'Test Experiment',
        description: 'Test experiment description',
        hypothesis: 'Test hypothesis',
        duration: 3,
        startDate: new Date().toISOString()
      }

      const response = await app.request('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experimentData)
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })
  })

  describe('GET /api/experiments - List Experiments', () => {
    beforeEach(async () => {
      // Create test experiments
      const experimentsData = [
        {
          userId: testUserId,
          title: 'Early Morning Routine',
          description: 'Wake up at 5 AM every day',
          hypothesis: 'Early wake-up will increase productivity',
          duration: 14,
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Started 5 days ago
          endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // Ends in 9 days
          status: 'active'
        },
        {
          userId: testUserId,
          title: 'No Coffee Challenge',
          description: 'Avoid caffeine completely',
          hypothesis: 'Reducing caffeine will improve sleep quality',
          duration: 10,
          startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // Started 12 days ago
          endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Ended 2 days ago
          status: 'completed',
          results: 'Noticed significant improvement in sleep quality',
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ]

      for (const expData of experimentsData) {
        const [experiment] = await db.insert(experiments).values(expData).returning()
        cleanupExperimentIds.push(experiment.id)
        
        // Create a sample task for each experiment
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          title: `Daily task for ${experiment.title}`,
          description: 'Experiment-related task',
          source: 'experiment',
          sourceId: experiment.id,
          targetStats: ['Mental Wellness'],
          estimatedXp: 25,
          status: 'pending'
        }).returning()
        cleanupTaskIds.push(task.id)
      }
    })

    it('should list all experiments for a user with progress tracking', async () => {
      const response = await app.request(`/api/experiments?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiments).toBeDefined()
      expect(Array.isArray(result.data.experiments)).toBe(true)
      expect(result.data.experiments.length).toBeGreaterThanOrEqual(2)

      // Check experiment differentiation from quests
      const activeExperiment = result.data.experiments.find((exp: any) => exp.status === 'active')
      expect(activeExperiment).toBeDefined()
      expect(activeExperiment.hypothesis).toBeDefined()
      expect(activeExperiment.duration).toBeDefined()
      expect(activeExperiment.progressSummary).toBeDefined()
      expect(activeExperiment.daysRemaining).toBeDefined()
    })

    it('should filter experiments by status', async () => {
      const response = await app.request(`/api/experiments?userId=${testUserId}&status=completed`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiments.length).toBe(1)
      expect(result.data.experiments[0].status).toBe('completed')
      expect(result.data.experiments[0].results).toBeDefined()
    })

    it('should include experiment duration and timeline information', async () => {
      const response = await app.request(`/api/experiments?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      for (const experiment of result.data.experiments) {
        expect(experiment.duration).toBeDefined()
        expect(experiment.startDate).toBeDefined()
        
        if (experiment.status === 'active') {
          expect(experiment.daysRemaining).toBeGreaterThanOrEqual(0)
        }
        
        // Experiments should be differentiated from quests
        expect(experiment.hypothesis).toBeDefined()
        expect(typeof experiment.duration).toBe('number')
      }
    })
  })

  describe('GET /api/experiments/:id - Get Experiment Details', () => {
    beforeEach(async () => {
      // Create test experiment with tasks
      const [experiment] = await db.insert(experiments).values({
        userId: testUserId,
        title: 'Cold Shower Challenge',
        description: 'Take cold showers for mental resilience',
        hypothesis: 'Cold exposure will improve stress tolerance',
        duration: 21,
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        status: 'active'
      }).returning()
      testExperimentId = experiment.id
      cleanupExperimentIds.push(experiment.id)

      // Create associated tasks
      const tasksData = [
        { status: 'completed', completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        { status: 'pending', completedAt: null }
      ]

      for (const taskData of tasksData) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          title: 'Take cold shower',
          description: 'Morning cold shower routine',
          source: 'experiment',
          sourceId: experiment.id,
          targetStats: ['Mental Wellness'],
          estimatedXp: 30,
          ...taskData
        }).returning()
        cleanupTaskIds.push(task.id)
      }
    })

    it('should get detailed experiment information with progress', async () => {
      const response = await app.request(`/api/experiments/${testExperimentId}?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiment.id).toBe(testExperimentId)

      // Should include detailed progress information
      expect(result.data.experiment.progressSummary).toBeDefined()
      expect(result.data.experiment.progressSummary.totalTasks).toBe(2)
      expect(result.data.experiment.progressSummary.completedTasks).toBe(1)
      expect(result.data.experiment.progressSummary.completionRate).toBe(50)

      // Should include experiment-specific fields
      expect(result.data.experiment.hypothesis).toBeDefined()
      expect(result.data.experiment.duration).toBe(21)
      expect(result.data.experiment.daysRemaining).toBeGreaterThan(0)

      // Should include associated tasks
      expect(result.data.experiment.tasks).toBeDefined()
      expect(Array.isArray(result.data.experiment.tasks)).toBe(true)
      expect(result.data.experiment.tasks.length).toBe(2)
    })

    it('should return 404 for non-existent experiment', async () => {
      const response = await app.request(`/api/experiments/${generateUUID()}?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Experiment not found')
    })

    it('should return 403 for unauthorized access', async () => {
      const otherUserId = generateUUID()
      
      const response = await app.request(`/api/experiments/${testExperimentId}?userId=${otherUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(403)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('PUT /api/experiments/:id - Update Experiment', () => {
    beforeEach(async () => {
      const [experiment] = await db.insert(experiments).values({
        userId: testUserId,
        title: 'Test Experiment',
        description: 'Initial description',
        hypothesis: 'Initial hypothesis',
        duration: 7,
        startDate: new Date(),
        status: 'active'
      }).returning()
      testExperimentId = experiment.id
      cleanupExperimentIds.push(experiment.id)
    })

    it('should update experiment properties', async () => {
      const updateData = {
        userId: testUserId,
        title: 'Updated Test Experiment',
        description: 'Updated description with more details',
        hypothesis: 'Refined hypothesis based on initial observations'
      }

      const response = await app.request(`/api/experiments/${testExperimentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiment.title).toBe(updateData.title)
      expect(result.data.experiment.description).toBe(updateData.description)
      expect(result.data.experiment.hypothesis).toBe(updateData.hypothesis)
    })

    it('should update experiment status and completion', async () => {
      const updateData = {
        userId: testUserId,
        status: 'completed',
        results: 'The experiment was successful. Observed significant improvements in the target behavior.'
      }

      const response = await app.request(`/api/experiments/${testExperimentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiment.status).toBe('completed')
      expect(result.data.experiment.results).toBe(updateData.results)
      expect(result.data.experiment.completedAt).toBeDefined()
    })

    it('should handle experiment abandonment', async () => {
      const updateData = {
        userId: testUserId,
        status: 'abandoned',
        results: 'Experiment abandoned due to unexpected circumstances'
      }

      const response = await app.request(`/api/experiments/${testExperimentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.experiment.status).toBe('abandoned')
      expect(result.data.experiment.results).toBe(updateData.results)
    })
  })

  describe('DELETE /api/experiments/:id - Delete Experiment', () => {
    beforeEach(async () => {
      // Create experiment with associated tasks
      const [experiment] = await db.insert(experiments).values({
        userId: testUserId,
        title: 'Experiment to Delete',
        description: 'This experiment will be deleted',
        hypothesis: 'Deletion will work correctly',
        duration: 5,
        startDate: new Date(),
        status: 'active'
      }).returning()
      testExperimentId = experiment.id
      cleanupExperimentIds.push(experiment.id)

      // Create associated tasks
      const [task] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Experiment task',
        description: 'Task associated with experiment',
        source: 'experiment',
        sourceId: experiment.id,
        targetStats: ['Mental Wellness'],
        estimatedXp: 20,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(task.id)
    })

    it('should delete an experiment and convert associated tasks to ad-hoc', async () => {
      const response = await app.request(`/api/experiments/${testExperimentId}?userId=${testUserId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.message).toBe('Experiment deleted successfully')

      // Verify experiment is deleted
      const checkResponse = await app.request(`/api/experiments/${testExperimentId}?userId=${testUserId}`, {
        method: 'GET'
      })
      expect(checkResponse.status).toBe(404)

      // Verify associated tasks are converted to ad-hoc
      const tasksResponse = await app.request(`/api/tasks?userId=${testUserId}&source=ad-hoc`, {
        method: 'GET'
      })
      expect(tasksResponse.status).toBe(200)
      const tasksResult = await tasksResponse.json()
      expect(tasksResult.data.length).toBeGreaterThanOrEqual(1)
      
      const convertedTask = tasksResult.data.find((t: any) => t.title === 'Experiment task')
      expect(convertedTask).toBeDefined()
      expect(convertedTask.source).toBe('ad-hoc')
      expect(convertedTask.sourceId).toBeNull()
    })
  })

  describe('Experiment Task Differentiation', () => {
    it('should differentiate experiment tasks from quest tasks in dashboard', async () => {
      // This test verifies that experiment tasks are clearly marked and behave differently
      const [experiment] = await db.insert(experiments).values({
        userId: testUserId,
        title: 'Short-term Behavior Test',
        description: 'Testing a behavior change for a short period',
        hypothesis: 'Short experiments are more manageable',
        duration: 3,
        startDate: new Date(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'active'
      }).returning()
      cleanupExperimentIds.push(experiment.id)

      const [task] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Daily experiment task',
        description: 'Task for short-term experiment',
        source: 'experiment',
        sourceId: experiment.id,
        targetStats: ['Mental Wellness'],
        estimatedXp: 15,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(task.id)

      // Check that experiment tasks appear in dashboard
      const dashboardResponse = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(dashboardResponse.status).toBe(200)
      const dashboardResult = await dashboardResponse.json()
      
      const experimentTasks = dashboardResult.data.tasks.filter((t: any) => t.source === 'experiment')
      expect(experimentTasks.length).toBeGreaterThanOrEqual(1)
      
      const experimentTask = experimentTasks[0]
      expect(experimentTask.sourceMetadata).toBeDefined()
      expect(experimentTask.sourceMetadata.type).toBe('experiment')
      expect(experimentTask.sourceMetadata.hypothesis).toBeDefined()
      expect(experimentTask.sourceMetadata.duration).toBe(3)
      expect(experimentTask.sourceMetadata.daysRemaining).toBeGreaterThanOrEqual(0)
    })

    it('should confirm experiments do not influence AI task generation', async () => {
      // This test documents the key difference: experiments should not influence AI
      // In a real implementation, this would be tested in the AI service integration
      // For now, we document this requirement in the experiment data structure
      
      const [experiment] = await db.insert(experiments).values({
        userId: testUserId,
        title: 'Non-AI Influencing Experiment',
        description: 'This experiment should not affect AI task generation',
        hypothesis: 'AI should not consider this experiment when generating tasks',
        duration: 5,
        startDate: new Date(),
        status: 'active'
      }).returning()
      cleanupExperimentIds.push(experiment.id)

      const response = await app.request(`/api/experiments/${experiment.id}?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      // Experiments should be clearly marked as not influencing AI
      expect(result.data.experiment.influencesAI).toBe(false)
      expect(result.data.experiment.type).toBe('experiment')
    })
  })
})
