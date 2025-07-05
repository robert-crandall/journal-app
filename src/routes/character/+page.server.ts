import { redirect, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	// Require authentication
	if (!locals.user) {
		redirect(302, '/login');
	}

	// Get fresh user data from database
	const user = await db.select().from(users).where(eq(users.id, locals.user.id)).limit(1);

	return {
		user: user[0]
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const characterClass = formData.get('characterClass') as string;
		const backstory = formData.get('backstory') as string;
		const motto = formData.get('motto') as string;
		const goals = formData.get('goals') as string;

		// Basic validation
		if (!characterClass || characterClass.trim().length === 0) {
			return fail(400, { 
				error: 'Character class is required',
				characterClass,
				backstory,
				motto,
				goals
			});
		}

		try {
			await db
				.update(users)
				.set({
					characterClass: characterClass.trim(),
					backstory: backstory?.trim() || null,
					motto: motto?.trim() || null,
					goals: goals?.trim() || null,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));

			console.log('Character updated successfully for user:', locals.user.id);
			return { success: true };
		} catch (error) {
			console.error('Failed to update character:', error);
			return fail(500, { 
				error: 'Failed to update character',
				characterClass,
				backstory,
				motto,
				goals
			});
		}
	}
};
