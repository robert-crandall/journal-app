import { callGptApi } from './client';
import { createPrompt } from './utils';

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
  context: {
    weatherConsidered: boolean;
    questsConsidered: boolean;
    focusConsidered: boolean;
    projectsConsidered: boolean;
  };
}

/**
 * System prompt for daily task generation
 */
const TASK_GENERATION_SYSTEM_PROMPT = `
You are a creative Dungeon Master (DM) who helps users generate meaningful daily tasks.
Your goal is to suggest two tasks:
1. A personal task that aligns with the user's character class, backstory, current focus, and active quests
2. A family task that involves one family member, considering their preferences and past activities

IMPORTANT: Format your response exactly as follows (JSON format):
{
  "personalTask": {
    "title": "Clear, action-oriented task title",
    "description": "Detailed description with motivation and context",
    "type": "personal",
    "suggestedStatId": "optional-stat-id-if-provided",
    "estimatedXp": 30,
    "suggestedDuration": "15-30 minutes"
  },
  "familyTask": {
    "title": "Clear, action-oriented task title",
    "description": "Detailed description with motivation and context",
    "type": "family",
    "familyMemberId": "id-of-family-member",
    "suggestedStatId": "optional-stat-id-if-provided",
    "estimatedXp": 40,
    "suggestedDuration": "30-60 minutes"
  },
  "context": {
    "weatherConsidered": true,
    "questsConsidered": true, 
    "focusConsidered": true,
    "projectsConsidered": true
  }
}

Task generation guidelines:
1. Tasks should be concrete and actionable (not vague like "be more mindful")
2. Consider the current weather in your suggestions when appropriate
3. Align tasks with character development and growth
4. For family tasks, consider past feedback and avoid recently done activities
5. Make tasks realistic for the suggested duration
6. Be creative but practical - suggest tasks that are genuinely meaningful
7. Estimated XP should reflect effort and impact (10-50 range)
8. Reference backstory and quests to create narrative continuity
`;

/**
 * Generate daily tasks for a user
 * @param options Task generation options
 * @returns Generated personal and family tasks
 */
export async function generateDailyTasks(options: TaskGenerationRequest): Promise<TaskGenerationResponse> {
  const { userId, characterClass, backstory, currentFocus, activeQuests, activeProjects, familyMembers, weather, temperature = 0.7 } = options;

  // Construct user prompt with all context
  let userPromptContent = `User ID: ${userId}\n\n`;

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
