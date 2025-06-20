import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	// We'll validate the task ID exists on the client side
	// This just ensures we have the task ID parameter
	if (!params.id) {
		throw error(404, 'Task not found');
	}

	return {
		taskId: params.id
	};
};
