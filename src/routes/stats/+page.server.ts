import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import {
	getUserStats,
	createStat,
	updateStat,
	deleteStat,
	awardXp,
	addStatActivity
} from '$lib/server/stats.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const stats = await getUserStats(locals.user.id);

	return {
		user: locals.user,
		stats
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const icon = data.get('icon') as string;
		const exampleActivity = data.get('exampleActivity') as string;
		const exampleXp = parseInt(data.get('exampleXp') as string) || 15;

		if (!name?.trim()) {
			return fail(400, {
				error: 'Name is required',
				name,
				description,
				icon,
				exampleActivity,
				exampleXp: exampleXp.toString()
			});
		}

		try {
			const newStat = await createStat(locals.user.id, name, description, icon);

			// Add the example activity if provided
			if (exampleActivity?.trim()) {
				await addStatActivity(newStat.id, exampleActivity.trim(), exampleXp);
			}

			return { success: true };
		} catch (error) {
			console.error('Error creating stat:', error);
			return fail(500, {
				error: 'Failed to create stat',
				name,
				description,
				icon,
				exampleActivity,
				exampleXp: exampleXp.toString()
			});
		}
	},

	update: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const statId = data.get('statId') as string;
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const icon = data.get('icon') as string;

		if (!statId || !name?.trim()) {
			return fail(400, {
				error: 'Stat ID and name are required'
			});
		}

		try {
			await updateStat(statId, locals.user.id, { name, description, icon });
			return { success: true };
		} catch (error) {
			console.error('Error updating stat:', error);
			return fail(500, {
				error: 'Failed to update stat'
			});
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const statId = data.get('statId') as string;

		if (!statId) {
			return fail(400, {
				error: 'Stat ID is required'
			});
		}

		try {
			await deleteStat(statId, locals.user.id);
			return { success: true };
		} catch (error) {
			console.error('Error deleting stat:', error);
			return fail(500, {
				error: 'Failed to delete stat'
			});
		}
	},

	awardXp: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const statId = data.get('statId') as string;
		const amount = parseInt(data.get('amount') as string);
		const comment = data.get('comment') as string;

		if (!statId || isNaN(amount) || amount <= 0) {
			return fail(400, {
				error: 'Valid stat ID and positive amount are required'
			});
		}

		try {
			const result = await awardXp(locals.user.id, statId, amount, 'adhoc', undefined, comment);
			return {
				success: true,
				leveledUp: result.leveledUp,
				newLevel: result.newLevel,
				xpAwarded: amount
			};
		} catch (error) {
			console.error('Error awarding XP:', error);
			return fail(500, {
				error: 'Failed to award XP'
			});
		}
	}
};
