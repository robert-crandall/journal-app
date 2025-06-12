import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import type { GPTProcessingResult, ConversationMessage } from '$lib/types.js';

const openai = new OpenAI({
	apiKey: env.OPENAI_API_KEY
});

export class OpenAIService {
	/**
	 * Generate follow-up questions for journal conversation
	 */
	async generateFollowUpQuestions(
		conversationHistory: ConversationMessage[]
	): Promise<string[]> {
		const messages = [
			{
				role: 'system' as const,
				content: `You are a thoughtful journal companion helping users reflect deeply on their experiences. 
				Based on the conversation so far, generate 2-3 follow-up questions that:
				1. Help the user explore emotions or motivations more deeply
				2. Connect current experiences to broader patterns or goals
				3. Encourage specific, concrete reflection rather than abstract thoughts
				
				Return ONLY a JSON array of question strings, no other text.
				Example: ["What specifically triggered that feeling?", "How does this connect to your broader goals?"]`
			},
			...conversationHistory.map(msg => ({
				role: msg.role,
				content: msg.content
			}))
		];

		try {
			const completion = await openai.chat.completions.create({
				model: 'gpt-4o-mini',
				messages,
				temperature: 0.7,
				max_tokens: 200
			});

			const response = completion.choices[0]?.message?.content;
			if (!response) throw new Error('No response from OpenAI');

			return JSON.parse(response);
		} catch (error) {
			console.error('Error generating follow-up questions:', error);
			// Return fallback questions
			return [
				"How did this experience make you feel?",
				"What would you do differently next time?",
				"How does this connect to your current goals?"
			];
		}
	}

	/**
	 * Process completed journal conversation and extract structured insights
	 */
	async processJournalEntry(
		conversationHistory: ConversationMessage[],
		existingContentTags: string[] = [],
		existingCharacterStats: string[] = []
	): Promise<GPTProcessingResult> {
		const conversationText = conversationHistory
			.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
			.join('\n\n');

		const systemPrompt = `You are analyzing a completed journal conversation to extract structured insights.

TASK: Extract the following from the conversation:

1. TITLE: A compelling 6-10 word title that captures the essence of the day
2. SYNOPSIS: A 1-2 sentence overview of what happened
3. SUMMARY: A narrative rewrite (2-3 paragraphs) in the user's voice and tone
4. CONTENT_TAGS: 3-6 topic-based tags (prefer existing: ${existingContentTags.join(', ') || 'create new ones'})
5. TONE_TAGS: Mood-based labels from this predefined set: overwhelmed, calm, frustrated, excited, anxious, content, motivated, tired, focused, scattered, hopeful, discouraged, energized, peaceful, stressed, confident, uncertain, grateful, irritated, accomplished
6. CHARACTER_TAGS: Personal growth stats used/developed (choose ONLY from existing: ${existingCharacterStats.join(', ') || 'none available'})

REQUIREMENTS:
- CONTENT_TAGS: Use existing tags when possible, create new ones only if necessary
- TONE_TAGS: Use ONLY the predefined set above, multiple allowed
- CHARACTER_TAGS: Use ONLY from the existing stats provided, empty array if none fit
- Keep the user's authentic voice in the summary
- Focus on concrete experiences over abstract concepts

Return ONLY valid JSON:
{
  "title": "string",
  "synopsis": "string", 
  "summary": "string",
  "contentTags": ["string"],
  "toneTags": ["string"],
  "characterTags": ["string"]
}`;

		try {
			const completion = await openai.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: conversationText }
				],
				temperature: 0.3,
				max_tokens: 1500
			});

			const response = completion.choices[0]?.message?.content;
			if (!response) throw new Error('No response from OpenAI');

			const result = JSON.parse(response) as GPTProcessingResult;
			
			// Validate the response
			if (!result.title || !result.synopsis || !result.summary) {
				throw new Error('Missing required fields in GPT response');
			}

			return result;
		} catch (error) {
			console.error('Error processing journal entry:', error);
			throw new Error('Failed to process journal entry with GPT');
		}
	}

	/**
	 * Generate an initial journal prompt to get the conversation started
	 */
	async generateInitialPrompt(): Promise<string> {
		const prompts = [
			"How was your day today? What stood out to you the most?",
			"Tell me about something that happened today that made you think or feel strongly.",
			"What's one thing from today that you'd like to reflect on?",
			"How are you feeling right now, and what's contributing to that mood?",
			"What was the most meaningful part of your day today?",
			"Is there something from today that you're still thinking about?"
		];

		return prompts[Math.floor(Math.random() * prompts.length)];
	}
}
