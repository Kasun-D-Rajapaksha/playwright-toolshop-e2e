const js = require('@eslint/js')
const playwright = require('eslint-plugin-playwright')

module.exports = [
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'blob-report/',
      'test-results/',
      'playwright/.auth/',
    ],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.js'],
    settings: {
      playwright: {
        globalAliases: { test: ['setup'] },
      },
    },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Conditional logic is used deliberately for per-browser test data.
      'playwright/no-conditional-in-test': 'off',
    },
  },
]
