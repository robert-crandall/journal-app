// Frontend class library - defines classes and their recommended stats
// This is used purely for UX guidance in stat selection UI

export interface ClassDefinition {
  class_name: string;
  description: string;
  recommended_stats: string[];
}

export const CLASS_LIBRARY: ClassDefinition[] = [
  // COMBAT CLASSES
  {
    class_name: 'Fighter',
    description: 'A bold warrior who faces challenges head-on with strength and courage',
    recommended_stats: ['Strength', 'Courage', 'Discipline']
  },
  {
    class_name: 'Warrior',
    description: 'A disciplined combatant who values honor and physical prowess',
    recommended_stats: ['Strength', 'Discipline', 'Courage']
  },
  {
    class_name: 'Paladin',
    description: 'A righteous defender who balances might with moral purpose',
    recommended_stats: ['Strength', 'Wisdom', 'Community']
  },
  {
    class_name: 'Barbarian',
    description: 'A primal force who channels raw emotion and physical power',
    recommended_stats: ['Strength', 'Vitality', 'Rage']
  },
  {
    class_name: 'Ranger',
    description: 'A skilled tracker who moves between civilization and wilderness',
    recommended_stats: ['Dexterity', 'Intuition', 'Stewardship']
  },

  // MYSTIC CLASSES
  {
    class_name: 'Wizard',
    description: 'A scholarly practitioner of arcane knowledge and systematic learning',
    recommended_stats: ['Intellect', 'Discipline', 'Wisdom']
  },
  {
    class_name: 'Sorcerer',
    description: 'An intuitive caster who channels raw magical talent',
    recommended_stats: ['Intuition', 'Charisma', 'Transcendence']
  },
  {
    class_name: 'Warlock',
    description: 'A bound practitioner who gains power through otherworldly pacts',
    recommended_stats: ['Shadow Integration', 'Wisdom', 'Courage']
  },
  {
    class_name: 'Druid',
    description: 'A nature-connected guide who seeks harmony with the natural world',
    recommended_stats: ['Wisdom', 'Stewardship', 'Intuition']
  },
  {
    class_name: 'Cleric',
    description: 'A devoted servant who channels divine power for healing and guidance',
    recommended_stats: ['Wisdom', 'Community', 'Dharma']
  },

  // SUPPORT CLASSES
  {
    class_name: 'Bard',
    description: 'A charismatic storyteller who inspires and connects others through art',
    recommended_stats: ['Charisma', 'Creatorship', 'Community']
  },
  {
    class_name: 'Healer',
    description: 'A compassionate caregiver who focuses on restoration and well-being',
    recommended_stats: ['Wisdom', 'Intimacy', 'Vitality']
  },
  {
    class_name: 'Support',
    description: 'A reliable ally who strengthens and empowers others',
    recommended_stats: ['Community', 'Wisdom', 'Courage']
  },
  {
    class_name: 'Guardian',
    description: 'A protective presence who shields others from harm',
    recommended_stats: ['Courage', 'Discipline', 'Community']
  },
  {
    class_name: 'Protector',
    description: 'A steadfast defender of those who cannot defend themselves',
    recommended_stats: ['Strength', 'Courage', 'Dharma']
  },

  // STEALTH CLASSES
  {
    class_name: 'Rogue',
    description: 'A cunning operative who excels at stealth and precision',
    recommended_stats: ['Dexterity', 'Intellect', 'Shadow Integration']
  },
  {
    class_name: 'Assassin',
    description: 'A deadly professional who strikes from shadows with lethal precision',
    recommended_stats: ['Dexterity', 'Discipline', 'Shadow Integration']
  },
  {
    class_name: 'Scout',
    description: 'An agile explorer who gathers information and avoids detection',
    recommended_stats: ['Dexterity', 'Intuition', 'Clarity']
  },
  {
    class_name: 'Thief',
    description: 'A resourceful survivor who takes what they need through cunning',
    recommended_stats: ['Dexterity', 'Intellect', 'Courage']
  },
  {
    class_name: 'Spy',
    description: 'A master of deception who operates in the shadows of society',
    recommended_stats: ['Charisma', 'Intellect', 'Shadow Integration']
  },

  // OTHER CLASSES
  {
    class_name: 'Monk',
    description: 'A quiet thinker who moves through the world with graceful intent',
    recommended_stats: ['Discipline', 'Clarity', 'Vitality']
  },
  {
    class_name: 'Artificer',
    description: 'A creative inventor who blends magic and technology',
    recommended_stats: ['Intellect', 'Craft', 'Creatorship']
  },
  {
    class_name: 'Scholar',
    description: 'A dedicated researcher who seeks knowledge and understanding',
    recommended_stats: ['Intellect', 'Wisdom', 'Discipline']
  },
  {
    class_name: 'Merchant',
    description: 'A savvy trader who builds networks and creates prosperity',
    recommended_stats: ['Charisma', 'Community', 'Wisdom']
  },
  {
    class_name: 'Wanderer',
    description: 'A free spirit who follows their path wherever it may lead',
    recommended_stats: ['Intuition', 'Dharma', 'Dexterity']
  }
];

// Helper function to find a class by name
export function findClassByName(name: string): ClassDefinition | undefined {
  return CLASS_LIBRARY.find(cls => cls.class_name.toLowerCase() === name.toLowerCase());
}

// Helper function to get classes grouped by type (for backward compatibility)
export function getClassesByType() {
  return {
    Combat: CLASS_LIBRARY.filter(cls => ['Fighter', 'Warrior', 'Paladin', 'Barbarian', 'Ranger'].includes(cls.class_name)),
    Mystic: CLASS_LIBRARY.filter(cls => ['Wizard', 'Sorcerer', 'Warlock', 'Druid', 'Cleric'].includes(cls.class_name)),
    Support: CLASS_LIBRARY.filter(cls => ['Bard', 'Healer', 'Support', 'Guardian', 'Protector'].includes(cls.class_name)),
    Stealth: CLASS_LIBRARY.filter(cls => ['Rogue', 'Assassin', 'Scout', 'Thief', 'Spy'].includes(cls.class_name)),
    Other: CLASS_LIBRARY.filter(cls => ['Monk', 'Artificer', 'Scholar', 'Merchant', 'Wanderer'].includes(cls.class_name))
  };
}