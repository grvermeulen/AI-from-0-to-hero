import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    // Narrow to server tests and key SSR smoke tests for this feature branch
    include: [
      'src/server/**/*.test.ts',
      'src/app/layout.ssr.test.tsx',
      'src/app/(public)/profile/page.ssr.test.tsx',
      'src/app/api/**/*.test.ts',
      'src/components/**/*.test.tsx',
    ],
    environmentMatchGlobs: [
      ['src/app/**/*.ssr.test.tsx', 'node'],
      ['src/components/**/*.test.tsx', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': srcDir,
    },
  },
});

