import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testDb } from './setup';
import { users } from '../db/schema/users';
import { characterStats } from '../db/schema/stats';
import { journals, journalContentTags, journalToneTags, journalStatTags } from '../db/schema/journals';
import { sign } from 'hono/jwt';
import { env } from '../env';
import { hashPassword } from '../utils/auth';
import { eq } from 'drizzle-orm';
import appExport from '../index';

// Get database connection
const db = testDb();

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

// Mock the analyze function to avoid actual API calls during tests
vi.mock('../utils/gpt', async (importOriginal: any) => {
  const mod = await importOriginal();
  return {
    ...mod,
    analyzeJournalEntry: vi.fn().mockResolvedValue({
      summary: 'Test summary',
      synopsis: 'Test synopsis',
      title: 'Test Journal Title',
      contentTags: ['work', 'stress', 'coding'],
      toneTags: ['focused', 'tired'],
      statTags: [
        { statId: 'test-stat-id', xp: 20 },
      ],
    }),
  };
});

describe('Journal API', () => {
  let userId: string;
  let token: string;
  let statId: string;
  let journalId: string;
  
  // Set up test data before each test
  beforeEach(async () => {
    // Clean up any existing data
    await db.delete(journalStatTags);
    await db.delete(journalToneTags);
    await db.delete(journalContentTags);
    await db.delete(journals);
    await db.delete(characterStats);
    await db.delete(users);
    
    // Create a test user
    const password = await hashPassword('test-password');
    const [user] = await db
      .insert(users)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password,
      })
      .returning();
    
    userId = user.id;
    
    // Create a token for authentication
    token = await sign(
      {
        id: userId,
        email: user.email,
        name: user.name,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      env.JWT_SECRET,
    );
    
    // Create a test stat
    const [stat] = await db
      .insert(characterStats)
      .values({
        userId,
        name: 'Test Stat',
        description: 'A test stat for journal tests',
        totalXp: 0,
      })
      .returning();
    
    statId = stat.id;
  });
  
  // Clean up after each test
  afterEach(async () => {
    await db.delete(journalStatTags);
    await db.delete(journalToneTags);
    await db.delete(journalContentTags);
    await db.delete(journals);
    await db.delete(characterStats);
    await db.delete(users);
  });
  
  describe('POST /api/journal', () => {
    it('should create a new journal entry', async () => {
      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: 'This is a test journal entry',
          journalDate: '2025-07-10',
        }),
      });
      
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.content).toBe('This is a test journal entry');
      expect(data.data.journalDate).toBe('2025-07-10');
      expect(data.data.isFinalized).toBe(false);
      
      // Save the journal ID for later tests
      journalId = data.data.id;
    });
    
    it('should return 409 when creating a journal entry for an existing date', async () => {
      // Create initial journal entry
      await db
        .insert(journals)
        .values({
          userId,
          content: 'Existing journal entry',
          journalDate: '2025-07-11',
          isFinalized: false,
        });
      
      // Attempt to create another entry for the same date
      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: 'This should fail',
          journalDate: '2025-07-11',
        }),
      });
      
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('A journal entry for this date already exists');
    });
  });
  
  describe('GET /api/journal', () => {
    beforeEach(async () => {
      // Create some test journal entries
      await db
        .insert(journals)
        .values([
          {
            userId,
            content: 'Journal entry 1',
            journalDate: '2025-07-01',
            isFinalized: true,
            title: 'Entry 1',
          },
          {
            userId,
            content: 'Journal entry 2',
            journalDate: '2025-07-02',
            isFinalized: false,
          },
        ]);
    });
    
    it('should return all journal entries for the user', async () => {
      const res = await app.request('/api/journal', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(2);
      expect(data.data[0].journalDate).toBe('2025-07-02'); // Sorted by date desc
      expect(data.data[1].journalDate).toBe('2025-07-01');
    });
  });
  
  describe('GET /api/journal/:id', () => {
    let testJournalId: string;
    
    beforeEach(async () => {
      // Create a test journal entry
      const [journal] = await db
        .insert(journals)
        .values({
          userId,
          content: 'Test journal content',
          journalDate: '2025-07-15',
          isFinalized: true,
          title: 'Test Journal',
          summary: 'Test summary',
          synopsis: 'Test synopsis',
        })
        .returning();
      
      testJournalId = journal.id;
      
      // Add some tags
      await db
        .insert(journalContentTags)
        .values([
          { journalId: testJournalId, tag: 'work' },
          { journalId: testJournalId, tag: 'productivity' },
        ]);
      
      await db
        .insert(journalToneTags)
        .values([
          { journalId: testJournalId, tag: 'happy' },
        ]);
      
      await db
        .insert(journalStatTags)
        .values([
          { journalId: testJournalId, statId, xpAmount: 15 },
        ]);
    });
    
    it('should return a journal entry with its tags', async () => {
      const res = await app.request(`/api/journal/${testJournalId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id', testJournalId);
      expect(data.data).toHaveProperty('content', 'Test journal content');
      
      // Check for tags
      expect(data.data).toHaveProperty('contentTags');
      expect(data.data.contentTags).toContain('work');
      expect(data.data.contentTags).toContain('productivity');
      
      expect(data.data).toHaveProperty('toneTags');
      expect(data.data.toneTags).toContain('happy');
      
      expect(data.data).toHaveProperty('statTags');
      expect(data.data.statTags).toHaveLength(1);
      expect(data.data.statTags[0].statId).toBe(statId);
      expect(data.data.statTags[0].xpAmount).toBe(15);
    });
    
    it('should return 404 for non-existent journal', async () => {
      const res = await app.request('/api/journal/00000000-0000-0000-0000-000000000000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Journal not found');
    });
  });
  
  describe('PUT /api/journal/:id', () => {
    let testJournalId: string;
    
    beforeEach(async () => {
      // Create a test journal entry
      const [journal] = await db
        .insert(journals)
        .values({
          userId,
          content: 'Original content',
          journalDate: '2025-07-20',
          isFinalized: false,
        })
        .returning();
      
      testJournalId = journal.id;
    });
    
    it('should update a journal entry', async () => {
      const res = await app.request(`/api/journal/${testJournalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: 'Updated content',
        }),
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.content).toBe('Updated content');
      
      // Verify in database
      const journalEntries = await db
        .select()
        .from(journals)
        .where(eq(journals.id, testJournalId));
      
      expect(journalEntries[0].content).toBe('Updated content');
    });
    
    it('should not allow updating a finalized journal', async () => {
      // Finalize the journal
      await db
        .update(journals)
        .set({ isFinalized: true })
        .where(eq(journals.id, testJournalId));
      
      const res = await app.request(`/api/journal/${testJournalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: 'Should not update',
        }),
      });
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot update a finalized journal entry');
    });
  });
  
  describe('DELETE /api/journal/:id', () => {
    let testJournalId: string;
    
    beforeEach(async () => {
      // Create a test journal entry with tags
      const [journal] = await db
        .insert(journals)
        .values({
          userId,
          content: 'Journal to delete',
          journalDate: '2025-07-25',
          isFinalized: false,
        })
        .returning();
      
      testJournalId = journal.id;
      
      // Add some tags
      await db
        .insert(journalContentTags)
        .values([
          { journalId: testJournalId, tag: 'delete-test' },
        ]);
    });
    
    it('should delete a journal entry and its tags', async () => {
      const res = await app.request(`/api/journal/${testJournalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      
      // Verify journal is deleted
      const journalEntries = await db
        .select()
        .from(journals)
        .where(eq(journals.id, testJournalId));
      
      expect(journalEntries.length).toBe(0);
      
      // Verify tags are deleted
      const contentTags = await db
        .select()
        .from(journalContentTags)
        .where(eq(journalContentTags.journalId, testJournalId));
      
      expect(contentTags.length).toBe(0);
    });
  });
  
  describe('GET /api/journal/date/:date', () => {
    beforeEach(async () => {
      // Create a test journal entry
      await db
        .insert(journals)
        .values({
          userId,
          content: 'Date-specific journal',
          journalDate: '2025-08-01',
          isFinalized: true,
          title: 'August 1st',
        })
        .returning();
    });
    
    it('should return journal for a specific date', async () => {
      const res = await app.request('/api/journal/date/2025-08-01', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.journalDate).toBe('2025-08-01');
      expect(data.data.content).toBe('Date-specific journal');
    });
    
    it('should return 404 for date with no journal', async () => {
      const res = await app.request('/api/journal/date/2025-08-02', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('No journal found for the specified date');
    });
  });
  
  describe('POST /api/journal/finalize', () => {
    let testJournalId: string;
    
    beforeEach(async () => {
      // Create a test journal entry
      const [journal] = await db
        .insert(journals)
        .values({
          userId,
          content: 'Journal to finalize',
          journalDate: '2025-08-10',
          isFinalized: false,
        })
        .returning();
      
      testJournalId = journal.id;
    });
    
    it('should finalize and analyze a journal entry', async () => {
      const res = await app.request('/api/journal/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: testJournalId,
        }),
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      
      // Verify journal is finalized
      const journalEntries = await db
        .select()
        .from(journals)
        .where(eq(journals.id, testJournalId));
      
      expect(journalEntries[0].isFinalized).toBe(true);
      expect(journalEntries[0].title).toBe('Test Journal Title');
      expect(journalEntries[0].summary).toBe('Test summary');
      expect(journalEntries[0].synopsis).toBe('Test synopsis');
      expect(journalEntries[0].analyzedAt).not.toBeNull();
      
      // Check tags were created
      const contentTags = await db
        .select()
        .from(journalContentTags)
        .where(eq(journalContentTags.journalId, testJournalId));
      
      expect(contentTags.length).toBe(3); // work, stress, coding
      
      const toneTags = await db
        .select()
        .from(journalToneTags)
        .where(eq(journalToneTags.journalId, testJournalId));
      
      expect(toneTags.length).toBe(2); // focused, tired
      
      const statTagsResults = await db
        .select()
        .from(journalStatTags)
        .where(eq(journalStatTags.journalId, testJournalId));
      
      expect(statTagsResults.length).toBe(1);
    });
    
    it('should not allow finalizing an already finalized journal', async () => {
      // First finalize the journal
      await db
        .update(journals)
        .set({ isFinalized: true })
        .where(eq(journals.id, testJournalId));
      
      // Attempt to finalize again
      const res = await app.request('/api/journal/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: testJournalId,
        }),
      });
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Journal is already finalized');
    });
  });
});
