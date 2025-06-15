import OpenAI from 'openai';
import 'dotenv/config';

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not found in environment variables. AI features will not work.');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Base system prompt for the conversational assistant
const BASE_SYSTEM_PROMPT = `
You are a friendly, supportive life coach assistant. Your goal is to help the user improve their life through
thoughtful conversation, journaling, and completing tasks and quests. Be supportive, encouraging, and thoughtful.
Ask follow-up questions to better understand the user. Keep responses concise and focused.
`;

/**
 * Generate a response from the OpenAI API
 */
export async function generateChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    userContext?: Record<string, string[]>;
  } = {}
) {
  const { model = 'gpt-4o', temperature = 0.7, userContext = {} } = options;
  
  // Create system prompt with user context if available
  let systemPrompt = BASE_SYSTEM_PROMPT;
  
  if (Object.keys(userContext).length > 0) {
    systemPrompt += '\n\nUser context:\n';
    for (const [key, values] of Object.entries(userContext)) {
      systemPrompt += `${key}: ${values.join(', ')}\n`;
    }
  }
  
  // Ensure the first message is a system message
  const allMessages = messages.slice();
  if (messages.length === 0 || messages[0].role !== 'system') {
    allMessages.unshift({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: allMessages,
      temperature,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Stream a response from OpenAI
 */
export async function streamChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    userContext?: Record<string, string[]>;
  } = {}
) {
  const { model = 'gpt-4o', temperature = 0.7, userContext = {} } = options;
  
  // Create system prompt with user context if available
  let systemPrompt = BASE_SYSTEM_PROMPT;
  
  if (Object.keys(userContext).length > 0) {
    systemPrompt += '\n\nUser context:\n';
    for (const [key, values] of Object.entries(userContext)) {
      systemPrompt += `${key}: ${values.join(', ')}\n`;
    }
  }
  
  // Ensure the first message is a system message
  const allMessages = messages.slice();
  if (messages.length === 0 || messages[0].role !== 'system') {
    allMessages.unshift({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  try {
    return await openai.chat.completions.create({
      model,
      messages: allMessages,
      temperature,
      stream: true,
    });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate AI response stream');
  }
}
