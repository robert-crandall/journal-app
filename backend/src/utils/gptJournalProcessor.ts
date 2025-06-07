import OpenAI from 'openai';
import { db } from '../db';
import { tags, attributes, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type User, type Journal, type Tag } from '../db/schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const openAiModel = process.env.OPENAI_MODEL || 'gpt-4-1106-preview';

export interface ConversationMessage {
  role: 'user' | 'assistant';
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
  summary: string;
  extractedTags: string[];
  suggestedAttributes: Array<{ key: string; value: string }>;
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
    
    const completion = await openai.chat.completions.create({
      model: openAiModel,
      messages: [{ role: 'system', content: prompt }],
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
  const conversationHistory = journal.conversationHistory || [];
  
  let prompt = `You are a thoughtful, empathetic journaling companion helping ${user.name} reflect on their experiences. `;
  prompt += `Your role is to ask one insightful follow-up question that helps them go deeper into their thoughts and feelings.\n\n`;
  
  prompt += `CONVERSATION SO FAR:\n`;
  conversationHistory.forEach((msg, index) => {
    const speaker = msg.role === 'user' ? user.name : 'You';
    prompt += `${speaker}: ${msg.content}\n`;
  });
  
  prompt += `\nGUIDELINES:\n`;
  prompt += `- Ask ONE thoughtful follow-up question (not multiple questions)\n`;
  prompt += `- Be empathetic and encouraging\n`;
  prompt += `- Help them explore emotions, insights, or connections they might not have considered\n`;
  prompt += `- Keep the tone conversational and supportive\n`;
  prompt += `- Don't repeat questions or topics already covered\n`;
  prompt += `- The question should be 1-2 sentences maximum\n\n`;
  
  prompt += `Your follow-up question:`;
  
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
  prompt += `1. Write a cohesive summary in ${user.name}'s voice that captures the key insights and experiences\n`;
  prompt += `2. Extract 2-5 relevant tags (prefer existing tags when appropriate)\n`;
  prompt += `3. Suggest 0-2 new user attributes based on insights (avoid duplicating existing attributes)\n\n`;
  
  prompt += `RESPONSE FORMAT (JSON):\n`;
  prompt += `{\n`;
  prompt += `  "summary": "A cohesive journal summary written in first person...",\n`;
  prompt += `  "extractedTags": ["tag1", "tag2", "tag3"],\n`;
  prompt += `  "suggestedAttributes": [\n`;
  prompt += `    {"key": "category", "value": "specific insight"},\n`;
  prompt += `    {"key": "preference", "value": "discovered preference"}\n`;
  prompt += `  ]\n`;
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
      summary: parsed.summary || 'Summary could not be generated.',
      extractedTags: Array.isArray(parsed.extractedTags) ? parsed.extractedTags : [],
      suggestedAttributes: Array.isArray(parsed.suggestedAttributes) ? parsed.suggestedAttributes : [],
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
    summary: `Today I reflected on ${userContent.slice(0, 200)}...`,
    extractedTags: ['reflection', 'personal-growth'],
    suggestedAttributes: [],
  };
}