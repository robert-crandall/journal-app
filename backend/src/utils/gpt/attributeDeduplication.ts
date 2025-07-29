import { callGptApi } from './client';
import { parseGptJsonResponse } from './utils';
import type { UserAttribute } from '../../db/schema/user-attributes';

/**
 * Interface for GPT deduplication request
 */
export interface AttributeDeduplicationRequest {
  userAttributes: string[]; // User-defined attributes (to preserve)
  discoveredAttributes: string[]; // Journal-analysis attributes (to deduplicate)
}

/**
 * Interface for GPT deduplication response
 */
export interface AttributeDeduplicationResponse {
  deduplicatedAttributes: string[];
}

/**
 * Create system prompt for attribute deduplication
 */
function createDeduplicationSystemPrompt(): string {
  return `You are an expert at analyzing and consolidating personal attribute lists. Your task is to intelligently deduplicate and clean up discovered attributes while being aware of user-defined attributes.

CRITICAL RULES:
1. You will receive two lists: user-defined attributes and discovered attributes
2. NEVER modify, duplicate, or reference the user-defined attributes in your output
3. Only process the discovered attributes list
4. Consolidate similar discovered attributes into cleaner, more concise versions
5. Remove redundancy and combine semantically similar items
6. Avoid creating attributes that are too similar to the user-defined ones
7. Return ONLY the cleaned-up discovered attributes as a JSON array of strings

Your goal is to reduce noise while preserving the essence of what was discovered from journal analysis.

Response format: Return a JSON array of strings containing the deduplicated discovered attributes.

Example:
Input discovered attributes: ["Spends time with kids", "Plays with children", "Goes hiking", "Enjoys nature", "Explores outdoors", "Debugging", "Writes code", "Solves puzzles"]
Output: ["Engages in outdoor activities", "Problem-solving and programming"]`;
}

/**
 * Generate deduplicated attributes using GPT
 * @param request The deduplication request with user and discovered attributes
 * @returns Promise resolving to deduplicated attributes
 */
export async function generateDeduplicatedAttributes(
  request: AttributeDeduplicationRequest
): Promise<AttributeDeduplicationResponse> {
  const { userAttributes, discoveredAttributes } = request;

  // If there are no discovered attributes to deduplicate, return empty array
  if (!discoveredAttributes || discoveredAttributes.length === 0) {
    return { deduplicatedAttributes: [] };
  }

  // If there are very few discovered attributes, return them as-is
  if (discoveredAttributes.length <= 2) {
    return { deduplicatedAttributes: discoveredAttributes };
  }

  const userMessage = `User-defined attributes (DO NOT modify these):
${userAttributes.map(attr => `- ${attr}`).join('\n')}

Discovered attributes to deduplicate:
${discoveredAttributes.map(attr => `- ${attr}`).join('\n')}

Please consolidate the discovered attributes into a cleaner, deduplicated list. Remember to avoid creating attributes that overlap with the user-defined ones.`;

  const messages = [
    {
      role: 'system' as const,
      content: createDeduplicationSystemPrompt(),
    },
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  // Call GPT API with a lower temperature for more consistent results
  const response = await callGptApi({
    messages,
    temperature: 0.3, // Lower temperature for more focused, consistent deduplication
  });

  try {
    // Parse the response as a JSON array of strings
    const parsed = parseGptJsonResponse(response.content);
    
    // Validate that the response is an array of strings
    if (!Array.isArray(parsed)) {
      throw new Error('GPT response is not an array');
    }

    const deduplicatedAttributes = parsed.filter(item => 
      typeof item === 'string' && item.trim().length > 0
    );

    return { deduplicatedAttributes };
  } catch (error: any) {
    throw new Error(`Failed to parse GPT deduplication response: ${error.message}`);
  }
}

/**
 * Helper function to separate attributes by source
 * @param attributes All user attributes
 * @returns Object with userDefined and discovered attribute arrays
 */
export function separateAttributesBySource(attributes: UserAttribute[]): {
  userDefined: UserAttribute[];
  discovered: UserAttribute[];
} {
  const userDefined = attributes.filter(attr => attr.source === 'user_set');
  const discovered = attributes.filter(attr => attr.source === 'journal_analysis');

  return { userDefined, discovered };
}
