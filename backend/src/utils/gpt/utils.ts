import { ChatCompletionMessageParam } from 'openai/resources';

/**
 * Common utility functions for GPT integrations
 * These functions can be reused across different GPT use cases
 */

/**
 * Format a system prompt message
 */
export function createSystemPrompt(content: string): ChatCompletionMessageParam {
  return {
    role: 'system',
    content,
  };
}

/**
 * Format a user prompt message
 */
export function createUserPrompt(content: string): ChatCompletionMessageParam {
  return {
    role: 'user',
    content,
  };
}

/**
 * Create a standard prompt array with system and user messages
 */
export function createPrompt(systemContent: string, userContent: string): ChatCompletionMessageParam[] {
  return [createSystemPrompt(systemContent), createUserPrompt(userContent)];
}

/**
 * Extract and normalize tags from GPT-generated content
 * @param tagText Raw text containing comma-separated tags
 * @returns Array of normalized tags
 */
export function extractTagsFromText(tagText: string): string[] {
  return tagText
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}

/**
 * Generate a title from longer text content
 * This is a utility that can be used by multiple GPT use cases
 * @param text The content to generate a title for
 * @param maxLength Maximum length of the generated title
 * @returns A promise resolving to the generated title
 */
export async function generateTitleFromText(text: string, maxLength: number = 80): Promise<string> {
  // This would use the GPT client to generate a title
  // For now, we'll just return a placeholder
  return `Title for: ${text.substring(0, Math.min(20, text.length))}...`;
}

/**
 * Parse GPT-generated XP values into a numeric form
 * @param xpText Raw text containing XP values
 * @returns Number of XP points
 */
export function parseXPFromText(xpText: string): number {
  // Extract digits from text
  const match = xpText.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return 0;
}
