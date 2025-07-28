import { describe, test, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail, schema } from './setup';
import { eq } from 'drizzle-orm';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

const { journals } = schema;

let authToken: string;
let userId: string;

beforeEach(async () => {
  // Create test user and get auth token
  const testUser = {
    name: 'Test User',
    email: getUniqueEmail('tone-filter'),
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

  // Create test journals with different tone tags
  const db = testDb();
  await db.insert(journals).values([
    {
      userId,
      date: '2024-01-15',
      status: 'complete',
      initialMessage: 'Had a great day!',
      title: 'Happy Day',
      synopsis: 'A wonderful day',
      toneTags: ['happy', 'energized'],
      summary: 'Test summary',
    },
    {
      userId,
      date: '2024-01-16',
      status: 'complete',
      initialMessage: 'Feeling overwhelmed with work',
      title: 'Stressful Day',
      synopsis: 'Work was too much',
      toneTags: ['overwhelmed', 'anxious'],
      summary: 'Test summary',
    },
    {
      userId,
      date: '2024-01-17',
      status: 'complete',
      initialMessage: 'Just a regular day',
      title: 'Normal Day',
      synopsis: 'Nothing special',
      toneTags: ['calm'],
      summary: 'Test summary',
    },
    {
      userId,
      date: '2024-01-18',
      status: 'complete',
      initialMessage: 'Feeling angry about situation',
      title: 'Angry Day',
      synopsis: 'Very frustrated',
      toneTags: ['angry', 'sad'],
      summary: 'Test summary',
    },
    {
      userId,
      date: '2024-01-19',
      status: 'complete',
      initialMessage: 'No specific emotions today',
      title: 'Neutral Day',
      synopsis: 'Just a day',
      toneTags: null, // No tone tags
      summary: 'Test summary',
    },
  ]);
});

describe('Journal Tone Tag Filtering', () => {
  test('should filter journals by tone tag - happy', async () => {
    const response = await app.request('/api/journals?toneTag=happy', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.journals).toHaveLength(1);
    expect(data.data.journals[0].title).toBe('Happy Day');
    expect(data.data.journals[0].toneTags).toContain('happy');
  });

  test('should filter journals by tone tag - overwhelmed', async () => {
    const response = await app.request('/api/journals?toneTag=overwhelmed', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.journals).toHaveLength(1);
    expect(data.data.journals[0].title).toBe('Stressful Day');
    expect(data.data.journals[0].toneTags).toContain('overwhelmed');
  });

  test('should filter journals by tone tag - calm', async () => {
    const response = await app.request('/api/journals?toneTag=calm', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.journals).toHaveLength(1);
    expect(data.data.journals[0].title).toBe('Normal Day');
    expect(data.data.journals[0].toneTags).toContain('calm');
  });

  test('should return correct results for tone tag present in multiple journals', async () => {
    const response = await app.request('/api/journals?toneTag=energized', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.journals).toHaveLength(1); // Only the 'Happy Day' journal has 'energized'
    expect(data.data.journals[0].title).toBe('Happy Day');
  });

  test('should return all journals when no tone tag filter is applied', async () => {
    const response = await app.request('/api/journals', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.journals).toHaveLength(5); // All 5 test journals
  });

  test('should combine tone tag filter with other filters', async () => {
    const response = await app.request('/api/journals?toneTag=angry&search=angry', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.journals).toHaveLength(1);
    expect(data.data.journals[0].title).toBe('Angry Day');
    expect(data.data.journals[0].toneTags).toContain('angry');
  });

  test('should validate tone tag parameter', async () => {
    const response = await app.request('/api/journals?toneTag=invalid_tone', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(400); // Should be rejected by validation
  });

  test('should require authentication for tone tag filtering', async () => {
    const response = await app.request('/api/journals?toneTag=happy');

    expect(response.status).toBe(401);
  });

  test('should return empty results for tone tag not present in any journal', async () => {
    const response = await app.request('/api/journals?toneTag=happy&search=nonexistent', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.journals).toHaveLength(0); // No journals match both filters
  });
});
