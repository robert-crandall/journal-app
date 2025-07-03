#!/usr/bin/env node

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import fetch from 'node-fetch'

const execAsync = promisify(exec)

// Check if backend is already running
async function isBackendRunning() {
  try {
    const response = await fetch('http://localhost:3000/api/health', { timeout: 2000 })
    return response.ok
  } catch {
    return false
  }
}

// Check if port is in use
async function isPortInUse(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`)
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

async function startBackend() {
  console.log('🔍 Checking if backend is running...')
  
  if (await isBackendRunning()) {
    console.log('✅ Backend is already running on http://localhost:3000')
    process.exit(0)
  }

  if (await isPortInUse(3000)) {
    console.log('❌ Port 3000 is in use but backend is not responding')
    process.exit(1)
  }

  console.log('🚀 Starting backend...')
  
  const backend = spawn('bun', ['run', 'dev'], {
    cwd: './backend',
    stdio: 'inherit',
    shell: true
  })

  // Wait a moment for startup
  await new Promise(resolve => setTimeout(resolve, 3000))

  if (await isBackendRunning()) {
    console.log('✅ Backend started successfully on http://localhost:3000')
    process.exit(0)
  } else {
    console.log('❌ Backend failed to start')
    backend.kill()
    process.exit(1)
  }
}

startBackend().catch(error => {
  console.error('❌ Error starting backend:', error.message)
  process.exit(1)
})
