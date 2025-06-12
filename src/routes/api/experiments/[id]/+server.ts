import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { experiment } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET({ params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const experimentId = params.id;
    if (!experimentId) {
      return json({ error: 'Experiment ID is required' }, { status: 400 });
    }

    const [exp] = await db
      .select()
      .from(experiment)
      .where(and(
        eq(experiment.id, experimentId),
        eq(experiment.userId, locals.user.id)
      ))
      .limit(1);

    if (!exp) {
      return json({ error: 'Experiment not found' }, { status: 404 });
    }

    return json({ experiment: exp });
  } catch (error) {
    console.error('Error fetching experiment:', error);
    return json({ error: 'Failed to fetch experiment' }, { status: 500 });
  }
}

export async function PUT({ params, request, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const experimentId = params.id;
    if (!experimentId) {
      return json({ error: 'Experiment ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, startDate, endDate, isActive } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (startDate !== undefined) updates.startDate = new Date(startDate);
    if (endDate !== undefined) updates.endDate = new Date(endDate);
    if (isActive !== undefined) updates.isActive = isActive;
    updates.updatedAt = new Date();

    const [updatedExperiment] = await db
      .update(experiment)
      .set(updates)
      .where(and(
        eq(experiment.id, experimentId),
        eq(experiment.userId, locals.user.id)
      ))
      .returning();

    if (!updatedExperiment) {
      return json({ error: 'Experiment not found or not updated' }, { status: 404 });
    }

    return json({ experiment: updatedExperiment });
  } catch (error) {
    console.error('Error updating experiment:', error);
    return json({ error: 'Failed to update experiment' }, { status: 500 });
  }
}

export async function DELETE({ params, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const experimentId = params.id;
    if (!experimentId) {
      return json({ error: 'Experiment ID is required' }, { status: 400 });
    }

    const [deletedExperiment] = await db
      .delete(experiment)
      .where(and(
        eq(experiment.id, experimentId),
        eq(experiment.userId, locals.user.id)
      ))
      .returning();

    if (!deletedExperiment) {
      return json({ error: 'Experiment not found or not deleted' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    return json({ error: 'Failed to delete experiment' }, { status: 500 });
  }
}
