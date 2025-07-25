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

const { journals } = schema;

describe('Journal Tone Tags Integration', () => {
  let userId: string;
  let authToken: string;
  let mockGenerateJournalMetadata: any;

  beforeEach(async () => {
    // Set up the mock for generateJournalMetadata
    mockGenerateJournalMetadata = vi.spyOn(gptModule, 'generateJournalMetadata');

    // Create test user and get auth token
    const testUser = {
      name: 'Test User',
      email: getUniqueEmail('journal-tone'),
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
  });

  afterEach(async () => {
    // Clean up test data
    await testDb().delete(journals).where(eq(journals.userId, userId));
  });

  describe('Tone Tags Extraction on Journal Completion', () => {
    it('should extract and store tone tags when journal is finished', async () => {
      // Mock the GPT response to return tone tags
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'A Joyful and Energetic Day',
        synopsis: 'User experienced happiness and high energy throughout the day',
        summary: 'Today was filled with positive emotions and good energy',
        suggestedTags: [],
        suggestedStatTags: {},
        suggestedFamilyTags: {},
        toneTags: ['happy', 'energized'],
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
          initialMessage: 'Today I felt really happy and energetic!',
          chatSession: [
            { role: 'user', content: 'Today I felt really happy and energetic!' },
            { role: 'assistant', content: 'That sounds wonderful! Can you tell me more about what made you feel so positive?' },
          ],
        });

      // Finish the journal (this will trigger GPT analysis and tone tag extraction)
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

      // Verify that tone tags were extracted and stored
      expect(data.data.toneTags).toEqual(['happy', 'energized']);

      // Verify in database
      const journalInDb = await testDb()
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.date, date)))
        .limit(1);

      expect(journalInDb.length).toBe(1);
      expect(journalInDb[0].toneTags).toEqual(['happy', 'energized']);
      expect(journalInDb[0].status).toBe('complete');
    });

    it('should store all tone tags returned by GPT', async () => {
      // Mock the GPT response to return multiple tone tags
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Complex Emotional Day',
        synopsis: 'User experienced multiple emotions',
        summary: 'A day with many different feelings',
        suggestedTags: [],
        suggestedStatTags: {},
        suggestedFamilyTags: {},
        toneTags: ['happy', 'anxious', 'overwhelmed', 'calm'], // Multiple tags
        suggestedTodos: [],
      });

      const date = '2024-01-16';

      // Create journal in review state
      await testDb()
        .insert(journals)
        .values({
          userId,
          date,
          status: 'in_review',
          initialMessage: 'Today I had so many different emotions...',
          chatSession: [
            { role: 'user', content: 'Today I had so many different emotions...' },
            { role: 'assistant', content: 'That sounds like it was quite a day. Tell me more about what you experienced.' },
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
      const data = await response.json();
      expect(data.success).toBe(true);

      // Should include all valid tone tags
      expect(data.data.toneTags).toEqual(['happy', 'anxious', 'overwhelmed', 'calm']);
    });

    it('should filter out invalid tone tags and only keep valid ones', async () => {
      // Mock the GPT response to return some invalid tone tags
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Mixed Day',
        synopsis: 'User had various feelings',
        summary: 'A day with mixed emotions',
        suggestedTags: [],
        suggestedStatTags: {},
        suggestedFamilyTags: {},
        toneTags: ['happy', 'invalid_tag', 'excited', 'sad'], // Contains invalid tag
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
          initialMessage: 'Mixed feelings today...',
          chatSession: [
            { role: 'user', content: 'Mixed feelings today...' },
            { role: 'assistant', content: 'I can hear that in your message. What kind of mixed feelings?' },
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
      const data = await response.json();
      expect(data.success).toBe(true);

      // Should only include valid tone tags, and filter out 'invalid_tag' and 'excited' (not in allowed list)
      // Should keep 'happy' and 'sad' (both are valid)
      expect(data.data.toneTags).toEqual(['happy', 'sad']);
    });

    it('should handle empty tone tags gracefully', async () => {
      // Mock the GPT response to return no tone tags
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Neutral Day',
        synopsis: 'User had a neutral day',
        summary: 'A regular day without strong emotions',
        suggestedTags: [],
        suggestedStatTags: {},
        suggestedFamilyTags: {},
        toneTags: [], // No tone tags
        suggestedTodos: [],
      });

      const date = '2024-01-18';

      // Create journal in review state
      await testDb()
        .insert(journals)
        .values({
          userId,
          date,
          status: 'in_review',
          initialMessage: 'Just a regular day today.',
          chatSession: [
            { role: 'user', content: 'Just a regular day today.' },
            { role: 'assistant', content: 'Sometimes regular days can be quite nice too. How are you feeling about that?' },
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
      const data = await response.json();
      expect(data.success).toBe(true);

      // Should have empty tone tags array
      expect(data.data.toneTags).toEqual([]);
    });

    it('should handle case-insensitive tone tags and normalize to lowercase', async () => {
      // Mock the GPT response to return tone tags with different cases
      (mockGenerateJournalMetadata as any).mockResolvedValue({
        title: 'Happy Day',
        synopsis: 'User was happy',
        summary: 'A happy day',
        suggestedTags: [],
        suggestedStatTags: {},
        suggestedFamilyTags: {},
        toneTags: ['HAPPY', 'Calm'], // Mixed case
        suggestedTodos: [],
      });

      const date = '2024-01-19';

      // Create journal in review state
      await testDb()
        .insert(journals)
        .values({
          userId,
          date,
          status: 'in_review',
          initialMessage: 'Feeling really happy and calm today!',
          chatSession: [
            { role: 'user', content: 'Feeling really happy and calm today!' },
            { role: 'assistant', content: "That's wonderful to hear! What contributed to those positive feelings?" },
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
      const data = await response.json();
      expect(data.success).toBe(true);

      // Should normalize to lowercase
      expect(data.data.toneTags).toEqual(['happy', 'calm']);
    });
  });

  describe('Tone Tags in Journal Responses', () => {
    it('should include tone tags in journal list responses', async () => {
      // Create a completed journal with tone tags
      await testDb()
        .insert(journals)
        .values({
          userId,
          date: '2024-01-20',
          status: 'complete',
          initialMessage: 'Happy day!',
          title: 'Happy Day',
          synopsis: 'A joyful day',
          toneTags: ['happy', 'energized'],
        });

      // Get journal list
      const response = await app.request('/api/journals', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.journals).toHaveLength(1);
      expect(data.data.journals[0].toneTags).toEqual(['happy', 'energized']);
    });

    it('should include tone tags in individual journal responses', async () => {
      const date = '2024-01-21';

      // Create a completed journal with tone tags
      await testDb()
        .insert(journals)
        .values({
          userId,
          date,
          status: 'complete',
          initialMessage: 'Anxious day',
          title: 'Anxious Day',
          synopsis: 'Feeling overwhelmed',
          toneTags: ['anxious', 'overwhelmed'],
        });

      // Get individual journal
      const response = await app.request(`/api/journals/${date}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.toneTags).toEqual(['anxious', 'overwhelmed']);
    });
  });
});
