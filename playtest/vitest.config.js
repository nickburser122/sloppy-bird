import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['playtest/**/*.test.js'], testTimeout: 900000, fileParallelism: false }
});
