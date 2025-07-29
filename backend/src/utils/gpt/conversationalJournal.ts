import { ChatCompletionMessageParam } from 'openai/resources';
import { callGptApi } from './client';
import { parseGptJsonResponse } from './utils';
import { getUserContext, formatUserContextForPrompt, type ComprehensiveUserContext } from '../userContextService';
import { getJournalMemoryContext } from '../journalMemoryService';
import { db } from '../../db';
import { characterStats } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

import { createOrGetTag } from '../tags';
import { getConversationalToneInstruction } from './toneInstructions';

/**
 * Interface for chat messages (matching the existing ChatMessage type)
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Interface for journal content metadata (content-based analysis)
 */
export interface JournalContentMetadata {
  title: string;
  synopsis: string;
  suggestedTags: string[]; // Raw tag names from content analysis
  suggestedTodos?: string[]; // Actionable items extracted from journal content
  suggestedAttributes?: string[]; // New user attributes discovered (personality traits, characteristics, etc.)
}

/**
 * Interface for journal context metadata (matching to existing entities)
 */
export interface JournalContextMetadata {
  toneTags: string[]; // Extracted emotional tone tags (from fixed set)
  suggestedStatTags: Record<string, { xp: number; reason: string }>; // Stat IDs with XP amount and reason for XP
  suggestedFamilyTags: Record<string, { xp: number; reason: string }>; // Family member IDs with XP amount and reason for interactions
}

/**
 * Interface for combined journal metadata (with IDs instead of names)
 */
export interface JournalMetadata extends JournalContentMetadata, JournalContextMetadata {
  suggestedTags: string[]; // Tag IDs (converted from names)
}

/**
 * System prompt for follow-up responses in conversation
 */
function createFollowUpSystemPrompt(userContext: ComprehensiveUserContext, shouldOfferSave: boolean, userMessageCount: number): string {
  const toneInstruction = getConversationalToneInstruction(userContext.gptTone);

  let systemPrompt = `You are a brilliant, emotionally intelligent friend to ${userContext.name}, helping them process their thoughts and feelings in a conversational journal session.

**Tone Instructions**: ${toneInstruction}

You're here to read the user's latest journal entry (and recent ones if provided), then respond with the tone specified above. Your job is not to fix or analyze, but to **reflect back what you're seeing** with insight and empathy.

## Things you've noticed about the user

${formatUserContextForPrompt(userContext)}

## Guidelines
`;

  if (userMessageCount < 2) {
    systemPrompt += `
Kick off a conversation with the user. Your response should feel like a natural continuation of the conversation, not a summary or analysis. Focus on what the user just said, and how it connects to their ongoing journey. Ask them questions to understand what they are saying better.
`;
  } else {
    systemPrompt += `
Keep the conversation going by responding to the user's latest message. Keep your response short and engaging, like a friend active in conversation.`;
  }

  systemPrompt += `
Your output can include:
1. **What you noticed** about emotions, patterns, reactions, or themes
2. **A hunch** about why the day felt that way, or what might be underneath
3. **Something to consider** — a question, a perspective shift, a helpful reframe. But nothing too heavy or preachy, and not very often.
4. **A nudge** to help them remember their values, goals, or what they care about
5. **A little humor** or lightness to keep it real and relatable
6. Markdown formatting, emojis, or bullet points when it makes the message hit better

LIMIT yourself to ONE or TWO of those outputs. The user will keep talking with you.

## Reminders
- Stay authentic to the tone specified above.
- Don't say the same thing every time. Vary your approach: some days validate, some days question, some days just notice.
- Don't force insight. If it's just “today was fine,” meet them there.
- Do reflect what matters most to them, even if they didn't mention it
- End with a line that feels warm, cheeky, or quietly affirming

Return only the reflection. No JSON, no summary. Markdown formatting is welcome.
`;

  if (shouldOfferSave) {
    systemPrompt += `

The conversation has reached good depth (${userMessageCount} user messages). Gently suggest saving this as a journal entry while providing a thoughtful response to their last message.`;
  }

  return systemPrompt;
}

/**
 * System prompt for extracting content-based metadata from a conversation
 */
