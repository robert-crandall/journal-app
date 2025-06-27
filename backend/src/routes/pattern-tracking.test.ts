import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { 
  users, 
  characters, 
  characterStats, 
  tasks, 
  taskCompletions,
  taskCompletionPatterns,
  taskCompletionEvents,
  patternInsights
} from '../db/schema'
import { eq, and } from 'drizzle-orm'

// Generate UUIDs using crypto.randomUUID()
function generateUUID(): string {
  return crypto.randomUUID()
}

describe('Pattern Tracking API Integration Tests - Task 3.10', () => {
  let testUserId: string
  let testCharacterId: string
  let testTaskId: string
  
  // Cleanup arrays
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupTaskIds: string[] = []
  const cleanupCompletionIds: string[] = []

  beforeAll(async () => {
    console.log('Setting up pattern tracking integration tests...')
    
    // Create test user
    const [user] = await db.insert(users).values({
      id: generateUUID(),
      email: 'pattern-test@example.com',
      name: 'Pattern Test User',
      timezone: 'UTC'
    }).returning()
    
    testUserId = user.id
    cleanupUserIds.push(user.id)
    
    // Create test character
    const [character] = await db.insert(characters).values({
      id: generateUUID(),
      userId: testUserId,
      name: 'Pattern Hero',
      class: 'Data Analyst',
      backstory: 'A character who loves patterns and data'
    }).returning()
    
    testCharacterId = character.id
    cleanupCharacterIds.push(character.id)
    
    // Create character stats
    const statCategories = ['Physical Health', 'Mental Health', 'Social Connection', 'Personal Growth']
    for (const category of statCategories) {
      await db.insert(characterStats).values({
        id: generateUUID(),
        characterId: testCharacterId,
        category,
        currentXp: 0,
        currentLevel: 1,
        totalXp: 0
      })
    }
    
    // Create test task
    const [task] = await db.insert(tasks).values({
      id: generateUUID(),
      userId: testUserId,
      title: 'Test Pattern Task',
      description: 'A task for testing pattern tracking',
      source: 'ai',
      targetStats: ['Physical Health', 'Mental Health'],
      estimatedXp: 50,
      status: 'pending'
    }).returning()
    
    testTaskId = task.id
    cleanupTaskIds.push(task.id)
  })

  beforeEach(async () => {
    // Clean up any previous test data
    await db.delete(patternInsights).where(eq(patternInsights.userId, testUserId))
    await db.delete(taskCompletionEvents).where(eq(taskCompletionEvents.userId, testUserId))
    await db.delete(taskCompletionPatterns).where(eq(taskCompletionPatterns.userId, testUserId))
  })

  afterAll(async () => {
    console.log('Cleaning up pattern tracking test data...')
    
    // Delete in dependency order
    await db.delete(patternInsights).where(eq(patternInsights.userId, testUserId))
    await db.delete(taskCompletionEvents).where(eq(taskCompletionEvents.userId, testUserId))
    await db.delete(taskCompletionPatterns).where(eq(taskCompletionPatterns.userId, testUserId))
    
    for (const completionId of cleanupCompletionIds) {
      await db.delete(taskCompletions).where(eq(taskCompletions.id, completionId))
    }
    
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

  test('should record pattern tracking event when task is completed', async () => {
    // Complete the task which should trigger pattern tracking
    const response = await app.request(`/api/tasks/${testTaskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        actualXp: 50,
        statAwards: { 'Physical Health': 25, 'Mental Health': 25 },
        feedback: 'Great task! I enjoyed this pattern tracking test.'
      })
    })
    
    expect(response.status).toBe(200)
    const result = await response.json()
    
    if (!result.success) {
      console.error('Task completion failed:', result)
    }
    
    expect(result.success).toBe(true)
    
    // Store completion ID for cleanup
    cleanupCompletionIds.push(result.data.taskCompletion.id)
    
    // Verify pattern tracking event was recorded
    const events = await db.select()
      .from(taskCompletionEvents)
      .where(eq(taskCompletionEvents.userId, testUserId))
    
    expect(events).toHaveLength(1)
    const event = events[0]
    
    expect(event.taskId).toBe(testTaskId)
    expect(event.eventType).toBe('completed')
    expect(event.taskSource).toBe('ai')
    expect(event.xpAwarded).toBe(50)
    
    // Check sentiment if it exists (can be null for simple feedback)
    if (event.feedbackSentiment !== null) {
      expect(parseFloat(event.feedbackSentiment)).toBeGreaterThan(0)
    }
    
    expect(event.timeOfDay).toMatch(/^(morning|afternoon|evening|night)$/)
    expect(event.dayOfWeek).toMatch(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)
  })

  test('should get AI learning context with patterns and insights', async () => {
    // Create a new task for this test
    const [newTask] = await db.insert(tasks).values({
      id: generateUUID(),
      userId: testUserId,
      title: 'AI Context Test Task',
      description: 'A task for testing AI context generation',
      source: 'ai',
      targetStats: ['Physical Health', 'Mental Health'],
      estimatedXp: 50,
      status: 'pending'
    }).returning()
    
    cleanupTaskIds.push(newTask.id)
    
    // Complete the task to generate some data
    const response = await app.request(`/api/tasks/${newTask.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        actualXp: 50,
        statAwards: { 'Physical Health': 25, 'Mental Health': 25 },
        feedback: 'I really enjoy morning workouts!'
      })
    })
    
    const result = await response.json()
    
    if (!result.success) {
      console.error('Task completion failed:', result)
    }
    
    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    
    cleanupCompletionIds.push(result.data.taskCompletion.id)
    
    // Get AI learning context
    const contextResponse = await app.request(`/api/patterns/ai-context?userId=${testUserId}`, {
      method: 'GET'
    })
    
    expect(contextResponse.status).toBe(200)
    const contextResult = await contextResponse.json()
    expect(contextResult.success).toBe(true)
    
    const context = contextResult.data
    expect(context).toHaveProperty('patterns')
    expect(context).toHaveProperty('insights')
    expect(context).toHaveProperty('preferences')
    expect(context).toHaveProperty('avoidances')
    expect(context).toHaveProperty('taskHistory')
    
    expect(context.patterns).toBeInstanceOf(Array)
    expect(context.taskHistory.totalCompletions).toBeGreaterThanOrEqual(1)
    expect(context.taskHistory.averageXp).toBeGreaterThan(0)
  })

  test('should record pattern tracking event directly via API', async () => {
    const response = await app.request('/api/patterns/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        taskId: testTaskId,
        eventType: 'completed',
        taskSource: 'ai',
        xpAwarded: 50,
        feedback: 'Direct API test feedback'
      })
    })
    
    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result.success).toBe(true)
    expect(result.message).toBe('Task completion event recorded successfully')
    
    // Verify event was recorded
    const events = await db.select()
      .from(taskCompletionEvents)
      .where(eq(taskCompletionEvents.userId, testUserId))
    
    expect(events).toHaveLength(1)
    expect(events[0].eventType).toBe('completed')
    expect(events[0].taskSource).toBe('ai')
  })

  test('should get patterns summary with statistics', async () => {
    // Create a new task for this test
    const [newTask] = await db.insert(tasks).values({
      id: generateUUID(),
      userId: testUserId,
      title: 'Summary Test Task',
      description: 'A task for testing pattern summary',
      source: 'ai',
      targetStats: ['Physical Health'],
      estimatedXp: 50,
      status: 'pending'
    }).returning()
    
    cleanupTaskIds.push(newTask.id)
    
    // Complete the task to have some data
    const response = await app.request(`/api/tasks/${newTask.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        actualXp: 50,
        statAwards: { 'Physical Health': 50 },
        feedback: 'Great task!'
      })
    })
    
    const result = await response.json()
    
    if (!result.success) {
      console.error('Task completion failed:', result)
    }
    
    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    
    cleanupCompletionIds.push(result.data.taskCompletion.id)
    
    // Get patterns summary
    const summaryResponse = await app.request(`/api/patterns?userId=${testUserId}`, {
      method: 'GET'
    })
    
    expect(summaryResponse.status).toBe(200)
    const summaryResult = await summaryResponse.json()
    expect(summaryResult.success).toBe(true)
    
    const data = summaryResult.data
    expect(data).toHaveProperty('summary')
    expect(data).toHaveProperty('recentPatterns')
    expect(data).toHaveProperty('activeInsights')
    
    expect(typeof data.summary.recentEvents).toBe('number')
    expect(data.summary.recentEvents).toBeGreaterThanOrEqual(1)
    expect(data.recentPatterns).toBeInstanceOf(Array)
    expect(data.activeInsights).toBeInstanceOf(Array)
  })

  test('should handle invalid user ID gracefully', async () => {
    const invalidUserId = generateUUID()
    
    // Try to record event with invalid user
    const response = await app.request('/api/patterns/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: invalidUserId,
        taskId: testTaskId,
        eventType: 'completed',
        taskSource: 'ai',
        xpAwarded: 50
      })
    })
    
    expect(response.status).toBe(404)
    const result = await response.json()
    expect(result.success).toBe(false)
    expect(result.message).toBe('User not found')
  })
})
