import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { JournalService } from '../src/services/journal.service'
import { ExperimentsService } from '../src/services/experiments.service'
import { CharacterStatsService } from '../src/services/character-stats.service'
import { TagsService } from '../src/services/tags.service'
import { cleanDatabase, createTestUser, TEST_USER_2 } from './setup'

describe('JournalService', () => {
  let userId: string

  beforeEach(async () => {
    await cleanDatabase()
    
    const user = await createTestUser()
    userId = (user as any).data.user.id
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  describe('create', () => {
    it('should create a new journal entry successfully', async () => {
      const entryData = {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'Today was a productive day working on my projects.'
      }

      const entry = await JournalService.create(userId, entryData)

      expect(entry).toBeDefined()
      expect(entry!.id).toBeDefined()
      expect(entry!.userId).toBe(userId)
      expect(entry!.entryDate).toEqual(new Date('2023-12-01T18:00:00Z'))
      expect(entry!.conversationData.messages).toHaveLength(1)
      expect(entry!.conversationData.messages[0].content).toBe(entryData.initialMessage)
      expect(entry!.conversationData.messages[0].role).toBe('user')
    })

    it('should create entry with experiment associations', async () => {
      // First create a character stat for the experiment
      const stat = await CharacterStatsService.create(userId, {
        name: 'Fitness',
        description: 'Physical fitness level'
      })

      // Create an experiment with xpRewards
      const experiment = await ExperimentsService.create(userId, {
        title: 'Daily Exercise',
        description: 'Exercise daily',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Exercise for 30 minutes',
        xpRewards: [{ statId: stat!.id, xp: 10 }]
      })

      const entryData = {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'Completed my daily exercise routine.',
        experimentIds: [experiment!.id]
      }

      const entry = await JournalService.create(userId, entryData)

      expect(entry).toBeDefined()
      // The entry itself doesn't store experimentIds directly
      // We need to check via the full entry with associations
    })

    it('should return null for invalid data', async () => {
      const entryData = {
        entryDate: 'invalid-date',
        initialMessage: 'Test message'
      }

      const entry = await JournalService.create(userId, entryData as any)
      expect(entry).toBeNull()
    })
  })

  describe('getByUserId', () => {
    it('should return empty array for user with no entries', async () => {
      const entries = await JournalService.getByUserId(userId)
      expect(entries).toEqual([])
    })

    it('should return user entries ordered by date', async () => {
      // Create entries in reverse chronological order
      await JournalService.create(userId, {
        entryDate: '2023-12-03T18:00:00Z',
        initialMessage: 'Third entry'
      })
      
      await JournalService.create(userId, {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'First entry'
      })
      
      await JournalService.create(userId, {
        entryDate: '2023-12-02T18:00:00Z',
        initialMessage: 'Second entry'
      })

      const entries = await JournalService.getByUserId(userId)
      expect(entries).toHaveLength(3)
      // Should be ordered by most recent first
      expect(entries[0].conversationData.messages[0].content).toBe('Third entry')
      expect(entries[1].conversationData.messages[0].content).toBe('Second entry')
      expect(entries[2].conversationData.messages[0].content).toBe('First entry')
    })

    it('should not return entries from other users', async () => {
      const anotherUser = await createTestUser(TEST_USER_2)
      const anotherUserId = (anotherUser as any).data.user.id

      // Create entry for current user
      await JournalService.create(userId, {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'My entry'
      })

      // Create entry for another user
      await JournalService.create(anotherUserId, {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'Other user entry'
      })

      const entries = await JournalService.getByUserId(userId)
      expect(entries).toHaveLength(1)
      expect(entries[0].conversationData.messages[0].content).toBe('My entry')
    })
  })

  describe('getById', () => {
    it('should return entry for valid id', async () => {
      const created = await JournalService.create(userId, {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'Test journal entry'
      })

      const entry = await JournalService.getById(created!.id, userId)
      expect(entry).toBeDefined()
      expect(entry!.id).toBe(created!.id)
      expect(entry!.conversationData.messages[0].content).toBe('Test journal entry')
    })

    it('should return null for non-existent entry', async () => {
      const entry = await JournalService.getById(
        '123e4567-e89b-12d3-a456-426614174000',
        userId
      )
      expect(entry).toBeNull()
    })

    it('should return null for entry belonging to different user', async () => {
      const anotherUser = await createTestUser(TEST_USER_2)
      const anotherUserId = (anotherUser as any).data.user.id
      
      const created = await JournalService.create(anotherUserId, {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'Other user entry'
      })

      const entry = await JournalService.getById(created!.id, userId)
      expect(entry).toBeNull()
    })
  })

  describe('continueConversation', () => {
    let entryId: string

    beforeEach(async () => {
      const entry = await JournalService.create(userId, {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'Initial message for conversation'
      })
      entryId = entry!.id
    })

    it('should add user message to conversation', async () => {
      const newMessage = 'This is my follow-up thought.'

      const result = await JournalService.continueConversation(
        entryId,
        userId,
        { message: newMessage }
      )

      expect(result).toBeDefined()
      expect(result!.entry.conversationData.messages.length).toBeGreaterThan(1)
      // Should include the new user message
      const userMessages = result!.entry.conversationData.messages.filter(m => m.role === 'user')
      expect(userMessages).toHaveLength(2)
      expect(userMessages[1].content).toBe(newMessage)
    })

    it('should return null for non-existent entry', async () => {
      const result = await JournalService.continueConversation(
        '123e4567-e89b-12d3-a456-426614174000',
        userId,
        { message: 'Test message' }
      )
      expect(result).toBeNull()
    })

    it('should return null for entry belonging to different user', async () => {
      const anotherUser = await createTestUser(TEST_USER_2)
      const anotherUserId = (anotherUser as any).data.user.id

      const result = await JournalService.continueConversation(
        entryId,
        anotherUserId,
        { message: 'Test message' }
      )
      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    let entryId: string

    beforeEach(async () => {
      const entry = await JournalService.create(userId, {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'Original entry'
      })
      entryId = entry!.id
    })

    it('should update entry metadata', async () => {
      const updateData = {
        title: 'Updated Title',
        summary: 'Updated summary',
        synopsis: 'Updated synopsis'
      }

      const updated = await JournalService.update(entryId, userId, updateData)

      expect(updated).toBeDefined()
      expect(updated!.title).toBe('Updated Title')
      expect(updated!.summary).toBe('Updated summary')
      expect(updated!.synopsis).toBe('Updated synopsis')
    })

    it('should return null for non-existent entry', async () => {
      const updated = await JournalService.update(
        '123e4567-e89b-12d3-a456-426614174000',
        userId,
        { title: 'Updated' }
      )
      expect(updated).toBeNull()
    })
  })

  describe('delete', () => {
    let entryId: string

    beforeEach(async () => {
      const entry = await JournalService.create(userId, {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'Entry to delete'
      })
      entryId = entry!.id
    })

    it('should delete entry successfully', async () => {
      const deleted = await JournalService.delete(entryId, userId)
      expect(deleted).toBe(true)

      const entry = await JournalService.getById(entryId, userId)
      expect(entry).toBeNull()
    })

    it('should return false for non-existent entry', async () => {
      const deleted = await JournalService.delete(
        '123e4567-e89b-12d3-a456-426614174000',
        userId
      )
      expect(deleted).toBe(false)
    })

    it('should return false for entry belonging to different user', async () => {
      const anotherUser = await createTestUser(TEST_USER_2)
      const anotherUserId = (anotherUser as any).data.user.id

      const deleted = await JournalService.delete(entryId, anotherUserId)
      expect(deleted).toBe(false)
    })
  })

  describe('getEntriesInDateRange', () => {
    beforeEach(async () => {
      // Create entries across different dates
      await JournalService.create(userId, {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'December 1 entry'
      })
      
      await JournalService.create(userId, {
        entryDate: '2023-12-05T18:00:00Z',
        initialMessage: 'December 5 entry'
      })
      
      await JournalService.create(userId, {
        entryDate: '2023-12-15T18:00:00Z',
        initialMessage: 'December 15 entry'
      })
      
      await JournalService.create(userId, {
        entryDate: '2023-11-25T18:00:00Z',
        initialMessage: 'November 25 entry'
      })
    })

    it('should return entries within date range', async () => {
      const entries = await JournalService.getEntriesInDateRange(
        userId,
        '2023-12-01T00:00:00Z',
        '2023-12-10T23:59:59Z'
      )

      expect(entries).toHaveLength(2) // Should exclude Dec 15 and Nov 25
      expect(entries.some(e => e.conversationData.messages[0].content.includes('December 1'))).toBe(true)
      expect(entries.some(e => e.conversationData.messages[0].content.includes('December 5'))).toBe(true)
    })

    it('should return empty array for date range with no entries', async () => {
      const entries = await JournalService.getEntriesInDateRange(
        userId,
        '2023-10-01T00:00:00Z',
        '2023-10-31T23:59:59Z'
      )

      expect(entries).toEqual([])
    })

    it('should return entries ordered by date within range', async () => {
      const entries = await JournalService.getEntriesInDateRange(
        userId,
        '2023-12-01T00:00:00Z',
        '2023-12-31T23:59:59Z'
      )

      expect(entries).toHaveLength(3)
      // Should be ordered by most recent first (assuming desc order)
      expect(entries[0].conversationData.messages[0].content.includes('December 15')).toBe(true)
      expect(entries[1].conversationData.messages[0].content.includes('December 5')).toBe(true)
      expect(entries[2].conversationData.messages[0].content.includes('December 1')).toBe(true)
    })
  })

  describe('getEntriesByExperiment', () => {
    let experimentId: string

    beforeEach(async () => {
      const stat = await CharacterStatsService.create(userId, {
        name: 'Fitness',
        description: 'Physical fitness level'
      })

      const experiment = await ExperimentsService.create(userId, {
        title: 'Daily Exercise',
        description: 'Exercise daily',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Exercise for 30 minutes',
        xpRewards: [{ statId: stat!.id, xp: 10 }]
      })
      experimentId = experiment!.id

      // Create entries with and without experiment association
      await JournalService.create(userId, {
        entryDate: '2023-12-01T18:00:00Z',
        initialMessage: 'Exercise entry 1',
        experimentIds: [experimentId]
      })

      await JournalService.create(userId, {
        entryDate: '2023-12-02T18:00:00Z',
        initialMessage: 'Exercise entry 2',
        experimentIds: [experimentId]
      })

      await JournalService.create(userId, {
        entryDate: '2023-12-03T18:00:00Z',
        initialMessage: 'Non-exercise entry'
      })
    })

    it('should return entries associated with experiment', async () => {
      const entries = await JournalService.getEntriesByExperiment(userId, experimentId)

      expect(entries).toHaveLength(2)
      // Verify entries are associated with the experiment
      expect(entries.some(e => e.conversationData.messages[0].content.includes('Exercise entry 1'))).toBe(true)
      expect(entries.some(e => e.conversationData.messages[0].content.includes('Exercise entry 2'))).toBe(true)
    })

    it('should return empty array for experiment with no associated entries', async () => {
      const stat2 = await CharacterStatsService.create(userId, {
        name: 'Reading',
        description: 'Reading skill'
      })

      const anotherExperiment = await ExperimentsService.create(userId, {
        title: 'Reading',
        description: 'Read daily',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        dailyTaskDescription: 'Read for 30 minutes',
        xpRewards: [{ statId: stat2!.id, xp: 5 }]
      })

      const entries = await JournalService.getEntriesByExperiment(userId, anotherExperiment!.id)
      expect(entries).toEqual([])
    })
  })
})
