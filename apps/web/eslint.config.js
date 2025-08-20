import js from '@eslint/js';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'dist/**'],
  },
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    ...js.configs.recommended,
    languageOptions: {
      sourceType: 'module',
    },
    rules: {
      // keep rules minimal; TS-specific rules can be added later
      'no-unused-vars': 'warn',
      'no-undef': 'off', // TS handles types
    },
  },
];


