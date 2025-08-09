import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': srcDir,
    },
  },
});

