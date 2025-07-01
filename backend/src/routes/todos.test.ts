import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, tasks } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

describe('Simple Todos API Integration Tests - Task 3.8', () => {
  let testUserId: string
  let testCharacterId: string
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupTaskIds: string[] = []

  beforeEach(async () => {
    // Create test user
    const testUserData = await createTestUser({
      email: `test-todos-${Date.now()}@example.com`,
      name: 'Test User',
      timezone: 'UTC'
    })
    testUserId = testUserData.user.id
    cleanupUserIds.push(testUserId)

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Character',
      class: 'Ranger',
      backstory: 'Test backstory for todos testing'
    }).returning()
    testCharacterId = character.id
    cleanupCharacterIds.push(testCharacterId)

    // Create test character stats
    await db.insert(characterStats).values([
      {
        characterId: testCharacterId,
        category: 'Adventure Spirit',
        description: 'Test stat for validation',
        currentXp: 100,
        currentLevel: 1,
        totalXp: 100
      }
    ])
  })

  afterEach(async () => {
    // Clean up test data
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasks).where(eq(tasks.id, taskId))
    }
    for (const characterId of cleanupCharacterIds) {
      await db.delete(characterStats).where(eq(characterStats.characterId, characterId))
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  describe('Todo Creation', () => {
    it('should create simple todo without XP integration', async () => {
      const todoData = {
        userId: testUserId,
        title: 'Buy groceries',
        description: 'Weekly grocery shopping'
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.todo).toBeDefined()
      
      const todo = result.data.todo
      expect(todo.title).toBe('Buy groceries')
      expect(todo.description).toBe('Weekly grocery shopping')
      expect(todo.source).toBe('todo')
      expect(todo.sourceId).toBeNull()
      expect(todo.targetStats).toBeNull()
      expect(todo.estimatedXp).toBe(0)
      expect(todo.status).toBe('pending')
      expect(todo.userId).toBe(testUserId)
      
      cleanupTaskIds.push(todo.id)
    })

    it('should validate required fields for todo creation', async () => {
      const invalidTodoData = {
        userId: testUserId,
        // Missing title
        description: 'Test description'
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidTodoData)
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error.issues).toBeDefined()
      expect(result.error.issues[0].path).toContain('title')
    })

    it('should validate user exists for todo creation', async () => {
      const todoData = {
        userId: '00000000-0000-0000-0000-000000000000',
        title: 'Test todo',
        description: 'Test description'
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData)
      })

      expect(response.status).toBe(403)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized: User not found')
    })

    it('should reject XP-related fields in todo creation', async () => {
      const todoData = {
        userId: testUserId,
        title: 'Test todo',
        description: 'Test description',
        estimatedXp: 25, // Should be ignored/rejected
        targetStats: ['Adventure Spirit'] // Should be ignored/rejected
      }

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      const todo = result.data.todo
      
      // XP and stat fields should be forced to safe values
      expect(todo.estimatedXp).toBe(0)
      expect(todo.targetStats).toBeNull()
      
      cleanupTaskIds.push(todo.id)
    })
  })

  describe('Todo Listing', () => {
    beforeEach(async () => {
      // Create test todos with different statuses
      const todosToCreate = [
        {
          userId: testUserId,
          title: 'Pending todo',
          description: 'Test pending todo',
          source: 'todo',
          estimatedXp: 0,
          status: 'pending'
        },
        {
          userId: testUserId,
          title: 'Completed todo',
          description: 'Test completed todo',
          source: 'todo',
          estimatedXp: 0,
          status: 'completed',
          completedAt: new Date()
        },
        {
          userId: testUserId,
          title: 'Skipped todo',
          description: 'Test skipped todo',
          source: 'todo',
          estimatedXp: 0,
          status: 'skipped'
        }
      ]

      for (const todoData of todosToCreate) {
        const [todo] = await db.insert(tasks).values(todoData).returning()
        cleanupTaskIds.push(todo.id)
      }
    })

    it('should list all todos for a user', async () => {
      const response = await app.request(`/api/todos?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.todos).toBeDefined()
      expect(Array.isArray(result.data.todos)).toBe(true)
      expect(result.data.todos.length).toBe(3)
      
      // All todos should have source 'todo'
      expect(result.data.todos.every((todo: any) => todo.source === 'todo')).toBe(true)
      
      // All todos should have 0 XP and no target stats
      expect(result.data.todos.every((todo: any) => todo.estimatedXp === 0)).toBe(true)
      expect(result.data.todos.every((todo: any) => todo.targetStats === null)).toBe(true)
    })

    it('should filter todos by status', async () => {
      // Test pending filter
      const pendingResponse = await app.request(`/api/todos?userId=${testUserId}&status=pending`, {
        method: 'GET'
      })

      expect(pendingResponse.status).toBe(200)
      const pendingResult = await pendingResponse.json()
      expect(pendingResult.success).toBe(true)
      expect(pendingResult.data.todos.length).toBe(1)
      expect(pendingResult.data.todos[0].status).toBe('pending')

      // Test completed filter
      const completedResponse = await app.request(`/api/todos?userId=${testUserId}&status=completed`, {
        method: 'GET'
      })

      expect(completedResponse.status).toBe(200)
      const completedResult = await completedResponse.json()
      expect(completedResult.success).toBe(true)
      expect(completedResult.data.todos.length).toBe(1)
      expect(completedResult.data.todos[0].status).toBe('completed')
    })

    it('should provide summary statistics for todos', async () => {
      const response = await app.request(`/api/todos?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.summary).toBeDefined()
      
      const summary = result.data.summary
      expect(summary.totalTodos).toBe(3)
      expect(summary.pendingTodos).toBe(1)
      expect(summary.completedTodos).toBe(1)
      expect(summary.skippedTodos).toBe(1)
      expect(summary.completionRate).toBe(33) // 1 completed out of 3 total
    })
  })

  describe('Todo Updates', () => {
    let testTodoId: string

    beforeEach(async () => {
      const [todo] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Test todo for updates',
        description: 'Test description',
        source: 'todo',
        estimatedXp: 0,
        status: 'pending'
      }).returning()
      testTodoId = todo.id
      cleanupTaskIds.push(testTodoId)
    })

    it('should update todo properties', async () => {
      const updateData = {
        userId: testUserId,
        title: 'Updated todo title',
        description: 'Updated description'
      }

      const response = await app.request(`/api/todos/${testTodoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.todo.title).toBe('Updated todo title')
      expect(result.data.todo.description).toBe('Updated description')
      expect(result.data.todo.source).toBe('todo')
      expect(result.data.todo.estimatedXp).toBe(0)
    })

    it('should mark todo as completed', async () => {
      const updateData = {
        userId: testUserId,
        status: 'completed'
      }

      const response = await app.request(`/api/todos/${testTodoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.todo.status).toBe('completed')
      expect(result.data.todo.completedAt).toBeDefined()
    })

    it('should reject XP-related fields in todo updates', async () => {
      const updateData = {
        userId: testUserId,
        title: 'Updated title',
        estimatedXp: 50, // Should be ignored
        targetStats: ['Adventure Spirit'] // Should be ignored
      }

      const response = await app.request(`/api/todos/${testTodoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.todo.title).toBe('Updated title')
      // XP fields should remain unchanged
      expect(result.data.todo.estimatedXp).toBe(0)
      expect(result.data.todo.targetStats).toBeNull()
    })
  })

  describe('Todo Deletion', () => {
    let testTodoId: string

    beforeEach(async () => {
      const [todo] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Test todo for deletion',
        description: 'Test description',
        source: 'todo',
        estimatedXp: 0,
        status: 'pending'
      }).returning()
      testTodoId = todo.id
      cleanupTaskIds.push(testTodoId)
    })

    it('should delete todo successfully', async () => {
      const response = await app.request(`/api/todos/${testTodoId}?userId=${testUserId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.message).toBe('Todo deleted successfully')

      // Verify todo was deleted
      const verifyResponse = await app.request(`/api/todos/${testTodoId}?userId=${testUserId}`, {
        method: 'GET'
      })
      expect(verifyResponse.status).toBe(404)
    })

    it('should handle non-existent todo deletion', async () => {
      const response = await app.request(`/api/todos/00000000-0000-0000-0000-000000000000?userId=${testUserId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Todo not found')
    })
  })

  describe('Dashboard Integration', () => {
    it('should include todos in dashboard API', async () => {
      // Create a todo
      const [todo] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Dashboard todo test',
        description: 'Should appear on dashboard',
        source: 'todo',
        estimatedXp: 0,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(todo.id)

      // Check dashboard API includes todos
      const response = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      
      const todoTasks = result.data.tasks.filter((task: any) => task.source === 'todo')
      expect(todoTasks.length).toBe(1)
      expect(todoTasks[0].title).toBe('Dashboard todo test')
      expect(todoTasks[0].estimatedXp).toBe(0)
    })

    it('should differentiate todos from other task types on dashboard', async () => {
      // Create different task types for comparison
      const tasksToCreate = [
        {
          userId: testUserId,
          title: 'AI generated task',
          source: 'ai',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 30,
          status: 'pending'
        },
        {
          userId: testUserId,
          title: 'Simple todo',
          source: 'todo',
          estimatedXp: 0,
          status: 'pending'
        }
      ]

      for (const taskData of tasksToCreate) {
        const [task] = await db.insert(tasks).values(taskData).returning()
        cleanupTaskIds.push(task.id)
      }

      const response = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      
      const aiTask = result.data.tasks.find((task: any) => task.source === 'ai')
      const todoTask = result.data.tasks.find((task: any) => task.source === 'todo')
      
      expect(aiTask).toBeDefined()
      expect(todoTask).toBeDefined()
      
      // AI task should have XP and stats
      expect(aiTask.estimatedXp).toBe(30)
      expect(aiTask.targetStats).toEqual(['Adventure Spirit'])
      
      // Todo should have no XP and no stats
      expect(todoTask.estimatedXp).toBe(0)
      expect(todoTask.targetStats).toBeNull()
    })
  })

  describe('Todo Completion Without XP', () => {
    let testTodoId: string

    beforeEach(async () => {
      const [todo] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Test todo for completion',
        description: 'Test description',
        source: 'todo',
        estimatedXp: 0,
        status: 'pending'
      }).returning()
      testTodoId = todo.id
      cleanupTaskIds.push(testTodoId)
    })

    it('should complete todo without XP awards or notifications', async () => {
      const response = await app.request(`/api/tasks/${testTodoId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          // No feedback should be required for todos
          actualXp: 0,
          statAwards: {}
        })
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.task.status).toBe('completed')
      expect(result.data.taskCompletion).toBeDefined()
      
      // Should not require feedback
      expect(result.data.feedbackRequired).toBe(false)
      
      // Should have no XP notifications
      expect(result.data.xpNotifications).toEqual([])
      
      // Should have minimal display duration
      expect(result.data.displayDuration).toBe(1000) // 1 second for simple completion
    })
  })

  describe('System Integration', () => {
    it('should exclude todos from AI context generation', async () => {
      // This is a placeholder test - when AI context generation is implemented,
      // todos should not be included in the context passed to GPT
      const [todo] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Todo for AI context test',
        description: 'Should not influence AI generation',
        source: 'todo',
        estimatedXp: 0,
        status: 'pending'
      }).returning()
      cleanupTaskIds.push(todo.id)

      // For now, just verify the todo was created with correct properties
      expect(todo.source).toBe('todo')
      expect(todo.estimatedXp).toBe(0)
      expect(todo.targetStats).toBeNull()
    })

    it('should support todos alongside other task types', async () => {
      // Create various task types to ensure todos coexist properly
      const tasksToCreate = [
        {
          userId: testUserId,
          title: 'AI task',
          source: 'ai',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 25,
          status: 'pending'
        },
        {
          userId: testUserId,
          title: 'Simple todo',
          source: 'todo',
          estimatedXp: 0,
          status: 'pending'
        },
        {
          userId: testUserId,
          title: 'Ad-hoc task',
          source: 'ad-hoc',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 20,
          status: 'pending'
        }
      ]

      for (const taskData of tasksToCreate) {
        const [task] = await db.insert(tasks).values(taskData).returning()
        cleanupTaskIds.push(task.id)
      }

      // Verify all tasks exist and have correct properties
      const todosResponse = await app.request(`/api/todos?userId=${testUserId}`, {
        method: 'GET'
      })
      expect(todosResponse.status).toBe(200)
      
      const dashboardResponse = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })
      expect(dashboardResponse.status).toBe(200)
      
      const dashboardResult = await dashboardResponse.json()
      
      // Dashboard should include AI and todo tasks, but not ad-hoc
      const taskSources = dashboardResult.data.tasks.map((task: any) => task.source)
      expect(taskSources).toContain('ai')
      expect(taskSources).toContain('todo')
      expect(taskSources).not.toContain('ad-hoc')
    })
  })
})
