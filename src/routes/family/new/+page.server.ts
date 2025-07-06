import { redirect, fail } from '@sveltejs/kit';
import { createFamilyMember } from '$lib/server/family.js';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  return {
    user: locals.user,
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const name = data.get('name') as string;
    const relationship = data.get('relationship') as string;
    const birthdayStr = data.get('birthday') as string;
    const energyLevel = data.get('energyLevel') as string;
    const likesStr = data.get('likes') as string;
    const dislikesStr = data.get('dislikes') as string;

    // Validation
    if (!name?.trim()) {
      return fail(400, {
        error: 'Name is required',
        values: {
          name,
          relationship,
          birthday: birthdayStr,
          energyLevel,
          likes: likesStr,
          dislikes: dislikesStr,
        },
      });
    }

    if (!relationship?.trim()) {
      return fail(400, {
        error: 'Relationship is required',
        values: {
          name,
          relationship,
          birthday: birthdayStr,
          energyLevel,
          likes: likesStr,
          dislikes: dislikesStr,
        },
      });
    }

    // Parse birthday
    let birthday: Date | undefined;
    if (birthdayStr?.trim()) {
      birthday = new Date(birthdayStr);
      if (isNaN(birthday.getTime())) {
        birthday = undefined;
      }
    }

    // Parse likes and dislikes
    const likes = likesStr?.trim()
      ? likesStr
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    const dislikes = dislikesStr?.trim()
      ? dislikesStr
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    try {
      await createFamilyMember(locals.user.id, {
        name: name.trim(),
        relationship: relationship.trim(),
        birthday,
        likes,
        dislikes,
        energyLevel: energyLevel || undefined,
      });

      throw redirect(302, '/family');
    } catch (error) {
      // Re-throw redirects - they're not actual errors
      if (error && typeof error === 'object' && 'status' in error && error.status === 302) {
        throw error;
      }

      console.error('Error creating family member:', error);
      return fail(500, {
        error: 'Failed to create family member',
        values: {
          name,
          relationship,
          birthday: birthdayStr,
          energyLevel,
          likes: likesStr,
          dislikes: dislikesStr,
        },
      });
    }
  },
};
