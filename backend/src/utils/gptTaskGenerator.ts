import { type User, type Focus, type Stat } from '../db/schema';

export interface TaskGenerationContext {
  user: User;
  todaysFocus?: Focus;
  userStats: Stat[];
  familyMembers: User[];
  recentTasks?: any[];
  recentFeedback?: string[];
}

export interface GeneratedTask {
  title: string;
  description: string;
  source: 'primary' | 'connection';
  linkedStatIds: string[];
  linkedFamilyMemberIds?: string[];
}

export interface GeneratedTaskSet {
  primaryTask: GeneratedTask;
  connectionTask: GeneratedTask;
}

/**
 * Mock GPT task generator for MVP
 * In production, this would call OpenAI's API with user context
 */
export async function generateDailyTasks(context: TaskGenerationContext): Promise<GeneratedTaskSet> {
  const { user, todaysFocus, userStats, familyMembers } = context;

  // Mock primary task based on today's focus
  const primaryTask: GeneratedTask = {
    title: todaysFocus 
      ? `Focus on ${todaysFocus.name}: Take one meaningful step`
      : `Personal Growth: Complete a challenging task that stretches your abilities`,
    description: todaysFocus?.description 
      ? `Today's focus is ${todaysFocus.name}. ${todaysFocus.description} Take 30 minutes to work on something that advances this area of your life.`
      : `Spend 30 minutes working on personal development. Choose something that challenges you and moves you forward.`,
    source: 'primary',
    linkedStatIds: todaysFocus?.statId ? [todaysFocus.statId] : userStats.slice(0, 1).map(s => s.id),
  };

  // Mock connection task that rotates through family members
  const randomFamilyMember = familyMembers.length > 0 
    ? familyMembers[Math.floor(Math.random() * familyMembers.length)]
    : null;

  const connectionTask: GeneratedTask = {
    title: randomFamilyMember 
      ? `Connect with ${randomFamilyMember.name}: Quality time together`
      : `Self-Connection: Practice mindfulness or self-reflection`,
    description: randomFamilyMember
      ? `Spend focused, quality time with ${randomFamilyMember.name}. Put away distractions and be fully present. Ask them about something they're excited about or curious about.`
      : `Take 15 minutes for mindful self-connection. This could be meditation, journaling, or simply sitting quietly and checking in with how you're feeling.`,
    source: 'connection',
    linkedStatIds: userStats
      .filter(s => s.category === 'connection')
      .slice(0, 1)
      .map(s => s.id)
      .concat(userStats.filter(s => s.category === 'spirit').slice(0, 1).map(s => s.id)),
    linkedFamilyMemberIds: randomFamilyMember ? [randomFamilyMember.id] : undefined,
  };

  return {
    primaryTask,
    connectionTask,
  };
}

/**
 * Get today's focus based on day of week
 */
export function getTodaysFocus(focuses: Focus[]): Focus | undefined {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return focuses.find(focus => focus.dayOfWeek === today);
}