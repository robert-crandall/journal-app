import OpenAI from 'openai';
import { db } from '../db';
import { tags, attributes, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type User, type Journal, type Tag } from '../db/schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const openAiModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
console.log(`Using OpenAI model: ${openAiModel}`);

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface JournalProcessingContext {
  user: User;
  journal: Journal;
  userAttributes: Array<{ key: string; value: string }>;
  existingTags: Tag[];
}

export interface GPTFollowupResponse {
  question: string;
  shouldContinue: boolean;
}

export interface GPTJournalSummary {
  title: string; // Short, user-voiced title (5-10 words)
  summary: string; // Narrative-style summary in user's voice
  condensed: string; // Brief synopsis (1-2 sentences)
  extractedTags: string[];
  suggestedAttributes: Array<{ key: string; value: string }>;
  sentimentScore: number; // 1-5 sentiment rating
  moodTags: string[]; // mood tags like "calm", "anxious", "energized"
}

/**
 * Generate a thoughtful follow-up question based on the journal conversation so far
 */
export async function generateFollowupQuestion(context: JournalProcessingContext): Promise<GPTFollowupResponse> {
  // If OpenAI API key is not configured, return a simple fallback
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using mock follow-up generation');
    return generateMockFollowup(context);
  }

  try {
    const prompt = buildFollowupPrompt(context);
    const conversationHistory: ConversationMessage[] = context.journal.conversationHistory || [];
    
    // Add the conversation history to the prompt
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Create the completion request
    messages.unshift({ role: 'system', content: prompt });
    
    const completion = await openai.chat.completions.create({
      model: openAiModel,
      messages,
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the response to extract question and continuation flag
    const shouldContinue = context.journal.followupCount < context.journal.maxFollowups - 1;
    
    return {
      question: response.trim(),
      shouldContinue,
    };
  } catch (error) {
    console.error('Error generating follow-up question:', error);
    return generateMockFollowup(context);
  }
}

/**
 * Process the complete journal conversation and generate summary, tags, and attributes
 */
export async function processJournalSubmission(context: JournalProcessingContext): Promise<GPTJournalSummary> {
  // If OpenAI API key is not configured, return a simple fallback
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using mock journal processing');
    return generateMockSummary(context);
  }

  try {
    const prompt = buildSummaryPrompt(context);
    
    const completion = await openai.chat.completions.create({
      model: openAiModel,
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the structured response
    return parseGPTSummaryResponse(response, context);
  } catch (error) {
    console.error('Error processing journal submission:', error);
    return generateMockSummary(context);
  }
}

/**
 * Build the GPT prompt for generating follow-up questions
 */
function buildFollowupPrompt(context: JournalProcessingContext): string {
  const { user, journal } = context;
  
  let prompt = `You are a compassionate and emotionally intelligent life coach or therapist engaged in a journal conversation with the user.

Respond in a way that mirrors the user's tone and energy — playful if they're playful, serious if they're vulnerable or reflective.

Each response must follow this structure:
1. A brief observation (1-2 sentences) that shows you're listening and understanding what the user shared
2. A thoughtful follow-up question (1 sentence) that encourages deeper reflection

Keep your overall response short — never more than 3 sentences.
Avoid giving advice or interpretation unless the user asks for it.
Be warm, curious, and affirming — but never generic.
`
  
  return prompt;
}

/**
 * Build the GPT prompt for journal summary and tag extraction
 */
function buildSummaryPrompt(context: JournalProcessingContext): string {
  const { user, journal, userAttributes, existingTags } = context;
  const conversationHistory = journal.conversationHistory || [];
  
  let prompt = `You are processing a complete journal conversation for ${user.name}. `;
  prompt += `Create a cohesive summary and extract metadata.\n\n`;
  
  prompt += `COMPLETE CONVERSATION:\n`;
  conversationHistory.forEach((msg, index) => {
    const speaker = msg.role === 'user' ? user.name : 'Assistant';
    prompt += `${speaker}: ${msg.content}\n`;
  });
  
  prompt += `\nUSER CONTEXT:\n`;
  if (userAttributes.length > 0) {
    prompt += `Existing attributes: ${userAttributes.map(attr => `${attr.key}: ${attr.value}`).join(', ')}\n`;
  }
  
  if (existingTags.length > 0) {
    prompt += `Existing tags: ${existingTags.map(tag => tag.name).join(', ')}\n`;
  }
  
  prompt += `\nTASK:\n`;
  prompt += `1. Generate a short, user-voiced title (5-10 words, sentence case) that captures the core idea. Avoid RPG references (class, stat, etc.)\n`;
  prompt += `2. Write a cohesive narrative-style summary in ${user.name}'s voice that captures the key insights and experiences. Remove GPT prompts and preserve the user's tone and nuance. Write as if the user authored the full entry.\n`;
  prompt += `3. Create a brief synopsis (1-2 sentences max) that is straightforward and factual, suitable for previews\n`;
  prompt += `4. Extract 2-5 relevant tags (prefer existing tags when appropriate - use fuzzy matching for similar tags)\n`;
  prompt += `5. Suggest 0-2 new user attributes based on insights (avoid duplicating existing attributes). Extract only **persistent personality traits**, values, or behavioral tendencies. Ignore temporary emotions, states, or context-specific conditions (e.g., tired, bored, overwhelmed today)\n`;
  prompt += `6. Analyze overall emotional sentiment on a scale of 1-5 (1=very negative, 3=neutral, 5=very positive)\n`;
  prompt += `7. Extract 1-3 mood tags that capture the emotional tone (e.g., "calm", "anxious", "energized", "content", "frustrated", "excited", "peaceful", "stressed")\n\n`;
  
  prompt += `RESPONSE FORMAT (JSON):\n`;
  prompt += `{\n`;
  prompt += `  "title": "Short descriptive title capturing the core idea",\n`;
  prompt += `  "summary": "A cohesive narrative-style journal summary written in first person...",\n`;
  prompt += `  "condensed": "Brief 1-2 sentence synopsis for previews",\n`;
  prompt += `  "extractedTags": ["tag1", "tag2", "tag3"],\n`;
  prompt += `  "suggestedAttributes": [\n`;
  prompt += `    {"key": "category", "value": "specific insight"},\n`;
  prompt += `    {"key": "preference", "value": "discovered preference"}\n`;
  prompt += `  ],\n`;
  prompt += `  "sentimentScore": 4,\n`;
  prompt += `  "moodTags": ["energized", "content"]\n`;
  prompt += `}\n\n`;
  
  prompt += `Return only the JSON response:`;
  
  return prompt;
}

/**
 * Parse the GPT response for summary, tags, and attributes
 */
function parseGPTSummaryResponse(response: string, context: JournalProcessingContext): GPTJournalSummary {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      title: parsed.title || 'Journal Entry',
      summary: parsed.summary || 'Summary could not be generated.',
      condensed: parsed.condensed || 'Brief summary not available.',
      extractedTags: Array.isArray(parsed.extractedTags) ? parsed.extractedTags : [],
      suggestedAttributes: Array.isArray(parsed.suggestedAttributes) ? parsed.suggestedAttributes : [],
      sentimentScore: typeof parsed.sentimentScore === 'number' ? Math.max(1, Math.min(5, parsed.sentimentScore)) : 3,
      moodTags: Array.isArray(parsed.moodTags) ? parsed.moodTags : [],
    };
  } catch (error) {
    console.error('Error parsing GPT summary response:', error);
    return generateMockSummary(context);
  }
}

/**
 * Generate a mock follow-up question when GPT is not available
 */
function generateMockFollowup(context: JournalProcessingContext): GPTFollowupResponse {
  const mockQuestions = [
    "What emotions came up for you during that experience?",
    "How does this connect to what you value most in life?",
    "What would you like to remember most about today?",
    "What surprised you about your reaction to this situation?",
    "How do you feel this experience has changed your perspective?",
  ];
  
  const randomQuestion = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
  const shouldContinue = context.journal.followupCount < context.journal.maxFollowups - 1;
  
  return {
    question: randomQuestion,
    shouldContinue,
  };
}

/**
 * Generate a mock summary when GPT is not available
 */
function generateMockSummary(context: JournalProcessingContext): GPTJournalSummary {
  const conversationHistory = context.journal.conversationHistory || [];
  const userContent = conversationHistory
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join(' ');
  
  return {
    title: 'Today\'s reflection',
    summary: `Today I reflected on ${userContent.slice(0, 200)}...`,
    condensed: 'Reflected on personal experiences and growth.',
    extractedTags: ['reflection', 'personal-growth'],
    suggestedAttributes: [],
    sentimentScore: 3, // Neutral sentiment for mock
    moodTags: ['reflective'], // Default mood tag for mock
  };
}
