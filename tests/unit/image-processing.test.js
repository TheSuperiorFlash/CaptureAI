/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for Image Processing Module
 *
 * Tests the actual ImageProcessing module from extension/modules/image-processing.js
 * focusing on calculateOptimalSize (pure math, no DOM needed)
 */

import { describe, test, expect, jest } from '@jest/globals';

// Mock OCR service dependency (image-processing.js imports it statically)
jest.mock('../../modules/ocr-service.js', () => ({
  OCRService: {
    extractText: jest.fn(),
    isValidOCRResult: jest.fn()
  }
}));

import { ImageProcessing } from '../../modules/image-processing.js';

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
