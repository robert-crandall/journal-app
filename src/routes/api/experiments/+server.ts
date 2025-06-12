import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { experiment, user } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET({ url, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const limit = Number(url.searchParams.get('limit') || '10');
    const page = Number(url.searchParams.get('page') || '1');
    const active = url.searchParams.get('active') === 'true';
    const offset = (page - 1) * limit;

    const conditions = [eq(experiment.userId, locals.user.id)];
    
    if (active !== undefined) {
      conditions.push(eq(experiment.isActive, active));
    }
    
    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    const experiments = await db
      .select()
      .from(experiment)
      .where(whereCondition)
      .orderBy(desc(experiment.createdAt))
      .limit(limit)
      .offset(offset);

    return json({ experiments });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return json({ error: 'Failed to fetch experiments' }, { status: 500 });
  }
};

export async function POST({ request, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { title, description, startDate, endDate } = body;

    if (!title) {
      return json({ error: 'Title is required' }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    const [newExperiment] = await db
      .insert(experiment)
      .values({
        userId: locals.user.id,
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true
      })
      .returning();

    return json({ experiment: newExperiment }, { status: 201 });
  } catch (error) {
    console.error('Error creating experiment:', error);
    return json({ error: 'Failed to create experiment' }, { status: 500 });
  }
};
