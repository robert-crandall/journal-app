import { Context } from 'hono';
import { db } from '../db';
import { characterStats } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm/pg-core';
import { HTTPException } from 'hono/http-exception';
import { CharacterStatInput, ApiResponse, CharacterStat } from '../types/api';

// Get all character stats for the current user
export async function getCharacterStats(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    
    const results = await db
      .select()
      .from(characterStats)
      .where(eq(characterStats.userId, currentUser.id))
      .orderBy(characterStats.name);
    
    const response: ApiResponse<{ characterStats: CharacterStat[] }> = {
      success: true,
      data: {
        characterStats: results.map((stat: any) => ({
          ...stat,
          createdAt: stat.createdAt.toISOString(),
          updatedAt: stat.updatedAt.toISOString(),
        })),
      },
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Get character stats error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve character stats' });
  }
}

// Get a specific character stat by ID
export async function getCharacterStatById(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const statId = c.req.param('id');
    
    const result = await db
      .select()
      .from(characterStats)
      .where(
        and(
          eq(characterStats.id, statId),
          eq(characterStats.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (result.length === 0) {
      throw new HTTPException(404, { message: 'Character stat not found' });
    }
    
    const stat = result[0];
    
    const response: ApiResponse<{ characterStat: CharacterStat }> = {
      success: true,
      data: {
        characterStat: {
          ...stat,
          createdAt: stat.createdAt.toISOString(),
          updatedAt: stat.updatedAt.toISOString(),
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get character stat by ID error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve character stat' });
  }
}

// Create a new character stat
export async function createCharacterStat(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json() as CharacterStatInput;
    
    const result = await db.insert(characterStats).values({
      userId: currentUser.id,
      name: body.name,
      description: body.description || null,
      currentXP: 0,
    }).returning();
    
    const stat = result[0];
    
    const response: ApiResponse<{ characterStat: CharacterStat }> = {
      success: true,
      data: {
        characterStat: {
          ...stat,
          createdAt: stat.createdAt.toISOString(),
          updatedAt: stat.updatedAt.toISOString(),
        },
      },
    };
    
    return c.json(response, 201);
  } catch (error) {
    console.error('Create character stat error:', error);
    throw new HTTPException(500, { message: 'Failed to create character stat' });
  }
}

// Update a character stat
export async function updateCharacterStat(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const statId = c.req.param('id');
    const body = await c.req.json() as CharacterStatInput;
    
    // Check if stat exists and belongs to user
    const existingStat = await db
      .select()
      .from(characterStats)
      .where(
        and(
          eq(characterStats.id, statId),
          eq(characterStats.userId, currentUser.id)
        )
      )
      .limit(1);
      
    if (existingStat.length === 0) {
      throw new HTTPException(404, { message: 'Character stat not found' });
    }
    
    const result = await db.update(characterStats)
      .set({
        name: body.name,
        description: body.description || null,
        updatedAt: new Date(),
      })
      .where(eq(characterStats.id, statId))
      .returning();
    
    const stat = result[0];
    
    const response: ApiResponse<{ characterStat: CharacterStat }> = {
      success: true,
      data: {
        characterStat: {
          ...stat,
          createdAt: stat.createdAt.toISOString(),
          updatedAt: stat.updatedAt.toISOString(),
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update character stat error:', error);
    throw new HTTPException(500, { message: 'Failed to update character stat' });
  }
}

// Delete a character stat
export async function deleteCharacterStat(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const statId = c.req.param('id');
    
    // Check if stat exists and belongs to user
    const existingStat = await db
      .select()
      .from(characterStats)
      .where(
        and(
          eq(characterStats.id, statId),
          eq(characterStats.userId, currentUser.id)
        )
      )
      .limit(1);
      
    if (existingStat.length === 0) {
      throw new HTTPException(404, { message: 'Character stat not found' });
    }
    
    // Delete character stat (cascade will handle relationships)
    await db.delete(characterStats).where(eq(characterStats.id, statId));
    
    return c.json({
      success: true,
      message: 'Character stat deleted successfully',
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete character stat error:', error);
    throw new HTTPException(500, { message: 'Failed to delete character stat' });
  }
}
