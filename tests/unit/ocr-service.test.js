/**
 * Unit Tests for OCR Service Module
 * Tests text extraction, cleaning, and validation
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock Tesseract globally before requiring the module
const mockWorker = {
  recognize: jest.fn(),
  setParameters: jest.fn().mockResolvedValue(undefined),
  terminate: jest.fn().mockResolvedValue(undefined)
};

global.Tesseract = {
  createWorker: jest.fn().mockResolvedValue(mockWorker),
  PSM: { AUTO: 3 }
};

// Mock performance.now for duration tracking
if (typeof performance === 'undefined') {
  global.performance = { now: jest.fn().mockReturnValue(0) };
}

let OCRService;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();

  // Reset mock worker state
  mockWorker.recognize.mockReset();
  mockWorker.setParameters.mockReset().mockResolvedValue(undefined);
  mockWorker.terminate.mockReset().mockResolvedValue(undefined);
  global.Tesseract.createWorker.mockReset().mockResolvedValue(mockWorker);

  // Fresh import for each test
  const mod = require('../../extension/modules/ocr-service.js');
  OCRService = mod.OCRService;
});

describe('OCRService', () => {
  describe('constructor state', () => {
    test('should start uninitialized', () => {
      expect(OCRService.isInitialized).toBe(false);
      expect(OCRService.worker).toBeNull();
      expect(OCRService.initializationPromise).toBeNull();
    });
  });

  describe('initialize', () => {
    test('should create a Tesseract worker', async () => {
      await OCRService.initialize();

      expect(global.Tesseract.createWorker).toHaveBeenCalledWith('eng');
      expect(mockWorker.setParameters).toHaveBeenCalled();
      expect(OCRService.isInitialized).toBe(true);
    });

    test('should skip if already initialized', async () => {
      await OCRService.initialize();
      await OCRService.initialize();

      // Only called once
      expect(global.Tesseract.createWorker).toHaveBeenCalledTimes(1);
    });

    test('should deduplicate concurrent initialization calls', async () => {
      const p1 = OCRService.initialize();
      const p2 = OCRService.initialize();

      await Promise.all([p1, p2]);

      expect(global.Tesseract.createWorker).toHaveBeenCalledTimes(1);
    });

    test('should handle initialization failure', async () => {
      global.Tesseract.createWorker.mockRejectedValueOnce(new Error('Worker failed'));

      await expect(OCRService.initialize()).rejects.toThrow('Worker failed');
      expect(OCRService.isInitialized).toBe(false);
      expect(OCRService.initializationPromise).toBeNull();
    });

    test('should throw if Tesseract is not available', async () => {
      const savedTesseract = global.Tesseract;
      delete global.Tesseract;

      // Need fresh module without Tesseract
      jest.resetModules();
      const mod = require('../../extension/modules/ocr-service.js');
      const service = mod.OCRService;

      await expect(service.initialize()).rejects.toThrow('Tesseract.js not available');

      global.Tesseract = savedTesseract;
    });
  });

  describe('cleanOCRText', () => {
    test('should return empty string for falsy input', () => {
      expect(OCRService.cleanOCRText('')).toBe('');
      expect(OCRService.cleanOCRText(null)).toBe('');
      expect(OCRService.cleanOCRText(undefined)).toBe('');
    });

    test('should collapse excessive newlines', () => {
      const input = 'Line 1\n\n\n\n\nLine 2';
      const result = OCRService.cleanOCRText(input);
      expect(result).not.toContain('\n\n\n');
    });

    test('should collapse multiple spaces to single space', () => {
      const input = 'word1    word2     word3';
      const result = OCRService.cleanOCRText(input);
      expect(result).toContain('word1 word2 word3');
    });

    test('should remove carriage returns', () => {
      const input = 'line1\r\nline2\r\n';
      const result = OCRService.cleanOCRText(input);
      expect(result).not.toContain('\r');
    });

    test('should remove OCR artifacts (multiple pipes, tildes, backticks)', () => {
      const input = 'text |||| more ~~~ text ``` end';
      const result = OCRService.cleanOCRText(input);
      expect(result).not.toContain('||||');
      expect(result).not.toContain('~~~');
      expect(result).not.toContain('```');
    });

    test('should remove lines with only special characters', () => {
      const input = 'good line\n|\ngood line 2';
      const result = OCRService.cleanOCRText(input);
      expect(result).toContain('good line');
      expect(result).toContain('good line 2');
    });

    test('should trim each line', () => {
      const input = '  line 1  \n  line 2  ';
      const result = OCRService.cleanOCRText(input);
      const lines = result.split('\n');
      lines.forEach(line => {
        expect(line).toBe(line.trim());
      });
    });

    test('should preserve underscores (used for blank spaces in answers)', () => {
      const input = 'The answer is ___';
      const result = OCRService.cleanOCRText(input);
      expect(result).toContain('___');
    });
  });

  describe('extractText', () => {
    const mockImageData = 'data:image/png;base64,testdata';

    beforeEach(async () => {
      // Pre-initialize for extractText tests
      await OCRService.initialize();
    });

    test('should extract text from image', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: 'Hello World',
          confidence: 85,
          words: [{ text: 'Hello' }, { text: 'World' }],
          lines: [{ text: 'Hello World' }]
        }
      });

      const result = await OCRService.extractText(mockImageData);

      expect(result.text).toBe('Hello World');
      expect(result.confidence).toBe(85);
      expect(result.shouldFallbackToImage).toBe(false);
      expect(result.words).toHaveLength(2);
    });

    test('should flag low confidence for image fallback', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: 'garbled text',
          confidence: 20,
          words: [],
          lines: []
        }
      });

      const result = await OCRService.extractText(mockImageData);

      expect(result.shouldFallbackToImage).toBe(true);
    });

    test('should flag empty text for image fallback', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: '',
          confidence: 90,
          words: [],
          lines: []
        }
      });

      const result = await OCRService.extractText(mockImageData);

      expect(result.shouldFallbackToImage).toBe(true);
    });

    test('should use custom confidence threshold', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: 'Some text',
          confidence: 50,
          words: [],
          lines: []
        }
      });

      // Default threshold is 40, so 50 should pass
      const result = await OCRService.extractText(mockImageData);
      expect(result.shouldFallbackToImage).toBe(false);

      // Custom threshold of 60, so 50 should fail
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: 'Some text',
          confidence: 50,
          words: [],
          lines: []
        }
      });
      const result2 = await OCRService.extractText(mockImageData, { confidenceThreshold: 60 });
      expect(result2.shouldFallbackToImage).toBe(true);
    });

    test('should clean extracted text', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: '  Hello   World  \n\n\n\n  Test  ',
          confidence: 85,
          words: [],
          lines: []
        }
      });

      const result = await OCRService.extractText(mockImageData);

      // Text should be cleaned
      expect(result.text).not.toContain('   ');
    });

    test('should include duration in result', async () => {
      let callCount = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1500; // 500ms duration
      });

      mockWorker.recognize.mockResolvedValueOnce({
        data: { text: 'test', confidence: 90, words: [], lines: [] }
      });

      const result = await OCRService.extractText(mockImageData);
      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
    });

    test('should handle recognition errors gracefully', async () => {
      mockWorker.recognize.mockRejectedValueOnce(new Error('Recognition failed'));

      const result = await OCRService.extractText(mockImageData);

      expect(result.text).toBe('');
      expect(result.confidence).toBe(0);
      expect(result.shouldFallbackToImage).toBe(true);
      expect(result.error).toBe('Recognition failed');
    });

    test('should auto-initialize if not already initialized', async () => {
      // Create fresh instance
      jest.resetModules();
      global.Tesseract = {
        createWorker: jest.fn().mockResolvedValue(mockWorker),
        PSM: { AUTO: 3 }
      };
      const mod = require('../../extension/modules/ocr-service.js');
      const freshService = mod.OCRService;

      mockWorker.recognize.mockResolvedValueOnce({
        data: { text: 'test', confidence: 90, words: [], lines: [] }
      });

      // Should initialize automatically
      await freshService.extractText(mockImageData);
      expect(global.Tesseract.createWorker).toHaveBeenCalled();
    });
  });

  describe('terminate', () => {
    test('should terminate the worker', async () => {
      await OCRService.initialize();
      await OCRService.terminate();

      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(OCRService.worker).toBeNull();
      expect(OCRService.isInitialized).toBe(false);
      expect(OCRService.initializationPromise).toBeNull();
    });

    test('should handle terminate when no worker exists', async () => {
      // Should not throw
      await OCRService.terminate();
      expect(mockWorker.terminate).not.toHaveBeenCalled();
    });

    test('should handle terminate errors gracefully', async () => {
      await OCRService.initialize();
      mockWorker.terminate.mockRejectedValueOnce(new Error('Terminate failed'));

      // Should not throw
      await OCRService.terminate();
    });
  });

  describe('isValidOCRResult', () => {
    test('should return true for valid result', () => {
      expect(OCRService.isValidOCRResult({
        text: 'Valid text',
        confidence: 85
      })).toBe(true);
    });

    test('should return false for null result', () => {
      expect(OCRService.isValidOCRResult(null)).toBe(false);
    });

    test('should return false for empty text', () => {
      expect(OCRService.isValidOCRResult({
        text: '',
        confidence: 90
      })).toBe(false);
    });

    test('should return false for whitespace-only text', () => {
      expect(OCRService.isValidOCRResult({
        text: '   ',
        confidence: 90
      })).toBe(false);
    });

    test('should return false for low confidence', () => {
      expect(OCRService.isValidOCRResult({
        text: 'Some text',
        confidence: 30
      })).toBe(false);
    });

    test('should return true for confidence at threshold (40)', () => {
      expect(OCRService.isValidOCRResult({
        text: 'Some text',
        confidence: 40
      })).toBe(true);
    });

    test('should return false for missing text property', () => {
      expect(OCRService.isValidOCRResult({
        confidence: 90
      })).toBe(false);
    });
  });
});
