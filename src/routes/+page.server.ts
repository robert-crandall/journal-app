import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is already authenticated, redirect to dashboard
	if (locals.user) {
		redirect(302, '/dashboard');
	}

	// Return empty object for unauthenticated users (they see the home page)
	return {};
};
