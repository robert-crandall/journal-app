import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import {
  getUserFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  updateLastInteraction,
  createFamilyTaskFeedback,
  createFamilyConnectionXp,
} from '$lib/server/family.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const familyMembers = await getUserFamilyMembers(locals.user.id);

  return {
    user: locals.user,
    familyMembers,
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const name = data.get('name') as string;
    const relationship = data.get('relationship') as string;
    const birthdayStr = data.get('birthday') as string;
    const likesStr = data.get('likes') as string;
    const dislikesStr = data.get('dislikes') as string;
    const energyLevel = data.get('energyLevel') as string;

    // Parse likes and dislikes (comma-separated)
    const likes =
      likesStr
        ?.split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0) || [];

    const dislikes =
      dislikesStr
        ?.split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0) || [];

    // Parse birthday
    let birthday: Date | undefined;
    if (birthdayStr?.trim()) {
      birthday = new Date(birthdayStr);
      if (isNaN(birthday.getTime())) {
        birthday = undefined;
      }
    }

    if (!name?.trim() || !relationship?.trim()) {
      return fail(400, {
        error: 'Name and relationship are required',
        name,
        relationship,
        birthday: birthdayStr,
        likes: likesStr,
        dislikes: dislikesStr,
        energyLevel,
      });
    }

    try {
      await createFamilyMember(locals.user.id, {
        name,
        relationship,
        birthday,
        likes,
        dislikes,
        energyLevel: energyLevel || undefined,
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating family member:', error);
      return fail(500, {
        error: 'Failed to create family member',
        name,
        relationship,
        birthday: birthdayStr,
        likes: likesStr,
        dislikes: dislikesStr,
        energyLevel,
      });
    }
  },

  update: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const familyMemberId = data.get('familyMemberId') as string;
    const name = data.get('name') as string;
    const relationship = data.get('relationship') as string;
    const birthdayStr = data.get('birthday') as string;
    const likesStr = data.get('likes') as string;
    const dislikesStr = data.get('dislikes') as string;
    const energyLevel = data.get('energyLevel') as string;

    // Parse likes and dislikes (comma-separated)
    const likes =
      likesStr
        ?.split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0) || [];

    const dislikes =
      dislikesStr
        ?.split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0) || [];

    // Parse birthday
    let birthday: Date | undefined;
    if (birthdayStr?.trim()) {
      birthday = new Date(birthdayStr);
      if (isNaN(birthday.getTime())) {
        birthday = undefined;
      }
    }

    if (!familyMemberId || !name?.trim() || !relationship?.trim()) {
      return fail(400, {
        error: 'Family member ID, name, and relationship are required',
      });
    }

    try {
      await updateFamilyMember(familyMemberId, locals.user.id, {
        name,
        relationship,
        birthday,
        likes,
        dislikes,
        energyLevel: energyLevel || undefined,
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating family member:', error);
      return fail(500, {
        error: 'Failed to update family member',
      });
    }
  },

  delete: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const familyMemberId = data.get('familyMemberId') as string;

    if (!familyMemberId) {
      return fail(400, {
        error: 'Family member ID is required',
      });
    }

    try {
      await deleteFamilyMember(familyMemberId, locals.user.id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting family member:', error);
      return fail(500, {
        error: 'Failed to delete family member',
      });
    }
  },

  updateInteraction: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const familyMemberId = data.get('familyMemberId') as string;

    if (!familyMemberId) {
      return fail(400, {
        error: 'Family member ID is required',
      });
    }

    try {
      await updateLastInteraction(familyMemberId, locals.user.id);
      return { success: true };
    } catch (error) {
      console.error('Error updating last interaction:', error);
      return fail(500, {
        error: 'Failed to update interaction time',
      });
    }
  },

  addFeedback: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const familyMemberId = data.get('familyMemberId') as string;
    const liked = data.get('liked') === 'true';
    const notes = data.get('notes') as string;
    const taskId = data.get('taskId') as string;

    if (!familyMemberId) {
      return fail(400, {
        error: 'Family member ID is required',
      });
    }

    try {
      await createFamilyTaskFeedback({
        familyMemberId,
        taskId: taskId || undefined,
        liked,
        notes,
      });

      // Update last interaction time when feedback is added
      await updateLastInteraction(familyMemberId, locals.user.id);

      return { success: true };
    } catch (error) {
      console.error('Error adding feedback:', error);
      return fail(500, {
        error: 'Failed to add feedback',
      });
    }
  },

  addConnectionXp: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const familyMemberId = data.get('familyMemberId') as string;
    const source = data.get('source') as 'task' | 'journal';
    const xpStr = data.get('xp') as string;
    const comment = data.get('comment') as string;

    const xp = parseInt(xpStr);

    if (!familyMemberId || !source || isNaN(xp)) {
      return fail(400, {
        error: 'Family member ID, source, and XP are required',
      });
    }

    try {
      await createFamilyConnectionXp({
        familyMemberId,
        source,
        xp,
        comment,
      });

      // Update last interaction time when XP is added
      await updateLastInteraction(familyMemberId, locals.user.id);

      return { success: true };
    } catch (error) {
      console.error('Error adding connection XP:', error);
      return fail(500, {
        error: 'Failed to add connection XP',
      });
    }
  },
};
