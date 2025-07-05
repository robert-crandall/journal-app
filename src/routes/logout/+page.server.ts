import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth.js';
import type { Actions } from './$types.js';

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		if (locals.session) {
			await deleteSession(locals.session.id);
		}

		cookies.delete('session', { path: '/' });
		redirect(302, '/');
	}
};
