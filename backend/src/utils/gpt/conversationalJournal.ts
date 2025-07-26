import { ChatCompletionMessageParam } from 'openai/resources';
import { callGptApi } from './client';
import { parseGptJsonResponse } from './utils';
import { getUserContext, formatUserContextForPrompt, type ComprehensiveUserContext } from '../userContextService';
import { getJournalMemoryContext } from '../journalMemoryService';
import { db } from '../../db';
import { characterStats } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { createOrGetTag } from '../tags';

/**
 * Interface for chat messages (matching the existing ChatMessage type)
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Interface for journal metadata generation (with IDs instead of names)
 */
export interface JournalMetadata {
  title: string;
  synopsis: string;
  suggestedTags: string[]; // Tag IDs
  suggestedStatTags: Record<string, { xp: number; reason: string }>; // Stat IDs with XP amount and reason for XP
  suggestedFamilyTags: Record<string, { xp: number; reason: string }>; // Family member IDs with XP amount and reason for interactions
  toneTags: string[]; // Extracted emotional tone tags (from fixed set)
  suggestedTodos?: string[]; // Actionable items extracted from journal content
}

/**
 * System prompt for follow-up responses in conversation
 */
function createFollowUpSystemPrompt(userContext: ComprehensiveUserContext, shouldOfferSave: boolean, userMessageCount: number): string {
  let systemPrompt = `You are a brilliant, emotionally intelligent friend to ${userContext.name}, with deep psychological insight and a wicked sense of humor. You're the kind of person who can validate someone's messy, beautiful life one day—and gently call out their nonsense the next.

You're here to read the user's latest journal entry (and recent ones if provided), then respond with warmth, curiosity, and the occasional eyebrow raise. Your job is not to fix or analyze, but to **reflect back what you're seeing** with insight, empathy, and a touch of playfulness.

## Things you've noticed about the user

${formatUserContextForPrompt(userContext)}

## Guidelines
`;

  if (userMessageCount < 2) {
    systemPrompt += `
Talk to the user about their latest message. This is kicking off a conversation with the user. Your tone should feel:
- Smart, compassionate, and conversational
- Occasionally funny or sarcastic (if the moment calls for it)
- Curious and human, like someone who's paying real attention
- Sometimes validating, sometimes challenging — based on the vibe

Your response should feel like a natural continuation of the conversation, not a summary or analysis. Focus on what the user just said, and how it connects to their ongoing journey. Ask them questions to understand what they are saying better.
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
- Don't sound like a coach or therapist. Be real.
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
 * System prompt for extracting metadata from a conversation
 */
function createMetadataSystemPrompt(userContext: ComprehensiveUserContext): string {
  let systemPrompt = `
You are analyzing a conversational journal session to extract meaningful metadata.

Your task is to review the entire conversation and generate:

1. **Title**: A 6-10 word descriptive title capturing the main theme
2. **Synopsis**: A 1-2 sentence summary of the key points discussed
3. **Content Tags**: 3-6 tags describing topics, activities, or themes
4. **Tone Tags**: Up to 2 emotional tone tags from this fixed list: happy, calm, energized, overwhelmed, sad, angry, anxious. Only include tones that are clearly expressed or strongly implied.
5. **Stat Tags**: Character stats that could be relevant based on the content discussed, formatted as a hash where keys are stat names and values are XP amounts to award (5-50 XP based on significance)
6. **Family Tags**: Family members mentioned or involved in activities discussed, formatted as a hash where keys are family member names and values are XP amounts to award for relationship interactions (5-50 XP based on significance)`;

  // Add existing content tags if available
  if (userContext.existingTags && userContext.existingTags.length > 0) {
    systemPrompt += `## Context for Tag Suggestions

### Existing Content Tags
Consider using these existing tags when appropriate (sorted by usage frequency):
${userContext.existingTags.map((tag) => `- "${tag.name}"`).join('\n')}`;
  }

  // Add available character stats information
  if (userContext.characterStats && userContext.characterStats.length > 0) {
    systemPrompt += `\n\n### Current Character Stats
These are the user's current character stats that could receive XP:`;
    systemPrompt += formatCharacterStatsForPrompt(userContext.characterStats);
  }

  // Add available family members information
  if (userContext.familyMembers && userContext.familyMembers.length > 0) {
    systemPrompt += `\n\n### Family Members
These are the user's family members that could receive connection XP:`;
    systemPrompt += formatFamilyMembersForPrompt(userContext.familyMembers);
  }

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

  systemPrompt += `

IMPORTANT: Format your response exactly as JSON:
{
  "title": "Brief descriptive title",
  "synopsis": "1-2 sentence overview", 
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "toneTags": ["happy", "calm"],
  "suggestedStatTags": {
    "statName1": { "xp": 15, "reason": "Specific achievement or activity that developed this stat" },
    "statName2": { "xp": 25, "reason": "Specific achievement or activity that developed this stat" }
  },
  "suggestedFamilyTags": {
    "familyMemberName1": { "xp": 20, "reason": "Specific interaction or quality time spent with this person" },
    "familyMemberName2": { "xp": 15, "reason": "Specific interaction or quality time spent with this person" }
  },
  "suggestedTodos": ["Actionable item 1", "Actionable item 2"]
}

## Todo Guidelines

Only include todos that are explicitly mentioned in the conversation. Do not invent tasks, and do not add tasks based on implications. Focus on concrete, actionable items that the user has expressed a need to do.

## Tagging Guidelines

**Content Tags**: Prefer existing tags when they fit the content. Create new tags only when existing ones don't capture the conversation themes. Use lowercase, concise terms.

**Tone Tags**: Analyze the user's emotional state and mood throughout the conversation. Select up to 2 tone tags from this exact list: "happy", "calm", "energized", "overwhelmed", "sad", "angry", "anxious". Only include emotional tones that are clearly expressed or strongly implied. Prefer emotional tones that dominate the mood or are repeated, rather than fleeting moments.

**Stat Tags**: Only suggest stats (current or available) that genuinely relate to activities or growth areas discussed. Consider both what the user did and what skills/qualities they demonstrated or worked on. For each stat, provide:
  - XP amount between 5-50 based on the significance and effort discussed
  - A specific reason describing what actions or qualities earned this XP
  - Use the exact stat names provided in the context
  
**Todos**: Extract 0-5 actionable items from the conversation that the user has mentioned or implied they need to do. Format each as a short, clear task statement:
  - Start with a verb when possible (e.g., "Call doctor about appointment")
  - Keep each todo brief (under 100 characters)
  - Focus on concrete, specific actions
  - Only include todos that seem genuinely important to the user

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
 * Generate journal metadata from a complete conversation
 */
export async function generateJournalMetadata(conversation: ChatMessage[], userId: string): Promise<JournalMetadata> {
  // Get enhanced user context with tags and stats for metadata generation
  const enhancedContext = await getUserContext(userId, {
    includeCharacter: true,
    includeActiveGoals: true,
    includeFamilyMembers: true,
    includeCharacterStats: true, // Stats will be provided in the metadata
    includeExistingTags: true,
  });

  // Create the system prompt with enhanced user context
  const systemPrompt = createMetadataSystemPrompt(enhancedContext);

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
    content: `\nGenerate metadata for this journal session according to the specified JSON format. Return only a valid JSON object. No commentary, no formatting, no extra text.`,
  });

  const response = await callGptApi({
    messages,
    temperature: 0.3, // Lower temperature for more consistent structured output
  });

  try {
    const rawResult = parseGptJsonResponse(response.content);
    // Convert names to IDs
    const convertedResult = await convertNamesToIds(rawResult, userId, enhancedContext);
    return convertedResult;
  } catch (error) {
    throw new Error(`Failed to parse GPT metadata response: ${error instanceof Error ? error.message : String(error)}`);
  }
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

/**
 * Convert tag names, stat names, and family member names to their respective IDs
 */
async function convertNamesToIds(rawMetadata: any, userId: string, userContext: ComprehensiveUserContext): Promise<JournalMetadata> {
  // Convert content tags to IDs (create if they don't exist)
  const suggestedTags: string[] = [];
  if (rawMetadata.suggestedTags || rawMetadata.contentTags) {
    const tagNames = rawMetadata.suggestedTags || rawMetadata.contentTags || [];
    for (const tagName of tagNames) {
      if (typeof tagName === 'string' && tagName.trim()) {
        try {
          const tag = await createOrGetTag(userId, tagName.toLowerCase().trim());
          suggestedTags.push(tag.id);
        } catch (error) {
          console.warn(`Failed to create/get tag "${tagName}":`, error);
        }
      }
    }
  }

  // Convert stat names to IDs
  const suggestedStatTags: Record<string, { xp: number; reason: string }> = {};
  const rawStatTags = rawMetadata.suggestedStatTags || rawMetadata.statTags || {};

  if (userContext.characterStats && typeof rawStatTags === 'object' && rawStatTags !== null) {
    for (const [statName, data] of Object.entries(rawStatTags)) {
      if (typeof data === 'object' && data !== null && 'xp' in data) {
        // Find the stat by name (case-insensitive)
        const matchingStat = userContext.characterStats.find((stat) => stat.name.toLowerCase() === statName.toLowerCase());

        if (matchingStat) {
          // Get the actual stat ID from the database
          const dbStat = await db
            .select()
            .from(characterStats)
            .where(and(eq(characterStats.userId, userId), eq(characterStats.name, matchingStat.name)))
            .limit(1);

          if (dbStat.length > 0) {
            suggestedStatTags[dbStat[0].id] = {
              xp: (data as any).xp || 0,
              reason: (data as any).reason || '',
            };
          }
        }
      }
    }
  }

  // Convert family member names to IDs
  const suggestedFamilyTags: Record<string, { xp: number; reason: string }> = {};
  const rawFamilyTags = rawMetadata.suggestedFamilyTags || {};

  if (userContext.familyMembers && typeof rawFamilyTags === 'object' && rawFamilyTags !== null) {
    for (const [familyName, data] of Object.entries(rawFamilyTags)) {
      if (typeof data === 'object' && data !== null && 'xp' in data) {
        // Find the family member by name (case-insensitive)
        const matchingMember = userContext.familyMembers.find((member) => member.name.toLowerCase() === familyName.toLowerCase());

        if (matchingMember) {
          suggestedFamilyTags[matchingMember.id] = {
            xp: (data as any).xp || 0,
            reason: (data as any).reason || '',
          };
        }
      }
    }
  }

  // Extract and validate tone tags
  const VALID_TONE_TAGS = ['happy', 'calm', 'energized', 'overwhelmed', 'sad', 'angry', 'anxious'];
  const toneTags: string[] = [];
  if (rawMetadata.toneTags && Array.isArray(rawMetadata.toneTags)) {
    for (const tag of rawMetadata.toneTags) {
      if (typeof tag === 'string' && VALID_TONE_TAGS.includes(tag.toLowerCase())) {
        toneTags.push(tag.toLowerCase());
      }
    }
  }

  return {
    title: rawMetadata.title || '',
    synopsis: rawMetadata.synopsis || '',
    suggestedTags,
    suggestedStatTags,
    suggestedFamilyTags,
    toneTags,
    suggestedTodos: rawMetadata.suggestedTodos || [],
  };
}
