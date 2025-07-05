import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail, error } from '@sveltejs/kit';
import { getUserStats, getStatXpHistory, addStatActivity, updateStatActivity, deleteStatActivity } from '$lib/server/stats.js';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const statId = params.id;
  if (!statId) {
    throw error(404, 'Stat not found');
  }

  // Get the specific stat
  const allStats = await getUserStats(locals.user.id);
  const stat = allStats.find((s) => s.id === statId);

  if (!stat) {
    throw error(404, 'Stat not found');
  }

  // Get XP history
  const xpHistory = await getStatXpHistory(statId, locals.user.id);

  return {
    stat,
    xpHistory,
  };
};

export const actions: Actions = {
  addActivity: async ({ request, locals, params }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const statId = params.id;
    if (!statId) {
      throw error(404, 'Stat not found');
    }

    const data = await request.formData();
    const description = data.get('description') as string;
    const suggestedXp = parseInt(data.get('suggestedXp') as string);

    if (!description?.trim()) {
      return fail(400, {
        error: 'Description is required',
      });
    }

    if (isNaN(suggestedXp) || suggestedXp <= 0) {
      return fail(400, {
        error: 'Valid XP amount is required',
      });
    }

    try {
      await addStatActivity(statId, description, suggestedXp);
      return { success: true };
    } catch (error) {
      console.error('Error adding activity:', error);
      return fail(500, {
        error: 'Failed to add activity',
      });
    }
  },

  updateActivity: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const activityId = data.get('activityId') as string;
    const description = data.get('description') as string;
    const suggestedXp = parseInt(data.get('suggestedXp') as string);

    if (!activityId || !description?.trim()) {
      return fail(400, {
        error: 'Activity ID and description are required',
      });
    }

    if (isNaN(suggestedXp) || suggestedXp <= 0) {
      return fail(400, {
        error: 'Valid XP amount is required',
      });
    }

    try {
      await updateStatActivity(activityId, { description, suggestedXp });
      return { success: true };
    } catch (error) {
      console.error('Error updating activity:', error);
      return fail(500, {
        error: 'Failed to update activity',
      });
    }
  },

  deleteActivity: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const activityId = data.get('activityId') as string;

    if (!activityId) {
      return fail(400, {
        error: 'Activity ID is required',
      });
    }

    try {
      await deleteStatActivity(activityId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting activity:', error);
      return fail(500, {
        error: 'Failed to delete activity',
      });
    }
  },
};
