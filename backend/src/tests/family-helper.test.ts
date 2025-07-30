import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { users, familyMembers } from '../db/schema';
import { convertFamilyNamesToIds } from '../utils/family';
import { eq } from 'drizzle-orm';

describe('Family Helper Functions', () => {
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

    // Create some test family members
    await db.insert(familyMembers).values([
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
      {
        userId: testUserId,
        name: 'Michael',
        relationship: 'son',
        connectionXp: 50,
        connectionLevel: 1,
      },
    ]);
  });

  describe('convertFamilyNamesToIds', () => {
    it('should convert family member names to IDs', async () => {
      const familyNames = ['Sarah', 'Emma'];
      const familyNameToIdMap = await convertFamilyNamesToIds(testUserId, familyNames);

      expect(Object.keys(familyNameToIdMap)).toHaveLength(2);
      expect(familyNameToIdMap['Sarah']).toBeDefined();
      expect(familyNameToIdMap['Emma']).toBeDefined();
      expect(typeof familyNameToIdMap['Sarah']).toBe('string');
      expect(typeof familyNameToIdMap['Emma']).toBe('string');
    });

    it('should handle case-insensitive matching', async () => {
      const familyNames = ['sarah', 'EMMA', 'Michael'];
      const familyNameToIdMap = await convertFamilyNamesToIds(testUserId, familyNames);

      expect(Object.keys(familyNameToIdMap)).toHaveLength(3);
      expect(familyNameToIdMap['sarah']).toBeDefined();
      expect(familyNameToIdMap['EMMA']).toBeDefined();
      expect(familyNameToIdMap['Michael']).toBeDefined();
    });

    it('should handle empty array', async () => {
      const familyNameToIdMap = await convertFamilyNamesToIds(testUserId, []);
      expect(familyNameToIdMap).toEqual({});
    });

    it('should handle non-existent family member names', async () => {
      const familyNames = ['NonExistent', 'Sarah'];
      const familyNameToIdMap = await convertFamilyNamesToIds(testUserId, familyNames);

      // Should only return ID for 'Sarah'
      expect(Object.keys(familyNameToIdMap)).toHaveLength(1);
      expect(familyNameToIdMap['Sarah']).toBeDefined();
      expect(familyNameToIdMap['NonExistent']).toBeUndefined();
    });

    it('should handle duplicate family member names', async () => {
      const familyNames = ['Sarah', 'Sarah', 'Emma'];
      const familyNameToIdMap = await convertFamilyNamesToIds(testUserId, familyNames);

      // Should return 2 unique mappings despite duplicates
      expect(Object.keys(familyNameToIdMap)).toHaveLength(2);
      expect(familyNameToIdMap['Sarah']).toBeDefined();
      expect(familyNameToIdMap['Emma']).toBeDefined();
    });

    it('should handle empty/whitespace family member names', async () => {
      const familyNames = ['Sarah', '', '  ', 'Emma'];
      const familyNameToIdMap = await convertFamilyNamesToIds(testUserId, familyNames);

      expect(Object.keys(familyNameToIdMap)).toHaveLength(2);
      expect(familyNameToIdMap['Sarah']).toBeDefined();
      expect(familyNameToIdMap['Emma']).toBeDefined();
    });

    it('should only return family members for the specified user', async () => {
      // Create another user with a family member of the same name
      const [otherUser] = await db
        .insert(users)
        .values({
          name: 'Other User',
          email: `other-${Date.now()}@example.com`,
          password: 'hashedpassword',
        })
        .returning();

      await db.insert(familyMembers).values({
        userId: otherUser.id,
        name: 'Sarah', // Same name as our test user's family member
        relationship: 'sister',
        connectionXp: 0,
        connectionLevel: 1,
      });

      const familyNames = ['Sarah'];
      const familyNameToIdMap = await convertFamilyNamesToIds(testUserId, familyNames);

      expect(Object.keys(familyNameToIdMap)).toHaveLength(1);
      expect(familyNameToIdMap['Sarah']).toBeDefined();

      // Verify the returned ID belongs to our test user
      const [member] = await db.select().from(familyMembers).where(eq(familyMembers.id, familyNameToIdMap['Sarah']));

      expect(member.userId).toBe(testUserId);
      expect(member.relationship).toBe('wife'); // Our test user's Sarah
    });
  });
});
