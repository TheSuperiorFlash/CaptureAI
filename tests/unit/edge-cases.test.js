/**
 * Unit Tests for Edge Cases
 *
 * Comprehensive edge case testing for critical functions
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock, tabsMock, setRuntimeError } = require('../setup/chrome-mock');

// Test functions
const PROMPT_TYPES = {
  ANSWER: 'answer',
  AUTO_SOLVE: 'auto_solve',
  ASK: 'ask'
};

const PROMPTS = {
  AUTO_SOLVE: 'Answer with only the number...',
  ANSWER: 'Reply with answer only...'
};

const ERROR_MESSAGES = {
  NO_IMAGE_DATA: 'No image data provided'
};

function buildMessages(data, promptType) {
  if (!data?.imageData) {
    throw new Error(`${ERROR_MESSAGES.NO_IMAGE_DATA} for ${promptType}`);
  }

  const prompts = {
    [PROMPT_TYPES.AUTO_SOLVE]: PROMPTS.AUTO_SOLVE,
    [PROMPT_TYPES.ANSWER]: PROMPTS.ANSWER
  };

  if (promptType === PROMPT_TYPES.ASK && data.question) {
    return [{
      role: 'user',
      content: [
        { type: 'text', text: data.question },
        { type: 'image_url', image_url: { url: data.imageData } }
      ]
    }];
  }

  const prompt = prompts[promptType] || PROMPTS.ANSWER;
  return [{
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: data.imageData } }
    ]
  }];
}

function isValidUrl(url) {
  return (url.startsWith('http://') || url.startsWith('https://')) &&
         !url.startsWith('chrome://') &&
         !url.startsWith('chrome-extension://') &&
         !url.startsWith('chrome.google.com');
}

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

async function getStoredApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['captureai-api-key'], (result) => {
      resolve(result['captureai-api-key'] || '');
    });
  });
}

describe('Edge Cases', () => {
  beforeEach(() => {
    resetChromeMocks();
  });

  describe('buildMessages - extreme inputs', () => {
    test('should handle extremely long image data URLs', () => {
      const longImageData = 'data:image/png;base64,' + 'A'.repeat(100000);
      const result = buildMessages({ imageData: longImageData }, PROMPT_TYPES.ANSWER);

      expect(result[0].content[1].image_url.url).toBe(longImageData);
      expect(result[0].content[1].image_url.url.length).toBeGreaterThan(100000);
    });

    test('should handle very long questions', () => {
      const longQuestion = 'What is ' + 'this '.repeat(1000) + '?';
      const result = buildMessages(
        { imageData: 'data:image/png;base64,abc', question: longQuestion },
        PROMPT_TYPES.ASK
      );

      expect(result[0].content[0].text).toBe(longQuestion);
    });

    test('should handle questions with special regex characters', () => {
      const question = 'What does [a-z]+ (\\d{3}) mean?';
      const result = buildMessages(
        { imageData: 'data:image/png;base64,abc', question: question },
        PROMPT_TYPES.ASK
      );

      expect(result[0].content[0].text).toBe(question);
    });

    test('should handle questions with HTML entities', () => {
      const question = 'What is &lt;div&gt; &amp; &quot;test&quot;?';
      const result = buildMessages(
        { imageData: 'data:image/png;base64,abc', question: question },
        PROMPT_TYPES.ASK
      );

      expect(result[0].content[0].text).toBe(question);
    });

    test('should handle image data with special base64 characters', () => {
      const imageData = 'data:image/png;base64,ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/==';
      const result = buildMessages({ imageData }, PROMPT_TYPES.ANSWER);

      expect(result[0].content[1].image_url.url).toBe(imageData);
    });

    test('should handle data object with extra properties', () => {
      const data = {
        imageData: 'data:image/png;base64,abc',
        question: 'test',
        extraProp1: 'ignored',
        extraProp2: 123
      };
      const result = buildMessages(data, PROMPT_TYPES.ASK);

      expect(result[0].content).toHaveLength(2);
      expect(result[0].content[0].text).toBe('test');
    });
  });

  describe('isValidUrl - complex URLs', () => {
    test('should handle URLs with maximum length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      expect(isValidUrl(longUrl)).toBe(true);
    });

    test('should handle URLs with many query parameters', () => {
      const url = 'https://example.com?' + Array(100).fill(0).map((_, i) => `param${i}=value${i}`).join('&');
      expect(isValidUrl(url)).toBe(true);
    });

    test('should handle URLs with special characters in path', () => {
      expect(isValidUrl('https://example.com/path%20with%20spaces')).toBe(true);
      expect(isValidUrl('https://example.com/path?q=test+query')).toBe(true);
      expect(isValidUrl('https://example.com/#section')).toBe(true);
    });

    test('should handle URLs with auth credentials', () => {
      expect(isValidUrl('https://user:pass@example.com')).toBe(true);
    });

    test('should handle URLs with non-standard ports', () => {
      expect(isValidUrl('https://example.com:8443')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://example.com:65535')).toBe(true);
    });

    test('should handle IPv4 addresses', () => {
      expect(isValidUrl('http://192.168.1.1')).toBe(true);
      expect(isValidUrl('https://10.0.0.1:8080')).toBe(true);
    });

    test('should handle IPv6 addresses', () => {
      expect(isValidUrl('http://[::1]')).toBe(true);
      expect(isValidUrl('https://[2001:db8::1]')).toBe(true);
    });

    test('should handle internationalized domain names', () => {
      expect(isValidUrl('https://münchen.de')).toBe(true);
      expect(isValidUrl('https://中国.cn')).toBe(true);
    });

    test('should reject empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    test('should reject single character', () => {
      expect(isValidUrl('h')).toBe(false);
    });

    test('should reject whitespace only', () => {
      expect(isValidUrl('   ')).toBe(false);
    });
  });

  describe('captureScreenshot - error scenarios', () => {
    test('should handle very large screenshot data', async () => {
      const largeImageData = 'data:image/png;base64,' + 'A'.repeat(1000000);
      tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
        callback(largeImageData);
      });

      const result = await captureScreenshot();
      expect(result.length).toBeGreaterThan(1000000);
    });

    test('should handle null image data', async () => {
      tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
        callback(null);
      });

      const result = await captureScreenshot();
      expect(result).toBeNull();
    });

    test('should handle undefined image data', async () => {
      tabsMock.captureVisibleTab.mockImplementation((windowId, options, callback) => {
        callback(undefined);
      });

      const result = await captureScreenshot();
      expect(result).toBeUndefined();
    });
  });

  describe('getStoredApiKey - edge cases', () => {
    test('should handle very long API keys', async () => {
      const longKey = 'sk-' + 'A'.repeat(1000);
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': longKey });
      });

      const result = await getStoredApiKey();
      expect(result).toBe(longKey);
      expect(result.length).toBeGreaterThan(1000);
    });

    test('should handle API keys with special characters', async () => {
      const specialKey = 'sk-test!@#$%^&*()_+-=[]{}|;:,.<>?';
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': specialKey });
      });

      const result = await getStoredApiKey();
      expect(result).toBe(specialKey);
    });

    test('should handle API keys with unicode', async () => {
      const unicodeKey = 'sk-测试-🔑-key';
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': unicodeKey });
      });

      const result = await getStoredApiKey();
      expect(result).toBe(unicodeKey);
    });

    test('should handle boolean false as stored value (falsy, returns empty string)', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': false });
      });

      const result = await getStoredApiKey();
      // Function uses || operator, so falsy values return empty string
      expect(result).toBe('');
    });

    test('should handle number zero as stored value (falsy, returns empty string)', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({ 'captureai-api-key': 0 });
      });

      const result = await getStoredApiKey();
      // Function uses || operator, so falsy values return empty string
      expect(result).toBe('');
    });

    test('should handle empty object response', async () => {
      storageMock.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const result = await getStoredApiKey();
      expect(result).toBe('');
    });
  });

  describe('Type coercion and boundary values', () => {
    test('buildMessages should throw on null data', () => {
      expect(() => buildMessages(null, PROMPT_TYPES.ANSWER))
        .toThrow('No image data provided');
    });

    test('buildMessages should throw on undefined data', () => {
      expect(() => buildMessages(undefined, PROMPT_TYPES.ANSWER))
        .toThrow('No image data provided');
    });

    test('buildMessages should throw on data without imageData', () => {
      expect(() => buildMessages({ question: 'test' }, PROMPT_TYPES.ANSWER))
        .toThrow('No image data provided');
    });

    test('isValidUrl should handle URL with only protocol', () => {
      // Note: .startsWith() will return true for these
      expect(isValidUrl('http://')).toBe(true);
      expect(isValidUrl('https://')).toBe(true);
    });

    test('isValidUrl should handle protocol without slashes', () => {
      expect(isValidUrl('http:example.com')).toBe(false);
      expect(isValidUrl('https:example.com')).toBe(false);
    });
  });
});
