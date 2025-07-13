import { describe, it, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail, schema } from './setup';
import { eq, and } from 'drizzle-orm';
import * as tagUtils from '../utils/tags';

describe('Tag Utilities', () => {
  let authToken: string;
  let userId: string;
  let testGoalId: string;
  let testUser: { name: string; email: string; password: string };

  // API wrapper for requests
  const app = {
    request: (url: string, init?: RequestInit) => {
      const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
      return appExport.fetch(new Request(absoluteUrl, init));
    },
  };

  beforeEach(async () => {
    // Create a test user with unique email and get auth token
    testUser = {
      name: 'Tag Test User',
      email: getUniqueEmail('tags'),
      password: 'testpassword123',
    };

    const signupRes = await app.request('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    const signupData = await signupRes.json();
    authToken = signupData.token;
    userId = signupData.user.id;

    // Create a test goal via DB (if no API endpoint exists)
    const db = testDb();
    const goal = await db
      .insert(schema.goals)
      .values({
        userId,
        title: 'Test Goal for Tags',
        description: 'A goal to test tags',
        isActive: true,
        isArchived: false,
      })
      .returning();
    testGoalId = goal[0].id;
  });

  describe('createOrGetTag', () => {
    it('should create a new tag', async () => {
      const tag = await tagUtils.createOrGetTag(userId, 'family');

      expect(tag.name).toBe('family');
      expect(tag.userId).toBe(userId);
      expect(tag.id).toBeDefined();
    });

    it('should return existing tag instead of creating duplicate', async () => {
      const tag1 = await tagUtils.createOrGetTag(userId, 'family');
      const tag2 = await tagUtils.createOrGetTag(userId, 'FAMILY'); // Different case

      expect(tag1.id).toBe(tag2.id);
      expect(tag1.name).toBe('family');
      expect(tag2.name).toBe('family');
    });

    it('should normalize tag names to lowercase', async () => {
      const tag = await tagUtils.createOrGetTag(userId, '  GROWTH  ');

      expect(tag.name).toBe('growth');
    });

    it('should create separate tags for different users', async () => {
      const db = testDb();

      // Create another user via API
      const anotherUser = {
        name: 'Tag Test User 2',
        email: getUniqueEmail('tags2'),
        password: 'testpassword123',
      };
      const signupRes2 = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(anotherUser),
      });
      const signupData2 = await signupRes2.json();
      const userId2 = signupData2.user.id;

      const tag1 = await tagUtils.createOrGetTag(userId, 'family');
      const tag2 = await tagUtils.createOrGetTag(userId2, 'family');

      expect(tag1.id).not.toBe(tag2.id);
      expect(tag1.userId).toBe(userId);
      expect(tag2.userId).toBe(userId2);
    });
  });

  describe('getUserTagsWithCounts', () => {
    it('should return empty array for user with no tags', async () => {
      const userTags = await tagUtils.getUserTagsWithCounts(userId);

      expect(userTags).toEqual([]);
    });

    it('should return tags with usage counts', async () => {
      // Create tags and assign to goal
      await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);

      const userTags = await tagUtils.getUserTagsWithCounts(userId);

      expect(userTags).toHaveLength(2);

      const familyTag = userTags.find((tag) => tag.name === 'family');
      const growthTag = userTags.find((tag) => tag.name === 'growth');

      expect(familyTag?.usageCount).toBe(1);
      expect(growthTag?.usageCount).toBe(1);
    });

    it('should order tags by usage count desc, then name asc', async () => {
      const db = testDb();

      // Create another goal
      const goal2 = await db
        .insert(schema.goals)
        .values({
          userId,
          title: 'Second Goal',
          description: 'Another goal',
          isActive: true,
          isArchived: false,
        })
        .returning();

      // Set tags: 'family' used twice, 'growth' and 'adventure' used once each
      await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);
      await tagUtils.setGoalTags(goal2[0].id, userId, ['family', 'adventure']);

      const userTags = await tagUtils.getUserTagsWithCounts(userId);

      expect(userTags).toHaveLength(3);
      expect(userTags[0].name).toBe('family'); // Used 2 times
      expect(userTags[0].usageCount).toBe(2);

      // 'adventure' and 'growth' both have usageCount 1, should be ordered alphabetically
      expect(userTags[1].name).toBe('adventure');
      expect(userTags[2].name).toBe('growth');
    });
  });

  describe('getGoalTags', () => {
    it('should return empty array for goal with no tags', async () => {
      const goalTags = await tagUtils.getGoalTags(testGoalId);

      expect(goalTags).toEqual([]);
    });

    it('should return tags for a goal', async () => {
      await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);

      const goalTags = await tagUtils.getGoalTags(testGoalId);

      expect(goalTags).toHaveLength(2);
      expect(goalTags.map((tag) => tag.name).sort()).toEqual(['family', 'growth']);
    });

    it('should order tags alphabetically', async () => {
      await tagUtils.setGoalTags(testGoalId, userId, ['zzz', 'aaa', 'mmm']);

      const goalTags = await tagUtils.getGoalTags(testGoalId);

      expect(goalTags.map((tag) => tag.name)).toEqual(['aaa', 'mmm', 'zzz']);
    });
  });

  describe('setGoalTags', () => {
    it('should set tags for a goal', async () => {
      const resultTags = await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);

      expect(resultTags).toHaveLength(2);
      expect(resultTags.map((tag) => tag.name).sort()).toEqual(['family', 'growth']);

      // Verify in database
      const goalTags = await tagUtils.getGoalTags(testGoalId);
      expect(goalTags.map((tag) => tag.name).sort()).toEqual(['family', 'growth']);
    });

    it('should replace existing tags', async () => {
      // Set initial tags
      await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);

      // Replace with different tags
      await tagUtils.setGoalTags(testGoalId, userId, ['adventure', 'health']);

      const goalTags = await tagUtils.getGoalTags(testGoalId);
      expect(goalTags.map((tag) => tag.name).sort()).toEqual(['adventure', 'health']);
    });

    it('should handle empty tag array', async () => {
      // Set initial tags
      await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);

      // Clear all tags
      const resultTags = await tagUtils.setGoalTags(testGoalId, userId, []);

      expect(resultTags).toEqual([]);

      const goalTags = await tagUtils.getGoalTags(testGoalId);
      expect(goalTags).toEqual([]);
    });

    it('should ignore empty/whitespace tag names', async () => {
      const resultTags = await tagUtils.setGoalTags(testGoalId, userId, ['family', '', '  ', 'growth']);

      expect(resultTags).toHaveLength(2);
      expect(resultTags.map((tag) => tag.name).sort()).toEqual(['family', 'growth']);
    });
  });

  describe('addGoalTags', () => {
    it('should add tags to a goal without removing existing ones', async () => {
      // Set initial tags
      await tagUtils.setGoalTags(testGoalId, userId, ['family']);

      // Add more tags
      await tagUtils.addGoalTags(testGoalId, userId, ['growth', 'adventure']);

      const goalTags = await tagUtils.getGoalTags(testGoalId);
      expect(goalTags.map((tag) => tag.name).sort()).toEqual(['adventure', 'family', 'growth']);
    });

    it('should not duplicate existing tags', async () => {
      // Set initial tags
      await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);

      // Try to add existing and new tags
      await tagUtils.addGoalTags(testGoalId, userId, ['family', 'adventure']);

      const goalTags = await tagUtils.getGoalTags(testGoalId);
      expect(goalTags.map((tag) => tag.name).sort()).toEqual(['adventure', 'family', 'growth']);
    });
  });

  describe('removeGoalTags', () => {
    it('should remove specified tags from a goal', async () => {
      // Set initial tags
      const tags = await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth', 'adventure']);

      // Remove some tags
      const tagsToRemove = tags.filter((tag) => ['family', 'adventure'].includes(tag.name));
      await tagUtils.removeGoalTags(
        testGoalId,
        tagsToRemove.map((tag) => tag.id),
      );

      const remainingTags = await tagUtils.getGoalTags(testGoalId);
      expect(remainingTags.map((tag) => tag.name)).toEqual(['growth']);
    });

    it('should handle empty tag array', async () => {
      await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);

      await tagUtils.removeGoalTags(testGoalId, []);

      const goalTags = await tagUtils.getGoalTags(testGoalId);
      expect(goalTags).toHaveLength(2);
    });
  });

  describe('deleteUnusedTags', () => {
    it('should delete tags not linked to any goals', async () => {
      const db = testDb();

      // Create tags, some used and some unused
      const tag1 = await tagUtils.createOrGetTag(userId, 'family');
      const tag2 = await tagUtils.createOrGetTag(userId, 'growth');
      const tag3 = await tagUtils.createOrGetTag(userId, 'unused1');
      const tag4 = await tagUtils.createOrGetTag(userId, 'unused2');

      // Link only some tags to the goal
      await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);

      const deletedCount = await tagUtils.deleteUnusedTags(userId);

      expect(deletedCount).toBe(2);

      // Verify the unused tags are deleted
      const remainingTags = await db.select().from(schema.tags).where(eq(schema.tags.userId, userId));
      expect(remainingTags).toHaveLength(2);
      expect(remainingTags.map((tag) => tag.name).sort()).toEqual(['family', 'growth']);
    });

    it('should not delete tags from other users', async () => {
      const db = testDb();

      // Create another user via API
      const anotherUser = {
        name: 'Tag Test User 2',
        email: getUniqueEmail('tags3'),
        password: 'testpassword123',
      };
      const signupRes2 = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(anotherUser),
      });
      const signupData2 = await signupRes2.json();
      const userId2 = signupData2.user.id;

      // Create unused tags for both users
      await tagUtils.createOrGetTag(userId, 'unused1');
      await tagUtils.createOrGetTag(userId2, 'unused2');

      const deletedCount = await tagUtils.deleteUnusedTags(userId);

      expect(deletedCount).toBe(1);

      // Verify the other user's tag is not deleted
      const user2Tags = await db.select().from(schema.tags).where(eq(schema.tags.userId, userId2));
      expect(user2Tags).toHaveLength(1);
      expect(user2Tags[0].name).toBe('unused2');
    });

    it('should return 0 when no unused tags exist', async () => {
      await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);

      const deletedCount = await tagUtils.deleteUnusedTags(userId);

      expect(deletedCount).toBe(0);
    });
  });

  describe('serializeGoalWithTags', () => {
    it('should serialize goal with tags and dates', async () => {
      const db = testDb();

      // Get the test goal
      const goalData = await db.select().from(schema.goals).where(eq(schema.goals.id, testGoalId)).limit(1);
      const goal = goalData[0];

      const tags = await tagUtils.setGoalTags(testGoalId, userId, ['family', 'growth']);

      const serialized = tagUtils.serializeGoalWithTags(goal, tags);

      expect(serialized.id).toBe(testGoalId);
      expect(serialized.tags).toHaveLength(2);
      expect(serialized.tags.map((tag) => tag.name).sort()).toEqual(['family', 'growth']);
      expect(typeof serialized.createdAt).toBe('string');
      expect(typeof serialized.updatedAt).toBe('string');
      expect(new Date(serialized.createdAt)).toBeInstanceOf(Date);
      expect(new Date(serialized.updatedAt)).toBeInstanceOf(Date);
    });
  });
});
