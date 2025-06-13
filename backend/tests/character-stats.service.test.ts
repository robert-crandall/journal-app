import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { CharacterStatsService } from '../src/services/character-stats.service'
import { AuthService } from '../src/services/auth.service'
import { cleanDatabase, TEST_USER, NON_EXISTENT_UUID } from './setup'

describe('CharacterStatsService', () => {
  let userId: string

  beforeEach(async () => {
    await cleanDatabase()
    const result = await AuthService.register(TEST_USER)
    userId = result.data!.user.id
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  describe('create', () => {
    it('should successfully create a character stat', async () => {
      const statData = {
        name: 'Strength',
        description: 'Physical strength and endurance'
      }

      const stat = await CharacterStatsService.create(userId, statData)

      expect(stat).toBeDefined()
      expect(stat?.name).toBe(statData.name)
      expect(stat?.description).toBe(statData.description)
      expect(stat?.currentXp).toBe(0)
      expect(stat?.userId).toBe(userId)
    })

    it('should create stat without description', async () => {
      const statData = {
        name: 'Intelligence'
      }

      const stat = await CharacterStatsService.create(userId, statData)

      expect(stat).toBeDefined()
      expect(stat?.name).toBe(statData.name)
      expect(stat?.description).toBeNull()
    })
  })

  describe('getByUserId', () => {
    beforeEach(async () => {
      // Create some test stats
      await CharacterStatsService.create(userId, { name: 'Strength', description: 'Physical power' })
      await CharacterStatsService.create(userId, { name: 'Intelligence', description: 'Mental acuity' })
      await CharacterStatsService.create(userId, { name: 'Charisma' })
    })

    it('should get all stats for a user', async () => {
      const stats = await CharacterStatsService.getByUserId(userId)

      expect(stats).toHaveLength(3)
      expect(stats.map(s => s.name).sort()).toEqual(['Charisma', 'Intelligence', 'Strength'])
      expect(stats.every(s => s.userId === userId)).toBe(true)
    })

    it('should return empty array for user with no stats', async () => {
      const newUserResult = await AuthService.register({
        email: 'newuser@example.com',
        password: 'password123'
      })
      const newUserId = newUserResult.data!.user.id

      const stats = await CharacterStatsService.getByUserId(newUserId)
      expect(stats).toHaveLength(0)
    })
  })

  describe('getById', () => {
    let statId: string

    beforeEach(async () => {
      const stat = await CharacterStatsService.create(userId, {
        name: 'Wisdom',
        description: 'Ancient knowledge'
      })
      statId = stat!.id
    })

    it('should get stat by id for correct user', async () => {
      const stat = await CharacterStatsService.getById(statId, userId)

      expect(stat).toBeDefined()
      expect(stat?.name).toBe('Wisdom')
      expect(stat?.description).toBe('Ancient knowledge')
    })

    it('should return null for wrong user', async () => {
      const otherUserResult = await AuthService.register({
        email: 'other@example.com',
        password: 'password123'
      })
      const otherUserId = otherUserResult.data!.user.id

      const stat = await CharacterStatsService.getById(statId, otherUserId)
      expect(stat).toBe(null)
    })

    it('should return null for non-existent stat', async () => {
      const stat = await CharacterStatsService.getById(NON_EXISTENT_UUID, userId)
      expect(stat).toBe(null)
    })
  })

  describe('update', () => {
    let statId: string

    beforeEach(async () => {
      const stat = await CharacterStatsService.create(userId, {
        name: 'Dexterity',
        description: 'Hand-eye coordination'
      })
      statId = stat!.id
    })

    it('should update stat name', async () => {
      const updatedStat = await CharacterStatsService.update(statId, userId, {
        name: 'Agility'
      })

      expect(updatedStat).toBeDefined()
      expect(updatedStat?.name).toBe('Agility')
      expect(updatedStat?.description).toBe('Hand-eye coordination')
    })

    it('should update stat description', async () => {
      const updatedStat = await CharacterStatsService.update(statId, userId, {
        description: 'Speed and reflexes'
      })

      expect(updatedStat).toBeDefined()
      expect(updatedStat?.name).toBe('Dexterity')
      expect(updatedStat?.description).toBe('Speed and reflexes')
    })

    it('should update both name and description', async () => {
      const updatedStat = await CharacterStatsService.update(statId, userId, {
        name: 'Agility',
        description: 'Speed and reflexes'
      })

      expect(updatedStat).toBeDefined()
      expect(updatedStat?.name).toBe('Agility')
      expect(updatedStat?.description).toBe('Speed and reflexes')
    })

    it('should return null for wrong user', async () => {
      const otherUserResult = await AuthService.register({
        email: 'other@example.com',
        password: 'password123'
      })
      const otherUserId = otherUserResult.data!.user.id

      const result = await CharacterStatsService.update(statId, otherUserId, {
        name: 'New Name'
      })

      expect(result).toBe(null)
    })
  })

  describe('delete', () => {
    let statId: string

    beforeEach(async () => {
      const stat = await CharacterStatsService.create(userId, {
        name: 'Constitution',
        description: 'Health and stamina'
      })
      statId = stat!.id
    })

    it('should delete stat for correct user', async () => {
      const result = await CharacterStatsService.delete(statId, userId)
      expect(result).toBe(true)

      // Verify it's deleted
      const stat = await CharacterStatsService.getById(statId, userId)
      expect(stat).toBe(null)
    })

    it('should return false for wrong user', async () => {
      const otherUserResult = await AuthService.register({
        email: 'other@example.com',
        password: 'password123'
      })
      const otherUserId = otherUserResult.data!.user.id

      const result = await CharacterStatsService.delete(statId, otherUserId)
      expect(result).toBe(false)

      // Verify it's not deleted
      const stat = await CharacterStatsService.getById(statId, userId)
      expect(stat).toBeDefined()
    })

    it('should return false for non-existent stat', async () => {
      const result = await CharacterStatsService.delete(NON_EXISTENT_UUID, userId)
      expect(result).toBe(false)
    })
  })

  describe('addXp', () => {
    let statId: string

    beforeEach(async () => {
      const stat = await CharacterStatsService.create(userId, {
        name: 'Focus',
        description: 'Concentration ability'
      })
      statId = stat!.id
    })

    it('should add XP to stat', async () => {
      const result = await CharacterStatsService.addXp(statId, 10)
      expect(result).toBe(true)

      // Verify XP was added
      const stat = await CharacterStatsService.getById(statId, userId)
      expect(stat?.currentXp).toBe(10)
    })

    it('should accumulate XP over multiple additions', async () => {
      await CharacterStatsService.addXp(statId, 5)
      await CharacterStatsService.addXp(statId, 7)
      await CharacterStatsService.addXp(statId, 3)

      const stat = await CharacterStatsService.getById(statId, userId)
      expect(stat?.currentXp).toBe(15)
    })

    it('should return false for non-existent stat', async () => {
      const result = await CharacterStatsService.addXp(NON_EXISTENT_UUID, 10)
      expect(result).toBe(false)
    })
  })
})