function createContentMetadataSystemPrompt(userContext: ComprehensiveUserContext): string {
  let systemPrompt = `
You are analyzing a conversational journal session to extract meaningful content-based metadata.

Your task is to review the entire conversation and generate:

1. **Title**: A 6-10 word descriptive title capturing the main theme
2. **Synopsis**: A 1-2 sentence summary of the key points discussed
3. **Content Tags**: 3-6 tags describing topics, activities, or themes
4. **Todos**: Actionable items extracted from the conversation
5. **User Attributes**: New personality traits, characteristics, motivators, or patterns about the user that emerge from the conversation`;

  // Add existing content tags if available
  if (userContext.existingTags && userContext.existingTags.length > 0) {
    systemPrompt += `

## Context for Tag Suggestions

### Existing Content Tags
Consider using these existing tags when appropriate. You can create new tags if needed.
${userContext.existingTags.map((tag) => `- "${tag.name}"`).join('\n')}`;
  }

  // Add existing user attributes to avoid duplicates
  if (userContext.userAttributes && userContext.userAttributes.length > 0) {
    systemPrompt += `

### Existing User Attributes
The following attributes about the user are already known. DO NOT suggest these again:
${userContext.userAttributes.map((attr) => `- ${attr.value} (source: ${attr.source})`).join('\n')}`;
  }

  systemPrompt += `

IMPORTANT: Format your response exactly as JSON:
{
  "title": "Brief descriptive title",
  "synopsis": "1-2 sentence overview", 
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedTodos": ["Actionable item 1", "Actionable item 2"],
  "suggestedAttributes": ["New personality trait or characteristic", "Another insight about the user"]
}

## Todo Guidelines

Only include todos that are explicitly mentioned in the conversation. Do not invent tasks, and do not add tasks based on implications. Focus on concrete, actionable items that the user has expressed a need to do.

## Tagging Guidelines

**Content Tags**: Prefer existing tags when they fit the content. Create new tags only when existing ones don't capture the conversation themes. Use lowercase, concise terms.

**Todos**: Extract 0-5 actionable items from the conversation that the user has mentioned or implied they need to do. Format each as a short, clear task statement:
  - Start with a verb when possible (e.g., "Call doctor about appointment")
  - Keep each todo brief (under 100 characters)
  - Focus on concrete, specific actions
  - Only include todos that seem genuinely important to the user

**User Attributes**: OPTIONAL. Extract 0-3 new insights about the user's personality, characteristics, motivators, values, or behavioral patterns that become evident from the conversation. Guidelines:
  - Only suggest attributes that are NOT already in the existing attributes list
  - Focus on deeper personality traits, characteristics, motivators, or patterns rather than temporary states
  - Be specific and meaningful (e.g., "Prefers to process emotions through creative expression" rather than "Creative")
  - Avoid duplicating or paraphrasing existing attributes
  - Only include attributes that are clearly demonstrated or discussed in the conversation

DO NOT GUESS. If you cannot determine a field, leave it empty or null. Focus on the content of the conversation, not external context.

Return ONLY the JSON object without any additional text or explanation.
`;

  return systemPrompt;
}

/**
 * System prompt for extracting context-based metadata (matching to existing entities)
 */
function createContextMetadataSystemPrompt(userContext: ComprehensiveUserContext): string {
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

  let systemPrompt = `
You are analyzing a conversational journal session to match content to existing user context entities.

Your task is to review the entire conversation and generate:

1. **Tone Tags**: Up to 2 emotional tone tags from this fixed list: happy, calm, energized, overwhelmed, sad, angry, anxious. Only include tones that are clearly expressed or strongly implied.
2. **Stat Tags**: Character stats that could be relevant based on the content discussed, formatted as a hash where keys are stat names and values are XP amounts to award (5-50 XP based on significance)
3. **Family Tags**: Family members mentioned or involved in activities discussed, formatted as a hash where keys are family member names and values are XP amounts to award for relationship interactions (5-50 XP based on significance)`;

  // Add available character stats information
  if (userContext.characterStats && userContext.characterStats.length > 0) {
    systemPrompt += `

### Current Character Stats
These are the user's current character stats that could receive XP:`;
    systemPrompt += formatCharacterStatsForPrompt(userContext.characterStats);
  }

  // Add available family members information
  if (userContext.familyMembers && userContext.familyMembers.length > 0) {
    systemPrompt += `

### Family Members
These are the user's family members that could receive connection XP:`;
    systemPrompt += formatFamilyMembersForPrompt(userContext.familyMembers);
  }

  systemPrompt += `

IMPORTANT: Format your response exactly as JSON:
{
  "toneTags": ["tag1", "tag2"],
  "suggestedStatTags": {
    "statName1": { "xp": 15, "reason": "Specific achievement or activity that developed this stat" },
    "statName2": { "xp": 25, "reason": "Specific achievement or activity that developed this stat" }
  },
  "suggestedFamilyTags": {
    "familyMemberName1": { "xp": 20, "reason": "Specific interaction or quality time spent with this person" },
    "familyMemberName2": { "xp": 15, "reason": "Specific interaction or quality time spent with this person" }
  }
}

## Tagging Guidelines

**Tone Tags**: Analyze the user's emotional state and mood throughout the conversation. Select up to 2 tone tags from this exact list: "happy", "calm", "energized", "overwhelmed", "sad", "angry", "anxious". Only include emotional tones that are clearly expressed or strongly implied. Prefer emotional tones that dominate the mood or are repeated, rather than fleeting moments.

**Stat Tags**: Only suggest stats (current or available) that genuinely relate to activities or growth areas discussed. Consider both what the user did and what skills/qualities they demonstrated or worked on. For each stat, provide:
  - XP amount between 5-50 based on the significance and effort discussed
  - A specific reason describing what actions or qualities earned this XP
  - Use the exact stat names provided in the context

**Family Tags**: Only suggest family members who were mentioned, involved in activities, or discussed in the conversation. For each family member, provide:
  - XP amount between 5-50 based on the significance of the interaction
  - A specific reason describing the interaction or quality time spent with them
  - Use the exact family member names provided in the context

DO NOT GUESS. If you cannot determine a field, leave it empty or null. Focus on the content of the conversation, not external context.

Return ONLY the JSON object without any additional text or explanation.
`;

  return systemPrompt;
}

