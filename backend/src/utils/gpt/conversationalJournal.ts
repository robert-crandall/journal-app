import { ChatCompletionMessageParam } from 'openai/resources';
import { callGptApi } from './client';
import { createPrompt } from './utils';
import { gptConfig } from './config';
import { getUserContext, formatUserContextForPrompt, type ComprehensiveUserContext } from '../userContextService';

/**
 * Interface for chat messages (matching the existing ChatMessage type)
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Interface for journal metadata generation
 */
export interface JournalMetadata {
  title: string;
  synopsis: string;
  summary: string;
  suggestedTags: string[];
  suggestedStatTags: Record<string, number>; // Changed from string[] to Record<statName, xpAmount>
  suggestedFamilyTags: Record<string, number>; // Family member names mapped to XP amounts for relationship interactions
}

/**
 * System prompt for generating welcome messages
 */
const WELCOME_MESSAGE_SYSTEM_PROMPT = `
You are a thoughtful, empathetic journal companion. Your role is to help users reflect on their day and experiences through gentle conversation.

Your task is to generate a warm, personalized welcome message that:
- Acknowledges the user by name if provided
- References their character class or background if available
- Invites them to share what's on their mind
- Feels supportive and non-judgmental
- Is conversational and encouraging

Keep the message to 1-2 sentences and make it feel personal but not overwhelming.
`;

/**
 * System prompt for follow-up responses in conversation
 */
function createFollowUpSystemPrompt(userContext: ComprehensiveUserContext, shouldOfferSave: boolean, userMessageCount: number): string {
  let systemPrompt = `You are a skilled journal companion helping ${userContext.name} reflect on their day. Your role is to:

1. Ask thoughtful follow-up questions that help the user explore their experiences more deeply
2. Show genuine interest and empathy
3. Help them process emotions and thoughts
4. Encourage deeper reflection without being pushy
5. Keep responses conversational and supportive

${formatUserContextForPrompt(userContext)}

## Guidelines
- Ask open-ended questions that invite elaboration
- Reflect back what you hear to show understanding
- Help them connect experiences to their goals or values when relevant
- Keep responses to 1-2 sentences
- Be warm but professional
- Don't give advice unless specifically asked`;

  if (shouldOfferSave) {
    systemPrompt += `

The conversation has reached good depth (${userMessageCount} user messages). Gently suggest saving this as a journal entry while providing a thoughtful response to their last message.`;
  } else {
    systemPrompt += `

Provide a thoughtful follow-up response that encourages deeper reflection.`;
  }

  return systemPrompt;
}

/**
 * System prompt for extracting metadata from a conversation
 */
function createMetadataSystemPrompt(userContext: ComprehensiveUserContext): string {
  let systemPrompt = `
You are analyzing a conversational journal session to extract meaningful metadata.

Your task is to review the entire conversation and generate:

1. **Title**: A 6-10 word descriptive title capturing the main theme
2. **Synopsis**: A 1-2 sentence summary of the key points discussed
3. **Summary**: A stiched-together narrative that captures the user's side of the conversation, maintaining the user's voice. It should be roughly as long as the user's messages combined. Summary can contain markdown formatting, and emojis if appropriate.
4. **Content Tags**: 3-6 tags describing topics, activities, or themes
5. **Stat Tags**: Character stats that could be relevant based on the content discussed, formatted as a hash where keys are stat names and values are XP amounts to award (5-50 XP based on significance)
6. **Family Tags**: Family members mentioned or involved in activities discussed, formatted as a hash where keys are family member names and values are XP amounts to award for relationship interactions (5-50 XP based on significance)`;

  // Add existing content tags if available
  if (userContext.existingTags && userContext.existingTags.length > 0) {
    systemPrompt += `## Context for Tag Suggestions

### Existing Content Tags
Consider using these existing tags when appropriate (sorted by usage frequency):
${userContext.existingTags.map((tag) => `- "${tag.name}"`).join('\n')}`;
  }

  // Add available character stats information
  if (userContext.characterStats && userContext.characterStats.length > 0) {
    systemPrompt += `\n\n### Current Character Stats
These are the user's current character stats that could receive XP:`;
    systemPrompt += formatCharacterStatsForPrompt(userContext.characterStats);
  }

  // Add available family members information
  if (userContext.familyMembers && userContext.familyMembers.length > 0) {
    systemPrompt += `\n\n### Family Members
These are the user's family members that could receive connection XP:`;
    systemPrompt += formatFamilyMembersForPrompt(userContext.familyMembers);
  }

  // Helper function for formatting character stats for the prompt
  function formatCharacterStatsForPrompt(
    stats: Array<{
      name: string;
      currentLevel: number;
      totalXp: number;
      description: string;
      exampleActivities?: Array<{ description: string; suggestedXp: number }>;
    }>,
  ): string {
    return (
      '\n' +
      stats
        .map((stat) => {
          let lines = [`- **${stat.name}** (Level ${stat.currentLevel}, ${stat.totalXp} XP): ${stat.description}`];
          if (stat.exampleActivities) {
            lines.push(`  - Example activities or qualities related to this stat:`);
            lines.push(
              ...stat.exampleActivities.map((activity: { description: string; suggestedXp: number } | string) => {
                if (typeof activity === 'object' && 'description' in activity && 'suggestedXp' in activity) {
                  return `    - ${activity.description} (XP: ${activity.suggestedXp})`;
                } else if (typeof activity === 'string') {
                  return `    - ${activity}`;
                } else {
                  return ``;
                }
              }),
            );
          }
          return lines.join('\n');
        })
        .join('\n')
    );
  }

  // Helper function for formatting family members for the prompt
  function formatFamilyMembersForPrompt(
    familyMembers: Array<{
      id: string;
      name: string;
      relationship: string;
      likes?: string;
      dislikes?: string;
      connectionLevel: number;
      connectionXp: number;
    }>,
  ): string {
    return (
      '\n' +
      familyMembers
        .map((member) => {
          let lines = [`- **${member.name}** (${member.relationship}, Level ${member.connectionLevel}, ${member.connectionXp} XP)`];
          if (member.likes) {
            lines.push(`  - Likes: ${member.likes}`);
          }
          if (member.dislikes) {
            lines.push(`  - Dislikes: ${member.dislikes}`);
          }
          return lines.join('\n');
        })
        .join('\n')
    );
  }

  systemPrompt += `

IMPORTANT: Format your response exactly as JSON:
{
  "title": "Brief descriptive title",
  "synopsis": "1-2 sentence overview", 
  "summary": "Detailed narrative synthesis maintaining user's voice",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedStatTags": {"statName1": 15, "statName2": 25},
  "suggestedFamilyTags": {"familyMemberName1": 20, "familyMemberName2": 15}
}

## Tagging Guidelines

**Content Tags**: Prefer existing tags when they fit the content. Create new tags only when existing ones don't capture the conversation themes. Use lowercase, concise terms.

**Stat Tags**: Only suggest stats (current or available) that genuinely relate to activities or growth areas discussed. Consider both what the user did and what skills/qualities they demonstrated or worked on. Provide XP amounts between 5-50 based on the significance and effort discussed. Use the exact stat names provided in the context.

**Family Tags**: Only suggest family members who were mentioned, involved in activities, or discussed in the conversation. Consider relationship interactions, quality time spent, or meaningful connections made. Provide XP amounts between 5-50 based on the significance of the interaction and relationship building. Use the exact family member names provided in the context.

The summary should read like a personal journal entry, written in first person, that captures the essence of what the user shared during the conversation.

DO NOT GUESS. If you cannot determine a field, leave it empty or null. Focus on the content of the conversation, not external context.

Return ONLY the JSON object without any additional text or explanation.
`;

  return systemPrompt;
}

