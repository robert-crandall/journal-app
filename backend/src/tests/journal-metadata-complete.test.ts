import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { users, characterStats, familyMembers } from '../db/schema';
import { generateJournalMetadata, type ChatMessage } from '../utils/gpt/conversationalJournal';
import { eq } from 'drizzle-orm';

describe('Journal Metadata with Complete ID Conversion', () => {
  let testUserId: string;
  let strengthStatId: string;
  let sarahId: string;

  beforeEach(async () => {
    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'hashedpassword',
      })
      .returning();
    testUserId = user.id;

    // Create test stats
    const [stat] = await db
      .insert(characterStats)
      .values({
        userId: testUserId,
        name: 'Strength',
        description: 'Physical power and endurance',
        currentLevel: 1,
        totalXp: 0,
      })
      .returning();
    strengthStatId = stat.id;

    // Create test family members
    const [family] = await db
      .insert(familyMembers)
      .values({
        userId: testUserId,
        name: 'Sarah',
        relationship: 'wife',
        connectionXp: 100,
        connectionLevel: 2,
      })
      .returning();
    sarahId = family.id;
  });

  it('should convert both stat names and family names to IDs in generateJournalMetadata', async () => {
    const conversation: ChatMessage[] = [
      {
        role: 'user',
        content: 'Today I did a great workout to build my strength, then spent quality time with Sarah cooking dinner together.',
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: 'What a wonderful balance of personal development and relationship building!',
        timestamp: new Date().toISOString(),
      },
    ];

    const metadata = await generateJournalMetadata(conversation, testUserId);

    // Verify stats conversion
    expect(metadata.suggestedStatTags).toBeDefined();
    const statTagKeys = Object.keys(metadata.suggestedStatTags);
    for (const key of statTagKeys) {
      // Should be UUID format
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      // Verify it's a valid stat for this user
      const stat = await db.select().from(characterStats).where(eq(characterStats.id, key)).limit(1);

      expect(stat).toHaveLength(1);
      expect(stat[0].userId).toBe(testUserId);
    }

    // Verify family conversion
    expect(metadata.suggestedFamilyTags).toBeDefined();
    const familyTagKeys = Object.keys(metadata.suggestedFamilyTags);
    for (const key of familyTagKeys) {
      // Should be UUID format
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      // Verify it's a valid family member for this user
      const member = await db.select().from(familyMembers).where(eq(familyMembers.id, key)).limit(1);

      expect(member).toHaveLength(1);
      expect(member[0].userId).toBe(testUserId);
    }

    // Verify both have the correct structure
    for (const [statId, statData] of Object.entries(metadata.suggestedStatTags)) {
      expect(statData).toHaveProperty('xp');
      expect(statData).toHaveProperty('reason');
      expect(typeof statData.xp).toBe('number');
      expect(typeof statData.reason).toBe('string');
    }

    for (const [familyId, familyData] of Object.entries(metadata.suggestedFamilyTags)) {
      expect(familyData).toHaveProperty('xp');
      expect(familyData).toHaveProperty('reason');
      expect(typeof familyData.xp).toBe('number');
      expect(typeof familyData.reason).toBe('string');
    }
  }, 30000); // Increase timeout for GPT API call
});
