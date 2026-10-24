import { defineConfig } from 'vitest/config';
import { pwaPlugin } from './tools/pwa.js';

export default defineConfig({
  base: './',
  build: { target: 'es2022' },
  plugins: [pwaPlugin()],
  test: { environment: 'node', include: ['tests/**/*.test.js'] }
});
