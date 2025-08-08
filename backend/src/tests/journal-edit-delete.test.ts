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

const { journals, xpGrants, simpleTodos, characterStats, familyMembers, tags, userAttributes } = schema;

describe('Journal Edit/Delete with XP Management', () => {
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
      email: getUniqueEmail('journal-edit-delete'),
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
    // Clean up mocks
    if (mockGenerateJournalMetadata) {
      mockGenerateJournalMetadata.mockRestore();
    }
    vi.restoreAllMocks();

    // Clean up test data
    await testDb().delete(userAttributes).where(eq(userAttributes.userId, userId));
    await testDb().delete(simpleTodos).where(eq(simpleTodos.userId, userId));
    await testDb().delete(xpGrants).where(eq(xpGrants.userId, userId));
    await testDb().delete(journals).where(eq(journals.userId, userId));
    await testDb().delete(characterStats).where(eq(characterStats.userId, userId));
    await testDb().delete(familyMembers).where(eq(familyMembers.userId, userId));
    await testDb().delete(tags).where(eq(tags.userId, userId));
  });

  describe('Journal Deletion with XP Cleanup', () => {
    it('should delete journal and all associated XP grants, then recalculate stat totals', async () => {
      // Mock the GPT response
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Fitness Day',
        synopsis: 'User worked out and felt great',
        summary: 'A productive workout session',
        suggestedTags: [],
        suggestedStatTags: {
          [testStat[0].id]: { xp: 25, reason: 'Completed workout' },
        },
        suggestedFamilyTags: {
          [testFamilyMember[0].id]: { xp: 15, reason: 'Talked about fitness goals with John' },
        },
        suggestedTodos: [],
      });

      const date = '2024-01-20';

      // Create and complete a journal with XP grants
      await testDb()
        .insert(journals)
        .values({
          userId,
          date,
          status: 'in_review',
          initialMessage: 'Had a great workout today and talked to John about fitness',
          chatSession: [
            { role: 'user', content: 'Had a great workout today' },
            { role: 'assistant', content: 'That sounds fantastic!' },
          ],
        });

      // Complete the journal to generate XP grants
      const finishResponse = await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(finishResponse.status).toBe(200);

      // Verify XP grants were created
      const xpGrantsBefore = await testDb()
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal')));

      expect(xpGrantsBefore.length).toBeGreaterThan(0);

      // Verify stat XP was updated
      const statBefore = await testDb().select().from(characterStats).where(eq(characterStats.id, testStat[0].id)).limit(1);

      expect(statBefore[0].totalXp).toBe(25);

      // Verify family member XP was updated
      const familyBefore = await testDb().select().from(familyMembers).where(eq(familyMembers.id, testFamilyMember[0].id)).limit(1);

      expect(familyBefore[0].connectionXp).toBe(15);

      // Now delete the journal
      const deleteResponse = await app.request(`/api/journals/${date}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(deleteResponse.status).toBe(200);
      const deleteData = await deleteResponse.json();
      expect(deleteData.success).toBe(true);

      // Verify journal was deleted
      const journalAfter = await testDb()
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)));

      expect(journalAfter.length).toBe(0);

      // Verify all XP grants were deleted
      const xpGrantsAfter = await testDb()
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal')));

      expect(xpGrantsAfter.length).toBe(0);

      // Verify stat total XP was recalculated (should be 0)
      const statAfter = await testDb().select().from(characterStats).where(eq(characterStats.id, testStat[0].id)).limit(1);

      expect(statAfter[0].totalXp).toBe(0);

      // Verify family member XP was recalculated (should be 0)
      const familyAfter = await testDb().select().from(familyMembers).where(eq(familyMembers.id, testFamilyMember[0].id)).limit(1);

      expect(familyAfter[0].connectionXp).toBe(0);
    });

    it('should handle deletion of journal with content tags (0 XP)', async () => {
      // Create test tags
      const testTags = await testDb()
        .insert(tags)
        .values([
          { userId, name: 'fitness' },
          { userId, name: 'motivation' },
        ])
        .returning();

      // Mock the GPT response with content tags
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Motivational Fitness Day',
        synopsis: 'User felt motivated about fitness',
        summary: 'A day of fitness motivation',
        suggestedTags: [testTags[0].id, testTags[1].id],
        suggestedStatTags: {},
        suggestedFamilyTags: {},
        suggestedTodos: [],
      });

      const date = '2024-01-21';

      // Create and complete journal
      await testDb().insert(journals).values({
        userId,
        date,
        status: 'in_review',
        initialMessage: 'Feeling very motivated about fitness today',
        chatSession: [],
      });

      await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      // Verify content tag grants were created
      const contentTagGrants = await testDb()
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal'), eq(xpGrants.entityType, 'content_tag')));

      expect(contentTagGrants.length).toBe(2);
      expect(contentTagGrants.every((grant) => grant.xpAmount === 0)).toBe(true);

      // Delete the journal
      const deleteResponse = await app.request(`/api/journals/${date}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(deleteResponse.status).toBe(200);

      // Verify content tag grants were deleted
      const contentTagGrantsAfter = await testDb()
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal'), eq(xpGrants.entityType, 'content_tag')));

      expect(contentTagGrantsAfter.length).toBe(0);
    });
  });

  describe('Journal Editing with XP Cleanup and Re-finalization', () => {
    it('should edit journal, clean up existing XP grants, and reset to draft status', async () => {
      // Mock the GPT response for initial completion
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Original Workout',
        synopsis: 'User worked out',
        summary: 'A workout day',
        suggestedTags: [],
        suggestedStatTags: {
          [testStat[0].id]: { xp: 20, reason: 'Initial workout' },
        },
        suggestedFamilyTags: {},
        suggestedTodos: [],
      });

      const date = '2024-01-22';

      // Create and complete journal
      await testDb().insert(journals).values({
        userId,
        date,
        status: 'in_review',
        initialMessage: 'Did a moderate workout today',
        chatSession: [],
      });

      await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      // Verify initial XP grants and stat update
      const initialXpGrants = await testDb()
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal')));

      expect(initialXpGrants.length).toBe(1);
      expect(initialXpGrants[0].xpAmount).toBe(20);

      const initialStat = await testDb().select().from(characterStats).where(eq(characterStats.id, testStat[0].id)).limit(1);

      expect(initialStat[0].totalXp).toBe(20);

      // Now edit the journal
      const editResponse = await app.request(`/api/journals/${date}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          initialMessage: 'Had an amazing intense workout today, pushed myself hard',
          dayRating: 5,
        }),
      });

      expect(editResponse.status).toBe(200);
      const editData = await editResponse.json();
      expect(editData.success).toBe(true);
      expect(editData.data.status).toBe('draft');
      expect(editData.data.initialMessage).toBe('Had an amazing intense workout today, pushed myself hard');
      expect(editData.data.dayRating).toBe(5);

      // Verify old XP grants were deleted
      const xpGrantsAfterEdit = await testDb()
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal')));

      expect(xpGrantsAfterEdit.length).toBe(0);

      // Verify stat total was recalculated (should be 0 now)
      const statAfterEdit = await testDb().select().from(characterStats).where(eq(characterStats.id, testStat[0].id)).limit(1);

      expect(statAfterEdit[0].totalXp).toBe(0);

      // Verify AI-generated content was cleared
      const journalAfterEdit = await testDb()
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .limit(1);

      expect(journalAfterEdit[0].summary).toBe(null);
      expect(journalAfterEdit[0].title).toBe(null);
      expect(journalAfterEdit[0].synopsis).toBe(null);
      expect(journalAfterEdit[0].toneTags).toBe(null);
    });

    it('should handle editing a draft journal without XP cleanup', async () => {
      const date = '2024-01-23';

      // Create a draft journal (no XP grants created yet)
      await testDb().insert(journals).values({
        userId,
        date,
        status: 'draft',
        initialMessage: 'Just a draft entry',
      });

      // Edit the draft journal
      const editResponse = await app.request(`/api/journals/${date}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          initialMessage: 'Updated draft entry with more details',
          dayRating: 4,
        }),
      });

      expect(editResponse.status).toBe(200);
      const editData = await editResponse.json();
      expect(editData.success).toBe(true);
      expect(editData.data.status).toBe('draft');
      expect(editData.data.initialMessage).toBe('Updated draft entry with more details');

      // Verify no XP grants exist (since it was always a draft)
      const xpGrantsAfterEdit = await testDb()
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal')));

      expect(xpGrantsAfterEdit.length).toBe(0);
    });

    it('should allow re-completing the edited journal with new XP grants', async () => {
      // Mock responses for both completion phases
      (mockGenerateJournalMetadata as any)
        .mockResolvedValueOnce({
          title: 'Original Entry',
          synopsis: 'Original',
          summary: 'Original',
          suggestedTags: [],
          suggestedStatTags: {
            [testStat[0].id]: { xp: 15, reason: 'Original activity' },
          },
          suggestedFamilyTags: {},
          suggestedTodos: [],
        })
        .mockResolvedValueOnce({
          title: 'Updated Entry',
          synopsis: 'Updated and improved',
          summary: 'Much better activity',
          suggestedTags: [],
          suggestedStatTags: {
            [testStat[0].id]: { xp: 30, reason: 'Improved activity' },
          },
          suggestedFamilyTags: {},
          suggestedTodos: [],
        });

      const date = '2024-01-24';

      // Create, complete, edit, then re-complete journal
      await testDb().insert(journals).values({
        userId,
        date,
        status: 'in_review',
        initialMessage: 'Original message',
      });

      // First completion
      await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      // Verify first XP grant
      let stat = await testDb().select().from(characterStats).where(eq(characterStats.id, testStat[0].id)).limit(1);

      expect(stat[0].totalXp).toBe(15);

      // Edit the journal
      await app.request(`/api/journals/${date}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          initialMessage: 'Updated message with more intensity',
        }),
      });

      // Verify XP was reset
      stat = await testDb().select().from(characterStats).where(eq(characterStats.id, testStat[0].id)).limit(1);

      expect(stat[0].totalXp).toBe(0);

      // Start reflection and finish again
      await app.request(`/api/journals/${date}/start-reflection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const secondFinishResponse = await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(secondFinishResponse.status).toBe(200);

      // Verify new XP grant with updated amount
      stat = await testDb().select().from(characterStats).where(eq(characterStats.id, testStat[0].id)).limit(1);

      expect(stat[0].totalXp).toBe(30);

      // Verify the journal has new content
      const finalJournal = await testDb()
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .limit(1);

      expect(finalJournal[0].title).toBe('Updated Entry');
      expect(finalJournal[0].synopsis).toBe('Updated and improved');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when trying to delete non-existent journal', async () => {
      const response = await app.request('/api/journals/2024-12-31', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Journal not found');
    });

    it('should return 404 when trying to edit non-existent journal', async () => {
      const response = await app.request('/api/journals/2024-12-31/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          initialMessage: 'This should fail',
        }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Journal not found');
    });
  });
});
