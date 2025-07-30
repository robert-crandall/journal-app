import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { users, characterStats } from '../db/schema';
import { generateJournalMetadata, type ChatMessage } from '../utils/gpt/conversationalJournal';
import { eq } from 'drizzle-orm';

describe('Journal Metadata with Stat ID Conversion', () => {
  let testUserId: string;
  let strengthStatId: string;
  let intelligenceStatId: string;

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

    // Create some test stats
    const stats = await db
      .insert(characterStats)
      .values([
        {
          userId: testUserId,
          name: 'Strength',
          description: 'Physical power and endurance',
          currentLevel: 1,
          totalXp: 0,
        },
        {
          userId: testUserId,
          name: 'Intelligence',
          description: 'Mental acuity and learning ability',
          currentLevel: 2,
          totalXp: 150,
        },
      ])
      .returning();

    strengthStatId = stats[0].id;
    intelligenceStatId = stats[1].id;
  });

  it('should convert stat names to IDs in generateJournalMetadata', async () => {
    const conversation: ChatMessage[] = [
      {
        role: 'user',
        content: 'Today I did some weightlifting and read a challenging book about quantum physics.',
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: 'That sounds like a great combination of physical and mental challenges!',
        timestamp: new Date().toISOString(),
      },
    ];

    const metadata = await generateJournalMetadata(conversation, testUserId);

    // Check that suggestedStatTags now uses stat IDs as keys
    expect(metadata.suggestedStatTags).toBeDefined();

    // If any stat tags were suggested, they should use IDs as keys
    const statTagKeys = Object.keys(metadata.suggestedStatTags);
    for (const key of statTagKeys) {
      // UUIDs are 36 characters long
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      // Verify the ID corresponds to one of our test stats
      const stat = await db.select().from(characterStats).where(eq(characterStats.id, key)).limit(1);

      expect(stat).toHaveLength(1);
      expect(stat[0].userId).toBe(testUserId);
    }

    // Verify the structure of stat tag values
    for (const [statId, statData] of Object.entries(metadata.suggestedStatTags)) {
      expect(statData).toHaveProperty('xp');
      expect(statData).toHaveProperty('reason');
      expect(typeof statData.xp).toBe('number');
      expect(typeof statData.reason).toBe('string');
      expect(statData.xp).toBeGreaterThan(0);
      expect(statData.xp).toBeLessThanOrEqual(50);
    }
  }, 30000); // Increase timeout for GPT API call
});
