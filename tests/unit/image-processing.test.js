/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for Image Processing Module
 *
 * Tests the actual ImageProcessing module from extension/modules/image-processing.js
 * focusing on calculateOptimalSize (pure math, no DOM needed)
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock OCR service dependency (image-processing.js imports it statically)
jest.mock('../../modules/ocr-service.js', () => ({
  OCRService: {
    extractText: jest.fn(),
    isValidOCRResult: jest.fn()
  }
}));

import { ImageProcessing } from '../../modules/image-processing.js';
import { OCRService } from '../../modules/ocr-service.js';

describe('Image Processing Module', () => {
  describe('calculateOptimalSize', () => {
    test('should return original dimensions if within limits', () => {
      const result = ImageProcessing.calculateOptimalSize(400, 300, 800, 600);
      expect(result).toEqual({ width: 400, height: 300 });
    });

    test('should scale down large images proportionally', () => {
      const result = ImageProcessing.calculateOptimalSize(1600, 1200, 800, 600);
      expect(result.width).toBeLessThanOrEqual(800);
      expect(result.height).toBeLessThanOrEqual(600);
      const aspectRatio = result.width / result.height;
      expect(aspectRatio).toBeCloseTo(1600 / 1200, 1);
    });

    test('should handle square images', () => {
      const result = ImageProcessing.calculateOptimalSize(1000, 1000, 800, 600);
      const resultArea = result.width * result.height;
      const maxArea = 800 * 600;
      expect(resultArea).toBeLessThanOrEqual(maxArea * 1.01);
      expect(result.width).toBe(result.height);
    });

    test('should handle very wide images (4:1 ratio)', () => {
      const result = ImageProcessing.calculateOptimalSize(1600, 400, 800, 600);
      const resultArea = result.width * result.height;
      expect(resultArea).toBeLessThanOrEqual(800 * 600);
      expect(result.width / result.height).toBeCloseTo(4, 1);
    });

    test('should handle very tall images (1:4 ratio)', () => {
      const result = ImageProcessing.calculateOptimalSize(400, 1600, 800, 600);
      const resultArea = result.width * result.height;
      expect(resultArea).toBeLessThanOrEqual(800 * 600);
      expect(result.width / result.height).toBeCloseTo(0.25, 1);
    });

    test('should handle 1x1 image', () => {
      const result = ImageProcessing.calculateOptimalSize(1, 1, 800, 600);
      expect(result).toEqual({ width: 1, height: 1 });
    });

    test('should handle exact maximum size', () => {
      const result = ImageProcessing.calculateOptimalSize(800, 600, 800, 600);
      expect(result).toEqual({ width: 800, height: 600 });
    });

    test('should round dimensions to integers', () => {
      const result = ImageProcessing.calculateOptimalSize(1234, 567, 800, 600);
      expect(Number.isInteger(result.width)).toBe(true);
      expect(Number.isInteger(result.height)).toBe(true);
    });

    test('should handle zero dimensions', () => {
      const result = ImageProcessing.calculateOptimalSize(0, 0, 800, 600);
      expect(result).toEqual({ width: 0, height: 0 });
    });

    test('should handle negative dimensions gracefully', () => {
      const result = ImageProcessing.calculateOptimalSize(-100, -100, 800, 600);
      expect(result.width).toBe(-100);
      expect(result.height).toBe(-100);
    });

    test('should scale using area reduction', () => {
      const result = ImageProcessing.calculateOptimalSize(1000, 1000, 800, 600);
      const resultArea = result.width * result.height;
      const targetArea = 800 * 600;
      expect(resultArea).toBeLessThanOrEqual(targetArea * 1.01);
    });

    test('should preserve aspect ratio for 16:9', () => {
      const result = ImageProcessing.calculateOptimalSize(1920, 1080, 800, 600);
      const originalRatio = 1920 / 1080;
      const resultRatio = result.width / result.height;
      expect(resultRatio).toBeCloseTo(originalRatio, 1);
    });
  });

  describe('tryCompression', () => {
    test('returns the compressed data URL from canvas.toDataURL', async () => {
      const canvasMock = {
        toDataURL: jest.fn().mockReturnValue('data:image/webp;base64,abc123')
      };

      const result = await ImageProcessing.tryCompression(canvasMock, 'image/webp', 0.8);

      expect(result).toBe('data:image/webp;base64,abc123');
      expect(canvasMock.toDataURL).toHaveBeenCalledWith('image/webp', 0.8);
    });

    test('returns null when toDataURL throws', async () => {
      const canvasMock = {
        toDataURL: jest.fn().mockImplementation(() => {
          throw new Error('Format not supported');
        })
      };

      const result = await ImageProcessing.tryCompression(canvasMock, 'image/webp', 0.8);

      expect(result).toBeNull();
    });
  });

  describe('performOCR', () => {
    beforeEach(() => {
      OCRService.extractText.mockReset();
      OCRService.isValidOCRResult.mockReset();
    });

    test('returns valid OCR result when text has sufficient confidence', async () => {
      OCRService.extractText.mockResolvedValue({
        text: 'Hello World',
        confidence: 85,
        duration: 100,
        shouldFallbackToImage: false
      });
      OCRService.isValidOCRResult.mockReturnValue(true);

      const result = await ImageProcessing.performOCR('data:image/png;base64,test');

      expect(result.text).toBe('Hello World');
      expect(result.confidence).toBe(85);
      expect(result.hasValidText).toBe(true);
      expect(result.shouldFallbackToImage).toBe(false);
      expect(result.duration).toBe(100);
    });

    test('marks hasValidText false when shouldFallbackToImage is true', async () => {
      OCRService.extractText.mockResolvedValue({
        text: 'blurry low-confidence text',
        confidence: 25,
        duration: 50,
        shouldFallbackToImage: true
      });
      OCRService.isValidOCRResult.mockReturnValue(false);

      const result = await ImageProcessing.performOCR('data:image/png;base64,test');

      expect(result.hasValidText).toBe(false);
      expect(result.shouldFallbackToImage).toBe(true);
    });

    test('returns error-shaped object when extractText throws', async () => {
      OCRService.extractText.mockRejectedValue(new Error('OCR engine crashed'));

      const result = await ImageProcessing.performOCR('data:image/png;base64,test');

      expect(result.text).toBe('');
      expect(result.confidence).toBe(0);
      expect(result.hasValidText).toBe(false);
      expect(result.shouldFallbackToImage).toBe(true);
      expect(result.error).toBe('OCR engine crashed');
    });
  });

  describe('captureAndProcess', () => {
    let cropSpy;
    let compressSpy;
    let ocrSpy;

    beforeEach(() => {
      cropSpy = jest.spyOn(ImageProcessing, 'cropImage')
        .mockResolvedValue('data:image/png;base64,cropped');
      compressSpy = jest.spyOn(ImageProcessing, 'compressImage')
        .mockResolvedValue('data:image/jpeg;base64,compressed');
      ocrSpy = jest.spyOn(ImageProcessing, 'performOCR')
        .mockResolvedValue({
          text: 'test question',
          confidence: 80,
          hasValidText: true,
          shouldFallbackToImage: false,
          duration: 100
        });
    });

    test('returns compressed image and OCR data by default (enableOCR: true)', async () => {
      const result = await ImageProcessing.captureAndProcess(
        'data:image/png;base64,screenshot',
        { startX: 10, startY: 20, width: 100, height: 50 }
      );

      expect(result.success).toBe(true);
      expect(result.compressedImageData).toBe('data:image/jpeg;base64,compressed');
      expect(result.ocrData).toBeDefined();
      expect(result.ocrData.text).toBe('test question');
    });

    test('maps coordinates correctly to cropImage {x, y, width, height}', async () => {
      await ImageProcessing.captureAndProcess(
        'data:image/png;base64,screenshot',
        { startX: 50, startY: 100, width: 200, height: 150 }
      );

      expect(cropSpy).toHaveBeenCalledWith(
        'data:image/png;base64,screenshot',
        { x: 50, y: 100, width: 200, height: 150 }
      );
    });

    test('skips OCR and returns no ocrData when enableOCR is false', async () => {
      const result = await ImageProcessing.captureAndProcess(
        'data:image/png;base64,screenshot',
        { startX: 0, startY: 0, width: 100, height: 100 },
        { enableOCR: false }
      );

      expect(result.success).toBe(true);
      expect(result.ocrData).toBeUndefined();
      expect(ocrSpy).not.toHaveBeenCalled();
    });

    test('returns hasError object when cropImage rejects', async () => {
      cropSpy.mockRejectedValue(new Error('Canvas tainted by cross-origin data'));

      const result = await ImageProcessing.captureAndProcess(
        'data:image/png;base64,screenshot',
        { startX: 0, startY: 0, width: 100, height: 100 }
      );

      expect(result.hasError).toBe(true);
      expect(result.error).toContain('Canvas tainted');
    });
  });

  describe('module exports', () => {
    test('should export ImageProcessing object', () => {
      expect(ImageProcessing).toBeDefined();
      expect(typeof ImageProcessing.calculateOptimalSize).toBe('function');
    });

    test('should have compressImage method', () => {
      expect(typeof ImageProcessing.compressImage).toBe('function');
    });

    test('should have cropImage method', () => {
      expect(typeof ImageProcessing.cropImage).toBe('function');
    });

    test('should have captureAndProcess method', () => {
      expect(typeof ImageProcessing.captureAndProcess).toBe('function');
    });

    test('should have resizeImage method', () => {
      expect(typeof ImageProcessing.resizeImage).toBe('function');
    });
  });
});
