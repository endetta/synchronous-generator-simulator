// Vitest configuration for physics & renderer tests
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Simulate browser environment
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.js'],
      exclude: ['src/main.js', 'node_modules/**', 'tools/**'],
      lines: 80,
      functions: 75,
      branches: 70,
    },
    include: ['tools/**/*.test.js'],
    testTimeout: 10000,
  },
});
