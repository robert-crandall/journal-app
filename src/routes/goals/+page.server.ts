import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import { getUserGoals, createGoal, updateGoal, deleteGoal, toggleGoalActive, archiveGoal, unarchiveGoal } from '$lib/server/goals.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const goals = await getUserGoals(locals.user.id);

  return {
    user: locals.user,
    goals,
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const title = data.get('title') as string;
    const description = data.get('description') as string;
    const tagsStr = data.get('tags') as string;

    // Parse tags (comma-separated)
    let tags: string[] = [];
    if (tagsStr?.trim()) {
      tags = tagsStr
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }

    if (!title?.trim()) {
      return fail(400, {
        error: 'Title is required',
        title,
        description,
        tags: tagsStr,
      });
    }

    try {
      await createGoal(locals.user.id, { title, description, tags });
      return { success: true };
    } catch (error) {
      console.error('Error creating goal:', error);
      return fail(500, {
        error: 'Failed to create goal',
        title,
        description,
        tags: tagsStr,
      });
    }
  },

  update: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const goalId = data.get('goalId') as string;
    const title = data.get('title') as string;
    const description = data.get('description') as string;
    const tagsStr = data.get('tags') as string;

    // Parse tags (comma-separated)
    let tags: string[] = [];
    if (tagsStr?.trim()) {
      tags = tagsStr
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }

    if (!goalId || !title?.trim()) {
      return fail(400, {
        error: 'Goal ID and title are required',
      });
    }

    try {
      await updateGoal(goalId, locals.user.id, { title, description, tags });
      return { success: true };
    } catch (error) {
      console.error('Error updating goal:', error);
      return fail(500, {
        error: 'Failed to update goal',
      });
    }
  },

  delete: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const goalId = data.get('goalId') as string;

    if (!goalId) {
      return fail(400, {
        error: 'Goal ID is required',
      });
    }

    try {
      await deleteGoal(goalId, locals.user.id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting goal:', error);
      return fail(500, {
        error: 'Failed to delete goal',
      });
    }
  },

  toggleActive: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const goalId = data.get('goalId') as string;

    if (!goalId) {
      return fail(400, {
        error: 'Goal ID is required',
      });
    }

    try {
      await toggleGoalActive(goalId, locals.user.id);
      return { success: true };
    } catch (error) {
      console.error('Error toggling goal active status:', error);
      return fail(500, {
        error: 'Failed to toggle goal status',
      });
    }
  },

  archive: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const goalId = data.get('goalId') as string;

    if (!goalId) {
      return fail(400, {
        error: 'Goal ID is required',
      });
    }

    try {
      await archiveGoal(goalId, locals.user.id);
      return { success: true };
    } catch (error) {
      console.error('Error archiving goal:', error);
      return fail(500, {
        error: 'Failed to archive goal',
      });
    }
  },

  unarchive: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const goalId = data.get('goalId') as string;

    if (!goalId) {
      return fail(400, {
        error: 'Goal ID is required',
      });
    }

    try {
      await unarchiveGoal(goalId, locals.user.id);
      return { success: true };
    } catch (error) {
      console.error('Error unarchiving goal:', error);
      return fail(500, {
        error: 'Failed to unarchive goal',
      });
    }
  },
};
