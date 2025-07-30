import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { users, characterStats } from '../db/schema';
import { convertStatNamesToIds } from '../utils/stats';
import { eq } from 'drizzle-orm';

describe('Stats Helper Functions', () => {
  let testUserId: string;

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
    await db.insert(characterStats).values([
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
      {
        userId: testUserId,
        name: 'Creativity',
        description: 'Artistic and innovative thinking',
        currentLevel: 1,
        totalXp: 50,
      },
    ]);
  });

  describe('convertStatNamesToIds', () => {
    it('should convert stat names to IDs', async () => {
      const statNames = ['Strength', 'Intelligence'];
      const statNameToIdMap = await convertStatNamesToIds(testUserId, statNames);

      expect(Object.keys(statNameToIdMap)).toHaveLength(2);
      expect(statNameToIdMap['Strength']).toBeDefined();
      expect(statNameToIdMap['Intelligence']).toBeDefined();
      expect(typeof statNameToIdMap['Strength']).toBe('string');
      expect(typeof statNameToIdMap['Intelligence']).toBe('string');
    });

    it('should handle case-insensitive matching', async () => {
      const statNames = ['strength', 'CREATIVITY', 'Intelligence'];
      const statNameToIdMap = await convertStatNamesToIds(testUserId, statNames);

      expect(Object.keys(statNameToIdMap)).toHaveLength(3);
      expect(statNameToIdMap['strength']).toBeDefined();
      expect(statNameToIdMap['CREATIVITY']).toBeDefined();
      expect(statNameToIdMap['Intelligence']).toBeDefined();
    });

    it('should handle empty array', async () => {
      const statNameToIdMap = await convertStatNamesToIds(testUserId, []);
      expect(statNameToIdMap).toEqual({});
    });

    it('should handle non-existent stat names', async () => {
      const statNames = ['NonExistent', 'Strength'];
      const statNameToIdMap = await convertStatNamesToIds(testUserId, statNames);

      // Should only return ID for 'Strength'
      expect(Object.keys(statNameToIdMap)).toHaveLength(1);
      expect(statNameToIdMap['Strength']).toBeDefined();
      expect(statNameToIdMap['NonExistent']).toBeUndefined();
    });

    it('should handle duplicate stat names', async () => {
      const statNames = ['Strength', 'Strength', 'Intelligence'];
      const statNameToIdMap = await convertStatNamesToIds(testUserId, statNames);

      // Should return 2 unique mappings despite duplicates
      expect(Object.keys(statNameToIdMap)).toHaveLength(2);
      expect(statNameToIdMap['Strength']).toBeDefined();
      expect(statNameToIdMap['Intelligence']).toBeDefined();
    });

    it('should handle empty/whitespace stat names', async () => {
      const statNames = ['Strength', '', '  ', 'Intelligence'];
      const statNameToIdMap = await convertStatNamesToIds(testUserId, statNames);

      expect(Object.keys(statNameToIdMap)).toHaveLength(2);
      expect(statNameToIdMap['Strength']).toBeDefined();
      expect(statNameToIdMap['Intelligence']).toBeDefined();
    });

    it('should only return stats for the specified user', async () => {
      // Create another user with a stat of the same name
      const [otherUser] = await db
        .insert(users)
        .values({
          name: 'Other User',
          email: `other-${Date.now()}@example.com`,
          password: 'hashedpassword',
        })
        .returning();

      await db.insert(characterStats).values({
        userId: otherUser.id,
        name: 'Strength', // Same name as our test user's stat
        description: 'Different user strength',
        currentLevel: 1,
        totalXp: 0,
      });

      const statNames = ['Strength'];
      const statNameToIdMap = await convertStatNamesToIds(testUserId, statNames);

      expect(Object.keys(statNameToIdMap)).toHaveLength(1);
      expect(statNameToIdMap['Strength']).toBeDefined();

      // Verify the returned ID belongs to our test user
      const [stat] = await db
        .select()
        .from(characterStats)
        .where(eq(characterStats.id, statNameToIdMap['Strength']));

      expect(stat.userId).toBe(testUserId);
    });
  });
});
