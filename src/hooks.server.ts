import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, session } from '$lib/server/db/schema';
import { eq, and, lt, gt } from 'drizzle-orm';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	try {
		// Get session with user
		const now = new Date();
		const [sessionWithUser] = await db
			.select({
				session,
				user
			})
			.from(session)
			.innerJoin(user, eq(session.userId, user.id))
			.where(and(
				eq(session.id, sessionId),
				gt(session.expiresAt, now)
			))
			.limit(1);

		if (sessionWithUser) {
			// Valid session
			event.locals.user = {
				id: sessionWithUser.user.id,
				email: sessionWithUser.user.email,
				username: sessionWithUser.user.username
			};
			event.locals.session = sessionWithUser.session;
		} else {
			// Invalid or expired session, clear cookie
			event.cookies.delete('session', { path: '/' });
			event.locals.user = null;
			event.locals.session = null;
		}
	} catch (error) {
		console.error('Auth middleware error:', error);
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};

export const handle: Handle = handleAuth;
