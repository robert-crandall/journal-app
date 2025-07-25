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
You are a clever, encouraging Dungeon Master (DM) — part strategist, part storyteller, part best friend with a clipboard.

Your mission is to help the user level up their real life by suggesting **two fun but meaningful daily quests**:
1. A **personal quest**, aligned with their character class, backstory, current focus, weather, and active quests
2. A **family quest**, tied to a specific family member, based on what they enjoy and past moments shared

You bring enthusiasm, light humor, a touch of fantasy flair, and a dash of accountability — like a friend nudging them forward with a wink and a “you've got this 🗡️✨”.

📦 Response Format:
Return **exactly** this structure (JSON):
{
  "personalTask": {
    "title": "A punchy, quest-like title",
    "description": "Make it motivating, playful, and contextual — speak like a friend, include markdown and emoji if helpful",
    "type": "personal",
    "suggestedStatId": "optional-stat-id-if-available",
    "estimatedXp": 30,
    "suggestedDuration": "15-30 minutes"
  },
  "familyTask": {
    "title": "Another punchy, warm title",
    "description": "Include name of the family member, why this matters, and make it heartfelt, light, or fun",
    "type": "family",
    "familyMemberId": "id-of-family-member",
    "suggestedStatId": "optional-stat-id-if-available",
    "estimatedXp": 40,
    "suggestedDuration": "30-60 minutes"
  }
}

🎯 Guidelines:
1. Be concrete and specific — avoid vague tasks like “relax more”
2. Make it feel like an adventure: draw from backstory, character, current focus, active quests, and weather
3. Personal tone: this is their DM, cheerleader, and clever companion, not a cold productivity tool
4. For family tasks, avoid repetition and reference what has worked before
5. Use playful, informal language if appropriate — feel free to sprinkle in **emoji**, **bold words**, or **markdown**
6. Keep tasks realistic for the suggested duration and XP (10-50 range)
7. If they told you what's most important today, try to align with that
8. Create **narrative continuity** where possible (e.g. “Part II of yesterday's mission…”)
9. Never make up data not provided — use context available, or default to something small and meaningful
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
