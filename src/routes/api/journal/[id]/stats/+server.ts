import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { characterStat, journalCharacterTag, journalEntry } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET({ params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const journalId = params.id;
    if (!journalId) {
      return json({ error: 'Journal ID is required' }, { status: 400 });
    }

    // First check if the journal entry belongs to the user
    const [journalExists] = await db
      .select({ id: journalEntry.id })
      .from(journalEntry)
      .where(and(
        eq(journalEntry.id, journalId),
        eq(journalEntry.userId, locals.user.id)
      ))
      .limit(1);

    if (!journalExists) {
      return json({ error: 'Journal entry not found' }, { status: 404 });
    }

    // Get all character stat tags for this journal
    const statLinks = await db
      .select({
        id: journalCharacterTag.statId,
        name: characterStat.name,
        xpGained: journalCharacterTag.xpGained
      })
      .from(journalCharacterTag)
      .innerJoin(characterStat, eq(journalCharacterTag.statId, characterStat.id))
      .where(eq(journalCharacterTag.journalId, journalId));

    return json({ stats: statLinks });
  } catch (error) {
    console.error('Error fetching journal stats:', error);
    return json({ error: 'Failed to fetch journal stats' }, { status: 500 });
  }
}

export async function POST({ params, request, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const journalId = params.id;
    if (!journalId) {
      return json({ error: 'Journal ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { stats } = body;

    if (!Array.isArray(stats)) {
      return json({ error: 'Stats must be an array' }, { status: 400 });
    }

    // First check if the journal entry belongs to the user
    const [journalExists] = await db
      .select({ id: journalEntry.id })
      .from(journalEntry)
      .where(and(
        eq(journalEntry.id, journalId),
        eq(journalEntry.userId, locals.user.id)
      ))
      .limit(1);

    if (!journalExists) {
      return json({ error: 'Journal entry not found' }, { status: 404 });
    }

    // Delete existing character stat links
    await db
      .delete(journalCharacterTag)
      .where(eq(journalCharacterTag.journalId, journalId));

    // No stats to add, return early
    if (stats.length === 0) {
      return json({ success: true, stats: [] });
    }

    // Add new links and update XP for each stat
    const statInserts = stats.map(({ id, xpAmount }) => ({
      journalId,
      statId: id,
      xpGained: xpAmount
    }));

    await db.insert(journalCharacterTag).values(statInserts);

    // Update the total XP for each character stat
    for (const { id, xpAmount } of stats) {
      // Get the current XP
      const [currentStat] = await db
        .select({ currentXp: characterStat.currentXp })
        .from(characterStat)
        .where(and(
          eq(characterStat.id, id),
          eq(characterStat.userId, locals.user.id)
        ))
        .limit(1);
      
      if (currentStat) {
        // Update with the new XP
        await db
          .update(characterStat)
          .set({ 
            currentXp: currentStat.currentXp + xpAmount,
            updatedAt: new Date()
          })
          .where(eq(characterStat.id, id));
      }
    }

    // Get the updated stats with names
    const updatedStats = await db
      .select({
        id: journalCharacterTag.statId,
        name: characterStat.name,
        xpGained: journalCharacterTag.xpGained
      })
      .from(journalCharacterTag)
      .innerJoin(characterStat, eq(journalCharacterTag.statId, characterStat.id))
      .where(eq(journalCharacterTag.journalId, journalId));

    return json({ success: true, stats: updatedStats });
  } catch (error) {
    console.error('Error updating journal stats:', error);
    return json({ error: 'Failed to update journal stats' }, { status: 500 });
  }
}

export async function DELETE({ params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const journalId = params.id;
    if (!journalId) {
      return json({ error: 'Journal ID is required' }, { status: 400 });
    }

    // First check if the journal entry belongs to the user
    const [journalExists] = await db
      .select({ id: journalEntry.id })
      .from(journalEntry)
      .where(and(
        eq(journalEntry.id, journalId),
        eq(journalEntry.userId, locals.user.id)
      ))
      .limit(1);

    if (!journalExists) {
      return json({ error: 'Journal entry not found' }, { status: 404 });
    }

    // Get the stats before deletion to remove their XP gain
    const statLinks = await db
      .select({
        statId: journalCharacterTag.statId,
        xpGained: journalCharacterTag.xpGained
      })
      .from(journalCharacterTag)
      .where(eq(journalCharacterTag.journalId, journalId));

    // Remove XP from each character stat
    for (const { statId, xpGained } of statLinks) {
      // Get the current XP
      const [currentStat] = await db
        .select({ currentXp: characterStat.currentXp })
        .from(characterStat)
        .where(eq(characterStat.id, statId))
        .limit(1);
      
      if (currentStat) {
        // Subtract the XP, but don't go below 0
        const newXp = Math.max(0, currentStat.currentXp - xpGained);
        
        await db
          .update(characterStat)
          .set({ 
            currentXp: newXp,
            updatedAt: new Date()
          })
          .where(eq(characterStat.id, statId));
      }
    }

    // Delete all character stat links
    await db
      .delete(journalCharacterTag)
      .where(eq(journalCharacterTag.journalId, journalId));

    return json({ success: true });
  } catch (error) {
    console.error('Error removing journal stats:', error);
    return json({ error: 'Failed to remove journal stats' }, { status: 500 });
  }
}
