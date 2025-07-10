import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { gptConfig } from './config';
import { logger } from '../logger';

/**
 * Types for GPT API client parameters and responses
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

export type ChatMessage = ChatCompletionMessageParam;

export interface GptOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages: ChatCompletionMessageParam[];
  stream?: boolean;
}

export interface GptResponse {
  content: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Singleton OpenAI client instance
 */
let openaiClient: OpenAI | null = null;

/**
 * Get or create the OpenAI client
 */
function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: gptConfig.getApiKey(),
    });
  }
  return openaiClient;
}

/**
 * Central client function for making GPT API calls
 * This ensures consistent handling, error management, and logging
 */
export async function callGptApi(options: GptOptions): Promise<GptResponse> {
  const { model = gptConfig.getDefaultModel(), temperature, maxTokens, messages, stream = false } = options;

  const client = getClient();
  const isDebug = gptConfig.isDebugEnabled();

  // Debug logging for prompt
  if (isDebug) {
    logger.debug('GPT request:', {
      model,
      temperature,
      maxTokens,
      messages,
    });
  }

  try {
    const startTime = Date.now();

    // When streaming is enabled, handle differently
    if (stream) {
      throw new Error('Streaming is not yet implemented');
    }

    const response = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false, // Explicitly set to false since we're not handling streaming yet
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Extract response content
    const content = response.choices[0]?.message?.content || '';

    // Extract token usage if available
    const tokenUsage = response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined;

    // Debug logging for response
    if (isDebug) {
      logger.debug('GPT response:', {
        duration: `${duration}ms`,
        tokenUsage,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      });
    }

    return { content, tokenUsage };
  } catch (error) {
    // Handle errors gracefully
    logger.error('GPT API error:', error);

    // Apply retry logic in the future
    // For now, just throw the error upward
    throw new Error(`GPT API error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
