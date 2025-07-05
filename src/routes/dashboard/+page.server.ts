import { redirect, fail } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { content } from '$lib/server/db/schema.js';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	// Require authentication
	if (!locals.user) {
		redirect(302, '/login');
	}

	// Load user's content
	const userContent = await db
		.select()
		.from(content)
		.where(eq(content.userId, locals.user.id))
		.orderBy(desc(content.createdAt));

	return {
		user: locals.user,
		content: userContent
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const contentText = formData.get('content') as string;

		// Basic validation
		if (!title || title.trim().length === 0) {
			console.log('Validation failed: Title is required');
			return fail(400, { error: 'Title is required' });
		}

		if (!contentText || contentText.trim().length === 0) {
			console.log('Validation failed: Content is required');
			return fail(400, { error: 'Content is required' });
		}

		try {
			const result = await db.insert(content).values({
				userId: locals.user.id,
				title: title.trim(),
				content: contentText.trim()
			});

			return { success: true };
		} catch (error) {
			console.error('Failed to create content:', error);
			return fail(500, { error: 'Failed to create content' });
		}
	},

	update: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;
		const title = formData.get('title') as string;
		const contentText = formData.get('content') as string;

		// Basic validation
		if (!id) {
			return fail(400, { error: 'Content ID is required' });
		}

		if (!title || title.trim().length === 0) {
			return fail(400, { error: 'Title is required' });
		}

		if (!contentText || contentText.trim().length === 0) {
			return fail(400, { error: 'Content is required' });
		}

		try {
			// Verify the content belongs to the user before updating
			const existingContent = await db.select().from(content).where(eq(content.id, id)).limit(1);

			if (existingContent.length === 0 || existingContent[0].userId !== locals.user.id) {
				return fail(403, { error: 'Content not found or access denied' });
			}

			await db
				.update(content)
				.set({
					title: title.trim(),
					content: contentText.trim(),
					updatedAt: new Date()
				})
				.where(eq(content.id, id));

			return { success: true };
		} catch (error) {
			console.error('Failed to update content:', error);
			return fail(500, { error: 'Failed to update content' });
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'Content ID is required' });
		}

		try {
			// Verify the content belongs to the user before deleting
			const existingContent = await db.select().from(content).where(eq(content.id, id)).limit(1);

			if (existingContent.length === 0 || existingContent[0].userId !== locals.user.id) {
				return fail(403, { error: 'Content not found or access denied' });
			}

			await db.delete(content).where(eq(content.id, id));

			return { success: true };
		} catch (error) {
			console.error('Failed to delete content:', error);
			return fail(500, { error: 'Failed to delete content' });
		}
	}
};
