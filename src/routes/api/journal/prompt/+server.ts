import { json } from '@sveltejs/kit';
import { OpenAIService } from '$lib/server/openai.js';
import type { RequestHandler } from '@sveltejs/kit';

const openaiService = new OpenAIService();

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const prompt = await openaiService.generateInitialPrompt();
		return json({ prompt });
	} catch (error) {
		console.error('Error generating initial prompt:', error);
		return json({ error: 'Failed to generate prompt' }, { status: 500 });
	}
};
