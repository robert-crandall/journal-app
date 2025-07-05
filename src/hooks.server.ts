import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth.js';

export const handle: Handle = async ({ event, resolve }) => {
	// Get session ID from cookies
	const sessionId = event.cookies.get('session');

	if (sessionId) {
		const sessionData = await validateSession(sessionId);
		if (sessionData) {
			event.locals.user = sessionData.user;
			event.locals.session = sessionData.session;
		} else {
			// Invalid session, clear the cookie
			event.cookies.delete('session', { path: '/' });
		}
	}

	return resolve(event);
};
