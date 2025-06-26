import { db } from './connection'
import { users, characters, characterStats, familyMembers } from './schema'

export async function seedDatabase() {
  console.log('🌱 Seeding database...')

  try {
    // Create a sample user
    const [user] = await db.insert(users).values({
      email: 'demo@example.com',
      name: 'Demo User',
      timezone: 'America/New_York',
      zipCode: '12345',
    }).returning()

    console.log('✅ Created demo user:', user.id)

    // Create a sample character
    const [character] = await db.insert(characters).values({
      userId: user.id,
      name: 'Adventurous Alex',
      class: 'Life Explorer',
      backstory: 'A curious soul on a quest to balance family life, personal growth, and daily adventures.',
      isActive: true,
    }).returning()

    console.log('✅ Created demo character:', character.id)

    // Create sample character stats
    const sampleStats = [
      {
        characterId: character.id,
        category: 'Physical Health',
        description: 'Activities that improve physical fitness and wellbeing',
        sampleActivities: ['Take a 30-minute walk', 'Do 15 push-ups', 'Stretch for 10 minutes', 'Drink 8 glasses of water']
      },
      {
        characterId: character.id,
        category: 'Mental Wellness',
        description: 'Activities that support mental health and mindfulness',
        sampleActivities: ['Meditate for 10 minutes', 'Journal about your day', 'Practice deep breathing', 'Read for 20 minutes']
      },
      {
        characterId: character.id,
        category: 'Family Bonding',
        description: 'Quality time and activities with family members',
        sampleActivities: ['Play a board game', 'Cook a meal together', 'Take family photos', 'Have a meaningful conversation']
      },
      {
        characterId: character.id,
        category: 'Professional Growth',
        description: 'Career development and skill building activities',
        sampleActivities: ['Learn a new skill for 30 minutes', 'Organize workspace', 'Network with a colleague', 'Complete a training module']
      },
      {
        characterId: character.id,
        category: 'Creative Expression',
        description: 'Artistic and creative pursuits',
        sampleActivities: ['Write in a journal', 'Draw or sketch', 'Play a musical instrument', 'Try a new recipe']
      },
      {
        characterId: character.id,
        category: 'Social Connection',
        description: 'Building and maintaining relationships',
        sampleActivities: ['Call a friend', 'Write a thoughtful message', 'Attend a social event', 'Help a neighbor']
      }
    ]

    await db.insert(characterStats).values(sampleStats)
    console.log('✅ Created sample character stats')

    // Create sample family members
    const sampleFamily = [
      {
        userId: user.id,
        name: 'Spouse',
        age: 35,
        interests: ['cooking', 'gardening', 'reading'],
        interactionFrequency: 'daily'
      },
      {
        userId: user.id,
        name: 'Child 1',
        age: 8,
        interests: ['soccer', 'video games', 'drawing'],
        interactionFrequency: 'daily'
      },
      {
        userId: user.id,
        name: 'Child 2',
        age: 5,
        interests: ['dolls', 'singing', 'puzzles'],
        interactionFrequency: 'daily'
      },
      {
        userId: user.id,
        name: 'Parent',
        age: 65,
        interests: ['crossword puzzles', 'history books', 'birdwatching'],
        interactionFrequency: 'weekly'
      }
    ]

    await db.insert(familyMembers).values(sampleFamily)
    console.log('✅ Created sample family members')

    console.log('🎉 Database seeded successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
if (process.argv[1] === __filename || process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().then(() => {
    console.log('✅ Seeding completed')
    process.exit(0)
  }).catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
}
