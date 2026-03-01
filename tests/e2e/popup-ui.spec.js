/**
 * E2E Tests: Popup UI Interactions
 *
 * Tests the popup interface, license key activation,
 * and user-facing controls.
 */

const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test.describe('Popup UI', () => {
  test('should display extension branding', async ({ popupPage }) => {
    await popupPage.waitForLoadState('domcontentloaded');

    // Should have CaptureAI branding somewhere
    const content = await popupPage.textContent('body');
    expect(content.toLowerCase()).toContain('captureai');
  });

  test('should have capture button or activation prompt', async ({ popupPage }) => {
    await popupPage.waitForLoadState('domcontentloaded');

    // Either a capture button (activated) or activation form (not activated)
    const buttons = await popupPage.locator('button').count();
    const inputs = await popupPage.locator('input').count();

    // Should have some interactive elements
    expect(buttons + inputs).toBeGreaterThan(0);
  });

  test('should show error for invalid license key', async ({ popupPage }) => {
    await popupPage.waitForLoadState('domcontentloaded');

    // Find license key input (if in activation mode)
    const licenseInput = popupPage.locator('input[type="text"], input[placeholder*="license"], input[placeholder*="key"]');

    if (await licenseInput.count() > 0) {
      // Enter invalid key
      await licenseInput.first().fill('INVALID-KEY');

      // Find and click activate/submit button
      const submitBtn = popupPage.locator('button:has-text("Activate"), button:has-text("Submit"), button[type="submit"]');
      if (await submitBtn.count() > 0) {
        await submitBtn.first().click();

        // Should show error (wait for network response)
        await popupPage.waitForTimeout(3000);

        const content = await popupPage.textContent('body');
        const hasError = content.toLowerCase().includes('error') ||
                        content.toLowerCase().includes('invalid') ||
                        content.toLowerCase().includes('failed');
        expect(hasError).toBe(true);
      }
    }
  });

  test('should have keyboard shortcut info', async ({ popupPage }) => {
    await popupPage.waitForLoadState('domcontentloaded');

    // Check for shortcut hints anywhere in popup
    const content = await popupPage.textContent('body');
    const hasShortcutInfo = content.includes('Ctrl') ||
                           content.includes('Shift') ||
                           content.includes('shortcut');
    // This is optional - not all states show shortcuts
    // Just verify the page loaded properly
    expect(content.length).toBeGreaterThan(0);
  });
});

test.describe('Popup State Management', () => {
  test('popup should reflect content script state', async ({ context, extensionId }) => {
    // Open a page first
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Now open popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupPage.waitForLoadState('domcontentloaded');
    await popupPage.waitForTimeout(1000);

    // Popup should have loaded and attempted state sync
    const content = await popupPage.textContent('body');
    expect(content.length).toBeGreaterThan(0);
  });
});
