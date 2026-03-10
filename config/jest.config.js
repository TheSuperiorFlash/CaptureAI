/**
 * Jest Configuration for CaptureAI
 *
 * Testing configuration for Chrome extension unit tests
 */

module.exports = {
  // Root directory is project root (parent of config/)
  rootDir: '..',

  // Use Node environment for testing
  testEnvironment: 'node',

  // Test file patterns - exclude api/ and e2e/ (separate configs)
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.js'
  ],

  // Map module imports to their actual locations under extension/
  moduleNameMapper: {
    '^(\\.\\.[\\\\/]){2}modules[\\\\/](.*)$': '<rootDir>/extension/modules/$2',
    '^(\\.\\.[\\\\/]){2}background\\.js$': '<rootDir>/extension/background.js',
    '^(\\.\\.[\\\\/]){2}popup\\.js$': '<rootDir>/extension/popup.js',
    '^(\\.\\.[\\\\/]){2}content\\.js$': '<rootDir>/extension/content.js',
    '^(\\.\\.[\\\\/]){2}inject\\.js$': '<rootDir>/extension/inject.js'
  },

  // Coverage collection from extension source files
  collectCoverageFrom: [
    'extension/background.js',
    'extension/modules/**/*.js',
    'extension/popup.js',
    'extension/content.js',
    'extension/inject.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/__tests__/**'
  ],

  // Coverage thresholds
  // Current baseline: ~40% stmts/branches/lines, ~48% functions (Feb 2026).
  // popup.js (0%), ui-core.js (0%), ui-components.js (0%), and content.js (0%)
  // are DOM-heavy files included in coverage but currently under-tested; they pull the global average down.
  // Target: raise to 60%+ once Priority 2 DOM tests (ui-core, ui-components, popup)
  // are completed (see testing-plan.md).
  coverageThreshold: {
    global: {
      statements: 40,
      branches: 40,
      functions: 47,
      lines: 40
    }
  },

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.js'],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Test timeout (10 seconds)
  testTimeout: 10000,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/api/',
    '/e2e/'
  ]
};
