import { describe, test, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail, cleanDatabase } from './setup';
import { familyMembers, familyTaskFeedback } from '../db/schema';
import { eq } from 'drizzle-orm';
import { validAvatarBase64, validWebpAvatarBase64, invalidMimeType, invalidBase64Data } from './test-data/avatars';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Family API', () => {
  let authToken: string;
  let userId: string;
  let testUser: { name: string; email: string; password: string };

  beforeEach(async () => {
    // Generate unique email for each test
    testUser = {
      name: 'Test User',
      email: getUniqueEmail('family'),
      password: 'password123',
    };

    // Register and login test user
    const registerResponse = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(testUser),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(registerResponse.status).toBe(201);

    const loginResponse = await app.request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        rememberMe: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(loginResponse.status).toBe(200);

    const loginData = await loginResponse.json();
    authToken = loginData.token;
    userId = loginData.user.id;
  });

  describe('POST /api/family', () => {
    test('should create a new family member', async () => {
      const familyMemberData = {
        name: 'John',
        relationship: 'eldest son',
        birthday: '2010-05-15',
        likes: 'soccer, video games',
        dislikes: 'vegetables',
      };

      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify(familyMemberData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status !== 201) {
        const errorData = await response.text();
        console.log('Error response:', response.status, errorData);
      }

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(familyMemberData.name);
      expect(data.data.relationship).toBe(familyMemberData.relationship);
      expect(data.data.birthday).toBe(familyMemberData.birthday);
      expect(data.data.likes).toBe(familyMemberData.likes);
      expect(data.data.dislikes).toBe(familyMemberData.dislikes);
      expect(data.data.userId).toBe(userId);
    });

    test('should create a minimal family member (only required fields)', async () => {
      const familyMemberData = {
        name: 'Sarah',
        relationship: 'wife',
      };

      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify(familyMemberData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(familyMemberData.name);
      expect(data.data.relationship).toBe(familyMemberData.relationship);
      expect(data.data.birthday).toBe(null);
      expect(data.data.likes).toBe(null);
      expect(data.data.dislikes).toBe(null);
    });

    test('should require authentication', async () => {
      const familyMemberData = {
        name: 'John',
        relationship: 'son',
      };

      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify(familyMemberData),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });

    test('should validate required fields', async () => {
      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify({ name: 'John' }), // missing relationship
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(400);
    });

    test('should create family member with avatar', async () => {
      const familyMemberData = {
        name: 'Avatar Family Member',
        relationship: 'daughter',
        avatar: validAvatarBase64,
      };

      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify(familyMemberData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(familyMemberData.name);
      expect(data.data.avatar).toBe(validAvatarBase64);

      // Verify in database
      const dbMembers = await testDb().select().from(familyMembers).where(eq(familyMembers.id, data.data.id));
      expect(dbMembers[0].avatar).toBe(validAvatarBase64);
    });

    test('should reject invalid avatar format', async () => {
      const familyMemberData = {
        name: 'Invalid Avatar Member',
        relationship: 'son',
        avatar: invalidMimeType,
      };

      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify(familyMemberData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/family', () => {
    let familyMember1Id: string;
    let familyMember2Id: string;

    beforeEach(async () => {
      // Create test family members
      const member1Response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John',
          relationship: 'eldest son',
          likes: 'soccer',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const member1Data = await member1Response.json();
      familyMember1Id = member1Data.data.id;

      const member2Response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Sarah',
          relationship: 'wife',
          likes: 'reading',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const member2Data = await member2Response.json();
      familyMember2Id = member2Data.data.id;
    });

    test('should return all family members for user', async () => {
      const response = await app.request('/api/family', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data.find((m: any) => m.name === 'John')).toBeDefined();
      expect(data.data.find((m: any) => m.name === 'Sarah')).toBeDefined();
    });

    test('should require authentication', async () => {
      const response = await app.request('/api/family');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/family/:id', () => {
    let familyMemberId: string;

    beforeEach(async () => {
      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John',
          relationship: 'son',
          likes: 'soccer',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      familyMemberId = data.data.id;
    });

    test('should return specific family member', async () => {
      const response = await app.request(`/api/family/${familyMemberId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('John');
      expect(data.data.relationship).toBe('son');
    });

    test('should return 404 for non-existent family member', async () => {
      const response = await app.request('/api/family/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const response = await app.request(`/api/family/${familyMemberId}`);
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/family/:id', () => {
    let familyMemberId: string;

    beforeEach(async () => {
      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John',
          relationship: 'son',
          likes: 'soccer',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      familyMemberId = data.data.id;
    });

    test('should update family member', async () => {
      const updateData = {
        name: 'John Jr.',
        likes: 'soccer, basketball',
        dislikes: 'homework',
      };

      const response = await app.request(`/api/family/${familyMemberId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('John Jr.');
      expect(data.data.likes).toBe('soccer, basketball');
      expect(data.data.dislikes).toBe('homework');
      expect(data.data.relationship).toBe('son'); // Unchanged field
    });

    test('should allow partial updates', async () => {
      const updateData = {
        dislikes: 'vegetables',
      };

      const response = await app.request(`/api/family/${familyMemberId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('John'); // Unchanged
      expect(data.data.dislikes).toBe('vegetables'); // Updated
    });

    test('should return 404 for non-existent family member', async () => {
      const response = await app.request('/api/family/00000000-0000-0000-0000-000000000000', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const response = await app.request(`/api/family/${familyMemberId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/family/:id', () => {
    let familyMemberId: string;

    beforeEach(async () => {
      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John',
          relationship: 'son',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      familyMemberId = data.data.id;
    });

    test('should delete family member', async () => {
      const response = await app.request(`/api/family/${familyMemberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify deletion
      const getResponse = await app.request(`/api/family/${familyMemberId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(getResponse.status).toBe(404);
    });

    test('should delete associated feedback when deleting family member', async () => {
      // Add feedback first
      await app.request(`/api/family/${familyMemberId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          familyMemberId,
          taskDescription: 'Played soccer',
          feedback: 'Great fun!',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Delete family member
      const deleteResponse = await app.request(`/api/family/${familyMemberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(deleteResponse.status).toBe(200);

      // Verify feedback is also deleted
      const db = testDb();
      const remainingFeedback = await db.select().from(familyTaskFeedback).where(eq(familyTaskFeedback.familyMemberId, familyMemberId));
      expect(remainingFeedback).toHaveLength(0);
    });

    test('should return 404 for non-existent family member', async () => {
      const response = await app.request('/api/family/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const response = await app.request(`/api/family/${familyMemberId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/family/:id/avatar', () => {
    let familyMemberId: string;

    beforeEach(async () => {
      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Avatar Test Member',
          relationship: 'son',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      familyMemberId = data.data.id;
    });

    test('should update family member avatar', async () => {
      const avatarData = {
        avatar: validWebpAvatarBase64,
      };

      const response = await app.request(`/api/family/${familyMemberId}/avatar`, {
        method: 'PATCH',
        body: JSON.stringify(avatarData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.avatar).toBe(validWebpAvatarBase64);

      // Verify in database
      const dbMembers = await testDb().select().from(familyMembers).where(eq(familyMembers.id, familyMemberId));
      expect(dbMembers[0].avatar).toBe(validWebpAvatarBase64);
    });

    test('should remove family member avatar when empty string provided', async () => {
      // First set an avatar
      await app.request(`/api/family/${familyMemberId}/avatar`, {
        method: 'PATCH',
        body: JSON.stringify({ avatar: validAvatarBase64 }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Now remove it
      const response = await app.request(`/api/family/${familyMemberId}/avatar`, {
        method: 'PATCH',
        body: JSON.stringify({ avatar: '' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.avatar).toBe(null);

      // Verify in database
      const dbMembers = await testDb().select().from(familyMembers).where(eq(familyMembers.id, familyMemberId));
      expect(dbMembers[0].avatar).toBe(null);
    });

    test('should validate avatar format', async () => {
      const avatarData = {
        avatar: invalidBase64Data,
      };

      const response = await app.request(`/api/family/${familyMemberId}/avatar`, {
        method: 'PATCH',
        body: JSON.stringify(avatarData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should return 404 for non-existent family member', async () => {
      const response = await app.request('/api/family/00000000-0000-0000-0000-000000000000/avatar', {
        method: 'PATCH',
        body: JSON.stringify({ avatar: validAvatarBase64 }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const response = await app.request(`/api/family/${familyMemberId}/avatar`, {
        method: 'PATCH',
        body: JSON.stringify({ avatar: validAvatarBase64 }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/family/:id/feedback', () => {
    let familyMemberId: string;

    beforeEach(async () => {
      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John',
          relationship: 'son',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      familyMemberId = data.data.id;
    });

    test('should add task feedback for family member', async () => {
      const feedbackData = {
        familyMemberId,
        taskDescription: 'Played soccer in the backyard',
        feedback: 'He really enjoyed it and scored 3 goals!',
        enjoyedIt: 'yes',
        notes: 'Weather was perfect for outdoor play',
      };

      const response = await app.request(`/api/family/${familyMemberId}/feedback`, {
        method: 'POST',
        body: JSON.stringify(feedbackData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.taskDescription).toBe(feedbackData.taskDescription);
      expect(data.data.feedback).toBe(feedbackData.feedback);
      expect(data.data.enjoyedIt).toBe(feedbackData.enjoyedIt);
      expect(data.data.notes).toBe(feedbackData.notes);
      expect(data.data.familyMemberId).toBe(familyMemberId);
    });

    test('should update last interaction date when adding feedback', async () => {
      const beforeTime = new Date();

      await app.request(`/api/family/${familyMemberId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          familyMemberId,
          taskDescription: 'Played soccer',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Check that lastInteractionDate was updated
      const memberResponse = await app.request(`/api/family/${familyMemberId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const memberData = await memberResponse.json();
      const lastInteraction = new Date(memberData.data.lastInteractionDate);
      expect(lastInteraction.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    test('should add minimal feedback (only required fields)', async () => {
      const feedbackData = {
        familyMemberId,
        taskDescription: 'Read a book together',
      };

      const response = await app.request(`/api/family/${familyMemberId}/feedback`, {
        method: 'POST',
        body: JSON.stringify(feedbackData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.taskDescription).toBe(feedbackData.taskDescription);
      expect(data.data.feedback).toBe(null);
      expect(data.data.enjoyedIt).toBe(null);
      expect(data.data.notes).toBe(null);
    });

    test('should return 404 for non-existent family member', async () => {
      const response = await app.request('/api/family/00000000-0000-0000-0000-000000000000/feedback', {
        method: 'POST',
        body: JSON.stringify({
          familyMemberId: '00000000-0000-0000-0000-000000000000',
          taskDescription: 'Test task',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const response = await app.request(`/api/family/${familyMemberId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          familyMemberId,
          taskDescription: 'Test task',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/family/:id/feedback', () => {
    let familyMemberId: string;

    beforeEach(async () => {
      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John',
          relationship: 'son',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      familyMemberId = data.data.id;

      // Add some feedback
      const feedbackItems = [
        { taskDescription: 'Played soccer', feedback: 'Great fun!' },
        { taskDescription: 'Read a book', feedback: 'He loved the story' },
        { taskDescription: 'Went to park', feedback: 'Enjoyed the playground' },
      ];

      for (const feedback of feedbackItems) {
        await app.request(`/api/family/${familyMemberId}/feedback`, {
          method: 'POST',
          body: JSON.stringify({
            familyMemberId,
            ...feedback,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    });

    test('should return feedback history for family member', async () => {
      const response = await app.request(`/api/family/${familyMemberId}/feedback`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.data[0].taskDescription).toBe('Went to park'); // Most recent first
    });

    test('should limit results when requested', async () => {
      const response = await app.request(`/api/family/${familyMemberId}/feedback?limit=2`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    test('should return 404 for non-existent family member', async () => {
      const response = await app.request('/api/family/00000000-0000-0000-0000-000000000000/feedback', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const response = await app.request(`/api/family/${familyMemberId}/feedback`);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/family/:id/xp-history', () => {
    let familyMemberId: string;

    beforeEach(async () => {
      // Create a family member
      const response = await app.request('/api/family', {
        method: 'POST',
        body: JSON.stringify({
          name: 'XP History Test Member',
          relationship: 'daughter',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      familyMemberId = data.data.id;

      // Add some feedback to generate XP
      const feedbackItems = [
        { taskDescription: 'Played board games', feedback: 'She won three times!' },
        { taskDescription: 'Went swimming', feedback: 'Great progress with her swimming' },
        { taskDescription: 'Helped with dinner', feedback: 'Very helpful in the kitchen' },
      ];

      for (const feedback of feedbackItems) {
        await app.request(`/api/family/${familyMemberId}/feedback`, {
          method: 'POST',
          body: JSON.stringify({
            familyMemberId,
            ...feedback,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    });

    test('should return XP history for family member', async () => {
      const response = await app.request(`/api/family/${familyMemberId}/xp-history`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Should have 3 XP grant entries
      expect(data.data).toHaveLength(3);

      // Check structure of first XP grant
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('entityType', 'family_member');
      expect(data.data[0]).toHaveProperty('entityId', familyMemberId);
      expect(data.data[0]).toHaveProperty('xpAmount');
      expect(data.data[0]).toHaveProperty('sourceType', 'interaction');
      expect(data.data[0]).toHaveProperty('reason');
      expect(data.data[0]).toHaveProperty('entityName', 'XP History Test Member');
      expect(data.data[0]).toHaveProperty('entityDescription', 'daughter');
    });

    test('should limit results when requested', async () => {
      const response = await app.request(`/api/family/${familyMemberId}/xp-history?limit=2`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    test('should apply offset when requested', async () => {
      // Get all grants first
      const allResponse = await app.request(`/api/family/${familyMemberId}/xp-history`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const allData = await allResponse.json();

      // Now get with offset
      const offsetResponse = await app.request(`/api/family/${familyMemberId}/xp-history?offset=1`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const offsetData = await offsetResponse.json();

      expect(offsetData.success).toBe(true);
      expect(offsetData.data).toHaveLength(2); // Should have all except the first

      // The first entry in the offset results should match the second entry in the complete results
      expect(offsetData.data[0].id).toBe(allData.data[1].id);
    });

    test('should filter by source type when requested', async () => {
      // All our test data has sourceType 'interaction' so we should get all results
      const response = await app.request(`/api/family/${familyMemberId}/xp-history?sourceType=interaction`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.data.every((item: any) => item.sourceType === 'interaction')).toBe(true);

      // Filter by a non-existent source type - should return empty array
      const emptyResponse = await app.request(`/api/family/${familyMemberId}/xp-history?sourceType=journal`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(emptyResponse.status).toBe(200);
      const emptyData = await emptyResponse.json();
      expect(emptyData.success).toBe(true);
      expect(emptyData.data).toHaveLength(0);
    });

    test('should return 404 for non-existent family member', async () => {
      const response = await app.request('/api/family/00000000-0000-0000-0000-000000000000/xp-history', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const response = await app.request(`/api/family/${familyMemberId}/xp-history`);
      expect(response.status).toBe(401);
    });
  });
});
