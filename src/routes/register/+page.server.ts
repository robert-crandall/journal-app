import { fail, redirect } from '@sveltejs/kit';
import { createUser, createSession, getUserByEmail } from '$lib/server/auth.js';
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
		const name = data.get('name') as string;

		// Validation
		if (!email || !password || !name) {
			return fail(400, {
				error: 'All fields are required',
				email,
				name
			});
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, {
				error: 'Please enter a valid email address',
				email,
				name
			});
		}

		if (password.length < 8) {
			return fail(400, {
				error: 'Password must be at least 8 characters long',
				email,
				name
			});
		}

		try {
			// Check if user already exists
			const existingUser = await getUserByEmail(email);
			if (existingUser) {
				return fail(400, {
					error: 'An account with this email already exists',
					email,
					name
				});
			}

			// Create user
			const user = await createUser(email, password, name);

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
			console.error('Registration error:', error);
			return fail(500, {
				error: 'An error occurred during registration. Please try again.',
				email,
				name
			});
		}

		// Redirect outside of try/catch block
		redirect(302, '/dashboard');
	}
};
