import { callGptApi } from './client';
import { parseGptJsonResponse } from './utils';
/**
 * Interface for daily task generation request
 */
export interface TaskGenerationRequest {
  userId: string;
  gptTone?: string;
  characterClass?: string;
  backstory?: string;
  characterGoals?: string;
  dailyIntent?: string;
  currentFocus?:
    | string
    | {
        title: string;
        description: string;
        plans: Array<{
          title: string;
          description: string | null;
          subtasks: Array<{
            title: string;
            description: string | null;
            orderIndex: number | null;
          }>;
        }>;
      };
  activeQuests?: Array<{
    title: string;
    description: string;
  }>;
  projects?: Array<{
    title: string;
    description: string | null;
    subtasks: Array<{
      title: string;
      description: string | null;
      orderIndex: number | null;
    }>;
  }>;
  adventures?: Array<{
    title: string;
    description: string | null;
    subtasks: Array<{
      title: string;
      description: string | null;
      orderIndex: number | null;
    }>;
  }>;
  userGoals?: Array<{
    title: string;
    description: string;
  }>;
  familyMembers?: Array<{
    id: string;
    name: string;
    relationship: string;
    likes?: string[];
    dislikes?: string[];
    lastActivityDate?: string;
    lastActivityFeedback?: string;
  }>;
  weather?: {
    temperature: number;
    condition: string;
    forecast: string;
  };
  temperature?: number;
}

/**
 * Interface for a generated task
 */
export interface GeneratedTask {
  title: string;
  description: string;
  type: 'personal' | 'family';
  familyMemberId?: string;
  suggestedStatId?: string;
  estimatedXp?: number;
  suggestedDuration?: string;
}

/**
 * Interface for daily task generation response
 */
export interface TaskGenerationResponse {
  personalTask: GeneratedTask;
  familyTask: GeneratedTask;
}

/**
 * Generate tone instruction for GPT based on user preference
 */
function getToneInstruction(gptTone?: string): string {
  switch (gptTone) {
    case 'motivational':
      return 'Use a high-energy, coaching style. Be like a personal trainer or life coach - action-forward, encouraging, and pumped up. Use exclamation points and energizing language.';
    case 'funny':
      return 'Use light humor, emojis, and playful language. Be witty and entertaining while still being helpful. Make it fun and engaging.';
    case 'serious':
      return 'Be direct, efficient, and no-fluff. Keep responses concise and professional. Focus on actionable advice without unnecessary elaboration.';
    case 'minimal':
      return 'Be terse and minimal. Use as few words as possible while still being clear. No elaboration or extra context.';
    case 'wholesome':
      return 'Be calm, thoughtful, and gently encouraging. Use a nurturing, supportive tone that feels like a wise friend or mentor.';
    case 'friendly':
    default:
      return 'Be warm, approachable, and conversational. This is the default tone - friendly but not overly casual.';
  }
}

/**
 * System prompt for daily task generation
 */
function createTaskGenerationSystemPrompt(gptTone?: string): string {
  const toneInstruction = getToneInstruction(gptTone);

  return `You are a clever, grounded, and occasionally cheeky Dungeon Master (DM), guiding a modern-day adventurer through real life.

**Tone Instructions**: ${toneInstruction}

Each day, you present two meaningful “quests”:

1. **A personal quest** — this should reflect the user's character class, current focus, priorities, backstory, active quests, and the current weather. It might build strength, deepen presence, reconnect them with values, or help them break free from distraction. If a daily priority is set (e.g. "Check into X"), make that the core of the task.

2. **A family quest** — an activity with one specific family member, taking into account their interests, past activities, and the user's relationship with them. Make it bonding, playful, or meaningful. Avoid repeats and reflect weather where relevant.

🎨 **Tone**: Encouraging, humorous, and friendly. You're not a boss — you're the loyal voice saying: *“Let's do something real today.”* Use markdown, emoji, and personality.

🎯 **Format**:
Respond in this exact JSON format:
{
  "personalTask": {
    "title": "Fun and action-oriented title",
    "description": "Speak like a friend — add motivation, context, and encouragement. Markdown and emojis welcome.",
    "type": "personal",
    "suggestedStatId": "optional-stat-id-if-available",
    "estimatedXp": 30,
    "suggestedDuration": "15 minutes"
  },
  "familyTask": {
    "title": "Heartfelt or playful title",
    "description": "Reference the chosen family member, their interests, and the spirit of the activity. Keep it light, meaningful, or fun.",
    "type": "family",
    "familyMemberId": "id-here",
    "suggestedStatId": "if available",
    "estimatedXp": 40,
    "suggestedDuration": "15 minutes"
  }
}

🧭 **Guidelines**:
- Base tasks entirely on the user context (character class, backstory, focus, quests, weather, family members, etc.)
- Priority for tasks: daily intent is first, then daily focus, then plans, then quests.
- Tasks must be concrete and actionable, not abstract (“be more mindful” is not enough)
- Be creative, but make suggestions realistic for the suggested duration
- Avoid recent family activities when suggesting new ones
- Weather can influence task selection (e.g. outdoor vs indoor)
- XP should reflect effort and impact (range: 10-50)
- Maintain narrative continuity — grow the user's story

User input will be provided as a JSON object with fields like character, focus, quests, weather, etc.
`;
}

/**
 * Generate daily tasks for a user
 * @param options Task generation options
 * @returns Generated personal and family tasks
 */
export async function generateDailyTasks(options: TaskGenerationRequest): Promise<TaskGenerationResponse> {
  const {
    gptTone,
    characterClass,
    backstory,
    characterGoals,
    dailyIntent,
    currentFocus,
    activeQuests,
    projects,
    adventures,
    userGoals,
    familyMembers,
    weather,
    temperature = 0.8,
  } = options;

  // Build structured user context for the model
  const userContext: any = {
    character:
      characterClass || backstory
        ? {
            class: characterClass,
            backstory: backstory,
            // longTermGoals: characterGoals,
          }
        : undefined,
    dailyIntent: dailyIntent
      ? {
          priority: 'highest',
          dailyIntent: dailyIntent,
        }
      : undefined,
    focus: currentFocus
      ? {
          priority: 'high',
          currentFocus: currentFocus,
        }
      : undefined,
    projects: projects
      ? {
          priority: 'medium',
          projects: projects,
        }
      : undefined,
    adventures: adventures
      ? {
          priority: 'low',
          adventures: adventures,
        }
      : undefined,
    activeQuests: activeQuests
      ? {
          quests: activeQuests,
        }
      : undefined,
    goals: userGoals
      ? {
          goals: userGoals,
        }
      : undefined,
    familyMembers,
    weather,
  };

  // Remove undefined fields
  Object.keys(userContext).forEach((key) => userContext[key] === undefined && delete userContext[key]);

  // Compose the user message as an array of content blocks
  const userMessageContent = JSON.stringify(userContext);

  // Compose the messages array in the required format
  const messages = [
    {
      role: 'system',
      content: createTaskGenerationSystemPrompt(gptTone),
    },
    {
      role: 'user',
      content: userMessageContent,
    },
  ];

  // Call GPT API
  const response = await callGptApi({
    messages: messages as import('openai/resources').ChatCompletionMessageParam[],
    temperature,
  });

  try {
    const result = parseGptJsonResponse(response.content) as TaskGenerationResponse;
    return result;
  } catch (error: any) {
    throw new Error(`Failed to parse GPT response: ${error && typeof error === 'object' && 'message' in error ? error.message : String(error)}`);
  }
}
