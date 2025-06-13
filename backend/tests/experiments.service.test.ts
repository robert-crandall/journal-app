import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { ExperimentsService } from '../src/services/experiments.service'
import { AuthService } from '../src/services/auth.service'
import { cleanDatabase, TEST_USER, TEST_USER_2 } from './setup'

describe('ExperimentsService', () => {
  let userId: string

  beforeEach(async () => {
    await cleanDatabase()
    
    const user = await AuthService.register(TEST_USER)
    userId = (user as any).data.user.id
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  describe('createExperiment', () => {
    it('should create a new experiment successfully', async () => {
      const experimentData = {
        title: 'Daily Exercise',
        description: 'Exercise for 30 minutes daily',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Complete 30 minutes of exercise'
      }

      const experiment = await experimentsService.createExperiment(userId, experimentData)

      expect(experiment.id).toBeDefined()
      expect(experiment.userId).toBe(userId)
      expect(experiment.title).toBe(experimentData.title)
      expect(experiment.description).toBe(experimentData.description)
      expect(experiment.status).toBe('active')
      expect(experiment.currentStreak).toBe(0)
      expect(experiment.longestStreak).toBe(0)
      expect(experiment.totalCompletions).toBe(0)
    })

    it('should throw error for invalid date range', async () => {
      const experimentData = {
        title: 'Invalid Experiment',
        description: 'Test',
        startDate: '2023-12-31T00:00:00Z',
        endDate: '2023-12-01T00:00:00Z', // end before start
        dailyTaskDescription: 'Task'
      }

      await expect(
        experimentsService.createExperiment(userId, experimentData)
      ).rejects.toThrow('End date must be after start date')
    })
  })

  describe('getUserExperiments', () => {
    it('should return empty array for user with no experiments', async () => {
      const experiments = await experimentsService.getUserExperiments(userId)
      expect(experiments).toEqual([])
    })

    it('should return user experiments', async () => {
      // Create two experiments
      await experimentsService.createExperiment(userId, {
        title: 'Experiment 1',
        description: 'First experiment',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Task 1'
      })

      await experimentsService.createExperiment(userId, {
        title: 'Experiment 2',
        description: 'Second experiment',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Task 2'
      })

      const experiments = await experimentsService.getUserExperiments(userId)
      expect(experiments).toHaveLength(2)
      expect(experiments[0].title).toBe('Experiment 1')
      expect(experiments[1].title).toBe('Experiment 2')
    })
  })

  describe('getExperimentById', () => {
    it('should return experiment for valid id', async () => {
      const created = await experimentsService.createExperiment(userId, {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task'
      })

      const experiment = await experimentsService.getExperimentById(userId, created.id)
      expect(experiment).toBeDefined()
      expect(experiment!.id).toBe(created.id)
      expect(experiment!.title).toBe('Test Experiment')
    })

    it('should return null for non-existent experiment', async () => {
      const experiment = await experimentsService.getExperimentById(
        userId, 
        '123e4567-e89b-12d3-a456-426614174000'
      )
      expect(experiment).toBeNull()
    })

    it('should return null for experiment belonging to different user', async () => {
      const anotherUser = await createTestUser('another@test.com')
      
      const created = await experimentsService.createExperiment(anotherUser.id, {
        title: 'Other User Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task'
      })

      const experiment = await experimentsService.getExperimentById(userId, created.id)
      expect(experiment).toBeNull()
    })
  })

  describe('completeTask', () => {
    let experimentId: string

    beforeEach(async () => {
      const experiment = await experimentsService.createExperiment(userId, {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task'
      })
      experimentId = experiment.id
    })

    it('should complete a task successfully', async () => {
      const taskData = {
        completed: true,
        date: '2023-12-01T10:00:00Z'
      }

      const task = await experimentsService.completeTask(userId, experimentId, taskData)

      expect(task.id).toBeDefined()
      expect(task.experimentId).toBe(experimentId)
      expect(task.completed).toBe(true)
      expect(task.date).toEqual(new Date('2023-12-01T10:00:00Z'))
    })

    it('should update experiment streaks when completing tasks', async () => {
      // Complete task for day 1
      await experimentsService.completeTask(userId, experimentId, {
        completed: true,
        date: '2023-12-01T10:00:00Z'
      })

      // Complete task for day 2 (consecutive)
      await experimentsService.completeTask(userId, experimentId, {
        completed: true,
        date: '2023-12-02T10:00:00Z'
      })

      const experiment = await experimentsService.getExperimentById(userId, experimentId)
      expect(experiment!.currentStreak).toBe(2)
      expect(experiment!.longestStreak).toBe(2)
      expect(experiment!.totalCompletions).toBe(2)
    })

    it('should reset current streak when missing a day', async () => {
      // Complete tasks for 3 consecutive days
      await experimentsService.completeTask(userId, experimentId, {
        completed: true,
        date: '2023-12-01T10:00:00Z'
      })
      await experimentsService.completeTask(userId, experimentId, {
        completed: true,
        date: '2023-12-02T10:00:00Z'
      })
      await experimentsService.completeTask(userId, experimentId, {
        completed: true,
        date: '2023-12-03T10:00:00Z'
      })

      // Skip day 4, complete day 5
      await experimentsService.completeTask(userId, experimentId, {
        completed: true,
        date: '2023-12-05T10:00:00Z'
      })

      const experiment = await experimentsService.getExperimentById(userId, experimentId)
      expect(experiment!.currentStreak).toBe(1) // reset to 1
      expect(experiment!.longestStreak).toBe(3) // preserves longest
      expect(experiment!.totalCompletions).toBe(4)
    })

    it('should throw error for non-existent experiment', async () => {
      const taskData = {
        completed: true,
        date: '2023-12-01T10:00:00Z'
      }

      await expect(
        experimentsService.completeTask(userId, '123e4567-e89b-12d3-a456-426614174000', taskData)
      ).rejects.toThrow('Experiment not found')
    })
  })

  describe('getExperimentTasks', () => {
    let experimentId: string

    beforeEach(async () => {
      const experiment = await experimentsService.createExperiment(userId, {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task'
      })
      experimentId = experiment.id
    })

    it('should return empty array for experiment with no tasks', async () => {
      const tasks = await experimentsService.getExperimentTasks(userId, experimentId)
      expect(tasks).toEqual([])
    })

    it('should return tasks for experiment', async () => {
      // Create two tasks
      await experimentsService.completeTask(userId, experimentId, {
        completed: true,
        date: '2023-12-01T10:00:00Z'
      })
      await experimentsService.completeTask(userId, experimentId, {
        completed: false,
        date: '2023-12-02T10:00:00Z'
      })

      const tasks = await experimentsService.getExperimentTasks(userId, experimentId)
      expect(tasks).toHaveLength(2)
      expect(tasks[0].completed).toBe(true)
      expect(tasks[1].completed).toBe(false)
    })

    it('should return tasks ordered by date', async () => {
      // Create tasks out of order
      await experimentsService.completeTask(userId, experimentId, {
        completed: true,
        date: '2023-12-03T10:00:00Z'
      })
      await experimentsService.completeTask(userId, experimentId, {
        completed: true,
        date: '2023-12-01T10:00:00Z'
      })
      await experimentsService.completeTask(userId, experimentId, {
        completed: true,
        date: '2023-12-02T10:00:00Z'
      })

      const tasks = await experimentsService.getExperimentTasks(userId, experimentId)
      expect(tasks).toHaveLength(3)
      expect(tasks[0].date).toEqual(new Date('2023-12-01T10:00:00Z'))
      expect(tasks[1].date).toEqual(new Date('2023-12-02T10:00:00Z'))
      expect(tasks[2].date).toEqual(new Date('2023-12-03T10:00:00Z'))
    })

    it('should throw error for non-existent experiment', async () => {
      await expect(
        experimentsService.getExperimentTasks(userId, '123e4567-e89b-12d3-a456-426614174000')
      ).rejects.toThrow('Experiment not found')
    })
  })

  describe('updateExperiment', () => {
    let experimentId: string

    beforeEach(async () => {
      const experiment = await experimentsService.createExperiment(userId, {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task'
      })
      experimentId = experiment.id
    })

    it('should update experiment successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        status: 'paused' as const
      }

      const updated = await experimentsService.updateExperiment(userId, experimentId, updateData)

      expect(updated.title).toBe('Updated Title')
      expect(updated.description).toBe('Updated description')
      expect(updated.status).toBe('paused')
    })

    it('should throw error for non-existent experiment', async () => {
      await expect(
        experimentsService.updateExperiment(userId, '123e4567-e89b-12d3-a456-426614174000', {
          title: 'Updated'
        })
      ).rejects.toThrow('Experiment not found')
    })
  })

  describe('deleteExperiment', () => {
    let experimentId: string

    beforeEach(async () => {
      const experiment = await experimentsService.createExperiment(userId, {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Test task'
      })
      experimentId = experiment.id
    })

    it('should delete experiment successfully', async () => {
      await experimentsService.deleteExperiment(userId, experimentId)

      const experiment = await experimentsService.getExperimentById(userId, experimentId)
      expect(experiment).toBeNull()
    })

    it('should throw error for non-existent experiment', async () => {
      await expect(
        experimentsService.deleteExperiment(userId, '123e4567-e89b-12d3-a456-426614174000')
      ).rejects.toThrow('Experiment not found')
    })
  })
})
