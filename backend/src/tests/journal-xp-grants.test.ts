import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail, schema } from './setup';
import { eq, and } from 'drizzle-orm';

// Import the module we want to mock
import * as gptModule from '../utils/gpt/conversationalJournal';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

const { journals, xpGrants, simpleTodos, characterStats, familyMembers, tags } = schema;

describe('Journal XP Grants Integration', () => {
  let userId: string;
  let authToken: string;
  let testStat: any;
  let testFamilyMember: any;
  let mockGenerateJournalMetadata: any;

  beforeEach(async () => {
    // Set up the mock for generateJournalMetadata
    mockGenerateJournalMetadata = vi.spyOn(gptModule, 'generateJournalMetadata');

    // Create test user and get auth token
    const testUser = {
      name: 'Test User',
      email: getUniqueEmail('journal-xp'),
      password: 'password123',
    };

    const registerResponse = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    expect(registerResponse.status).toBe(201);
    const registerData = await registerResponse.json();
    authToken = registerData.token;
    userId = registerData.user.id;

    // Create test character stat
    testStat = await testDb()
      .insert(characterStats)
      .values({
        userId,
        name: 'Fitness',
        description: 'Physical fitness and health',
        currentLevel: 1,
        totalXp: 0,
      })
      .returning();

    // Create test family member
    testFamilyMember = await testDb()
      .insert(familyMembers)
      .values({
        userId,
        name: 'John',
        relationship: 'Brother',
        birthday: '1990-01-01',
      })
      .returning();
  });

  afterEach(async () => {
    // Clean up test data
    await testDb().delete(simpleTodos).where(eq(simpleTodos.userId, userId));
    await testDb().delete(xpGrants).where(eq(xpGrants.userId, userId));
    await testDb().delete(journals).where(eq(journals.userId, userId));
    await testDb().delete(characterStats).where(eq(characterStats.userId, userId));
    await testDb().delete(familyMembers).where(eq(familyMembers.userId, userId));
    await testDb().delete(tags).where(eq(tags.userId, userId));
  });

  describe('Journal Finishing with XP Grants', () => {
    it('should create XP grants for character stats when journal is finished', async () => {
      // Mock the GPT response to return character stat XP grants
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Fitness Progress',
        synopsis: 'User worked out and gained energy',
        summary: 'A good workout session that improved fitness',
        suggestedTags: [],
        suggestedStatTags: {
          [testStat[0].id]: { xp: 25, reason: 'Completed an hour of exercise' },
        },
        suggestedFamilyTags: {},
        suggestedTodos: [],
      });

      const date = '2024-01-15';

      // Create journal in review state
      await testDb()
        .insert(journals)
        .values({
          userId,
          date,
          status: 'in_review',
          initialMessage: 'I worked out today and feel great!',
          chatSession: [
            { role: 'user', content: 'I did an hour of exercise today' },
            { role: 'assistant', content: 'That sounds fantastic! How did it make you feel?' },
            { role: 'user', content: 'Really energized and accomplished' },
          ],
        });

      // Finish the journal (this will trigger GPT analysis and XP grants)
      const response = await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('complete');

      // Check that XP grants were created
      const xpGrantRecords = await testDb()
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal')));

      expect(xpGrantRecords.length).toBeGreaterThan(0);

      // Verify character stat XP grants
      const statXpGrants = xpGrantRecords.filter((grant) => grant.entityType === 'character_stat');
      expect(statXpGrants.length).toBeGreaterThan(0);
      expect(statXpGrants[0].xpAmount).toBe(25);
      expect(statXpGrants[0].reason).toBe('Completed an hour of exercise');

      // Check that the character stat's total XP was updated
      const updatedStat = await testDb()
        .select()
        .from(characterStats)
        .where(and(eq(characterStats.id, testStat[0].id), eq(characterStats.userId, userId)))
        .limit(1);

      expect(updatedStat[0].totalXp).toBe(25);
    });

    it('should create XP grants for family members when mentioned in journal', async () => {
      // Mock the GPT response to return family member XP grants
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Quality Time with Family',
        synopsis: 'User had meaningful conversation with John',
        summary: 'A connecting conversation that strengthened the relationship',
        suggestedTags: [],
        suggestedStatTags: {},
        suggestedFamilyTags: {
          [testFamilyMember[0].id]: { xp: 15, reason: 'Had quality conversation and connected' },
        },
        suggestedTodos: [],
      });

      const date = '2024-01-16';

      // Create journal in review state with family interaction
      await testDb()
        .insert(journals)
        .values({
          userId,
          date,
          status: 'in_review',
          initialMessage: 'Had a great conversation with John today',
          chatSession: [
            { role: 'user', content: 'John and I talked for an hour about our future plans' },
            { role: 'assistant', content: 'That sounds like quality time together!' },
            { role: 'user', content: 'Yes, we really connected and understood each other' },
          ],
        });

      // Finish the journal
      const response = await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(200);

      // Check that family member XP grants were created
      const familyXpGrants = await testDb()
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.entityType, 'family_member'), eq(xpGrants.sourceType, 'journal')));

      expect(familyXpGrants.length).toBeGreaterThan(0);
      expect(familyXpGrants[0].xpAmount).toBe(15);
      expect(familyXpGrants[0].reason).toBe('Had quality conversation and connected');

      // Check that the family member's connection XP was updated
      const updatedFamily = await testDb()
        .select()
        .from(familyMembers)
        .where(and(eq(familyMembers.id, testFamilyMember[0].id), eq(familyMembers.userId, userId)))
        .limit(1);

      expect(updatedFamily[0].connectionXp).toBe(15);
      expect(updatedFamily[0].lastInteractionDate).toBeDefined();
    });

    it('should create content tag XP grants with 0 XP', async () => {
      // Create test tags first
      const testTags = await testDb()
        .insert(tags)
        .values([
          { userId, name: 'programming' },
          { userId, name: 'learning' },
        ])
        .returning();

      // Mock the GPT response to return content tags
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Learning Day',
        synopsis: 'User spent time learning programming',
        summary: 'A productive day of coding and learning',
        suggestedTags: [testTags[0].id, testTags[1].id], // Use actual tag IDs
        suggestedStatTags: {},
        suggestedFamilyTags: {},
        suggestedTodos: [],
      });

      const date = '2024-01-17';

      // Create journal in review state
      await testDb()
        .insert(journals)
        .values({
          userId,
          date,
          status: 'in_review',
          initialMessage: 'Today I learned about programming',
          chatSession: [
            { role: 'user', content: 'I spent time coding and learning new techniques' },
            { role: 'assistant', content: 'Learning is always valuable!' },
          ],
        });

      // Finish the journal
      const response = await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      console.log('Response:', response.status, await response.text());

      expect(response.status).toBe(200);

      // Check that content tag XP grants were created with 0 XP
      const contentTagGrants = await testDb()
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.entityType, 'content_tag'), eq(xpGrants.sourceType, 'journal'), eq(xpGrants.xpAmount, 0)));

      expect(contentTagGrants.length).toBeGreaterThan(0);

      // Verify that corresponding tags were created
      const createdTags = await testDb().select().from(tags).where(eq(tags.userId, userId));

      expect(createdTags.length).toBeGreaterThan(0);
    });

    it('should create simple todos that expire in 24 hours', async () => {
      // Mock the GPT response to return suggested todos
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Health Appointments',
        synopsis: 'User needs to schedule medical appointments',
        summary: 'Important health-related tasks to follow up on',
        suggestedTags: [],
        suggestedStatTags: {},
        suggestedFamilyTags: {},
        suggestedTodos: ['Call the doctor to schedule appointment', 'Schedule dentist appointment'],
      });

      const date = '2024-01-18';

      // Create journal in review state with actionable items
      await testDb()
        .insert(journals)
        .values({
          userId,
          date,
          status: 'in_review',
          initialMessage: 'I need to schedule some appointments',
          chatSession: [
            { role: 'user', content: 'I mentioned needing to call the doctor and schedule a dentist appointment' },
            { role: 'assistant', content: 'Those sound like important tasks to follow up on!' },
          ],
        });

      const beforeTime = new Date();

      // Finish the journal
      const response = await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(200);

      const afterTime = new Date();
      afterTime.setHours(afterTime.getHours() + 24);

      // Check that todos were created
      const createdTodos = await testDb().select().from(simpleTodos).where(eq(simpleTodos.userId, userId));

      expect(createdTodos.length).toBeGreaterThan(0);

      // Verify expiration times are approximately 24 hours from now
      for (const todo of createdTodos) {
        expect(todo.expirationTime).toBeDefined();
        expect(todo.expirationTime!.getTime()).toBeGreaterThan(beforeTime.getTime() + 23 * 60 * 60 * 1000); // At least 23 hours
        expect(todo.expirationTime!.getTime()).toBeLessThan(afterTime.getTime() + 60 * 60 * 1000); // At most 25 hours
        expect(todo.isCompleted).toBe(false);
      }
    });

    it('should create user attributes when journal is finished with GPT suggestions', async () => {
      // Mock the GPT response to return suggested attributes
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Daily Reflection',
        synopsis: 'User shared thoughts and discovered personality traits',
        summary: 'A reflective journal entry',
        suggestedTags: [],
        suggestedStatTags: {},
        suggestedFamilyTags: {},
        suggestedTodos: [],
        suggestedAttributes: ['Goal-oriented', 'Reflective', 'Growth-minded'],
      });

      const date = '2024-01-18';

      // Create journal in review state
      await testDb()
        .insert(journals)
        .values({
          userId,
          date,
          status: 'in_review',
          initialMessage: 'I spent today reflecting on my goals and thinking about my personal growth.',
          chatSession: [
            { role: 'user', content: 'I spent today reflecting on my goals and thinking about my personal growth.', timestamp: new Date().toISOString() },
            { role: 'assistant', content: 'That sounds like valuable self-reflection!', timestamp: new Date().toISOString() },
          ],
        });

      // Finish the journal
      const finishResponse = await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(finishResponse.status).toBe(200);

      // Verify user attributes were created
      const createdAttributes = await testDb().select().from(schema.userAttributes).where(eq(schema.userAttributes.userId, userId));

      expect(createdAttributes.length).toBe(3);
      expect(createdAttributes.map((attr) => attr.value)).toEqual(expect.arrayContaining(['Goal-oriented', 'Reflective', 'Growth-minded']));
      expect(createdAttributes.every((attr) => attr.source === 'journal_analysis')).toBe(true);
    });
  });
});
