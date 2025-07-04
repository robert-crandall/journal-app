#!/usr/bin/env node

import { spawn } from 'child_process'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Kill processes using specified ports (macOS/Linux)
function killProcessesOnPorts(ports) {
  const { spawnSync } = require('child_process');
  ports.forEach((port) => {
    try {
      // lsof -ti tcp:<port> | xargs kill -9
      const lsof = spawnSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf-8' });
      const pids = lsof.stdout.split('\n').filter(Boolean);
      if (pids.length > 0) {
        spawnSync('kill', ['-9', ...pids]);
        console.log(`✅ Killed process(es) on port ${port}: ${pids.join(', ')}`);
      }
    } catch (e) {
      console.warn(`⚠️  Could not kill process on port ${port}:`, e.message);
    }
  });
}

// Run database migrations before starting services
async function runDatabaseMigrations() {
  console.log('🗄️  Running database migrations...')
  
  return new Promise((resolve, reject) => {
    const migrate = spawn('bun', ['run', 'db:migrate'], {
      stdio: 'inherit',
      shell: true,
      cwd: './backend'
    })
    
    migrate.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database migrations completed successfully')
        resolve()
      } else {
        console.error(`❌ Database migrations failed with code ${code}`)
        reject(new Error(`Database migrations failed with code ${code}`))
      }
    })
    
    migrate.on('error', (err) => {
      console.error('❌ Failed to run database migrations:', err)
      reject(err)
    })
  })
}

// Seed database with predefined stats if needed
async function seedPredefinedStats() {
  console.log('🌱 Seeding predefined stats...')
  
  return new Promise((resolve, reject) => {
    const seedStats = spawn('bun', ['run', 'db:seed:stats'], {
      stdio: 'inherit',
      shell: true,
      cwd: './backend'
    })
    
    seedStats.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Stats seeded successfully')
        resolve()
      } else {
        console.warn(`⚠️  Stats seeding exited with code ${code}`)
        // Don't reject - we want to continue even if seeding fails
        resolve()
      }
    })
    
    seedStats.on('error', (err) => {
      console.warn('⚠️  Failed to run stats seeding:', err)
      // Don't reject - we want to continue even if seeding fails
      resolve()
    })
  })
}

// Use concurrently to run both services with combined logs
async function startDev() {
  console.log('🚀 Starting development environment...')
  console.log('📝 This will show logs from both backend and frontend')
  console.log('🔍 Press Ctrl+C to stop all services\n')

  // Check for --force flag
  if (process.argv.includes('--force')) {
    console.log('🛑 --force flag detected: Killing processes on ports 3000 and 5173...');
    killProcessesOnPorts([3000, 5173]);
  }
  
  // Run migrations first
  try {
    await runDatabaseMigrations()
    
    // After migrations succeed, seed predefined stats
    await seedPredefinedStats()
  } catch (error) {
    console.error('❌ Failed to run database migrations. Fix the issues before continuing.')
    if (!process.argv.includes('--ignore-migration-errors')) {
      console.log('💡 Use --ignore-migration-errors flag to start services despite migration failures')
      process.exit(1)
    } else {
      console.log('⚠️  Ignoring migration errors due to --ignore-migration-errors flag')
    }
  }

  try {
    // Try to use concurrently if available

    const concurrently = spawn('npx', [
      'concurrently',
      '--prefix', '[{name}]',
      '--names', 'backend,frontend',
      '--prefix-colors', 'blue,green',
      '--kill-others',
      '--kill-others-on-fail',
      '"bun scripts/start-backend.js"',
      '"bun scripts/start-frontend.js"'
    ], {
      stdio: 'inherit',
      shell: true,
      detached: true // Start in a new process group
    })

    concurrently.on('exit', (code) => {
      console.log(`\n🛑 Development environment stopped (exit code: ${code})`)
      process.exit(code)
    })

    // Handle Ctrl+C gracefully and kill the process group
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping development environment...')
      if (concurrently.pid) {
        // Kill the entire process group (negative PID)
        try {
          process.kill(-concurrently.pid, 'SIGINT')
        } catch (e) {
          // fallback: kill the main process if group kill fails
          concurrently.kill('SIGINT')
        }
      }
    })

  } catch (error) {
    console.error('❌ Could not start with concurrently. Make sure to install it:')
    console.error('   bun add -D concurrently')
    console.error('\n💡 Alternatively, run in separate terminals:')
    console.error('   Terminal 1: bun scripts/start-backend.js')
    console.error('   Terminal 2: bun scripts/start-frontend.js')
    process.exit(1)
  }
}

// Run the start dev process
startDev().catch(error => {
  console.error('❌ Error during startup:', error)
  process.exit(1)
})
