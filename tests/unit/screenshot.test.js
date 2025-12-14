/**
 * Unit Tests for Screenshot Functions
 *
 * Tests screenshot capture functionality
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, tabsMock, runtimeMock, setRuntimeError, clearRuntimeError } = require('../setup/chrome-mock');

/**
 * Capture screenshot of currently visible tab
 * (Copy of function from background.js for testing)
 */
async function captureScreenshot() {
  const ERROR_MESSAGES = { CAPTURE_FAILED: 'Failed to capture screenshot' };

  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (imageUri) => {
      chrome.runtime.lastError
        ? reject(new Error(ERROR_MESSAGES.CAPTURE_FAILED))
        : resolve(imageUri);
    });
  });
}

describe('captureScreenshot', () => {
  beforeEach(() => {
    resetChromeMocks();
    clearRuntimeError();
  });

  test('should successfully capture screenshot', async () => {
    const mockImageData = 'data:image/png;base64,iVBORw0KGgo';

    tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
      callback(mockImageData);
    });

    const result = await captureScreenshot();

    expect(result).toBe(mockImageData);
    expect(tabsMock.captureVisibleTab).toHaveBeenCalledWith(
      null,
      { format: 'png' },
      expect.any(Function)
    );
  });

  test('should reject on Chrome runtime error', async () => {
    setRuntimeError('Permission denied');

    tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
      callback(null);
    });

    await expect(captureScreenshot()).rejects.toThrow('Failed to capture screenshot');
  });

  test('should call with PNG format', async () => {
    tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
      callback('data:image/png;base64,test');
    });

    await captureScreenshot();

    expect(tabsMock.captureVisibleTab).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ format: 'png' }),
      expect.any(Function)
    );
  });

  test('should call with null window ID (current window)', async () => {
    tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
      callback('data:image/png;base64,test');
    });

    await captureScreenshot();

    const calls = tabsMock.captureVisibleTab.mock.calls;
    expect(calls[0][0]).toBeNull();
  });

  test('should handle empty image data', async () => {
    tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
      callback('');
    });

    const result = await captureScreenshot();

    expect(result).toBe('');
  });
});
