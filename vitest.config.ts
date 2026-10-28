import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'content/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
  },
});
