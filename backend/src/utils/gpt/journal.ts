import { ChatCompletionMessageParam } from 'openai/resources';
import { callGptApi } from './client';
import { createPrompt } from './utils';

/**
 * Interface for the journal entry analysis request
 */
export interface JournalAnalysisRequest {
  journalContent: string;
  userBackstory?: string;
  characterClass?: string;
  availableStats?: Array<{ id: string; name: string; description: string }>;
  temperature?: number;
}

/**
 * Interface for the journal entry analysis response
 */
export interface JournalAnalysisResponse {
  summary: string;
  synopsis: string;
  title: string;
  contentTags: string[];
  toneTags: string[];
  statTags: Array<{ statId: string; xp: number }>;
  suggestedTodos?: string[]; // Actionable items extracted from journal content
}

/**
 * System prompt for journal analysis
 */
const JOURNAL_ANALYSIS_SYSTEM_PROMPT = `
You are an insightful life coach who analyzes journal entries.
Your task is to analyze the journal entry and extract structured information.

IMPORTANT: Format your response exactly as follows (JSON format):
{
  "summary": "A thoughtful rewritten narrative capturing the essence of the entry (150-300 words)",
  "synopsis": "A 1-2 sentence overview of the journal entry",
  "title": "A 6-10 word descriptive title for the entry",
  "contentTags": ["tag1", "tag2", "tag3"], 
  "toneTags": ["calm", "reflective", "joyful"],
  "statTags": [
    {"statId": "stat-id-1", "xp": 20},
    {"statId": "stat-id-2", "xp": 15}
  ],
  "suggestedTodos": ["Actionable item 1", "Actionable item 2"]
}

Rules for analysis:
1. Content tags should identify topics discussed (e.g., work, family, health)
2. Tone tags should reflect the emotional tone (e.g., happy, stressed, grateful)
3. Stat tags should match provided stat IDs that relate to the journal content
4. XP should be between 10-50 points based on significance and depth
5. The title should be concise but descriptive
6. The summary should maintain the original voice but enhance clarity
7. The synopsis should capture the main point/theme
8. Extract 0-5 actionable todos from the journal that the user has explicitly mentioned or implied they need to do
9. Format todos as short, clear task statements that start with a verb when possible (e.g., "Call doctor about appointment")
`;

/**
 * Analyze a journal entry using GPT
 * @param options Journal analysis options
 * @returns Analysis of the journal entry
 */
export async function analyzeJournalEntry(options: JournalAnalysisRequest): Promise<JournalAnalysisResponse> {
  const { journalContent, userBackstory, characterClass, availableStats, temperature = 0.2 } = options;

  // Construct the user prompt with all relevant context
  let userPromptContent = `Journal Entry:\n${journalContent}\n\n`;

  // Add contextual information if available
  if (userBackstory) {
    userPromptContent += `User Backstory: ${userBackstory}\n\n`;
  }

  if (characterClass) {
    userPromptContent += `Character Class: ${characterClass}\n\n`;
  }

  // Add available stats if provided
  if (availableStats && availableStats.length > 0) {
    userPromptContent += 'Available Stats:\n';
    availableStats.forEach((stat) => {
      userPromptContent += `- ID: ${stat.id}, Name: ${stat.name}, Description: ${stat.description}\n`;
    });
  }

  userPromptContent += '\nPlease analyze this journal entry according to the format specified.';

  // Create the messages array for the GPT request
  const messages = createPrompt(JOURNAL_ANALYSIS_SYSTEM_PROMPT, userPromptContent);

  // Call GPT API
  const response = await callGptApi({
    messages,
    temperature,
  });

  try {
    // Parse the JSON response
    const result = JSON.parse(response.content) as JournalAnalysisResponse;
    return result;
  } catch (error) {
    throw new Error(`Failed to parse GPT response: ${error instanceof Error ? error.message : String(error)}`);
  }
}
