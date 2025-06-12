import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { characterStat } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { calculateLevel, calculateLevelProgress, calculateXpToNextLevel } from '$lib/utils/xp';

export async function GET({ url, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const limit = Number(url.searchParams.get('limit') || '20');
    const page = Number(url.searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const stats = await db
      .select()
      .from(characterStat)
      .where(eq(characterStat.userId, locals.user.id))
      .orderBy(desc(characterStat.updatedAt))
      .limit(limit)
      .offset(offset);

    // Add level information to each stat
    const statsWithLevels = stats.map(stat => {
      const level = calculateLevel(stat.currentXp);
      const progress = calculateLevelProgress(stat.currentXp);
      const xpToNextLevel = calculateXpToNextLevel(stat.currentXp);

      return {
        ...stat,
        level,
        progress,
        xpToNextLevel
      };
    });

    return json({ stats: statsWithLevels });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

export async function POST({ request, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return json({ error: 'Name is required' }, { status: 400 });
    }

    const [newStat] = await db
      .insert(characterStat)
      .values({
        userId: locals.user.id,
        name,
        description,
        currentXp: 0
      })
      .returning();

    // Add level information
    const level = calculateLevel(newStat.currentXp);
    const progress = calculateLevelProgress(newStat.currentXp);
    const xpToNextLevel = calculateXpToNextLevel(newStat.currentXp);

    return json({
      stat: {
        ...newStat,
        level,
        progress,
        xpToNextLevel
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating character stat:', error);
    return json({ error: 'Failed to create character stat' }, { status: 500 });
  }
}
