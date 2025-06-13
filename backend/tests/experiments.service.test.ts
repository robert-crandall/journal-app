import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { ExperimentsService } from '../src/services/experiments.service'
import { AuthService } from '../src/services/auth.service'
import { CharacterStatsService } from '../src/services/character-stats.service'
import { cleanDatabase, TEST_USER, TEST_USER_2, createTestUser } from './setup'

describe('ExperimentsService', () => {
  let userId: string
  let statId: string

  beforeEach(async () => {
    await cleanDatabase()
    
    const user = await AuthService.register(TEST_USER)
    userId = (user as any).data.user.id

    // Create a character stat for the user (required for XP rewards)
    const stat = await CharacterStatsService.create(userId, {
      name: 'Focus',
      description: 'Mental focus and concentration'
    })
    statId = stat!.id
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  describe('create', () => {
    it('should create a new experiment successfully', async () => {
      const experimentData = {
        title: 'Daily Exercise',
        description: 'Exercise for 30 minutes daily',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Complete 30 minutes of exercise',
        xpRewards: [{ statId, xp: 10 }]
      }

      const experiment = await ExperimentsService.create(userId, experimentData)

      expect(experiment).not.toBeNull()
      expect(experiment!.id).toBeDefined()
      expect(experiment!.userId).toBe(userId)
      expect(experiment!.title).toBe(experimentData.title)
      expect(experiment!.description).toBe(experimentData.description)
      expect(experiment!.dailyTaskDescription).toBe(experimentData.dailyTaskDescription)
    })

    it('should create experiment with empty title (no database constraint)', async () => {
      const experimentData = {
        title: '', // Empty title - allowed by database schema
        description: 'Test',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T00:00:00Z',
        dailyTaskDescription: 'Task',
        xpRewards: [{ statId, xp: 10 }]
      }

      const experiment = await ExperimentsService.create(userId, experimentData)
      expect(experiment).not.toBeNull()
      expect(experiment!.title).toBe('')
    })
  })

  describe('getByUserId', () => {
    it('should return empty array for user with no experiments', async () => {
      const experiments = await ExperimentsService.getByUserId(userId)
      expect(experiments).toEqual([])
    })

    it('should return user experiments', async () => {
      // Create two experiments
      await ExperimentsService.create(userId, {
        title: 'Experiment 1',
        description: 'First experiment',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Task 1',
        xpRewards: [{ statId, xp: 10 }]
      })

      await ExperimentsService.create(userId, {
        title: 'Experiment 2',
        description: 'Second experiment',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Task 2',
        xpRewards: [{ statId, xp: 15 }]
      })

      const experiments = await ExperimentsService.getByUserId(userId)
      expect(experiments).toHaveLength(2)
      expect(experiments[0].title).toBe('Experiment 2') // Ordered by created desc
      expect(experiments[1].title).toBe('Experiment 1')
    })
  })

  describe('getById', () => {
    it('should return experiment for valid id', async () => {
      const created = await ExperimentsService.create(userId, {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task',
        xpRewards: [{ statId, xp: 10 }]
      })

      const experiment = await ExperimentsService.getById(created!.id, userId)
      expect(experiment).toBeDefined()
      expect(experiment!.id).toBe(created!.id)
      expect(experiment!.title).toBe('Test Experiment')
    })

    it('should return undefined for non-existent experiment', async () => {
      const experiment = await ExperimentsService.getById(
        '123e4567-e89b-12d3-a456-426614174000',
        userId
      )
      expect(experiment).toBeUndefined()
    })

    it('should return undefined for experiment belonging to different user', async () => {
      const anotherUserResult = await AuthService.register({
        email: 'another@test.com',
        password: 'password123',
        name: 'Another User'
      })
      const anotherUserId = (anotherUserResult as any).data.user.id
      
      // Create character stat for another user
      const anotherStat = await CharacterStatsService.create(anotherUserId, {
        name: 'Energy',
        description: 'Physical energy levels'
      })

      const created = await ExperimentsService.create(anotherUserId, {
        title: 'Other User Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task',
        xpRewards: [{ statId: anotherStat!.id, xp: 10 }]
      })

      const experiment = await ExperimentsService.getById(created!.id, userId)
      expect(experiment).toBeUndefined()
    })
  })

  describe('completeDailyTask', () => {
    let experimentId: string

    beforeEach(async () => {
      const experiment = await ExperimentsService.create(userId, {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task',
        xpRewards: [{ statId, xp: 10 }]
      })
      experimentId = experiment!.id
    })

    it('should complete a task successfully', async () => {
      const taskData = {
        completed: true,
        date: '2023-12-01T10:00:00Z'
      }

      const task = await ExperimentsService.completeDailyTask(experimentId, taskData)

      expect(task).not.toBeNull()
      expect(task!.id).toBeDefined()
      expect(task!.experimentId).toBe(experimentId)
      expect(task!.completed).toBe(true)
      expect(task!.date).toEqual(new Date('2023-12-01T10:00:00Z'))
    })

    it('should return null for non-existent experiment', async () => {
      const taskData = {
        completed: true,
        date: '2023-12-01T10:00:00Z'
      }

      const task = await ExperimentsService.completeDailyTask(
        '123e4567-e89b-12d3-a456-426614174000', 
        taskData
      )
      expect(task).toBeNull()
    })
  })

  describe('getDailyTasks', () => {
    let experimentId: string

    beforeEach(async () => {
      const experiment = await ExperimentsService.create(userId, {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task',
        xpRewards: [{ statId, xp: 10 }]
      })
      experimentId = experiment!.id
    })

    it('should return empty array for experiment with no tasks', async () => {
      const tasks = await ExperimentsService.getDailyTasks(experimentId)
      expect(tasks).toEqual([])
    })

    it('should return tasks for experiment', async () => {
      // Create two tasks  
      await ExperimentsService.completeDailyTask(experimentId, {
        completed: true,
        date: '2023-12-01T10:00:00Z'
      })
      await ExperimentsService.completeDailyTask(experimentId, {
        completed: false,
        date: '2023-12-02T10:00:00Z'
      })

      const tasks = await ExperimentsService.getDailyTasks(experimentId)
      expect(tasks).toHaveLength(2)
      // Tasks are ordered by date desc, so newest first
      expect(tasks[0].completed).toBe(false) // 2023-12-02 task
      expect(tasks[1].completed).toBe(true)  // 2023-12-01 task
    })

    it('should return tasks ordered by date (desc)', async () => {
      // Create tasks out of order
      await ExperimentsService.completeDailyTask(experimentId, {
        completed: true,
        date: '2023-12-03T10:00:00Z'
      })
      await ExperimentsService.completeDailyTask(experimentId, {
        completed: true,
        date: '2023-12-01T10:00:00Z'
      })
      await ExperimentsService.completeDailyTask(experimentId, {
        completed: true,  
        date: '2023-12-02T10:00:00Z'
      })

      const tasks = await ExperimentsService.getDailyTasks(experimentId)
      expect(tasks).toHaveLength(3)
      // Service orders by date desc, so newest first
      expect(tasks[0].date).toEqual(new Date('2023-12-03T10:00:00Z'))
      expect(tasks[1].date).toEqual(new Date('2023-12-02T10:00:00Z'))
      expect(tasks[2].date).toEqual(new Date('2023-12-01T10:00:00Z'))
    })
  })

  describe('update', () => {
    let experimentId: string

    beforeEach(async () => {
      const experiment = await ExperimentsService.create(userId, {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task',
        xpRewards: [{ statId, xp: 10 }]
      })
      experimentId = experiment!.id
    })

    it('should update experiment successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      }

      const updated = await ExperimentsService.update(experimentId, userId, updateData)

      expect(updated).not.toBeNull()
      expect(updated!.title).toBe('Updated Title')
      expect(updated!.description).toBe('Updated description')
    })

    it('should return null for non-existent experiment', async () => {
      const updated = await ExperimentsService.update(
        '123e4567-e89b-12d3-a456-426614174000',
        userId,
        { title: 'Updated' }
      )
      expect(updated).toBeNull()
    })
  })

  describe('delete', () => {
    let experimentId: string

    beforeEach(async () => {
      const experiment = await ExperimentsService.create(userId, {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task',
        xpRewards: [{ statId, xp: 10 }]
      })
      experimentId = experiment!.id
    })

    it('should delete experiment successfully', async () => {
      const result = await ExperimentsService.delete(experimentId, userId)
      expect(result).toBe(true)

      const experiment = await ExperimentsService.getById(experimentId, userId)
      expect(experiment).toBeUndefined()
    })

    it('should return false for non-existent experiment', async () => {
      const result = await ExperimentsService.delete(
        '123e4567-e89b-12d3-a456-426614174000',
        userId
      )
      expect(result).toBe(false)
    })
  })
})
