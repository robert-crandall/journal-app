import { callGptApi } from './client';
import { createPrompt } from './utils';
import { logger } from '../logger' // TODO
/**
 * Interface for daily task generation request
 */
export interface TaskGenerationRequest {
  userId: string;
  characterClass?: string;
  backstory?: string;
  currentFocus?: string;
  activeQuests?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  activeProjects?: Array<{
    id: string;
    title: string;
    description: string;
    type: 'project' | 'adventure';
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
 * System prompt for daily task generation
 */
const TASK_GENERATION_SYSTEM_PROMPT = `
You are a clever, grounded, and occasionally cheeky Dungeon Master (DM), guiding a modern-day adventurer through real life.

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
    "suggestedDuration": "15-30 minutes"
  },
  "familyTask": {
    "title": "Heartfelt or playful title",
    "description": "Reference the chosen family member, their interests, and the spirit of the activity. Keep it light, meaningful, or fun.",
    "type": "family",
    "familyMemberId": "id-here",
    "suggestedStatId": "if available",
    "estimatedXp": 40,
    "suggestedDuration": "30-60 minutes"
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
`;

/**
 * Generate daily tasks for a user
 * @param options Task generation options
 * @returns Generated personal and family tasks
 */
export async function generateDailyTasks(options: TaskGenerationRequest): Promise<TaskGenerationResponse> {
  const { characterClass, backstory, currentFocus, activeQuests, activeProjects, familyMembers, weather, temperature = 0.8 } = options;

  // Construct user prompt with all context
  let userPromptContent = ``;

  // Add character information
  if (characterClass) {
    userPromptContent += `Character Class: ${characterClass}\n\n`;
  }

  if (backstory) {
    userPromptContent += `Backstory:\n${backstory}\n\n`;
  }

  // Add current focus
  if (currentFocus) {
    userPromptContent += `Current Focus: ${currentFocus}\n\n`;
  }

  // Add active quests
  if (activeQuests && activeQuests.length > 0) {
    userPromptContent += 'Active Quests:\n';
    activeQuests.forEach((quest) => {
      userPromptContent += `- ${quest.title}: ${quest.description}\n`;
    });
    userPromptContent += '\n';
  }

  // Add active projects and adventures
  if (activeProjects && activeProjects.length > 0) {
    userPromptContent += 'Active Projects & Adventures:\n';
    activeProjects.forEach((project) => {
      userPromptContent += `- ${project.type.charAt(0).toUpperCase() + project.type.slice(1)}: ${project.title} - ${project.description}\n`;
    });
    userPromptContent += '\n';
  }

  // Add family members
  if (familyMembers && familyMembers.length > 0) {
    userPromptContent += 'Family Members:\n';
    familyMembers.forEach((member) => {
      userPromptContent += `- ID: ${member.id}, Name: ${member.name}, Relationship: ${member.relationship}\n`;
      if (member.likes && member.likes.length > 0) {
        userPromptContent += `  Likes: ${member.likes.join(', ')}\n`;
      }
      if (member.dislikes && member.dislikes.length > 0) {
        userPromptContent += `  Dislikes: ${member.dislikes.join(', ')}\n`;
      }
      if (member.lastActivityDate) {
        userPromptContent += `  Last Activity: ${member.lastActivityDate}\n`;
      }
      if (member.lastActivityFeedback) {
        userPromptContent += `  Last Feedback: ${member.lastActivityFeedback}\n`;
      }
    });
    userPromptContent += '\n';
  }

  // Add weather information
  if (weather) {
    userPromptContent += `Current Weather: ${weather.condition}, ${weather.temperature}°F\n`;
    userPromptContent += `Forecast: ${weather.forecast}\n\n`;
  }

  userPromptContent += 'Please generate two tasks based on this information: one personal task and one family task.';

  // Create the messages array
  const messages = createPrompt(TASK_GENERATION_SYSTEM_PROMPT, userPromptContent);

  // TODO
  logger.info("System prompt:")
  logger.info(TASK_GENERATION_SYSTEM_PROMPT);
  logger.info("User Prompt:")
  logger.info(userPromptContent);
  throw new Error("hello");
  // Call GPT API
  const response = await callGptApi({
    messages,
    temperature,
  });

  try {
    // Parse the JSON response
    const result = JSON.parse(response.content) as TaskGenerationResponse;
    return result;
  } catch (error) {
    throw new Error(`Failed to parse GPT response: ${error instanceof Error ? error.message : String(error)}`);
  }
}
