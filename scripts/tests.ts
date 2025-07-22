#!/usr/bin/env bun
import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(spawn);

// Get the parent directory (repository root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PARENT_DIR = path.dirname(__dirname);

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0]?.toLowerCase();

// Set environment variables
process.env.NODE_ENV = 'test';
process.env.PARENT_DIR = PARENT_DIR;

interface TestOptions {
  runBackend: boolean;
  runFrontend: boolean;
  runE2E: boolean;
}

function getTestOptions(testType?: string): TestOptions {
  switch (testType) {
    case 'backend':
      return { runBackend: true, runFrontend: false, runE2E: false };
    case 'frontend':
      return { runBackend: false, runFrontend: true, runE2E: true };
    default:
      return { runBackend: true, runFrontend: true, runE2E: true };
  }
}

function printSection(title: string): void {
  console.log('');
  console.log(`🔍 ${title}`);
  console.log('----------------------------------------');
}

async function runCommand(command: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: cwd || process.cwd(),
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runBackendTests(): Promise<void> {
  printSection('Running backend checks');
  const backendDir = path.join(PARENT_DIR, 'backend');

  console.log('📦 Installing backend dependencies...');
  await runCommand('bun', ['install', '--frozen-lockfile'], backendDir);

  console.log('🔧 Running checks...');
  await runCommand('bun', ['run', 'check'], backendDir);

  console.log('- Running tests...');
  await runCommand('bun', ['run', 'test'], backendDir);
}

async function runFrontendTests(): Promise<void> {
  printSection('Running frontend checks');
  const frontendDir = path.join(PARENT_DIR, 'frontend');

  console.log('📦 Installing frontend dependencies...');
  await runCommand('bun', ['install', '--frozen-lockfile'], frontendDir);

  console.log('🔧 Running Svelte check...');
  await runCommand('bun', ['run', 'check'], frontendDir);

  console.log('- Building frontend...');
  await runCommand('bun', ['run', 'build'], frontendDir);

  console.log('🔧 Running linter...(not in CI)');
  await runCommand('bun', ['run', 'lint'], frontendDir);
}

async function runE2ETests(): Promise<void> {
  printSection('Running E2E tests (not in CI)');
  await runCommand('playwright', ['test'], PARENT_DIR);
}

async function main(): Promise<void> {
  try {
    const options = getTestOptions(testType);

    // Show which tests will run
    const testSuite = testType || 'all';
    console.log(`🚀 Running ${testSuite} tests...`);

    // Always run preparation steps
    printSection('Preparing for tests');
    console.log('Running formatter...');
    await runCommand('bun', ['run', 'format'], PARENT_DIR);
    await runCommand('bun', ['run', 'db:setup'], PARENT_DIR);

    // Run selected test suites
    if (options.runBackend) {
      await runBackendTests();
    }

    if (options.runFrontend) {
      await runFrontendTests();
    }

    if (options.runE2E) {
      await runE2ETests();
    }

    printSection('All checks completed successfully! ✅');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Show usage information if help is requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: bun run scripts/test_pr.ts [test-type]

Arguments:
  [test-type]    Optional. Specifies which tests to run:
                 - backend: Run only backend tests
                 - frontend: Run only frontend tests (includes E2E)
                 - (no argument): Run all tests (backend + frontend + E2E)

Examples:
  bun run scripts/test_pr.ts          # Run all tests
  bun run scripts/test_pr.ts backend  # Run only backend tests
  bun run scripts/test_pr.ts frontend # Run only frontend tests + E2E

Options:
  -h, --help     Show this help message
`);
  process.exit(0);
}

main();
