import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, tasks, taskCompletions } from '../db/schema'
import { eq } from 'drizzle-orm'

describe('Task Completion Debug', () => {
  let testUserId: string
  let testCharacterId: string
  let testStatId: string
  let testTaskId: string

  beforeEach(async () => {
    // Create test user
    const [user] = await db.insert(users).values({
      email: `test-completion-${Date.now()}@example.com`,
      name: 'Test User',
      timezone: 'UTC'
    }).returning()
    testUserId = user.id

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Hero',
      class: 'Warrior',
      backstory: 'A brave warrior on their journey'
    }).returning()
    testCharacterId = character.id

    // Create test character stat
    const [stat] = await db.insert(characterStats).values({
      characterId: testCharacterId,
      category: 'Physical Health',
      currentXp: 50,
      currentLevel: 1,
      totalXp: 50,
      description: 'Track physical fitness activities'
    }).returning()
    testStatId = stat.id

    // Create test task
    const [task] = await db.insert(tasks).values({
      userId: testUserId,
      title: 'Complete workout routine',
      description: 'Do 30 minutes of exercise',
      source: 'ai',
      targetStats: ['Physical Health'],
      estimatedXp: 25,
      status: 'pending'
    }).returning()
    testTaskId = task.id
  })

  afterEach(async () => {
    // Clean up test data
    await db.delete(taskCompletions).where(eq(taskCompletions.userId, testUserId))
    await db.delete(tasks).where(eq(tasks.userId, testUserId))
    await db.delete(characterStats).where(eq(characterStats.characterId, testCharacterId))
    await db.delete(characters).where(eq(characters.id, testCharacterId))
    await db.delete(users).where(eq(users.id, testUserId))
  })

  it('should debug task completion error', async () => {
    const completionData = {
      userId: testUserId,
      actualXp: 30,
      statAwards: {
        'Physical Health': 30
      },
      feedback: 'Great workout!'
    }

    const response = await app.request(`/api/tasks/${testTaskId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completionData),
    })

    console.log('Response status:', response.status)
    const result = await response.json()
    console.log('Response body:', JSON.stringify(result, null, 2))

    expect(response.status).toBe(200)
  })
})
