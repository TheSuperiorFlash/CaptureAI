/**
 * Global Test Setup
 *
 * Runs before all tests to set up the testing environment
 */

const { setupChromeMock } = require('./chrome-mock');

// Set up Chrome API mocks globally
setupChromeMock();

// Suppress console output during tests (optional)
// Uncomment to reduce test output noise
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn()
// };
