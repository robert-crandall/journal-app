import { callGptApi } from './client';
import { parseGptJsonResponse } from './utils';
import { createSystemPrompt, createUserPrompt } from './utils';

/**
 * Interface for tag deduplication input
 */
export interface TagDeduplicationInput {
  existingTags: string[];
  newTags: string[];
}

/**
 * Interface for tag deduplication output
 */
export interface TagDeduplicationOutput {
  deduplicatedTags: string[];
}

/**
 * System prompt for tag deduplication
 */
function createTagDeduplicationSystemPrompt(): string {
  return `
You are helping to keep a tag list clean and readable. Given the existing tags and new suggestions, return a final list of new tags that do NOT duplicate or closely overlap with the existing tags.

Your task:
1. Compare the new suggested tags against the existing tags
2. Remove any new tags that are duplicates or very similar to existing ones
3. Merge or simplify tags as needed to avoid redundancy
4. Return only the truly new and unique tags that should be added

Guidelines:
- Be strict about duplicates (e.g., "family" and "family time" are too similar)
- Consider semantic similarity (e.g., "reflection" and "introspection" are similar)
- Prefer more specific over generic terms when merging
- Keep tag names concise and descriptive
- Return lowercase, trimmed tag names

Return your response as a JSON object with this exact format:
{
  "deduplicatedTags": ["tag1", "tag2", "tag3"]
}
`;
}

/**
 * Use GPT to deduplicate tags against existing ones
 */
export async function deduplicateTags(existingTags: string[], newTags: string[], userId: string): Promise<string[]> {
  if (newTags.length === 0) {
    return [];
  }

  // If no existing tags, return the new tags as-is (normalized)
  if (existingTags.length === 0) {
    return newTags.map((tag: string) => tag.trim().toLowerCase()).filter((tag: string) => tag.length > 0);
  }

  const systemPrompt = createTagDeduplicationSystemPrompt();
  const userInput = JSON.stringify({
    existingTags,
    newTags,
  });

  const messages = [createSystemPrompt(systemPrompt), createUserPrompt(userInput)];

  try {
    const response = await callGptApi({
      messages,
      temperature: 0.3, // Low temperature for consistent deduplication
    });

    const parsed = parseGptJsonResponse(response.content) as TagDeduplicationOutput;

    // Normalize and validate the returned tags
    return parsed.deduplicatedTags.map((tag: string) => tag.trim().toLowerCase()).filter((tag: string) => tag.length > 0 && tag.length <= 100);
  } catch (error) {
    console.warn('GPT tag deduplication failed, falling back to simple deduplication:', error);

    // Fallback: simple string-based deduplication
    const existingLower = existingTags.map((tag: string) => tag.toLowerCase());
    return newTags.map((tag: string) => tag.trim().toLowerCase()).filter((tag: string) => tag.length > 0 && !existingLower.includes(tag));
  }
}