/**
 * System prompt for generating a high-quality journal summary
 */
function createSummarySystemPrompt(userContext: ComprehensiveUserContext): string {
  return `You are a skilled writer tasked with summarizing a journal conversation into a cohesive journal entry.
  Transform the user's previous journal entries into a single, flowing narrative that captures the essence of their thoughts and feelings during this quest period.
  
  Your summary should:
  1. Maintains the user's voice, style, and key phrases
  2. Connects fragmented thoughts across multiple entries into a single narrative
  3. Sounds like a single journal entry rather than a back-and-forth conversation

  - Do not include comments in the summary.
  - Focus only on the user's thoughts and experiences.
  - Write in first person from the user's perspective.
  - Use a dry, fact-based tone, avoiding flowery language or excessive emotion.
  
  You can break the summary into paragraphs. You can also add markdown formatting, bullets, or other elements to enhance the entry, but do not feel obligated to do so.
  
  Maintain the user's original voice and style, and ensure the summary flows naturally as a single entry.`;
}

/**
 * Generate a follow-up response in a conversational journal session
 */
export async function generateFollowUpResponse(
  conversation: ChatMessage[],
  userContext: ComprehensiveUserContext,
  userId: string,
): Promise<{ response: string; shouldOfferSave: boolean }> {
  const userMessages = conversation.filter((msg) => msg.role === 'user');
  const shouldOfferSave = userMessages.length >= 3;

  // Create the system prompt with user context
  const systemPrompt = createFollowUpSystemPrompt(userContext, shouldOfferSave, userMessages.length);

  // Prepare the conversation messages for the API
  const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];

  // Add journal memory context as individual messages (oldest to newest)
  const journalMemory = await getJournalMemoryContext(userId);

  // Add monthly summaries first (oldest to newest)
  if (journalMemory.monthlySummaries.length > 0) {
    journalMemory.monthlySummaries.reverse().forEach((summary) => {
      const startDate = new Date(summary.startDate);
      const monthYear = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      messages.push({
        role: 'user',
        content: `📆 **Monthly Summary: ${monthYear}**\n\n${summary.summary}`,
      });
    });
  }

  // Add weekly summaries (oldest to newest)
  if (journalMemory.weeklySummaries.length > 0) {
    journalMemory.weeklySummaries.reverse().forEach((summary) => {
      const startDate = new Date(summary.startDate);
      const endDate = new Date(summary.endDate);
      const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      messages.push({
        role: 'user',
        content: `📅 **Weekly Summary: ${dateRange}**\n\n${summary.summary}`,
      });
    });
  }

  // Add daily journals (oldest to newest)
  if (journalMemory.dailyJournals.length > 0) {
    journalMemory.dailyJournals.reverse().forEach((entry) => {
      const date = new Date(entry.date);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Add user journal entry
      messages.push({
        role: 'user',
        content: `🗓️ **${formattedDate}**\n\n${entry.initialMessage}`,
      });

      // Add assistant reply if it exists
      if (entry.assistantReply) {
        messages.push({
          role: 'assistant',
          content: entry.assistantReply,
        });
      }
    });
  }

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
 * Generate content-based journal metadata from a complete conversation
 */
