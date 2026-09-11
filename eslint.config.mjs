import tsParser from './node_modules/.pnpm/@typescript-eslint+parser@8_e89279480403728805e1ff1197e4738b/node_modules/@typescript-eslint/parser/dist/index.js';

const tsPlugin = {
  rules: {
    'no-explicit-any': {
      create() {
        return {};
      },
    },
  },
};

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'coverage/**', '*.d.ts', '.trash/**', 'public/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
