import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { characterStats, characterStatXpGrants, characterStatLevelTitles } from '../db/schema/stats';

// Character Stats types
export type CharacterStat = InferSelectModel<typeof characterStats>;
export type NewCharacterStat = InferInsertModel<typeof characterStats>;

export type CharacterStatExampleActivity = {
  description: string;
  suggestedXp: number;
};

// XP Grant types
export type CharacterStatXpGrant = InferSelectModel<typeof characterStatXpGrants>;
export type NewCharacterStatXpGrant = InferInsertModel<typeof characterStatXpGrants>;

export type XpSourceType = 'task' | 'journal' | 'adhoc' | 'quest' | 'experiment';

// Level Title types
export type CharacterStatLevelTitle = InferSelectModel<typeof characterStatLevelTitles>;
export type NewCharacterStatLevelTitle = InferInsertModel<typeof characterStatLevelTitles>;

// Computed types for frontend
export type CharacterStatWithProgress = CharacterStat & {
  xpToNextLevel: number;
  canLevelUp: boolean;
  currentLevelTitle?: string;
  nextLevelTitle?: string;
};

// Level calculation utilities (these functions will be implemented in backend utils)
export interface LevelCalculation {
  level: number;
  totalXpRequired: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  canLevelUp: boolean;
}

// Predefined stats that can be offered to users
export interface PredefinedStat {
  name: string;
  description: string;
  exampleActivities: CharacterStatExampleActivity[];
}

export const PREDEFINED_STATS: PredefinedStat[] = [
  {
    name: 'Strength',
    description: 'Physical power and endurance - the ability to lift, carry, and push through physical challenges.',
    exampleActivities: [
      { description: 'Complete a workout session', suggestedXp: 25 },
      { description: 'Go for a challenging hike', suggestedXp: 30 },
      { description: 'Heavy lifting or moving furniture', suggestedXp: 20 },
      { description: 'Sports or physical activity', suggestedXp: 35 },
    ],
  },
  {
    name: 'Wisdom',
    description: 'Mental clarity, decision-making, and learning - the ability to think deeply and gain insights.',
    exampleActivities: [
      { description: 'Read a book or educational material', suggestedXp: 20 },
      { description: 'Solve a complex problem', suggestedXp: 30 },
      { description: 'Meditate or practice mindfulness', suggestedXp: 15 },
      { description: 'Learn a new skill', suggestedXp: 40 },
    ],
  },
  {
    name: 'Fatherhood',
    description: 'Being present, patient, and engaged with your children - the ability to connect and guide.',
    exampleActivities: [
      { description: 'Play with your children', suggestedXp: 25 },
      { description: 'Help with homework or learning', suggestedXp: 30 },
      { description: 'Have a meaningful conversation', suggestedXp: 35 },
      { description: 'Take kids on an adventure', suggestedXp: 40 },
    ],
  },
  {
    name: 'Adventure',
    description: 'Exploring new places, trying new things, and embracing the unknown with courage.',
    exampleActivities: [
      { description: 'Explore a new hiking trail', suggestedXp: 35 },
      { description: 'Try a new outdoor activity', suggestedXp: 40 },
      { description: 'Visit a new place', suggestedXp: 30 },
      { description: 'Plan an adventure', suggestedXp: 20 },
    ],
  },
  {
    name: 'Self-Control',
    description: 'Discipline and willpower - the ability to resist temptation and stay focused on goals.',
    exampleActivities: [
      { description: 'Stick to a planned routine', suggestedXp: 25 },
      { description: 'Avoid unhealthy habits', suggestedXp: 30 },
      { description: 'Complete a difficult but important task', suggestedXp: 35 },
      { description: 'Practice delayed gratification', suggestedXp: 20 },
    ],
  },
  {
    name: 'Creativity',
    description: 'Imagination and artistic expression - the ability to create, innovate, and think outside the box.',
    exampleActivities: [
      { description: 'Work on a creative project', suggestedXp: 30 },
      { description: 'Write, draw, or make music', suggestedXp: 25 },
      { description: 'Brainstorm new ideas', suggestedXp: 20 },
      { description: 'Learn a creative skill', suggestedXp: 35 },
    ],
  },
];
