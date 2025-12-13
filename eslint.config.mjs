import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        chrome: 'readonly'
      }
    },
    rules: {
      // Code Quality
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'no-console': 'off', // Allow console for debugging
      'prefer-const': 'warn',
      'no-var': 'error',

      // Style (matching CLAUDE.md standards)
      'indent': ['error', 2, { SwitchCase: 1 }],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'max-len': ['warn', {
        code: 100,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }],
      'max-lines': ['warn', {
        max: 500,
        skipBlankLines: true,
        skipComments: true
      }],
      'max-lines-per-function': ['warn', {
        max: 50,
        skipBlankLines: true,
        skipComments: true
      }],

      // Best Practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always'
      }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-infix-ops': 'error',
      'comma-spacing': ['error', { before: false, after: true }],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],

      // Chrome Extension Specific
      'no-undef': 'error' // Catch undefined variables
    }
  },
  {
    // Ignore generated or vendor files
    ignores: [
      'node_modules/**',
      'dist/**',
      '*.min.js'
    ]
  }
];
