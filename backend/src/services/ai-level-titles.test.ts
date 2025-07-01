import { describe, test, expect } from 'vitest'
import { generateLevelTitle } from './ai-level-titles'

describe('AI Level Title Generation Integration Tests', () => {
  test('should generate humorous title for Physical Health stat progression', async () => {
    const title = await generateLevelTitle({
      statCategory: 'Physical Health',
      newLevel: 2,
      characterClass: 'Life Explorer',
      characterBackstory: 'A curious adventurer seeking balance between outdoor exploration and family time'
    })

    expect(typeof title).toBe('string')
    expect(title.length).toBeGreaterThan(0)
    expect(title.length).toBeLessThanOrEqual(50) // Reasonable title length
    
    // Should be humorous and contextual - just verify it's not empty or generic
    expect(title.toLowerCase()).not.toBe('level 2')
    expect(title).not.toMatch(/^level \d+$/i)
  })

  test('should generate different titles for different stat categories', async () => {
    const physicalTitle = await generateLevelTitle({
      statCategory: 'Physical Health',
      newLevel: 3,
      characterClass: 'Wellness Champion',
      characterBackstory: 'Focused on maintaining peak physical condition'
    })

    const mentalTitle = await generateLevelTitle({
      statCategory: 'Mental Wellness',
      newLevel: 3,
      characterClass: 'Wellness Champion', 
      characterBackstory: 'Focused on maintaining peak physical condition'
    })

    expect(physicalTitle).not.toBe(mentalTitle)
    expect(typeof physicalTitle).toBe('string')
    expect(typeof mentalTitle).toBe('string')
  })

  test('should handle high level progressions', async () => {
    const title = await generateLevelTitle({
      statCategory: 'Family Bonding',
      newLevel: 15,
      characterClass: 'Family Guardian',
      characterBackstory: 'Dedicated parent committed to meaningful family connections'
    })

    expect(typeof title).toBe('string')
    expect(title.length).toBeGreaterThan(0)
    
    // High level titles should sound more impressive
    expect(title.toLowerCase()).not.toContain('weak')
    expect(title.toLowerCase()).not.toContain('novice')
  })

  test('should generate contextual titles based on character class and backstory', async () => {
    const rangerTitle = await generateLevelTitle({
      statCategory: 'Adventure Spirit',
      newLevel: 5,
      characterClass: 'Daily Adventurer',
      characterBackstory: 'An outdoor enthusiast who finds magic in everyday adventures'
    })

    const scholarTitle = await generateLevelTitle({
      statCategory: 'Professional Growth',
      newLevel: 5,
      characterClass: 'Learning Scholar',
      characterBackstory: 'A knowledge seeker focused on continuous professional development'
    })

    expect(typeof rangerTitle).toBe('string')
    expect(typeof scholarTitle).toBe('string')
    expect(rangerTitle).not.toBe(scholarTitle)
  })

  test('should handle edge cases gracefully', async () => {
    // Test level 1 (starting level)
    const level1Title = await generateLevelTitle({
      statCategory: 'Creativity',
      newLevel: 1,
      characterClass: 'Creative Spirit',
      characterBackstory: 'An artist exploring various forms of creative expression'
    })

    expect(typeof level1Title).toBe('string')
    expect(level1Title.length).toBeGreaterThan(0)

    // Test very high level
    const level20Title = await generateLevelTitle({
      statCategory: 'Social Connection',
      newLevel: 20,
      characterClass: 'Social Connector',
      characterBackstory: 'A natural networker who builds meaningful relationships'
    })

    expect(typeof level20Title).toBe('string')
    expect(level20Title.length).toBeGreaterThan(0)
  })

  test('should be consistent but not identical for same inputs', async () => {
    const params = {
      statCategory: 'Mental Wellness',
      newLevel: 4,
      characterClass: 'Balance Seeker',
      characterBackstory: 'Someone striving for work-life balance and mental clarity'
    }

    const title1 = await generateLevelTitle(params)
    const title2 = await generateLevelTitle(params)

    expect(typeof title1).toBe('string')
    expect(typeof title2).toBe('string')
    
    // Titles should be reasonable and not empty
    expect(title1.length).toBeGreaterThan(0)
    expect(title2.length).toBeGreaterThan(0)
    
    // GPT might generate slightly different results each time, which is fine
    // We just want to ensure the service works consistently
  })
})
