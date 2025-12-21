/**
 * Unit Tests for buildMessages() function
 *
 * Tests the OpenAI API message payload builder
 */

const { describe, test, expect } = require('@jest/globals');
const {
  PROMPT_TYPES,
  PROMPTS,
  ERROR_MESSAGES,
  buildMessages
} = require('../../background.js');

describe('buildMessages', () => {
  const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  describe('ANSWER prompt type', () => {
    test('should build message with ANSWER prompt and image', () => {
      const data = { imageData: mockImageData };
      const result = buildMessages(data, PROMPT_TYPES.ANSWER);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toHaveLength(2);
      expect(result[0].content[0].type).toBe('text');
      expect(result[0].content[0].text).toBe(PROMPTS.ANSWER);
      expect(result[0].content[1].type).toBe('image_url');
      expect(result[0].content[1].image_url.url).toBe(mockImageData);
    });

    test('should use ANSWER prompt as default for unknown types', () => {
      const data = { imageData: mockImageData };
      const result = buildMessages(data, 'unknown_type');

      expect(result[0].content[0].text).toBe(PROMPTS.ANSWER);
    });
  });

  describe('AUTO_SOLVE prompt type', () => {
    test('should build message with AUTO_SOLVE prompt and image', () => {
      const data = { imageData: mockImageData };
      const result = buildMessages(data, PROMPT_TYPES.AUTO_SOLVE);

      expect(result).toHaveLength(1);
      expect(result[0].content[0].text).toBe(PROMPTS.AUTO_SOLVE);
      expect(result[0].content[1].image_url.url).toBe(mockImageData);
    });
  });

  describe('ASK prompt type', () => {
    test('should build message with custom question and image', () => {
      const data = {
        imageData: mockImageData,
        question: 'What is this diagram showing?'
      };
      const result = buildMessages(data, PROMPT_TYPES.ASK);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toHaveLength(2);
      expect(result[0].content[0].type).toBe('text');
      expect(result[0].content[0].text).toBe('What is this diagram showing?');
      expect(result[0].content[1].type).toBe('image_url');
      expect(result[0].content[1].image_url.url).toBe(mockImageData);
    });

    test('should use default ANSWER prompt if ASK type but no question', () => {
      const data = { imageData: mockImageData };
      const result = buildMessages(data, PROMPT_TYPES.ASK);

      expect(result[0].content[0].text).toBe(PROMPTS.ANSWER);
    });
  });

  describe('error handling', () => {
    test('should throw error if no imageData provided', () => {
      const data = {};

      expect(() => buildMessages(data, PROMPT_TYPES.ANSWER))
        .toThrow('No image data provided');
    });

    test('should throw error if data is null', () => {
      expect(() => buildMessages(null, PROMPT_TYPES.ANSWER))
        .toThrow('No image data provided');
    });

    test('should throw error if data is undefined', () => {
      expect(() => buildMessages(undefined, PROMPT_TYPES.ANSWER))
        .toThrow('No image data provided');
    });

    test('should throw error with prompt type in message', () => {
      const data = {};

      expect(() => buildMessages(data, PROMPT_TYPES.AUTO_SOLVE))
        .toThrow('auto_solve');
    });
  });

  describe('edge cases', () => {
    test('should handle empty string question in ASK mode', () => {
      const data = {
        imageData: mockImageData,
        question: ''
      };
      const result = buildMessages(data, PROMPT_TYPES.ASK);

      // Empty string is falsy, should use default prompt
      expect(result[0].content[0].text).toBe(PROMPTS.ANSWER);
    });

    test('should handle whitespace-only question in ASK mode', () => {
      const data = {
        imageData: mockImageData,
        question: '   '
      };
      const result = buildMessages(data, PROMPT_TYPES.ASK);

      // Whitespace is truthy, should use the question
      expect(result[0].content[0].text).toBe('   ');
    });

    test('should preserve special characters in custom question', () => {
      const data = {
        imageData: mockImageData,
        question: 'What does "x + y = z" mean? Explain <carefully>!'
      };
      const result = buildMessages(data, PROMPT_TYPES.ASK);

      expect(result[0].content[0].text).toBe('What does "x + y = z" mean? Explain <carefully>!');
    });
  });
});
