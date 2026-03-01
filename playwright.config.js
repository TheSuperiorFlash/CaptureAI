/**
 * Playwright Configuration for CaptureAI E2E Tests
 *
 * Tests Chrome extension behavior in a real browser environment.
 * The extension is loaded as an unpacked extension in Chromium.
 */

const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests/e2e',

  // Timeout per test
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000
  },

  // Retries on CI
  retries: process.env.CI ? 2 : 0,

  // Reporter
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list']]
    : [['list']],

  // Global setup to build extension if needed
  use: {
    // Base URL for test pages
    baseURL: 'http://localhost:8787',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Trace on failure
    trace: 'on-first-retry'
  },

  projects: [
    {
      name: 'chromium-extension',
      use: {
        // Chrome extension testing requires persistent context
        // configured in test fixtures (see e2e/fixtures.js)
        browserName: 'chromium'
      }
    }
  ]
});
