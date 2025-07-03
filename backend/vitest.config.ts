import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    testTimeout: 20000,
    // Run tests sequentially to avoid database connection conflicts
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Ensure proper test isolation
    isolate: true,
  }
});
