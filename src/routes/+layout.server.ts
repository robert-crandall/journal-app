import { redirect } from '@sveltejs/kit';
import type { ServerLoadEvent } from '@sveltejs/kit';

export async function load({ locals, url }: ServerLoadEvent) {
	// If the user is already logged in and trying to access auth pages, redirect to home
	if (locals.user && url.pathname.startsWith('/auth')) {
		if (url.pathname !== '/auth/logout') {
			throw redirect(302, '/');
		}
	}

	// Return the user for the layout
	return {
		user: locals.user
	};
};
