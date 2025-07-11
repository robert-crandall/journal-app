import { db } from '../db';
import { users, characters, goals, familyMembers, characterStats } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Comprehensive user context interface for GPT prompts
 */
export interface ComprehensiveUserContext {
  // Basic user info
  name: string;

  // Character info
  characterClass?: string;
  backstory?: string;
  characterGoals?: string; // From character.goals field
  motto?: string;

  // Active goals
  activeGoals?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;

  // Family members
  familyMembers?: Array<{
    id: string;
    name: string;
    relationship: string;
    likes?: string;
    dislikes?: string;
    energyLevel: number;
    lastInteractionDate?: Date | null;
    connectionLevel: number;
    connectionXp: number;
  }>;

  // Character stats
  characterStats?: Array<{
    id: string;
    name: string;
    description: string;
    currentLevel: number;
    totalXp: number;
  }>;

  // Future: projects, adventures, quests, focuses, etc.
}

/**
 * Get comprehensive user context for GPT prompts
 * @param userId The user's ID
 * @param options Optional filters to only return specific data
 * @returns Comprehensive user context object
 */
export async function getUserContext(
  userId: string,
  options?: {
    includeCharacter?: boolean;
    includeActiveGoals?: boolean;
    includeFamilyMembers?: boolean;
    includeCharacterStats?: boolean;
    includeProjects?: boolean; // Future
    includeAdventures?: boolean; // Future
    includeQuests?: boolean; // Future
    includeFocuses?: boolean; // Future
  },
): Promise<ComprehensiveUserContext> {
  const { includeCharacter = true, includeActiveGoals = true, includeFamilyMembers = true, includeCharacterStats = true } = options || {};

  try {
    // Start with basic user info from character (fallback to users table if no character)
    let baseContext: ComprehensiveUserContext = { name: 'User' };

    if (includeCharacter) {
      const character = await db
        .select({
          name: characters.name,
          characterClass: characters.characterClass,
          backstory: characters.backstory,
          goals: characters.goals,
          motto: characters.motto,
        })
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1);

      if (character.length > 0) {
        baseContext = {
          name: character[0].name,
          characterClass: character[0].characterClass || undefined,
          backstory: character[0].backstory || undefined,
          characterGoals: character[0].goals || undefined,
          motto: character[0].motto || undefined,
        };
      } else {
        // Fallback to user name if no character exists
        const user = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);

        if (user.length > 0) {
          baseContext.name = user[0].name;
        }
      }
    }

    // Get active goals
    if (includeActiveGoals) {
      const activeGoals = await db
        .select({
          id: goals.id,
          title: goals.title,
          description: goals.description,
        })
        .from(goals)
        .where(and(eq(goals.userId, userId), eq(goals.isActive, true), eq(goals.isArchived, false)));

      if (activeGoals.length > 0) {
        baseContext.activeGoals = activeGoals.map((goal) => ({
          id: goal.id,
          title: goal.title,
          description: goal.description || undefined,
        }));
      }
    }

    // Get family members
    if (includeFamilyMembers) {
      const family = await db
        .select({
          id: familyMembers.id,
          name: familyMembers.name,
          relationship: familyMembers.relationship,
          likes: familyMembers.likes,
          dislikes: familyMembers.dislikes,
          energyLevel: familyMembers.energyLevel,
          lastInteractionDate: familyMembers.lastInteractionDate,
          connectionLevel: familyMembers.connectionLevel,
          connectionXp: familyMembers.connectionXp,
        })
        .from(familyMembers)
        .where(eq(familyMembers.userId, userId));

      if (family.length > 0) {
        baseContext.familyMembers = family.map((member) => ({
          id: member.id,
          name: member.name,
          relationship: member.relationship,
          likes: member.likes || undefined,
          dislikes: member.dislikes || undefined,
          energyLevel: member.energyLevel || 50,
          lastInteractionDate: member.lastInteractionDate,
          connectionLevel: member.connectionLevel || 1,
          connectionXp: member.connectionXp || 0,
        }));
      }
    }

    // Get character stats
    if (includeCharacterStats) {
      const stats = await db
        .select({
          id: characterStats.id,
          name: characterStats.name,
          description: characterStats.description,
          currentLevel: characterStats.currentLevel,
          totalXp: characterStats.totalXp,
        })
        .from(characterStats)
        .where(eq(characterStats.userId, userId));

      if (stats.length > 0) {
        baseContext.characterStats = stats;
      }
    }

    return baseContext;
  } catch (error) {
    console.error('Error fetching user context:', error);
    // Return minimal context on error
    return { name: 'User' };
  }
}

/**
 * Format user context for GPT system prompts
 * @param context The user context object
 * @returns Formatted string for inclusion in system prompts
 */
export function formatUserContextForPrompt(context: ComprehensiveUserContext): string {
  let promptContent = `## User\n`;
  promptContent += `\n${context.name}\n`; // Separator for clarity

  // Character information
  if (context.characterClass) {
    promptContent += `### Character Class\n`;
    promptContent += `${context.characterClass}\n`;
  }

  if (context.backstory) {
    promptContent += `### Backstory\n`;
    promptContent += `${context.backstory}\n`;
  }

  if (context.motto) {
    promptContent += `### Motto\n`;
    promptContent += `${context.motto}\n`;
  }

  if (context.activeGoals && context.activeGoals.length > 0) {
    promptContent += `### Active Goals\n`;
    context.activeGoals.forEach((goal) => {
      promptContent += `#### ${goal.title}\n`;
      if (goal.description) {
        promptContent += `\n${goal.description}`;
      }
      promptContent += `\n`;
    });
  } else {
    if (context.characterGoals) {
      promptContent += `### Character Goals\n`;
      promptContent += `\n${context.characterGoals}\n`;
    }
  }

  // Family members
  if (context.familyMembers && context.familyMembers.length > 0) {
    promptContent += `### Family Members\n`;
    context.familyMembers.forEach((member) => {
      promptContent += `#### ${member.name} (${member.relationship})\n`;

      const details = [];
      if (member.likes) details.push(`- Likes: ${member.likes}`);
      if (member.dislikes) details.push(`- Dislikes: ${member.dislikes}`);
      details.push(`- Energy Level: ${member.energyLevel}/100`);
      details.push(`- Connection Level: ${member.connectionLevel} (${member.connectionXp} XP)`);

      if (member.lastInteractionDate) {
        const daysSince = Math.floor((Date.now() - member.lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24));
        details.push(`- Last interaction: ${daysSince} days ago`);
      } else {
        details.push('No recent interactions');
      }

      if (details.length > 0) {
        promptContent += ` - ${details.join(', ')}`;
      }
      promptContent += `\n`;
    });
  }

  // Character stats
  if (context.characterStats && context.characterStats.length > 0) {
    promptContent += `### Character Stats\n`;
    context.characterStats.forEach((stat) => {
      promptContent += `#### ${stat.name}\n`;
      promptContent += `\n- Level ${stat.currentLevel} (${stat.totalXp} XP)\n`;
      promptContent += `- ${stat.description}\n`;
    });
  }

  return promptContent;
}

/**
 * Convenience function to get specific context items
 */
export async function getSpecificUserContext(userId: string, contextType: keyof ComprehensiveUserContext) {
  const options = {
    includeCharacter: contextType === 'characterClass' || contextType === 'backstory' || contextType === 'characterGoals' || contextType === 'motto',
    includeActiveGoals: contextType === 'activeGoals',
    includeFamilyMembers: contextType === 'familyMembers',
    includeCharacterStats: contextType === 'characterStats',
  };

  const context = await getUserContext(userId, options);
  return context[contextType];
}
