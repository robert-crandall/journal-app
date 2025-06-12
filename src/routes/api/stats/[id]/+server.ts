import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { characterStat, journalCharacterTag, journalEntry as journalEntries } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { calculateLevel, calculateLevelProgress, calculateXpToNextLevel } from '$lib/utils/xp';

export async function GET({ params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const statId = params.id;
    if (!statId) {
      return json({ error: 'Stat ID is required' }, { status: 400 });
    }

    const [stat] = await db
      .select()
      .from(characterStat)
      .where(and(
        eq(characterStat.id, statId),
        eq(characterStat.userId, locals.user.id)
      ))
      .limit(1);

    if (!stat) {
      return json({ error: 'Character stat not found' }, { status: 404 });
    }

    // Get related journal entries with XP gains
    const journalLinks = await db
      .select({
        link: journalCharacterTag,
        journal: {
          id: journalEntries.id,
          title: journalEntries.title,
          createdAt: journalEntries.createdAt
        }
      })
      .from(journalCharacterTag)
      .innerJoin(journalEntries, eq(journalCharacterTag.journalId, journalEntries.id))
      .where(eq(journalCharacterTag.statId, statId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(10);

    // Add level information
    const level = calculateLevel(stat.currentXp);
    const progress = calculateLevelProgress(stat.currentXp);
    const xpToNextLevel = calculateXpToNextLevel(stat.currentXp);

    return json({
      stat: {
        ...stat,
        level,
        progress,
        xpToNextLevel
      },
      journalEntries: journalLinks
    });
  } catch (error) {
    console.error('Error fetching stat:', error);
    return json({ error: 'Failed to fetch stat' }, { status: 500 });
  }
}

export async function PUT({ params, request, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const statId = params.id;
    if (!statId) {
      return json({ error: 'Stat ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, xpAdjustment } = body;

    // Find the stat first
    const [existingStat] = await db
      .select()
      .from(characterStat)
      .where(and(
        eq(characterStat.id, statId),
        eq(characterStat.userId, locals.user.id)
      ))
      .limit(1);

    if (!existingStat) {
      return json({ error: 'Character stat not found' }, { status: 404 });
    }

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    
    // If XP adjustment is provided, apply it
    if (xpAdjustment !== undefined) {
      const newXp = Math.max(0, existingStat.currentXp + xpAdjustment);
      updates.currentXp = newXp;
    }

    const [updatedStat] = await db
      .update(characterStat)
      .set(updates)
      .where(eq(characterStat.id, statId))
      .returning();

    // Add level information
    const level = calculateLevel(updatedStat.currentXp);
    const progress = calculateLevelProgress(updatedStat.currentXp);
    const xpToNextLevel = calculateXpToNextLevel(updatedStat.currentXp);

    return json({
      stat: {
        ...updatedStat,
        level,
        progress,
        xpToNextLevel
      }
    });
  } catch (error) {
    console.error('Error updating stat:', error);
    return json({ error: 'Failed to update stat' }, { status: 500 });
  }
}

export async function DELETE({ params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const statId = params.id;
    if (!statId) {
      return json({ error: 'Stat ID is required' }, { status: 400 });
    }

    const [deletedStat] = await db
      .delete(characterStat)
      .where(and(
        eq(characterStat.id, statId),
        eq(characterStat.userId, locals.user.id)
      ))
      .returning();

    if (!deletedStat) {
      return json({ error: 'Character stat not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting stat:', error);
    return json({ error: 'Failed to delete stat' }, { status: 500 });
  }
}
