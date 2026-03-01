/**
 * Playwright Test Fixtures for Chrome Extension Testing
 *
 * Provides a browser context with the CaptureAI extension loaded.
 * Chrome extensions require a persistent context (not incognito).
 */

const { test: base, chromium } = require('@playwright/test');
const path = require('path');

const EXTENSION_PATH = path.resolve(__dirname, '../../extension');

/**
 * Custom test fixture that launches Chromium with the extension loaded
 */
const test = base.extend({
  // Override context to use persistent context with extension
  context: async ({ /* unused fixtures */ }, use) => { // eslint-disable-line no-empty-pattern
    const context = await chromium.launchPersistentContext('', {
      headless: process.env.PWHEADED !== '1',
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-first-run',
        '--disable-default-apps'
      ]
    });

    await use(context);
    await context.close();
  },

  // Provide the extension ID for service worker access
  extensionId: async ({ context }, use) => {
    // Wait for the service worker to register
    let serviceWorker;
    if (context.serviceWorkers().length > 0) {
      serviceWorker = context.serviceWorkers()[0];
    } else {
      serviceWorker = await context.waitForEvent('serviceworker');
    }

    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },

  // Provide a page with the extension loaded
  extensionPage: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
  },

  // Provide access to the popup page
  popupPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await use(page);
  }
});

module.exports = { test };
