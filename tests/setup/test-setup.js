/**
 * Global Test Setup
 *
 * Runs before all tests to set up the testing environment
 */

import { setupChromeMock } from './chrome-mock.js';
import fetchMock from 'jest-fetch-mock';

// Set up Chrome API mocks globally
setupChromeMock();

// Set up fetch mock globally
global.fetch = fetchMock;
global.fetch.enableMocks();

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
