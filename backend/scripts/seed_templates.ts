#!/usr/bin/env bun
import { db } from '../src/db/index.js';
import { statTemplates } from '../src/db/schema.js';

const templates = [
  {
    name: 'Balanced Warrior',
    description: 'Disciplined, present, physically resilient',
    recommendedStats: ['Strength', 'Discipline', 'Courage']
  },
  {
    name: 'Creative Monk',
    description: 'Introspective, imaginative, emotionally open',
    recommendedStats: ['Vitality', 'Intellect', 'Wisdom']
  },
  {
    name: 'Expressive Rogue',
    description: 'Agile, spontaneous, high social intuition',
    recommendedStats: ['Dexterity', 'Charisma', 'Intimacy']
  },
  {
    name: 'Grounded Guardian',
    description: 'Calm, dependable, focused on care',
    recommendedStats: ['Vitality', 'Wisdom', 'Courage']
  },
  {
    name: 'Reforged Soul',
    description: 'Rebuilding energy and alignment after loss',
    recommendedStats: ['Vitality', 'Wisdom', 'Discipline', 'Intimacy']
  }
];

async function seedTemplates() {
  try {
    console.log('Seeding stat templates...');
    
    for (const template of templates) {
      await db.insert(statTemplates)
        .values(template)
        .onConflictDoNothing();
    }
    
    console.log('✅ Stat templates seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  }
}

seedTemplates();
