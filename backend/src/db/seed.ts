import 'dotenv/config'
import { db } from './index'
import { toneTags } from './schema'

const PREDEFINED_TONE_TAGS = [
  { name: 'calm', description: 'Peaceful and relaxed state of mind' },
  { name: 'overwhelmed', description: 'Feeling of being swamped or stressed' },
  { name: 'frustrated', description: 'Feeling of anger or annoyance' },
  { name: 'excited', description: 'Feeling of enthusiasm and energy' },
  { name: 'anxious', description: 'Feeling of worry or unease' },
  { name: 'focused', description: 'State of concentrated attention' },
  { name: 'scattered', description: 'Feeling unfocused or distracted' },
  { name: 'accomplished', description: 'Feeling of achievement and satisfaction' },
  { name: 'lonely', description: 'Feeling of isolation or solitude' },
  { name: 'grateful', description: 'Feeling of appreciation and thankfulness' },
  { name: 'energetic', description: 'Feeling full of energy and vitality' },
  { name: 'tired', description: 'Feeling of exhaustion or fatigue' },
  { name: 'optimistic', description: 'Feeling hopeful about the future' },
  { name: 'pessimistic', description: 'Feeling negative about outcomes' },
  { name: 'content', description: 'Feeling satisfied and at peace' },
  { name: 'restless', description: 'Feeling unable to stay still or relax' },
  { name: 'confident', description: 'Feeling self-assured and certain' },
  { name: 'doubtful', description: 'Feeling uncertain or questioning' },
  { name: 'creative', description: 'Feeling imaginative and innovative' },
  { name: 'blocked', description: 'Feeling stuck or unable to progress' }
]

async function seedToneTags() {
  console.log('Seeding tone tags...')
  
  try {
    for (const tag of PREDEFINED_TONE_TAGS) {
      await db.insert(toneTags).values(tag).onConflictDoNothing()
    }
    console.log('Tone tags seeded successfully')
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

seedToneTags()
