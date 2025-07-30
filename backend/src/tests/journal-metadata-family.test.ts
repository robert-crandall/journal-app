import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { users, familyMembers } from '../db/schema';
import { generateJournalMetadata, type ChatMessage } from '../utils/gpt/conversationalJournal';
import { eq } from 'drizzle-orm';

describe('Journal Metadata with Family ID Conversion', () => {
  let testUserId: string;
  let sarahId: string;
  let emmaId: string;

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

    // Create some test family members
    const family = await db
      .insert(familyMembers)
      .values([
        {
          userId: testUserId,
          name: 'Sarah',
          relationship: 'wife',
          connectionXp: 100,
          connectionLevel: 2,
        },
        {
          userId: testUserId,
          name: 'Emma',
          relationship: 'daughter',
          connectionXp: 75,
          connectionLevel: 1,
        },
      ])
      .returning();

    sarahId = family[0].id;
    emmaId = family[1].id;
  });

  it('should convert family member names to IDs in generateJournalMetadata', async () => {
    const conversation: ChatMessage[] = [
      {
        role: 'user',
        content: 'Today I spent quality time with Sarah and helped Emma with her homework. We had a wonderful family dinner together.',
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: 'That sounds like such a meaningful day with your family!',
        timestamp: new Date().toISOString(),
      },
    ];

    const metadata = await generateJournalMetadata(conversation, testUserId);

    // Check that suggestedFamilyTags now uses family member IDs as keys
    expect(metadata.suggestedFamilyTags).toBeDefined();

    // If any family tags were suggested, they should use IDs as keys
    const familyTagKeys = Object.keys(metadata.suggestedFamilyTags);
    for (const key of familyTagKeys) {
      // UUIDs are 36 characters long
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      // Verify the ID corresponds to one of our test family members
      const member = await db.select().from(familyMembers).where(eq(familyMembers.id, key)).limit(1);

      expect(member).toHaveLength(1);
      expect(member[0].userId).toBe(testUserId);
    }

    // Verify the structure of family tag values
    for (const [familyId, familyData] of Object.entries(metadata.suggestedFamilyTags)) {
      expect(familyData).toHaveProperty('xp');
      expect(familyData).toHaveProperty('reason');
      expect(typeof familyData.xp).toBe('number');
      expect(typeof familyData.reason).toBe('string');
      expect(familyData.xp).toBeGreaterThan(0);
      expect(familyData.xp).toBeLessThanOrEqual(50);
    }
  }, 30000); // Increase timeout for GPT API call
});
