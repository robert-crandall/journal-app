import { describe, test, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail, schema } from './setup';
import { getUserContext, formatUserContextForPrompt, getSpecificUserContext } from '../utils/userContextService';

describe('User Context Service', () => {
  let userId: string;
  let testUser: { name: string; email: string; password: string };
  let authToken: string;
  // API wrapper for requests
  const app = {
    request: (url: string, init?: RequestInit) => {
      const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
      return appExport.fetch(new Request(absoluteUrl, init));
    },
  };

  beforeEach(async () => {
    // Create a test user via API
    testUser = {
      name: 'Context Test User',
      email: getUniqueEmail('context'),
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
  });

  describe('getUserContext', () => {
    test('should return basic user context when no character exists', async () => {
      const context = await getUserContext(userId);

      expect(context.name).toBe('Context Test User');
      expect(context.characterClass).toBeUndefined();
      expect(context.backstory).toBeUndefined();
      expect(context.characterGoals).toBeUndefined();
      expect(context.motto).toBeUndefined();
      expect(context.activeGoals).toBeUndefined();
      expect(context.familyMembers).toBeUndefined();
      expect(context.characterStats).toBeUndefined();
    });

    test('should return comprehensive context when all data exists', async () => {
      const db = testDb();

      // Create character
      await db.insert(schema.characters).values({
        userId,
        name: 'Thorin Oakenshield',
        characterClass: 'Adventurer',
        backstory: 'A seasoned explorer seeking new challenges',
        goals: 'To reconnect with nature and strengthen family bonds',
        motto: 'Adventure awaits those who seek it',
      });

      // Create active goals
      const goal = await db
        .insert(schema.goals)
        .values({
          userId,
          title: 'Spend more time outdoors',
          description: 'Get outside at least 3 times per week',
          isActive: true,
          isArchived: false,
        })
        .returning();

      // Create family member
      await db.insert(schema.familyMembers).values({
        userId,
        name: 'Sarah',
        relationship: 'wife',
        likes: 'hiking, reading, coffee',
        dislikes: 'loud noises',
        connectionLevel: 3,
        connectionXp: 250,
        lastInteractionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      });

      // Create character stat
      await db.insert(schema.characterStats).values({
        userId,
        name: 'Strength',
        description: 'Physical power and endurance',
        currentLevel: 2,
        totalXp: 150,
      });

      const context = await getUserContext(userId);

      expect(context.name).toBe('Thorin Oakenshield');
      expect(context.characterClass).toBe('Adventurer');
      expect(context.backstory).toBe('A seasoned explorer seeking new challenges');
      expect(context.characterGoals).toBe('To reconnect with nature and strengthen family bonds');
      expect(context.motto).toBe('Adventure awaits those who seek it');

      expect(context.activeGoals).toHaveLength(1);
      expect(context.activeGoals![0].title).toBe('Spend more time outdoors');
      expect(context.activeGoals![0].description).toBe('Get outside at least 3 times per week');

      expect(context.familyMembers).toHaveLength(1);
      expect(context.familyMembers![0].name).toBe('Sarah');
      expect(context.familyMembers![0].relationship).toBe('wife');
      expect(context.familyMembers![0].likes).toBe('hiking, reading, coffee');
      expect(context.familyMembers![0].connectionLevel).toBe(3);

      expect(context.characterStats).toHaveLength(1);
      expect(context.characterStats![0].name).toBe('Strength');
      expect(context.characterStats![0].description).toBe('Physical power and endurance');
      expect(context.characterStats![0].currentLevel).toBe(2);
      expect(context.characterStats![0].totalXp).toBe(150);
    });

    test('should respect include options to filter data', async () => {
      const db = testDb();

      // Create character and other data
      await db.insert(schema.characters).values({
        userId,
        name: 'Test Character',
        characterClass: 'Test Class',
        backstory: 'Test backstory',
        goals: 'Test goals',
      });

      await db.insert(schema.goals).values({
        userId,
        title: 'Test Goal',
        description: 'Test description',
        isActive: true,
        isArchived: false,
      });

      // Only include character data
      const contextCharacterOnly = await getUserContext(userId, {
        includeCharacter: true,
        includeActiveGoals: false,
        includeFamilyMembers: false,
        includeCharacterStats: false,
      });

      expect(contextCharacterOnly.name).toBe('Test Character');
      expect(contextCharacterOnly.characterClass).toBe('Test Class');
      expect(contextCharacterOnly.activeGoals).toBeUndefined();

      // Only include goals
      const contextGoalsOnly = await getUserContext(userId, {
        includeCharacter: false,
        includeActiveGoals: true,
        includeFamilyMembers: false,
        includeCharacterStats: false,
      });

      expect(contextGoalsOnly.name).toBe('User'); // Fallback when character not included
      expect(contextGoalsOnly.characterClass).toBeUndefined();
      expect(contextGoalsOnly.activeGoals).toHaveLength(1);
      expect(contextGoalsOnly.activeGoals![0].title).toBe('Test Goal');
    });
  });

  describe('formatUserContextForPrompt', () => {
    test('should format comprehensive context for GPT prompts', async () => {
      const db = testDb();

      // Create test data
      await db.insert(schema.characters).values({
        userId,
        name: 'Aragorn',
        characterClass: 'Ranger',
        backstory: 'Former king living in exile',
        goals: 'Protect the innocent and find my place',
        motto: 'Not all who wander are lost',
      });

      await db.insert(schema.goals).values({
        userId,
        title: 'Master archery',
        description: 'Become proficient with bow and arrow',
        isActive: true,
        isArchived: false,
      });

      await db.insert(schema.familyMembers).values({
        userId,
        name: 'Arwen',
        relationship: 'beloved',
        likes: 'starlight, poetry',
        dislikes: 'conflict',
        connectionLevel: 5,
        connectionXp: 500,
        lastInteractionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      });

      await db.insert(schema.characterStats).values({
        userId,
        name: 'Wisdom',
        description: 'Understanding and insight',
        currentLevel: 4,
        totalXp: 350,
      });

      const context = await getUserContext(userId);
      const formatted = formatUserContextForPrompt(context);

      expect(formatted).toContain('## User');
      expect(formatted).toContain('Aragorn');
      expect(formatted).toContain('Character Class: Ranger');
      expect(formatted).toContain('### Backstory');
      expect(formatted).toContain('Former king living in exile');
      expect(formatted).toContain('Motto: Not all who wander are lost');
      expect(formatted).toContain('Not all who wander are lost');
      expect(formatted).toContain('### Active Goals');
      expect(formatted).toContain('#### Master archery');
      expect(formatted).toContain('Become proficient with bow and arrow');
      expect(formatted).toContain('### Family Members');
      expect(formatted).toContain('#### Arwen (beloved)');
      expect(formatted).toContain('Likes: starlight, poetry');
      expect(formatted).toContain('Connection Level: 5 (500 XP)');
      expect(formatted).toContain('Last interaction: 1 days ago');
    });

    test('should handle minimal context gracefully', async () => {
      const context = await getUserContext(userId);
      const formatted = formatUserContextForPrompt(context);

      expect(formatted).toContain('## User');
      expect(formatted).toContain('Context Test User');
      expect(formatted).not.toContain('### Character Class');
      expect(formatted).not.toContain('Active Goals:');
      expect(formatted).not.toContain('Family Members:');
      expect(formatted).not.toContain('Character Stats:');
    });
  });

  describe('getSpecificUserContext', () => {
    test('should return specific context items', async () => {
      const db = testDb();

      await db.insert(schema.characters).values({
        userId,
        name: 'Legolas',
        characterClass: 'Elf Archer',
        backstory: 'Prince of the Woodland Realm',
      });

      await db.insert(schema.goals).values({
        userId,
        title: 'Protect the forest',
        description: 'Guard the ancient woods',
        isActive: true,
        isArchived: false,
      });

      const characterClass = await getSpecificUserContext(userId, 'characterClass');
      const activeGoals = await getSpecificUserContext(userId, 'activeGoals');
      const name = await getSpecificUserContext(userId, 'name');

      expect(characterClass).toBe('Elf Archer');
      expect(Array.isArray(activeGoals)).toBe(true);
      expect((activeGoals as any)[0].title).toBe('Protect the forest');
      expect(name).toBe('Legolas');
    });
  });
});
