import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import * as child_process from 'node:child_process';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    csrf: {
      checkOrigin: process.env.NODE_ENV === 'production',
    },
    version: {
      // Use git commit hash for deterministic versioning in production
      // Falls back to environment variable (Docker) or timestamp in development
      name: (() => {
        // First try environment variable (from Docker build)
        if (process.env.GIT_COMMIT) {
          return process.env.GIT_COMMIT;
        }
        // Then try git command (local development)
        try {
          return child_process.execSync('git rev-parse HEAD').toString().trim();
        } catch {
          // Fallback to timestamp if git is not available
          return Date.now().toString();
        }
      })(),
      // Poll for version changes every 30 seconds (30000ms)
      // Set to 0 to disable polling (recommended for development)
      pollInterval: process.env.NODE_ENV === 'production' ? 30000 : 0,
    },
  },
};

export default config;