export async function generateJournalContentMetadata(conversation: ChatMessage[], userId: string): Promise<JournalContentMetadata> {
  // Get enhanced user context with tags for content metadata generation
  const enhancedContext = await getUserContext(userId, {
    includeExistingTags: true,
    includeUserAttributes: true, // Include existing user attributes to avoid duplicates
  });

  // Create the system prompt with enhanced user context
  const systemPrompt = createContentMetadataSystemPrompt(enhancedContext);

  // Prepare the conversation messages for the API
  const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];

  // Add the recent conversation context (only user messages)
  conversation.forEach((msg) => {
    if (msg.role === 'user') {
      // Only include user messages for summary
      messages.push({
        role: 'user',
        content: msg.content,
      });
    }
  });

  messages.push({
    role: 'user',
    content: `\nGenerate content metadata for this journal session according to the specified JSON format. Return only a valid JSON object. No commentary, no formatting, no extra text.`,
  });

  const response = await callGptApi({
    messages,
    temperature: 0.3, // Lower temperature for more consistent structured output
  });

  try {
    const rawResult = parseGptJsonResponse(response.content);
    return {
      title: rawResult.title || '',
      synopsis: rawResult.synopsis || '',
      suggestedTags: rawResult.suggestedTags || [],
      suggestedTodos: rawResult.suggestedTodos || [],
      suggestedAttributes: rawResult.suggestedAttributes || [],
    };
  } catch (error) {
    throw new Error(`Failed to parse GPT content metadata response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate context-based journal metadata from a complete conversation
 */
export async function generateJournalContextMetadata(conversation: ChatMessage[], userId: string): Promise<JournalContextMetadata> {
  // Get enhanced user context with stats and family for context metadata generation
  const enhancedContext = await getUserContext(userId, {
    includeCharacter: true,
    includeFamilyMembers: true,
    includeCharacterStats: true, // Stats will be provided in the metadata
  });

  // Create the system prompt with enhanced user context
  const systemPrompt = createContextMetadataSystemPrompt(enhancedContext);

  // Prepare the conversation messages for the API
  const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];

  // Add the recent conversation context (only user messages)
  conversation.forEach((msg) => {
    if (msg.role === 'user') {
      // Only include user messages for summary
      messages.push({
        role: 'user',
        content: msg.content,
      });
    }
  });

  messages.push({
    role: 'user',
    content: `\nGenerate context metadata for this journal session according to the specified JSON format. Return only a valid JSON object. No commentary, no formatting, no extra text.`,
  });

  const response = await callGptApi({
    messages,
    temperature: 0.3, // Lower temperature for more consistent structured output
  });

  try {
    const rawResult = parseGptJsonResponse(response.content);
    return {
      toneTags: rawResult.toneTags || [],
      suggestedStatTags: rawResult.suggestedStatTags || {},
      suggestedFamilyTags: rawResult.suggestedFamilyTags || {},
    };
  } catch (error) {
    throw new Error(`Failed to parse GPT context metadata response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate combined journal metadata from a complete conversation
 */
export async function generateJournalMetadata(conversation: ChatMessage[], userId: string): Promise<JournalMetadata> {
  // Get the user context for tag name to ID conversion
  const enhancedContext = await getUserContext(userId, {
    includeCharacter: true,
    includeFamilyMembers: true,
    includeCharacterStats: true,
    includeExistingTags: true,
  });

  // Run both content and context analysis in parallel for efficiency
  const [contentMetadata, contextMetadata] = await Promise.all([
    generateJournalContentMetadata(conversation, userId),
    generateJournalContextMetadata(conversation, userId),
  ]);

  // Convert tag names to IDs
  const tagIds: string[] = [];
  for (const tagName of contentMetadata.suggestedTags) {
    if (typeof tagName === 'string' && tagName.trim()) {
      try {
        const tag = await createOrGetTag(userId, tagName.toLowerCase().trim());
        tagIds.push(tag.id);
      } catch (error) {
        console.warn(`Failed to create/get tag "${tagName}":`, error);
      }
    }
  }

  // Combine results into the full metadata structure
  return {
    title: contentMetadata.title,
    synopsis: contentMetadata.synopsis,
    suggestedTags: tagIds, // Use converted tag IDs
    suggestedTodos: contentMetadata.suggestedTodos,
    suggestedAttributes: contentMetadata.suggestedAttributes,
    toneTags: contextMetadata.toneTags,
    suggestedStatTags: contextMetadata.suggestedStatTags,
    suggestedFamilyTags: contextMetadata.suggestedFamilyTags,
  };
}

/**
 * Generate a rich, narrative summary from a conversational journal session
 */
export async function generateJournalSummary(conversation: ChatMessage[], userContext: ComprehensiveUserContext, userId: string): Promise<string> {
  // Create the system prompt focused on summary generation
  const systemPrompt = createSummarySystemPrompt(userContext);

  // Prepare the conversation messages for the API
  const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];

  // Add the recent conversation context (only user messages)
  const recentConversation = conversation;
  recentConversation.forEach((msg) => {
    if (msg.role === 'user') {
      // Only include user messages for summary
      messages.push({
        role: 'user',
        content: msg.content,
      });
    }
  });

  messages.push({
    role: 'user',
    content: `Please summarize the given messages into a cohesive journal entry:`,
  });

  const response = await callGptApi({
    messages,
    temperature: 0.7, // Balanced temperature for creative but consistent narrative
  });

  return response.content.trim();
}
