import { describe, it, expect, beforeEach } from 'vitest';
import app from '../index';
import { testDb, cleanDatabase, schema } from './setup';
import { eq } from 'drizzle-orm';

describe('Characters API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await cleanDatabase();
    
    // Create a test user and get auth token for protected routes
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const registerRes = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(registerRes.status).toBe(201);
    const registerData = await registerRes.json();
    authToken = registerData.token;
    userId = registerData.user.id;
  });

  describe('GET /api/characters', () => {
    it('should return null when user has no character', async () => {
      const res = await app.request('/api/characters', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toBe(null);
    });

    it('should return character when user has one', async () => {
      // First create a character
      const characterData = {
        name: 'Aragorn',
        characterClass: 'Ranger',
        backstory: 'A wandering ranger from the north',
        goals: 'Protect the realm and find adventure'
      };

      const createRes = await app.request('/api/characters', {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(createRes.status).toBe(201);

      // Now get the character
      const getRes = await app.request('/api/characters', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        name: characterData.name,
        characterClass: characterData.characterClass,
        backstory: characterData.backstory,
        goals: characterData.goals,
        userId: userId
      });
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('createdAt');
      expect(data.data).toHaveProperty('updatedAt');
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/characters');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/characters', () => {
    it('should create a new character successfully', async () => {
      const characterData = {
        name: 'Legolas',
        characterClass: 'Archer',
        backstory: 'An elven prince with keen eyes',
        goals: 'Master archery and protect nature'
      };

      const res = await app.request('/api/characters', {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();
      
      // Check response structure
      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        name: characterData.name,
        characterClass: characterData.characterClass,
        backstory: characterData.backstory,
        goals: characterData.goals,
        userId: userId
      });
      expect(responseData.data).toHaveProperty('id');
      expect(responseData.data).toHaveProperty('createdAt');
      expect(responseData.data).toHaveProperty('updatedAt');

      // Verify character was actually created in database
      const db = testDb();
      const dbCharacter = await db
        .select()
        .from(schema.characters)
        .where(eq(schema.characters.userId, userId))
        .limit(1);

      expect(dbCharacter).toHaveLength(1);
      expect(dbCharacter[0].name).toBe(characterData.name);
      expect(dbCharacter[0].characterClass).toBe(characterData.characterClass);
      expect(dbCharacter[0].backstory).toBe(characterData.backstory);
      expect(dbCharacter[0].goals).toBe(characterData.goals);
    });

    it('should create character with minimal data (name and class only)', async () => {
      const characterData = {
        name: 'Gimli',
        characterClass: 'Warrior'
      };

      const res = await app.request('/api/characters', {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        name: characterData.name,
        characterClass: characterData.characterClass,
        backstory: null,
        goals: null,
        userId: userId
      });
    });

    it('should prevent creating multiple characters for same user', async () => {
      const characterData = {
        name: 'First Character',
        characterClass: 'Mage'
      };

      // Create first character
      const firstRes = await app.request('/api/characters', {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(firstRes.status).toBe(201);

      // Try to create second character
      const secondCharacterData = {
        name: 'Second Character',
        characterClass: 'Rogue'
      };

      const secondRes = await app.request('/api/characters', {
        method: 'POST',
        body: JSON.stringify(secondCharacterData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(secondRes.status).toBe(400);
      const errorData = await secondRes.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toContain('already has a character');
    });

    it('should require authentication', async () => {
      const characterData = {
        name: 'Test Character',
        characterClass: 'Test Class'
      };

      const res = await app.request('/api/characters', {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        backstory: 'Missing name and class'
      };

      const res = await app.request('/api/characters', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(400);
      const errorData = await res.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toHaveProperty('issues');
      expect(Array.isArray(errorData.error.issues)).toBe(true);
      expect(errorData.error.issues.length).toBeGreaterThan(0);
    });

    it('should validate field lengths', async () => {
      const invalidData = {
        name: 'a'.repeat(101), // Too long
        characterClass: 'Valid Class'
      };

      const res = await app.request('/api/characters', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(400);
      const errorData = await res.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toHaveProperty('issues');
      expect(Array.isArray(errorData.error.issues)).toBe(true);
      expect(errorData.error.issues.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/characters', () => {
    beforeEach(async () => {
      // Create a character for update tests
      const characterData = {
        name: 'Original Name',
        characterClass: 'Original Class',
        backstory: 'Original backstory',
        goals: 'Original goals'
      };

      const res = await app.request('/api/characters', {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(201);
    });

    it('should update character successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        backstory: 'Updated backstory',
        goals: 'Updated goals'
      };

      const res = await app.request('/api/characters', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        name: updateData.name,
        characterClass: 'Original Class', // Should remain unchanged
        backstory: updateData.backstory,
        goals: updateData.goals,
        userId: userId
      });

      // Verify in database
      const db = testDb();
      const dbCharacter = await db
        .select()
        .from(schema.characters)
        .where(eq(schema.characters.userId, userId))
        .limit(1);

      expect(dbCharacter[0].name).toBe(updateData.name);
      expect(dbCharacter[0].backstory).toBe(updateData.backstory);
      expect(dbCharacter[0].goals).toBe(updateData.goals);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        goals: 'Only updating goals'
      };

      const res = await app.request('/api/characters', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      expect(responseData.success).toBe(true);
      expect(responseData.data.goals).toBe(updateData.goals);
      expect(responseData.data.name).toBe('Original Name'); // Should remain unchanged
    });

    it('should return 404 when no character exists', async () => {
      // Delete the character first
      await app.request('/api/characters', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const updateData = {
        name: 'Updated Name'
      };

      const res = await app.request('/api/characters', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(404);
      const errorData = await res.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const res = await app.request('/api/characters', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/characters', () => {
    beforeEach(async () => {
      // Create a character for delete tests
      const characterData = {
        name: 'Character to Delete',
        characterClass: 'Doomed Class'
      };

      const res = await app.request('/api/characters', {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(201);
    });

    it('should delete character successfully', async () => {
      const res = await app.request('/api/characters', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        name: 'Character to Delete',
        characterClass: 'Doomed Class',
        userId: userId
      });

      // Verify character was actually deleted from database
      const db = testDb();
      const dbCharacter = await db
        .select()
        .from(schema.characters)
        .where(eq(schema.characters.userId, userId))
        .limit(1);

      expect(dbCharacter).toHaveLength(0);
    });

    it('should return 404 when no character exists', async () => {
      // Delete the character first
      await app.request('/api/characters', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Try to delete again
      const res = await app.request('/api/characters', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(res.status).toBe(404);
      const errorData = await res.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/characters', {
        method: 'DELETE'
      });

      expect(res.status).toBe(401);
    });
  });
});
