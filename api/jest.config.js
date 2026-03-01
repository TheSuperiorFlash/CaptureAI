/**
 * Jest Configuration for CaptureAI API (Cloudflare Workers)
 */

module.exports = {
  testEnvironment: 'node',

  testMatch: [
    '**/tests/**/*.test.js'
  ],

  setupFilesAfterEnv: ['./tests/setup/test-setup.js'],

  collectCoverageFrom: [
    'src/**/*.js',
    '!**/node_modules/**'
  ],

  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 90,
      lines: 85
    }
  },

  coverageDirectory: 'coverage',

  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  clearMocks: true,
  restoreMocks: true,
  verbose: true,
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 10000,

  testPathIgnorePatterns: [
    '/node_modules/'
  ]
};
