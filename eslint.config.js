// @ts-check
const nextPlugin = require('@next/eslint-plugin-next')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const jsxA11y = require('eslint-plugin-jsx-a11y')
const reactPlugin = require('eslint-plugin-react')
const reactHooksPlugin = require('eslint-plugin-react-hooks')
const raiseherPlugin = require('./eslint-rules')

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: [
      'convex/_generated/**',
      '.next/**',
      'dist/**',
      'node_modules/**',
      // Old Expo source files are progressively ported in later todos.
      // Exclude from linting until each module is migrated.
      'src/**',
    ],
  },

  // Next.js flat config (includes the @next/next plugin and its rules)
  nextPlugin.flatConfig.recommended,

  // TypeScript + React + accessibility for all TS/TSX files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11y,
      raiseher: raiseherPlugin,
    },
    settings: {
      react: { version: 'detect' },
      next: { rootDir: '.' },
    },
    rules: {
      // TypeScript
      ...tsPlugin.configs.recommended.rules,

      // React
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // React Hooks
      ...reactHooksPlugin.configs.recommended.rules,

      // Accessibility
      ...jsxA11y.configs.recommended.rules,

      // Design system house style (Section 8): no em dashes, no hardcoded
      // user-facing strings in JSX (use i18n t() instead).
      'raiseher/no-em-dash': 'error',
      'raiseher/no-hardcoded-jsx-text': 'error',
    },
  },

  // JS config files — enforce the em-dash rule only
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      raiseher: raiseherPlugin,
    },
    rules: {
      'raiseher/no-em-dash': 'error',
    },
  },

  {
    // Checkout pages use inline product copy that will be extracted to i18n
    // keys when the locale routing todo lands. Until then, treat them like
    // the old standalone checkout app which was excluded from this rule.
    files: ['app/checkout/**/*.{ts,tsx}'],
    rules: {
      'raiseher/no-hardcoded-jsx-text': 'off',
    },
  },

  {
    // Internal, founder-only tooling is not localized by design, so the
    // hardcoded-JSX-text check is scoped away from it. The no-em-dash rule
    // still applies everywhere.
    files: ['app/(internal)/**/*.{ts,tsx}'],
    rules: {
      'raiseher/no-hardcoded-jsx-text': 'off',
    },
  },
]
