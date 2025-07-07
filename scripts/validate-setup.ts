#!/usr/bin/env bun

/**
 * Setup validation script
 * Checks if the project is properly configured and what functionality is available
 */

console.log('🚀 LifeRPG Setup Validation\n')

// Check Node/Bun version
console.log('📦 Runtime:')
console.log(`  - Bun: ${process.versions.bun || 'Not available'}`)
console.log(`  - Node: ${process.versions.node}`)
console.log('')

// Check environment variables
console.log('🔧 Environment Configuration:')
const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar]
  if (value) {
    if (envVar === 'DATABASE_URL') {
      // Mask the password in database URL for security
      const masked = value.replace(/:([^:@]+)@/, ':***@')
      console.log(`  ✅ ${envVar}: ${masked}`)
    } else if (envVar === 'NEXTAUTH_SECRET') {
      console.log(`  ✅ ${envVar}: ${value.length > 10 ? '[CONFIGURED]' : '[TOO SHORT]'}`)
    } else {
      console.log(`  ✅ ${envVar}: ${value}`)
    }
  } else {
    console.log(`  ❌ ${envVar}: Not set`)
  }
})

console.log('')

// Check database connection
console.log('🗄️  Database Connection:')
try {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('username:password')) {
    console.log('  ℹ️  Database URL configured - connection test would require import')
    console.log('  ℹ️  Run `bun run db:studio` to test connection')
  } else {
    console.log('  ❌ Database URL not properly configured')
    console.log('  ℹ️  Update .env.local with real PostgreSQL credentials')
  }
} catch (error) {
  console.log(`  ❌ Database connection failed: ${error.message}`)
}

console.log('')

// Check what can be tested
console.log('🧪 Available Testing:')
console.log('  ✅ UI Components (no database required)')
console.log('  ✅ Navigation and Routing')  
console.log('  ✅ Theme Toggle')
console.log('  ✅ Form Validation (client-side)')

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('username:password')) {
  console.log('  ✅ Full Authentication Flow (database required)')
  console.log('  ✅ Character Creation')
  console.log('  ✅ Todo Management and XP Tracking')
} else {
  console.log('  ❌ Full Authentication Flow (requires database)')
  console.log('  ❌ Character Creation (requires database)')
  console.log('  ❌ Todo Management (requires database)')
}

console.log('')

// Next steps
console.log('📋 Next Steps:')
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('username:password')) {
  console.log('  1. Set up PostgreSQL database')
  console.log('  2. Update .env.local with real database credentials')
  console.log('  3. Run `bun run db:generate && bun run db:migrate`')
  console.log('  4. Start development server with `bun dev`')
} else {
  console.log('  1. Run `bun run db:generate && bun run db:migrate` (if not done)')
  console.log('  2. Start development server with `bun dev`')
  console.log('  3. Run UI tests with `bun run test`')
  console.log('  4. Visit http://localhost:3000 to start using the app')
}

console.log('')
console.log('🎮 Ready to start your LifeRPG adventure!')
