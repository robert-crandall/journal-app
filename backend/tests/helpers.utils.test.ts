import { describe, it, expect } from 'bun:test'
import { 
  formatError, 
  isValidUUID, 
  parseDate, 
  calculateXpForEntry, 
  calculateCompletionRate 
} from '../src/utils/helpers'

describe('Helper Utils', () => {
  describe('formatError', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error message')
      const result = formatError(error)
      expect(result).toBe('Test error message')
    })

    it('should handle non-Error objects', () => {
      const result = formatError('string error')
      expect(result).toBe('An unknown error occurred')
    })

    it('should handle null/undefined', () => {
      expect(formatError(null)).toBe('An unknown error occurred')
      expect(formatError(undefined)).toBe('An unknown error occurred')
    })

    it('should handle objects without message', () => {
      const result = formatError({ code: 500 })
      expect(result).toBe('An unknown error occurred')
    })
  })

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
        '00000000-0000-1000-8000-000000000000',
        'ffffffff-ffff-5fff-bfff-ffffffffffff'
      ]

      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true)
      })
    })

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',  // too short
        '123e4567-e89b-12d3-a456-426614174000-extra', // too long
        '123e4567-e89b-12d3-g456-426614174000', // invalid character
        '123e4567e89b12d3a456426614174000', // no dashes
        '',
        '123e4567-e89b-12d3-a456-42661417400g' // invalid last character
      ]

      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false)
      })
    })
  })

  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      const validDates = [
        '2023-12-01T10:30:00Z',
        '2023-12-01T10:30:00.000Z',
        '2023-12-01',
        'December 1, 2023'
      ]

      validDates.forEach(dateString => {
        const result = parseDate(dateString)
        expect(result).toBeInstanceOf(Date)
        expect(isNaN(result.getTime())).toBe(false)
      })
    })

    it('should throw error for invalid date strings', () => {
      const invalidDates = [
        'not-a-date',
        '2023-13-01', // invalid month
        '2023-12-32', // invalid day
        '',
        'undefined'
      ]

      invalidDates.forEach(dateString => {
        expect(() => parseDate(dateString)).toThrow('Invalid date format')
      })
    })

    it('should handle edge cases', () => {
      // Leap year
      const leapYear = parseDate('2024-02-29')
      expect(leapYear.getFullYear()).toBe(2024)
      expect(leapYear.getMonth()).toBe(1) // 0-indexed
      expect(leapYear.getDate()).toBe(29)

      // End of year
      const endOfYear = parseDate('2023-12-31T23:59:59Z')
      expect(endOfYear.getFullYear()).toBe(2023)
      expect(endOfYear.getMonth()).toBe(11)
      expect(endOfYear.getDate()).toBe(31)
    })
  })

  describe('calculateXpForEntry', () => {
    it('should return consistent XP value', () => {
      const xp = calculateXpForEntry()
      expect(xp).toBe(5)
      expect(typeof xp).toBe('number')
      expect(xp).toBeGreaterThan(0)
    })

    it('should return same value on multiple calls', () => {
      const xp1 = calculateXpForEntry()
      const xp2 = calculateXpForEntry()
      expect(xp1).toBe(xp2)
    })
  })

  describe('calculateCompletionRate', () => {
    it('should calculate correct completion rates', () => {
      expect(calculateCompletionRate(0, 10)).toBe(0)
      expect(calculateCompletionRate(5, 10)).toBe(50)
      expect(calculateCompletionRate(10, 10)).toBe(100)
      expect(calculateCompletionRate(7, 10)).toBe(70)
      expect(calculateCompletionRate(1, 3)).toBe(33)
      expect(calculateCompletionRate(2, 3)).toBe(67)
    })

    it('should handle edge cases', () => {
      expect(calculateCompletionRate(0, 0)).toBe(0)
      expect(calculateCompletionRate(5, 0)).toBe(0)
    })

    it('should handle partial completion', () => {
      expect(calculateCompletionRate(1, 3)).toBe(33)
      expect(calculateCompletionRate(2, 3)).toBe(67)
      expect(calculateCompletionRate(1, 7)).toBe(14)
      expect(calculateCompletionRate(6, 7)).toBe(86)
    })

    it('should round to nearest integer', () => {
      expect(calculateCompletionRate(1, 3)).toBe(33) // 33.33... rounded down
      expect(calculateCompletionRate(2, 3)).toBe(67) // 66.66... rounded up
    })
  })
})
