import { ChatMessage, JournalMetadata } from './conversationalJournal';
import type { ComprehensiveUserContext } from '../userContextService';
import { callGptApi } from './client';

/**
 * Generate metadata for a journal entry based on long-form content
 */
export async function generateJournalMetadataFromContent(
  content: string,
  userContext: ComprehensiveUserContext
): Promise<JournalMetadata> {
  try {
    // Build prompt
    const prompt = `
# Journal Analysis Task

## User Context
${JSON.stringify(userContext)}

## Journal Content
${content}

## Instructions
Analyze this journal entry and generate the following metadata:

1. A meaningful title (6-10 words) that captures the essence of the entry
2. A 1-2 sentence synopsis that summarizes the key points
3. A full narrative summary (2-3 paragraphs) based on the user's tone and style
4. 3-5 content tags (e.g. "work", "family", "exercise")
5. Stat tags with suggested XP amounts (from user's character stats)
6. Family member tags with XP amounts if family relationships were mentioned

Format your response as a JSON object with the following structure:
\`\`\`json
{
  "title": "Title of the Entry",
  "synopsis": "1-2 sentence synopsis",
  "summary": "Full narrative summary in 2-3 paragraphs",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedStatTags": { "stat name": xp_amount, ... },
  "suggestedFamilyTags": { "family member name": xp_amount, ... }
}
\`\`\`

Use an appropriate XP scale: 5-10 for minor mentions, 15-25 for moderate engagement, 30-50 for major focus.
`;

    // Get response from GPT
    const result = await callGptApi({
      messages: [{ role: 'user', content: prompt }],
    });
    const response = result.content;

    // Parse the JSON response
    try {
      // Extract JSON from potential text wrapping
      let jsonStr = '';
      const jsonBlockMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonStr = jsonBlockMatch[1];
      } else {
        const jsonObjectMatch = response.match(/{[\s\S]*?}/);
        if (jsonObjectMatch) {
          jsonStr = jsonObjectMatch[0];
        } else {
          // Fall back to mock data if we can't find JSON
          throw new Error('No valid JSON found in response');
        }
      }
      
      // Parse the JSON
      const metadata = JSON.parse(jsonStr) as JournalMetadata;
      return metadata;
    } catch (error) {
      console.error('Failed to parse metadata JSON:', error);
      console.log('Raw response:', response);
      // Provide default values if parsing fails
      return {
        title: 'Untitled Journal Entry',
        synopsis: 'No synopsis available.',
        summary: 'No summary available.',
        suggestedTags: [],
        suggestedStatTags: {},
        suggestedFamilyTags: {},
      };
    }
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    // Provide default values if generation fails
    return {
      title: 'Untitled Journal Entry',
      synopsis: 'No synopsis available.',
      summary: 'No summary available.',
      suggestedTags: [],
      suggestedStatTags: {},
      suggestedFamilyTags: {},
    };
  }
}

/**
 * Generate an initial reflection message based on journal content
 */
export async function generateReflectionMessage(
  content: string,
  userContext: ComprehensiveUserContext
): Promise<string> {
  try {
    // Build prompt
    const prompt = `
# Reflection Task

## User Context
${JSON.stringify(userContext)}

## Journal Content
${content}

## Instructions
You are a supportive AI reflection partner. The user has just shared their journal entry above.
Respond with a thoughtful, empathetic initial message that:

1. Acknowledges key themes or emotions in their entry
2. Asks 1-2 thoughtful follow-up questions to help them reflect deeper
3. Maintains a supportive, non-judgmental tone
4. Is conversational and personal (not formal or clinical)

Your response should be 3-5 sentences at most. Don't summarize their entire entry back to them.
Focus on helping them gain new insights about what they've shared.
`;

    // Get response from GPT
    const result = await callGptApi({
      messages: [{ role: 'user', content: prompt }],
    });
    return result.content;
  } catch (error) {
    console.error('Failed to generate reflection message:', error);
    return "Thank you for sharing your thoughts. I'd love to hear more about how you're feeling about what you wrote. What part of this experience do you think was most significant for you?";
  }
}
