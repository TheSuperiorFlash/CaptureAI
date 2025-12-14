/**
 * Unit Tests for buildMessages() function
 *
 * Tests the OpenAI API message payload builder
 */

const { describe, test, expect } = require('@jest/globals');

// Import constants and function (simulated - in real code these would be exported)
const PROMPT_TYPES = {
  ANSWER: 'answer',
  AUTO_SOLVE: 'auto_solve',
  ASK: 'ask'
};

const PROMPTS = {
  AUTO_SOLVE: 'Answer with only the number (1, 2, 3, or 4) that corresponds to the correct answer choice. Do not include any explanation or additional text.',
  ANSWER: 'Reply with answer only, avoid choices that are red.'
};

const ERROR_MESSAGES = {
  NO_IMAGE_DATA: 'No image data provided'
};

/**
 * Build OpenAI API message payload based on prompt type
 * (Copy of function from background.js for testing)
 */
function buildMessages(data, promptType) {
  if (!data?.imageData) {
    throw new Error(`${ERROR_MESSAGES.NO_IMAGE_DATA} for ${promptType}`);
  }

  const prompts = {
    [PROMPT_TYPES.AUTO_SOLVE]: PROMPTS.AUTO_SOLVE,
    [PROMPT_TYPES.ANSWER]: PROMPTS.ANSWER
  };

  // ASK mode with custom question
  if (promptType === PROMPT_TYPES.ASK && data.question) {
    return [{
      role: 'user',
      content: [
        { type: 'text', text: data.question },
        { type: 'image_url', image_url: { url: data.imageData } }
      ]
    }];
  }

  // Standard prompts (ANSWER or AUTO_SOLVE)
  const prompt = prompts[promptType] || PROMPTS.ANSWER;
  return [{
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: data.imageData } }
    ]
  }];
}

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
