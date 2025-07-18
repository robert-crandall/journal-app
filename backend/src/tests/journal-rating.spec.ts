import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../index';
import request from 'supertest';
import { db } from '../db';
import { journals } from '../db/schema/journals';
import { users } from '../db/schema/users';
import { eq, and } from 'drizzle-orm';
import { createTestUser, generateValidJwt, clearTestUsers } from './test-utils';

describe('Journal Day Rating', () => {
  let userId: string;
  let authToken: string;
  let testDate: string;

  beforeEach(async () => {
    // Create a test user
    const user = await createTestUser();
    userId = user.id;
    authToken = generateValidJwt(user);

    // Generate a unique test date
    const date = new Date();
    testDate = `2025-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Clean up any existing journal for this date
    await db.delete(journals).where(and(eq(journals.userId, userId), eq(journals.date, testDate)));
  });

  afterEach(async () => {
    // Clean up created journal
    await db.delete(journals).where(and(eq(journals.userId, userId), eq(journals.date, testDate)));
    await clearTestUsers();
  });

  it('should save user-provided day rating when updating a journal', async () => {
    // Create a new journal entry
    const createResponse = await request(app).post('/api/journals').set('Authorization', `Bearer ${authToken}`).send({
      date: testDate,
      initialMessage: 'Test journal with rating',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);

    const journalId = createResponse.body.data.id;

    // Update with a day rating
    const updateResponse = await request(app).put(`/api/journals/${testDate}`).set('Authorization', `Bearer ${authToken}`).send({
      dayRating: 4,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.dayRating).toBe(4);

    // Verify the rating was saved in the database
    const journal = await db
      .select()
      .from(journals)
      .where(and(eq(journals.userId, userId), eq(journals.date, testDate)))
      .limit(1);

    expect(journal[0].dayRating).toBe(4);
  });

  it('should infer a day rating when finishing a journal without a user-provided rating', async () => {
    // Create a new journal entry
    const createResponse = await request(app).post('/api/journals').set('Authorization', `Bearer ${authToken}`).send({
      date: testDate,
      initialMessage: 'This was a terrible day. Everything went wrong.',
    });

    expect(createResponse.status).toBe(201);

    // Start reflection
    const startReflectionResponse = await request(app).post(`/api/journals/${testDate}/start-reflection`).set('Authorization', `Bearer ${authToken}`).send({});

    expect(startReflectionResponse.status).toBe(200);
    expect(startReflectionResponse.body.success).toBe(true);

    // Add a chat message
    await request(app).post(`/api/journals/${testDate}/chat`).set('Authorization', `Bearer ${authToken}`).send({
      message: 'I feel awful about today',
    });

    // Finish the journal
    const finishResponse = await request(app).post(`/api/journals/${testDate}/finish`).set('Authorization', `Bearer ${authToken}`).send({});

    expect(finishResponse.status).toBe(200);
    expect(finishResponse.body.success).toBe(true);

    // Verify an inferred rating was generated
    const journal = await db
      .select()
      .from(journals)
      .where(and(eq(journals.userId, userId), eq(journals.date, testDate)))
      .limit(1);

    // The rating should be inferred based on the negative sentiment
    expect(journal[0].inferredDayRating).not.toBeNull();
    // In our simple algorithm, very negative should be a low score (1-2)
    expect(journal[0].inferredDayRating).toBeLessThan(3);
  });

  it('should not override user day rating with inferred rating', async () => {
    // Create a new journal entry
    const createResponse = await request(app).post('/api/journals').set('Authorization', `Bearer ${authToken}`).send({
      date: testDate,
      initialMessage: 'Test journal with user-provided rating',
    });

    expect(createResponse.status).toBe(201);

    // Set a user-provided rating
    await request(app).put(`/api/journals/${testDate}`).set('Authorization', `Bearer ${authToken}`).send({
      dayRating: 5,
    });

    // Start reflection
    await request(app).post(`/api/journals/${testDate}/start-reflection`).set('Authorization', `Bearer ${authToken}`).send({});

    // Add a negative chat message (contradicting the 5 rating)
    await request(app).post(`/api/journals/${testDate}/chat`).set('Authorization', `Bearer ${authToken}`).send({
      message: 'Actually, today was terrible',
    });

    // Finish the journal
    await request(app).post(`/api/journals/${testDate}/finish`).set('Authorization', `Bearer ${authToken}`).send({});

    // Verify the user rating was not overridden
    const journal = await db
      .select()
      .from(journals)
      .where(and(eq(journals.userId, userId), eq(journals.date, testDate)))
      .limit(1);

    expect(journal[0].dayRating).toBe(5); // User rating preserved
    expect(journal[0].inferredDayRating).toBeNull(); // No inferred rating since user provided one
  });
});
