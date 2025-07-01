import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, quests, tasks } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

describe('Task Source Debug Test', () => {
  let testUserId: string
  let testCharacterId: string
  let testQuestId: string
  
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupQuestIds: string[] = []
  const cleanupTaskIds: string[] = []

  beforeEach(async () => {
    // Create test user
    const testUserData = await createTestUser({
      email: `test-debug-${Date.now()}@example.com`,
      name: 'Debug Test User',
      timezone: 'UTC'
    })
    testUserId = testUserData.user.id
    cleanupUserIds.push(testUserId)

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Debug Hero',
      class: 'Debugger',
      backstory: 'A hero who debugs code'
    }).returning()
    testCharacterId = character.id
    cleanupCharacterIds.push(testCharacterId)

    // Create test quest
    const questResponse = await app.request('/api/quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        title: 'Debug Quest',
        description: 'A quest for debugging',
        hypothesis: 'We can debug this issue',
        startDate: new Date().toISOString(),
        duration: 7
      })
    })
    expect(questResponse.status).toBe(201)
    const questResult = await questResponse.json()
    testQuestId = questResult.data.quest.id
    cleanupQuestIds.push(testQuestId)
  })

  afterEach(async () => {
    // Cleanup
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasks).where(eq(tasks.id, taskId))
    }
    for (const questId of cleanupQuestIds) {
      await db.delete(quests).where(eq(quests.id, questId))
    }
    await db.delete(characterStats).where(eq(characterStats.characterId, testCharacterId))
    for (const characterId of cleanupCharacterIds) {
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }

    // Reset cleanup arrays
    cleanupTaskIds.length = 0
    cleanupQuestIds.length = 0
  })

  it('should create quest task with correct source', async () => {
    console.log('Creating quest task...')
    
    // Create task via API
    const taskResponse = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        title: 'Debug Quest Task',
        description: 'Task for debugging quest source',
        source: 'quest',
        sourceId: testQuestId,
        targetStats: ['Adventure Spirit'],
        estimatedXp: 25
      })
    })
    
    console.log('Task creation response status:', taskResponse.status)
    expect(taskResponse.status).toBe(201)
    
    const taskResult = await taskResponse.json()
    console.log('Task creation result:', JSON.stringify(taskResult, null, 2))
    
    const taskId = taskResult.data.id
    cleanupTaskIds.push(taskId)
    
    // Check what's actually in the database
    const [dbTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
    
    console.log('Database task:', JSON.stringify(dbTask, null, 2))
    expect(dbTask.source).toBe('quest')
    expect(dbTask.sourceId).toBe(testQuestId)
    
    // Retrieve via API
    const getResponse = await app.request(`/api/tasks/${taskId}?userId=${testUserId}`)
    console.log('Task retrieval response status:', getResponse.status)
    expect(getResponse.status).toBe(200)
    
    const getResult = await getResponse.json()
    console.log('Task retrieval result:', JSON.stringify(getResult, null, 2))
    
    expect(getResult.data.source).toBe('quest')
    expect(getResult.data.sourceId).toBe(testQuestId)
  })
})
