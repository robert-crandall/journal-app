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

  // In test environment, return mock responses to avoid API calls
  if (process.env.NODE_ENV === 'test' || process.env.OPENAI_API_KEY === 'sk-test-key-for-testing-only') {
    const lastMessage = messages[messages.length - 1];
    const content = typeof lastMessage?.content === 'string' ? lastMessage.content : '';
    const systemMessage = messages.find((m) => m.role === 'system');
    const systemContent = typeof systemMessage?.content === 'string' ? systemMessage.content : '';

    // Generate appropriate mock responses based on the prompt content
    let mockResponse = '';

    if (content.includes('Generate a welcome message')) {
      mockResponse = "Hi there! I'm here to help you reflect on whatever's on your mind today. What would you like to share?";
    } else if (content.includes('journal conversation') && !content.includes('Generate metadata')) {
      mockResponse = 'That sounds really meaningful. Can you tell me more about what that experience was like for you?';
    } else if (
      content.includes('two tasks based on this information') ||
      content.includes('character') ||
      content.includes('projects') ||
      content.includes('adventures')
    ) {
      // Task generation mock response
      mockResponse = JSON.stringify({
        personalTask: {
          title: 'Complete daily coding practice',
          description: 'Spend 30 minutes practicing coding skills to build technical expertise and maintain momentum in your software development journey.',
          type: 'personal',
          estimatedXp: 25,
          suggestedDuration: '30 minutes',
        },
        familyTask: {
          title: 'Have a meaningful conversation with family',
          description: 'Take time to connect with a family member through genuine conversation, asking about their day and sharing yours.',
          type: 'family',
          familyMemberId: 'mock-family-id',
          estimatedXp: 30,
          suggestedDuration: '20-30 minutes',
        },
      });
    } else if (
      content.includes('Generate metadata') ||
      content.includes('Analyze this journal conversation') ||
      content.includes('analyze this journal entry')
    ) {
      // Return properly formatted JSON for journal analysis
      mockResponse = JSON.stringify({
        summary:
          'In this journal session, the user shared their thoughts and feelings in a meaningful conversation. The discussion touched on personal experiences and provided space for reflection.',
        synopsis: 'A thoughtful conversation about current experiences and feelings.',
        title: 'Reflective Journal Session',
        contentTags: ['reflection', 'thoughts', 'personal'],
        toneTags: ['reflective', 'thoughtful'],
        statTags: [],
        suggestedTodos: ["Continue reflecting on today's experiences"],
      });
    } else if (
      content.includes('goal alignment') ||
      content.includes('aligned with their goals') ||
      content.includes('alignmentScore') ||
      systemContent.includes('goal alignment') ||
      systemContent.includes('alignmentScore') ||
      systemContent.includes('aligned with their goals')
    ) {
      // Mock response for goal alignment summary generation
      mockResponse = JSON.stringify({
        alignmentScore: 75,
        alignedGoals: [
          {
            goalId: 'mock-goal-1',
            goalTitle: 'Mock Goal 1',
            evidence: ['User mentioned working on this goal in their journal', 'Made progress on related activities'],
          },
        ],
        neglectedGoals: [
          {
            goalId: 'mock-goal-2',
            goalTitle: 'Mock Goal 2',
            reason: 'Limited time available during this period',
          },
        ],
        suggestedNextSteps: ['Continue making progress on aligned goals', 'Set aside specific time for neglected goals', 'Review goal priorities regularly'],
        summary:
          'During this period, you demonstrated solid alignment with your primary goals, showing consistent effort in key areas. While some goals received less attention, this appears to be due to natural prioritization rather than lack of commitment. Your journal entries reveal a thoughtful approach to goal pursuit and strong self-awareness about your progress and challenges.',
      });
    } else if (
      (content.includes('Please generate a') &&
        (content.includes('ly summary based on these journal entries') || content.includes('weekly summary') || content.includes('monthly summary'))) ||
      systemContent.includes('period summary') ||
      systemContent.includes('weekly summary') ||
      systemContent.includes('monthly summary')
    ) {
      // Mock response for period summary generation
      mockResponse = JSON.stringify({
        summary:
          'This week showed consistent progress in learning and personal development. You demonstrated dedication to your Spanish learning goals through regular practice sessions, while maintaining a positive and energized mindset. The balance between focused study time and reflection created a productive routine that supported both immediate learning and long-term retention. Your commitment to daily practice is building strong foundations for continued growth.',
        tags: ['learning', 'spanish', 'consistency', 'progress', 'dedication'],
      });
    } else if (
      content.includes('unified weekly reflection') ||
      content.includes('combined reflection') ||
      content.includes('weekly analysis') ||
      systemContent.includes('unified weekly reflection') ||
      systemContent.includes('combined reflection') ||
      systemContent.includes('weekly analysis')
    ) {
      // Mock response for combined weekly analysis reflection
      mockResponse =
        "This week showed great progress in learning and personal development. Your consistent effort in practicing Spanish and maintaining daily routines demonstrates strong self-discipline. The balance between productivity and reflection created a positive momentum that carried through each day. Moving forward, consider building on this foundation by setting slightly more challenging goals while maintaining the sustainable pace you've established.";
    } else if (
      content.includes('Discovered attributes to deduplicate:') ||
      systemContent.includes('intelligently deduplicate and clean up discovered attributes') ||
      systemContent.includes('consolidate similar discovered attributes')
    ) {
      // Mock response for attribute deduplication
      mockResponse = JSON.stringify([
        'Outdoor activities and exploration',
        'Programming and problem-solving'
      ]);
    } else {
      mockResponse = 'This is a mock response for testing purposes.';
    }

    // Simulate some delay to make it more realistic
    await new Promise((resolve) => setTimeout(resolve, 10));

    return {
      content: mockResponse,
      tokenUsage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    };
  }

  const client = getClient();
  const isDebug = gptConfig.isDebugEnabled();
  const isWelcomeMessageEnabled = gptConfig.isWelcomeMessageEnabled();

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
        content,
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
