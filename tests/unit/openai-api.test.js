/**
 * Unit Tests for OpenAI API Functions
 *
 * Tests sendToOpenAI and sendTextOnlyQuestion functions
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks, storageMock } = require('../setup/chrome-mock');
const {
  PROMPT_TYPES,
  OPENAI_CONFIG,
  PROMPTS,
  ERROR_MESSAGES,
  formatError,
  buildMessages,
  sendToOpenAI,
  sendTextOnlyQuestion
} = require('../../background.js');

// Tests
describe('sendToOpenAI', () => {
  const mockImageData = 'data:image/png;base64,iVBORw0KGgo';
  const mockApiKey = 'sk-test123456789';

  beforeEach(() => {
    fetch.resetMocks();
    resetChromeMocks();

    // Mock storage to return default reasoning level (medium)
    // Support both callback and Promise APIs
    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = { 'captureai-reasoning-level': 1 };
      if (callback) {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    });
  });

  describe('successful API calls', () => {
    test('should return AI response for ANSWER prompt', async () => {
      const mockResponse = {
        choices: [
          { message: { content: 'The answer is 42' } }
        ]
      };

      fetch.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        mockApiKey,
        PROMPT_TYPES.ANSWER
      );

      expect(result).toBe('The answer is 42');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        OPENAI_CONFIG.API_URL,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should return AI response for AUTO_SOLVE prompt', async () => {
      const mockResponse = {
        choices: [
          { message: { content: '2' } }
        ]
      };

      fetch.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        mockApiKey,
        PROMPT_TYPES.AUTO_SOLVE
      );

      expect(result).toBe('2');
    });

    test('should return AI response for ASK prompt with question', async () => {
      const mockResponse = {
        choices: [
          { message: { content: 'This is a diagram of a circle' } }
        ]
      };

      fetch.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await sendToOpenAI(
        { imageData: mockImageData, question: 'What is this?' },
        mockApiKey,
        PROMPT_TYPES.ASK
      );

      expect(result).toBe('This is a diagram of a circle');
    });

    test('should trim whitespace from response', async () => {
      const mockResponse = {
        choices: [
          { message: { content: '  Answer with spaces  \n' } }
        ]
      };

      fetch.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        mockApiKey
      );

      expect(result).toBe('Answer with spaces');
    });

    test('should handle empty content with fallback message', async () => {
      const mockResponse = {
        choices: [
          { message: { content: '' } }
        ]
      };

      fetch.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        mockApiKey
      );

      expect(result).toBe('No response found');
    });

    test('should use correct max tokens for AUTO_SOLVE', async () => {
      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: '1' } }]
      }));

      await sendToOpenAI(
        { imageData: mockImageData },
        mockApiKey,
        PROMPT_TYPES.AUTO_SOLVE
      );

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.max_completion_tokens).toBe(OPENAI_CONFIG.MAX_TOKENS.AUTO_SOLVE);
    });

    test('should use correct max tokens for ASK', async () => {
      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: 'answer' } }]
      }));

      await sendToOpenAI(
        { imageData: mockImageData, question: 'test?' },
        mockApiKey,
        PROMPT_TYPES.ASK
      );

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.max_completion_tokens).toBe(OPENAI_CONFIG.MAX_TOKENS.ASK);
    });
  });

  describe('error handling', () => {
    test('should return error for missing API key', async () => {
      const result = await sendToOpenAI(
        { imageData: mockImageData },
        '',
        PROMPT_TYPES.ANSWER
      );

      expect(result).toBe('Error: API key is not set');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should return error for whitespace-only API key', async () => {
      const result = await sendToOpenAI(
        { imageData: mockImageData },
        '   ',
        PROMPT_TYPES.ANSWER
      );

      expect(result).toBe('Error: API key is not set');
    });

    test('should return error for null API key', async () => {
      const result = await sendToOpenAI(
        { imageData: mockImageData },
        null,
        PROMPT_TYPES.ANSWER
      );

      expect(result).toBe('Error: API key is not set');
    });

    test('should handle HTTP error responses', async () => {
      fetch.mockResponseOnce('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        mockApiKey
      );

      expect(result).toContain('Error: OpenAI API error (401)');
    });

    test('should handle rate limit errors', async () => {
      fetch.mockResponseOnce('Rate limit exceeded', { status: 429, statusText: 'Too Many Requests' });

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        mockApiKey
      );

      expect(result).toContain('Error: OpenAI API error (429)');
    });

    test('should handle network errors', async () => {
      fetch.mockReject(new Error('Network failure'));

      const result = await sendToOpenAI(
        { imageData: mockImageData },
        mockApiKey
      );

      expect(result).toContain('Error: Network error or API unavailable');
      expect(result).toContain('Network failure');
    });

    test('should return error for missing image data', async () => {
      // Note: The function catches the error and returns an error string
      // rather than throwing
      const result = await sendToOpenAI({}, mockApiKey);

      expect(result).toContain('Error:');
      expect(result).toContain('No image data provided');
    });
  });

  describe('API request payload', () => {
    test('should include correct model in request', async () => {
      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: 'test' } }]
      }));

      await sendToOpenAI({ imageData: mockImageData }, mockApiKey);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('gpt-5-nano');
    });

    test('should include reasoning effort and verbosity', async () => {
      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: 'test' } }]
      }));

      await sendToOpenAI({ imageData: mockImageData }, mockApiKey);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.reasoning_effort).toBe('low');
      expect(requestBody.verbosity).toBe('low');
    });
  });
});

describe('sendTextOnlyQuestion', () => {
  const mockApiKey = 'sk-test123456789';

  beforeEach(() => {
    fetch.resetMocks();
    resetChromeMocks();

    // Mock storage to return default reasoning level (medium)
    // Support both callback and Promise APIs
    storageMock.local.get.mockImplementation((keys, callback) => {
      const result = { 'captureai-reasoning-level': 1 };
      if (callback) {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    });
  });

  describe('successful API calls', () => {
    test('should return AI response for text question', async () => {
      const mockResponse = {
        choices: [
          { message: { content: 'Paris is the capital of France' } }
        ]
      };

      fetch.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await sendTextOnlyQuestion(
        'What is the capital of France?',
        mockApiKey
      );

      expect(result).toBe('Paris is the capital of France');
    });

    test('should include system message in request', async () => {
      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: 'answer' } }]
      }));

      await sendTextOnlyQuestion('test question', mockApiKey);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.messages).toHaveLength(2);
      expect(requestBody.messages[0].role).toBe('system');
      expect(requestBody.messages[0].content).toBe(PROMPTS.ASK_SYSTEM);
      expect(requestBody.messages[1].role).toBe('user');
      expect(requestBody.messages[1].content).toBe('test question');
    });

    test('should use TEXT_ONLY max tokens', async () => {
      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: 'answer' } }]
      }));

      await sendTextOnlyQuestion('test', mockApiKey);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.max_completion_tokens).toBe(OPENAI_CONFIG.MAX_TOKENS.TEXT_ONLY);
    });

    test('should trim whitespace from response', async () => {
      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: '  trimmed response  \n' } }]
      }));

      const result = await sendTextOnlyQuestion('test', mockApiKey);

      expect(result).toBe('trimmed response');
    });
  });

  describe('error handling', () => {
    test('should handle HTTP error responses', async () => {
      fetch.mockResponseOnce(
        JSON.stringify({ error: { message: 'Invalid API key' } }),
        { status: 401 }
      );

      const result = await sendTextOnlyQuestion('test', mockApiKey);

      expect(result).toContain('Error: Invalid API key');
    });

    test('should handle malformed error JSON', async () => {
      fetch.mockResponseOnce(
        'Not JSON',
        { status: 500, statusText: 'Internal Server Error' }
      );

      const result = await sendTextOnlyQuestion('test', mockApiKey);

      expect(result).toContain('Error:');
    });

    test('should handle network errors', async () => {
      fetch.mockReject(new Error('Connection timeout'));

      const result = await sendTextOnlyQuestion('test', mockApiKey);

      expect(result).toContain('Error: Network error or API unavailable');
      expect(result).toContain('Connection timeout');
    });

    test('should handle empty response content', async () => {
      fetch.mockResponseOnce(JSON.stringify({
        choices: [{ message: { content: '' } }]
      }));

      const result = await sendTextOnlyQuestion('test', mockApiKey);

      expect(result).toBe('No response found');
    });
  });
});
