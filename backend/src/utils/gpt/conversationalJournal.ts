import { ChatCompletionMessageParam } from 'openai/resources';
import { callGptApi } from './client';
import { createPrompt } from './utils';
import { gptConfig } from './config';

/**
 * Interface for user context in conversational journal
 */
export interface UserContext {
  name: string;
  characterClass?: string;
  backstory?: string;
  goals?: string;
}

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
  suggestedStatTags: string[];
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
function createFollowUpSystemPrompt(userContext: UserContext, shouldOfferSave: boolean, userMessageCount: number): string {
  let systemPrompt = `You are a skilled journal companion helping ${userContext.name} reflect on their day. Your role is to:

1. Ask thoughtful follow-up questions that help the user explore their experiences more deeply
2. Show genuine interest and empathy
3. Help them process emotions and thoughts
4. Encourage deeper reflection without being pushy
5. Keep responses conversational and supportive

User Context:`;

  if (userContext.characterClass) {
    systemPrompt += `\n- Background: ${userContext.characterClass}`;
    if (userContext.backstory) {
      systemPrompt += ` - ${userContext.backstory}`;
    }
  }

  if (userContext.goals) {
    systemPrompt += `\n- Goals: ${userContext.goals}`;
  }

  systemPrompt += `

Guidelines:
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
 * System prompt for generating journal metadata from conversation
 */
const METADATA_GENERATION_SYSTEM_PROMPT = `
You are analyzing a conversational journal session to extract meaningful metadata.

Your task is to review the entire conversation and generate:

1. **Title**: A 6-10 word descriptive title capturing the main theme
2. **Synopsis**: A 1-2 sentence summary of the key points discussed
3. **Summary**: A stiched-together narrative that captures the user's side of the conversation, maintaining the user's voice. It should be roughly as long as the user's messages combined.
4. **Content Tags**: 3-6 tags describing topics, activities, or themes (e.g., "work", "family", "exercise", "reflection")
5. **Stat Tags**: Character stats that could be relevant based on the content discussed

IMPORTANT: Format your response exactly as JSON:
{
  "title": "Brief descriptive title",
  "synopsis": "1-2 sentence overview",
  "summary": "Detailed narrative synthesis maintaining user's voice",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedStatTags": ["stat1", "stat2"]
}

The summary should read like a personal journal entry, written in first person, that captures the essence of what the user shared during the conversation.

DO NOT GUESS. If you cannot determine a field, leave it empty or null. Focus on the content of the conversation, not external context.

Return ONLY the JSON object without any additional text or explanation.
`;

/**
 * Generate a personalized welcome message for a journal session
 */
export async function generateWelcomeMessage(userContext: UserContext): Promise<string> {
  if (!gptConfig.isWelcomeMessageEnabled()) {
    return `Welcome to your journal! I'm here to help you reflect on your thoughts and experiences. What would you like to share today?`;
  }

  let userPromptContent = `Generate a welcome message for a user starting a journal session.\n\n`;

  userPromptContent += `User Details:\n`;
  userPromptContent += `- Name: ${userContext.name}\n`;

  if (userContext.characterClass) {
    userPromptContent += `- Character Class: ${userContext.characterClass}\n`;
  }

  if (userContext.backstory) {
    userPromptContent += `- Backstory: ${userContext.backstory}\n`;
  }

  if (userContext.goals) {
    userPromptContent += `- Goals: ${userContext.goals}\n`;
  }

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
export async function generateFollowUpResponse(conversation: ChatMessage[], userContext: UserContext): Promise<{ response: string; shouldOfferSave: boolean }> {
  const userMessages = conversation.filter((msg) => msg.role === 'user');
  const shouldOfferSave = userMessages.length >= 3;

  // Create the system prompt with user context
  const systemPrompt = createFollowUpSystemPrompt(userContext, shouldOfferSave, userMessages.length);

  // Prepare the conversation messages for the API
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt }
  ];

  // Add the recent conversation context (last 6 messages)
  const recentConversation = conversation.slice(-6);
  recentConversation.forEach((msg) => {
    messages.push({
      role: msg.role,
      content: msg.content
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
export async function generateJournalMetadata(conversation: ChatMessage[], userContext: UserContext): Promise<JournalMetadata> {
  // let userPromptContent = `Analyze this journal conversation with ${userContext.name}.\n\n`;

  // if (userContext.characterClass) {
  //   userPromptContent += `User Background: ${userContext.characterClass}`;
  //   if (userContext.backstory) {
  //     userPromptContent += ` - ${userContext.backstory}`;
  //   }
  //   userPromptContent += `\n`;
  // }

  // if (userContext.goals) {
  //   userPromptContent += `User Goals: ${userContext.goals}\n`;
  // }

  let userPromptContent = `\nComplete Conversation:\n`;

  conversation.forEach((msg, index) => {
    const speaker = msg.role === 'user' ? userContext.name : 'Journal Companion';
    userPromptContent += `${speaker}: ${msg.content}\n`;
  });

  userPromptContent += `\nGenerate metadata for this journal session according to the specified JSON format.`;

  const messages = createPrompt(METADATA_GENERATION_SYSTEM_PROMPT, userPromptContent);

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
