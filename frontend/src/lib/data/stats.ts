// Frontend stat library - catalog of all available stats
// This is used purely for UX guidance in stat selection UI

export interface StatDefinition {
  name: string;
  category: 'body' | 'mind' | 'connection' | 'shadow' | 'spirit' | 'legacy';
  description: string;
  icon?: string;
  color?: string;
}

export const STAT_LIBRARY: StatDefinition[] = [
  // BODY
  {
    name: 'Strength',
    category: 'body',
    description: 'Physical health, energy, resilience, and capacity to take physical action',
    icon: 'dumbbell',
    color: 'red'
  },
  {
    name: 'Dexterity',
    category: 'body',
    description: 'Agility, coordination, body control, and adaptability under pressure',
    icon: 'move',
    color: 'orange'
  },
  {
    name: 'Vitality',
    category: 'body',
    description: 'Your overall life force: sleep, mood, stress regulation, libido, sense of aliveness',
    icon: 'heart-pulse',
    color: 'yellow'
  },

  // MIND
  {
    name: 'Intellect',
    category: 'mind',
    description: 'Creative problem-solving, mental clarity, strategic thinking, and curiosity',
    icon: 'brain',
    color: 'blue'
  },
  {
    name: 'Wisdom',
    category: 'mind',
    description: 'Emotional intelligence, reflection, insight, and making grounded decisions',
    icon: 'book-open',
    color: 'indigo'
  },
  {
    name: 'Discipline',
    category: 'mind',
    description: 'Habits, follow-through, structure, and resistance to impulse or distraction',
    icon: 'check-circle',
    color: 'purple'
  },
  {
    name: 'Clarity',
    category: 'mind',
    description: 'Mental focus, clear thinking, and ability to see situations objectively',
    icon: 'target',
    color: 'cyan'
  },

  // CONNECTION
  {
    name: 'Charisma',
    category: 'connection',
    description: 'Confidence, emotional presence, social engagement, and ability to influence others',
    icon: 'megaphone',
    color: 'pink'
  },
  {
    name: 'Intimacy',
    category: 'connection',
    description: 'Capacity for closeness, emotional openness, and authentic connection (with self or others)',
    icon: 'handshake',
    color: 'rose'
  },
  {
    name: 'Courage',
    category: 'connection',
    description: 'Willingness to confront hard truths, speak up, or act in uncertainty',
    icon: 'shield',
    color: 'amber'
  },
  {
    name: 'Craft',
    category: 'connection',
    description: 'Practical skill-building: making, fixing, building — external proof of internal mastery',
    icon: 'hammer',
    color: 'emerald'
  },

  // SHADOW
  {
    name: 'Resistance',
    category: 'shadow',
    description: 'Procrastination, avoidance patterns, or refusing necessary change',
    icon: 'radar',
    color: 'gray'
  },
  {
    name: 'Regression',
    category: 'shadow',
    description: 'Falling back into old patterns when stressed or triggered',
    icon: 'arrow-left',
    color: 'slate'
  },
  {
    name: 'Burnout',
    category: 'shadow',
    description: 'Overextension, depletion, or pushing beyond sustainable limits',
    icon: 'zap',
    color: 'zinc'
  },
  {
    name: 'Rage',
    category: 'shadow',
    description: 'Explosive anger, chronic irritability, or destructive emotional patterns',
    icon: 'flame',
    color: 'red'
  },
  {
    name: 'Isolation',
    category: 'shadow',
    description: 'Withdrawing from connection, avoiding intimacy, or chronic loneliness',
    icon: 'ban',
    color: 'stone'
  },

  // SPIRIT
  {
    name: 'Dharma',
    category: 'spirit',
    description: 'Sense of purpose, calling, or alignment with your unique path in life',
    icon: 'compass',
    color: 'violet'
  },
  {
    name: 'Shadow Integration',
    category: 'spirit',
    description: 'Working with difficult emotions, triggers, or unconscious patterns',
    icon: 'moon',
    color: 'indigo'
  },
  {
    name: 'Transcendence',
    category: 'spirit',
    description: 'Perspective beyond the ego: gratitude, acceptance, or spiritual connection',
    icon: 'infinity',
    color: 'purple'
  },
  {
    name: 'Intuition',
    category: 'spirit',
    description: 'Trusting inner knowing, gut feelings, or non-rational wisdom',
    icon: 'lightbulb',
    color: 'yellow'
  },

  // LEGACY
  {
    name: 'Community',
    category: 'legacy',
    description: 'Building meaningful relationships, networks, or belonging in groups',
    icon: 'users',
    color: 'blue'
  },
  {
    name: 'Stewardship',
    category: 'legacy',
    description: 'Care for your environment, projects, or community over time',
    icon: 'tree-deciduous',
    color: 'emerald'
  },
  {
    name: 'Creatorship',
    category: 'legacy',
    description: 'Building things that outlive you (music, code, systems, rituals)',
    icon: 'hammer',
    color: 'purple'
  },
  {
    name: 'Lineage',
    category: 'legacy',
    description: 'Honoring ancestry, traditions, or shaping generational values',
    icon: 'archive',
    color: 'lime'
  }
];

// Helper function to get stats by category
export function getStatsByCategory() {
  const categories: Record<string, StatDefinition[]> = {};
  
  STAT_LIBRARY.forEach(stat => {
    if (!categories[stat.category]) {
      categories[stat.category] = [];
    }
    categories[stat.category].push(stat);
  });
  
  return categories;
}

// Helper function to find a stat by name
export function findStatByName(name: string): StatDefinition | undefined {
  return STAT_LIBRARY.find(stat => stat.name.toLowerCase() === name.toLowerCase());
}