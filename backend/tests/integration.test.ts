import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { cleanDatabase, TEST_USER } from './setup'

const BASE_URL = 'http://localhost:3002'

describe('Full Application Flow Integration Test', () => {
  let authToken: string
  let userId: string

  beforeEach(async () => {
    await cleanDatabase()
    
    // Register and login user
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    })
    
    const registerResult = await registerResponse.json() as any
    authToken = registerResult.data.token
    userId = registerResult.data.user.id
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  it('should complete full user journey: auth -> create stats -> create experiment -> create journal', async () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }

    // 1. Create character stats
    const strengthStat = await fetch(`${BASE_URL}/api/character-stats`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Strength',
        description: 'Physical strength and endurance'
      })
    })
    expect(strengthStat.status).toBe(200)
    const strengthResult = await strengthStat.json() as any
    const strengthId = strengthResult.data.id

    const focusStat = await fetch(`${BASE_URL}/api/character-stats`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Focus',
        description: 'Mental concentration ability'
      })
    })
    expect(focusStat.status).toBe(200)
    const focusResult = await focusStat.json() as any
    const focusId = focusResult.data.id

    // 2. Get all character stats
    const getAllStats = await fetch(`${BASE_URL}/api/character-stats`, {
      method: 'GET',
      headers
    })
    expect(getAllStats.status).toBe(200)
    const allStatsResult = await getAllStats.json() as any
    expect(allStatsResult.data).toHaveLength(2)

    // 3. Create an experiment
    const experiment = await fetch(`${BASE_URL}/api/experiments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Daily Exercise Challenge',
        description: 'Exercise for 30 minutes every day',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Complete 30 minutes of exercise'
      })
    })
    expect(experiment.status).toBe(200)
    const experimentResult = await experiment.json() as any
    const experimentId = experimentResult.data.id

    // 4. Complete a daily task
    const completeTask = await fetch(`${BASE_URL}/api/experiments/${experimentId}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        completed: true,
        date: '2023-12-01T10:00:00Z'
      })
    })
    expect(completeTask.status).toBe(200)
    const taskResult = await completeTask.json() as any
    expect(taskResult.data.completed).toBe(true)

    // 5. Get experiment tasks
    const getTasks = await fetch(`${BASE_URL}/api/experiments/${experimentId}/tasks`, {
      method: 'GET',
      headers
    })
    expect(getTasks.status).toBe(200)
    const tasksResult = await getTasks.json() as any
    expect(tasksResult.data).toHaveLength(1)

    // 6. Create content tags
    const workTag = await fetch(`${BASE_URL}/api/tags/content`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'work' })
    })
    expect(workTag.status).toBe(200)

    const exerciseTag = await fetch(`${BASE_URL}/api/tags/content`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'exercise' })
    })
    expect(exerciseTag.status).toBe(200)

    // 7. Get tone tags
    const toneTags = await fetch(`${BASE_URL}/api/tags/tone`, {
      method: 'GET',
      headers
    })
    expect(toneTags.status).toBe(200)
    const toneTagsResult = await toneTags.json() as any
    expect(toneTagsResult.data.length).toBeGreaterThan(0)

    // 8. Create a journal entry
    const journalEntry = await fetch(`${BASE_URL}/api/journal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'Today was a great day! I completed my workout and felt really accomplished.',
        experimentIds: [experimentId]
      })
    })
    expect(journalEntry.status).toBe(200)
    const journalResult = await journalEntry.json() as any
    const journalId = journalResult.data.id

    // 9. Continue the journal conversation
    const continueConversation = await fetch(`${BASE_URL}/api/journal/${journalId}/continue`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: 'I especially enjoyed the strength training part and felt very focused during the workout.'
      })
    })
    expect(continueConversation.status).toBe(200)
    const conversationResult = await continueConversation.json() as any
    expect(conversationResult.data.entry).toBeDefined()

    // 10. Get journal entry with full details
    const getJournalEntry = await fetch(`${BASE_URL}/api/journal/${journalId}`, {
      method: 'GET',
      headers
    })
    expect(getJournalEntry.status).toBe(200)
    const fullJournalResult = await getJournalEntry.json() as any
    expect(fullJournalResult.data.conversationData.messages.length).toBeGreaterThan(1)

    // 11. Get all journal entries
    const getAllJournal = await fetch(`${BASE_URL}/api/journal`, {
      method: 'GET',
      headers
    })
    expect(getAllJournal.status).toBe(200)
    const allJournalResult = await getAllJournal.json() as any
    expect(allJournalResult.data).toHaveLength(1)

    // 12. Update user profile
    const updateProfile = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: 'Updated Test User' })
    })
    expect(updateProfile.status).toBe(200)
    const profileResult = await updateProfile.json() as any
    expect(profileResult.data.name).toBe('Updated Test User')

    // 13. Get user profile
    const getProfile = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers
    })
    expect(getProfile.status).toBe(200)
    const getProfileResult = await getProfile.json() as any
    expect(getProfileResult.data.name).toBe('Updated Test User')
  })

  it('should handle authorization correctly across endpoints', async () => {
    // Test that protected endpoints require authentication
    const protectedEndpoints = [
      { method: 'GET', url: '/api/character-stats' },
      { method: 'POST', url: '/api/character-stats' },
      { method: 'GET', url: '/api/experiments' },
      { method: 'POST', url: '/api/experiments' },
      { method: 'GET', url: '/api/journal' },
      { method: 'POST', url: '/api/journal' },
      { method: 'GET', url: '/api/tags/content' },
      { method: 'POST', url: '/api/tags/content' },
      { method: 'GET', url: '/api/auth/me' }
    ]

    for (const endpoint of protectedEndpoints) {
      const response = await fetch(`${BASE_URL}${endpoint.url}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: endpoint.method === 'POST' ? JSON.stringify({}) : undefined
      })
      
      expect(response.status).toBe(401)
      const result = await response.json() as any
      expect(result.success).toBe(false)
    }
  })

  it('should handle validation errors properly', async () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }

    // Test invalid character stat creation
    const invalidStat = await fetch(`${BASE_URL}/api/character-stats`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '' }) // empty name
    })
    expect(invalidStat.status).toBe(400)

    // Test invalid experiment creation
    const invalidExperiment = await fetch(`${BASE_URL}/api/experiments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Test',
        startDate: 'invalid-date',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Task'
      })
    })
    expect(invalidExperiment.status).toBe(400)

    // Test invalid journal entry creation
    const invalidJournal = await fetch(`${BASE_URL}/api/journal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        entryDate: '2023-12-01T18:00:00Z'
        // missing initialMessage
      })
    })
    expect(invalidJournal.status).toBe(400)
  })

  it('should handle 404 errors for non-existent resources', async () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }

    const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

    // Test getting non-existent character stat
    const getStat = await fetch(`${BASE_URL}/api/character-stats/${nonExistentId}`, {
      method: 'GET',
      headers
    })
    expect(getStat.status).toBe(404)

    // Test getting non-existent experiment
    const getExperiment = await fetch(`${BASE_URL}/api/experiments/${nonExistentId}`, {
      method: 'GET',
      headers
    })
    expect(getExperiment.status).toBe(404)

    // Test getting non-existent journal entry
    const getJournal = await fetch(`${BASE_URL}/api/journal/${nonExistentId}`, {
      method: 'GET',
      headers
    })
    expect(getJournal.status).toBe(404)
  })
})
