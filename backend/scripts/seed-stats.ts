#!/usr/bin/env bun

// Script to seed the database with predefined stat groups and templates

import { db } from '../src/db';
import { statGroups, statTemplates } from '../src/db/schema/stats';
import { eq } from 'drizzle-orm';
import { logger } from '../src/utils/logger';

// Define stat groups
const groups = [
  {
    name: 'Physical Attributes',
    description: 'Stats related to physical abilities and health',
    isDefault: true,
  },
  {
    name: 'Mental Attributes',
    description: 'Stats related to mental capabilities and knowledge',
    isDefault: true,
  },
  {
    name: 'Social Attributes',
    description: 'Stats related to social interactions and charisma',
    isDefault: true,
  },
  {
    name: 'Professional Skills',
    description: 'Stats related to career and professional development',
    isDefault: true,
  },
  {
    name: 'Life Skills',
    description: 'Stats related to everyday life management',
    isDefault: true,
  },
  {
    name: 'Creative Skills',
    description: 'Stats related to creative expression and art',
    isDefault: true,
  }
];

// Function to create stat templates
async function createStatTemplates() {
  try {
    // First, insert all the stat groups
    logger.info('Creating stat groups...');
    
    const existingGroups = await db.select().from(statGroups);
    if (existingGroups.length > 0) {
      logger.warn(`Found ${existingGroups.length} existing stat groups. Skipping group creation.`);
    } else {
      await db.insert(statGroups).values(groups);
      logger.info(`Created ${groups.length} stat groups successfully`);
    }

    // Now fetch all groups to get their IDs
    const allGroups = await db.select().from(statGroups);
    
    // Map group names to IDs for easy reference
    const groupMap = allGroups.reduce((map, group) => {
      map[group.name] = group.id;
      return map;
    }, {} as Record<string, string>);

    // Check for existing templates
    const existingTemplates = await db.select().from(statTemplates);
    if (existingTemplates.length > 0) {
      logger.warn(`Found ${existingTemplates.length} existing stat templates. Skipping template creation.`);
      return;
    }

    // Define templates with their groups and class suggestions
    const templates = [
      // Physical Attributes
      {
        groupId: groupMap['Physical Attributes'],
        name: 'Strength',
        description: 'Raw physical power and muscle. Helps with lifting, carrying, and physical tasks.',
        suggestedForClasses: 'Warrior,Barbarian,Paladin,Ranger,Fitness Enthusiast,Outdoor Enthusiast',
      },
      {
        groupId: groupMap['Physical Attributes'],
        name: 'Dexterity',
        description: 'Agility, reflexes, and hand-eye coordination. Helps with precision tasks and sports.',
        suggestedForClasses: 'Rogue,Ranger,Monk,Bard,Artist,Adventurer',
      },
      {
        groupId: groupMap['Physical Attributes'],
        name: 'Constitution',
        description: 'Stamina, endurance and overall health. Helps with resisting illness and sustaining physical activity.',
        suggestedForClasses: 'Warrior,Barbarian,Paladin,Fitness Enthusiast,Adventurer,Explorer',
      },
      {
        groupId: groupMap['Physical Attributes'],
        name: 'Fitness',
        description: 'Overall physical condition combining strength, endurance, and cardiovascular health.',
        suggestedForClasses: 'Fitness Enthusiast,Adventurer,Explorer,Outdoor Enthusiast',
      },
      {
        groupId: groupMap['Physical Attributes'],
        name: 'Flexibility',
        description: 'Range of motion and physical adaptability. Helps with yoga, dance, and preventing injuries.',
        suggestedForClasses: 'Monk,Rogue,Fitness Enthusiast,Artist',
      },

      // Mental Attributes
      {
        groupId: groupMap['Mental Attributes'],
        name: 'Intelligence',
        description: 'Raw mental processing power and learning ability. Helps with problem-solving and academic tasks.',
        suggestedForClasses: 'Mage,Scholar,Entrepreneur,Cleric',
      },
      {
        groupId: groupMap['Mental Attributes'],
        name: 'Wisdom',
        description: 'Insight, intuition, and common sense. Helps with decision making and understanding others.',
        suggestedForClasses: 'Cleric,Druid,Monk,Scholar,Community Builder',
      },
      {
        groupId: groupMap['Mental Attributes'],
        name: 'Focus',
        description: 'Ability to concentrate and avoid distractions. Helps with productivity and deep work.',
        suggestedForClasses: 'Mage,Scholar,Artist,Entrepreneur',
      },
      {
        groupId: groupMap['Mental Attributes'],
        name: 'Creativity',
        description: 'Ability to generate novel ideas and solutions. Essential for innovation and artistic expression.',
        suggestedForClasses: 'Bard,Artist,Entrepreneur,Scholar',
      },
      {
        groupId: groupMap['Mental Attributes'],
        name: 'Critical Thinking',
        description: 'Ability to analyze information objectively and make reasoned judgments.',
        suggestedForClasses: 'Scholar,Mage,Entrepreneur,Community Builder',
      },

      // Social Attributes
      {
        groupId: groupMap['Social Attributes'],
        name: 'Charisma',
        description: 'Personal magnetism and ability to influence others. Helps with leadership and persuasion.',
        suggestedForClasses: 'Bard,Paladin,Entrepreneur,Community Builder',
      },
      {
        groupId: groupMap['Social Attributes'],
        name: 'Empathy',
        description: 'Ability to understand and share the feelings of others. Essential for deep relationships.',
        suggestedForClasses: 'Cleric,Bard,Community Builder,Family Person',
      },
      {
        groupId: groupMap['Social Attributes'],
        name: 'Communication',
        description: 'Skill in expressing ideas clearly and effectively. Critical for all social interactions.',
        suggestedForClasses: 'Bard,Scholar,Entrepreneur,Community Builder',
      },
      {
        groupId: groupMap['Social Attributes'],
        name: 'Networking',
        description: 'Ability to build and maintain professional relationships. Vital for career advancement.',
        suggestedForClasses: 'Entrepreneur,Community Builder,Bard',
      },
      {
        groupId: groupMap['Social Attributes'],
        name: 'Leadership',
        description: 'Ability to inspire and guide others. Essential for team projects and community building.',
        suggestedForClasses: 'Paladin,Warrior,Entrepreneur,Community Builder',
      },

      // Professional Skills
      {
        groupId: groupMap['Professional Skills'],
        name: 'Project Management',
        description: 'Ability to plan, execute, and complete projects efficiently. Crucial for professional success.',
        suggestedForClasses: 'Entrepreneur,Scholar',
      },
      {
        groupId: groupMap['Professional Skills'],
        name: 'Digital Literacy',
        description: 'Proficiency with digital tools and platforms. Essential in the modern workplace.',
        suggestedForClasses: 'Scholar,Entrepreneur,Artist',
      },
      {
        groupId: groupMap['Professional Skills'],
        name: 'Problem Solving',
        description: 'Ability to identify issues and develop solutions. Valuable in any profession.',
        suggestedForClasses: 'Mage,Scholar,Entrepreneur,Explorer',
      },
      {
        groupId: groupMap['Professional Skills'],
        name: 'Time Management',
        description: 'Ability to use time effectively and prioritize tasks. Essential for productivity.',
        suggestedForClasses: 'Scholar,Entrepreneur,Family Person',
      },
      {
        groupId: groupMap['Professional Skills'],
        name: 'Technical Expertise',
        description: 'Specialized knowledge in a professional field. Core to career advancement.',
        suggestedForClasses: 'Mage,Scholar,Entrepreneur',
      },

      // Life Skills
      {
        groupId: groupMap['Life Skills'],
        name: 'Cooking',
        description: 'Ability to prepare nutritious and delicious meals. Important for health and hospitality.',
        suggestedForClasses: 'Family Person,Explorer',
      },
      {
        groupId: groupMap['Life Skills'],
        name: 'Financial Management',
        description: 'Ability to budget, save, and invest money wisely. Critical for long-term security.',
        suggestedForClasses: 'Entrepreneur,Family Person',
      },
      {
        groupId: groupMap['Life Skills'],
        name: 'Home Maintenance',
        description: 'Skills for keeping living spaces clean, organized, and in good repair.',
        suggestedForClasses: 'Family Person,Adventurer',
      },
      {
        groupId: groupMap['Life Skills'],
        name: 'Mindfulness',
        description: 'Practice of maintaining awareness and focus on the present moment.',
        suggestedForClasses: 'Monk,Druid,Scholar',
      },
      {
        groupId: groupMap['Life Skills'],
        name: 'Self-Care',
        description: 'Activities that preserve and improve physical and mental health.',
        suggestedForClasses: 'Family Person,Fitness Enthusiast,Adventurer',
      },

      // Creative Skills
      {
        groupId: groupMap['Creative Skills'],
        name: 'Visual Arts',
        description: 'Skills in creating visual works such as painting, drawing, and photography.',
        suggestedForClasses: 'Artist,Bard',
      },
      {
        groupId: groupMap['Creative Skills'],
        name: 'Writing',
        description: 'Ability to express ideas through written language, from poetry to technical documentation.',
        suggestedForClasses: 'Bard,Scholar,Artist',
      },
      {
        groupId: groupMap['Creative Skills'],
        name: 'Music',
        description: 'Skills in creating, performing, or appreciating musical works.',
        suggestedForClasses: 'Bard,Artist',
      },
      {
        groupId: groupMap['Creative Skills'],
        name: 'Crafting',
        description: 'Ability to make physical items by hand, from woodworking to jewelry making.',
        suggestedForClasses: 'Artist,Adventurer,Explorer',
      },
      {
        groupId: groupMap['Creative Skills'],
        name: 'Culinary Arts',
        description: 'Advanced cooking skills with focus on presentation, flavor combinations, and technique.',
        suggestedForClasses: 'Artist,Family Person',
      },
    ];

    // Insert all templates
    logger.info('Creating stat templates...');
    await db.insert(statTemplates).values(templates);
    logger.info(`Created ${templates.length} stat templates successfully`);
  } catch (error) {
    logger.error('Error seeding stats:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seeding function
createStatTemplates();
