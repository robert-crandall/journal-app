#!/usr/bin/env node

import { spawn } from 'child_process'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Use concurrently to run both services with combined logs
async function startDev() {
  console.log('🚀 Starting development environment...')
  console.log('📝 This will show logs from both backend and frontend')
  console.log('🔍 Press Ctrl+C to stop all services\n')

  try {
    // Try to use concurrently if available
    const concurrently = spawn('npx', [
      'concurrently',
      '--prefix', '[{name}]',
      '--names', 'backend,frontend',
      '--prefix-colors', 'blue,green',
      '--kill-others',
      '--kill-others-on-fail',
      '"cd backend && bun run dev"',
      '"cd frontend && bun run dev"'
    ], {
      stdio: 'inherit',
      shell: true
    })

    concurrently.on('exit', (code) => {
      console.log(`\n🛑 Development environment stopped (exit code: ${code})`)
      process.exit(code)
    })

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping development environment...')
      concurrently.kill('SIGINT')
    })

  } catch (error) {
    console.error('❌ Could not start with concurrently. Make sure to install it:')
    console.error('   bun add -D concurrently')
    console.error('\n💡 Alternatively, run in separate terminals:')
    console.error('   Terminal 1: bun run backend')
    console.error('   Terminal 2: bun run frontend')
    process.exit(1)
  }
}

startDev()
