/**
 * E2E Tests: Extension Loading & Basic Functionality
 *
 * Verifies the Chrome extension loads correctly, service worker
 * initializes, popup renders, and content script injects.
 */

const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test.describe('Extension Loading', () => {
  test('service worker should register successfully', async ({ context, extensionId }) => {
    expect(extensionId).toBeTruthy();
    expect(extensionId.length).toBeGreaterThan(0);

    // Service worker should be active
    const workers = context.serviceWorkers();
    expect(workers.length).toBeGreaterThan(0);

    const workerUrl = workers[0].url();
    expect(workerUrl).toContain('background.js');
  });

  test('popup should render with activation form', async ({ popupPage }) => {
    // Wait for popup to load
    await popupPage.waitForLoadState('domcontentloaded');

    // Check popup title
    const title = await popupPage.title();
    expect(title).toContain('CaptureAI');

    // Popup should have some content visible
    const body = await popupPage.locator('body');
    await expect(body).toBeVisible();
  });

  test('popup should show license key input or status', async ({ popupPage }) => {
    await popupPage.waitForLoadState('domcontentloaded');

    // Either license key input (not activated) or status info (activated)
    const hasInput = await popupPage.locator('input').count();
    const hasStatus = await popupPage.locator('[class*="status"], [id*="status"]').count();

    expect(hasInput + hasStatus).toBeGreaterThan(0);
  });

  test('content script should inject on a webpage', async ({ extensionPage }) => {
    // Navigate to a test page
    await extensionPage.goto('https://example.com');
    await extensionPage.waitForLoadState('domcontentloaded');

    // Content script should set up the CaptureAI namespace
    // Wait a moment for content script to load
    await extensionPage.waitForTimeout(2000);

    const hasCaptureAI = await extensionPage.evaluate(() => {
      return typeof window.CaptureAI !== 'undefined';
    });

    expect(hasCaptureAI).toBe(true);
  });

  test('content script should have STATE initialized', async ({ extensionPage }) => {
    await extensionPage.goto('https://example.com');
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForTimeout(2000);

    const state = await extensionPage.evaluate(() => {
      if (!window.CaptureAI || !window.CaptureAI.STATE) return null;
      return {
        isPanelVisible: window.CaptureAI.STATE.isPanelVisible,
        isAutoSolveMode: window.CaptureAI.STATE.isAutoSolveMode,
        isProcessing: window.CaptureAI.STATE.isProcessing,
        userTier: window.CaptureAI.STATE.userTier
      };
    });

    expect(state).not.toBeNull();
    expect(state.isPanelVisible).toBe(false);
    expect(state.isAutoSolveMode).toBe(false);
    expect(state.isProcessing).toBe(false);
    expect(state.userTier).toBe('free');
  });
});

test.describe('Extension Communication', () => {
  test('should respond to ping message', async ({ extensionPage }) => {
    await extensionPage.goto('https://example.com');
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForTimeout(2000);

    const response = await extensionPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
          resolve(response);
        });
      });
    });

    // Background should respond to ping
    // Note: if chrome.runtime.sendMessage is available depends on
    // content script context - this tests the content script relay
    expect(response).toBeDefined();
  });
});
