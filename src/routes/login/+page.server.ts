import { fail, redirect } from '@sveltejs/kit';
import { authenticateUser, createSession } from '$lib/server/auth.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.user) {
		redirect(302, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		// Validation
		if (!email || !password) {
			return fail(400, {
				error: 'Email and password are required',
				email
			});
		}

		try {
			// Authenticate user
			const user = await authenticateUser(email, password);
			if (!user) {
				return fail(400, {
					error: 'Invalid email or password',
					email
				});
			}

			// Create session
			const sessionId = await createSession(user.id);

			// Set session cookie
			cookies.set('session', sessionId, {
				path: '/',
				maxAge: 60 * 60 * 24 * 30, // 30 days
				httpOnly: true,
				secure: true,
				sameSite: 'strict'
			});
		} catch (error) {
			console.error('Login error:', error);
			return fail(500, {
				error: 'An error occurred during login. Please try again.',
				email
			});
		}

		// Redirect outside of try/catch block
		redirect(302, '/dashboard');
	}
};
