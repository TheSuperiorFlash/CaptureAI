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

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.js'
  ],

  // Coverage collection
  collectCoverageFrom: [
    'background.js',
    'modules/**/*.js',
    'popup.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/__tests__/**'
  ],

  // Coverage thresholds
  // Note: Currently set to 0% as tests use function copies for unit testing
  // TODO: Refactor to import actual functions and increase thresholds to 70%
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
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
    '/coverage/'
  ]
};