/**
 * Generate a personalized welcome message for a journal session
 */
export async function generateWelcomeMessage(userContext: ComprehensiveUserContext): Promise<string> {
  if (!gptConfig.isWelcomeMessageEnabled()) {
    return `Welcome to your journal! I'm here to help you reflect on your thoughts and experiences. What would you like to share today?`;
  }

  let userPromptContent = `Generate a welcome message for a user starting a journal session.\n\n`;

  // Use the comprehensive context formatting
  userPromptContent += formatUserContextForPrompt(userContext);

  userPromptContent += `\nGenerate a warm, personalized welcome message that invites them to begin journaling.`;

  const messages = createPrompt(WELCOME_MESSAGE_SYSTEM_PROMPT, userPromptContent);

  const response = await callGptApi({
    messages,
    temperature: 0.7, // Higher temperature for more creative/warm responses
  });

  return response.content.trim();
}

/**
 * Generate a follow-up response in a conversational journal session
 */
export async function generateFollowUpResponse(
  conversation: ChatMessage[],
  userContext: ComprehensiveUserContext,
): Promise<{ response: string; shouldOfferSave: boolean }> {
  const userMessages = conversation.filter((msg) => msg.role === 'user');
  const shouldOfferSave = userMessages.length >= 3;

  // Create the system prompt with user context
  const systemPrompt = createFollowUpSystemPrompt(userContext, shouldOfferSave, userMessages.length);

  // Prepare the conversation messages for the API
  const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];

  // Add the recent conversation context (last 6 messages)
  const recentConversation = conversation.slice(-6);
  recentConversation.forEach((msg) => {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  });

  const response = await callGptApi({
    messages,
    temperature: 0.8, // Higher temperature for more conversational responses
  });

  return {
    response: response.content.trim(),
    shouldOfferSave,
  };
}

/**
 * Generate journal metadata from a complete conversation
 */
export async function generateJournalMetadata(conversation: ChatMessage[], userContext: ComprehensiveUserContext, userId: string): Promise<JournalMetadata> {
  // Get enhanced user context with tags and stats for metadata generation
  const enhancedContext = await getUserContext(userId, {
    includeCharacter: true,
    includeActiveGoals: true,
    includeFamilyMembers: true,
    includeCharacterStats: true, // Stats will be provided in the metadata
    includeExistingTags: true,
  });

  // Create the system prompt with enhanced user context
  const systemPrompt = createMetadataSystemPrompt(enhancedContext);

  // Prepare the conversation messages for the API
  const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];

  // Add the recent conversation context (last 6 messages)
  const recentConversation = conversation.slice(-6);
  recentConversation.forEach((msg) => {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  });

  messages.push({
    role: 'user',
    content: `\nGenerate metadata for this journal session according to the specified JSON format.`,
  });

  const response = await callGptApi({
    messages,
    temperature: 0.3, // Lower temperature for more consistent structured output
  });

  try {
    const result = JSON.parse(response.content) as JournalMetadata;
    return result;
  } catch (error) {
    throw new Error(`Failed to parse GPT metadata response: ${error instanceof Error ? error.message : String(error)}`);
  }
}
