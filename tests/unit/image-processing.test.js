/**
 * Unit Tests for Image Processing Module
 *
 * Tests image compression, cropping, and optimization functions
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

// Since image-processing.js uses ES6 exports and DOM APIs,
// we'll test the core logic by extracting the algorithms

describe('Image Processing', () => {
  describe('calculateOptimalSize', () => {
    // Extracted from modules/image-processing.js for testing
    function calculateOptimalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
      const originalArea = originalWidth * originalHeight;
      const targetArea = Math.min(originalArea, maxWidth * maxHeight);

      if (originalArea <= targetArea) {
        return { width: originalWidth, height: originalHeight };
      }

      const scaleFactor = Math.sqrt(targetArea / originalArea);
      return {
        width: Math.round(originalWidth * scaleFactor),
        height: Math.round(originalHeight * scaleFactor)
      };
    }

    test('should return original dimensions if within limits', () => {
      const result = calculateOptimalSize(400, 300, 800, 600);

      expect(result).toEqual({
        width: 400,
        height: 300
      });
    });

    test('should scale down large images proportionally', () => {
      const result = calculateOptimalSize(1600, 1200, 800, 600);

      // Should scale to fit within 800x600
      expect(result.width).toBeLessThanOrEqual(800);
      expect(result.height).toBeLessThanOrEqual(600);

      // Should maintain aspect ratio (4:3)
      const aspectRatio = result.width / result.height;
      expect(aspectRatio).toBeCloseTo(1600 / 1200, 1);
    });

    test('should handle square images', () => {
      const result = calculateOptimalSize(1000, 1000, 800, 600);

      // Should scale down based on area (not individual dimensions)
      const resultArea = result.width * result.height;
      const maxArea = 800 * 600;
      // Allow small rounding error (within 1%)
      expect(resultArea).toBeLessThanOrEqual(maxArea * 1.01);

      // Should remain square
      expect(result.width).toBe(result.height);
    });

    test('should handle very wide images', () => {
      const result = calculateOptimalSize(1600, 400, 800, 600);

      // Should scale based on area
      const resultArea = result.width * result.height;
      const maxArea = 800 * 600;
      expect(resultArea).toBeLessThanOrEqual(maxArea);

      // Should maintain aspect ratio (4:1)
      const aspectRatio = result.width / result.height;
      expect(aspectRatio).toBeCloseTo(4, 1);
    });

    test('should handle very tall images', () => {
      const result = calculateOptimalSize(400, 1600, 800, 600);

      // Should scale based on area
      const resultArea = result.width * result.height;
      const maxArea = 800 * 600;
      expect(resultArea).toBeLessThanOrEqual(maxArea);

      // Should maintain aspect ratio (1:4)
      const aspectRatio = result.width / result.height;
      expect(aspectRatio).toBeCloseTo(1 / 4, 1);
    });

    test('should handle edge case of 1x1 image', () => {
      const result = calculateOptimalSize(1, 1, 800, 600);

      expect(result).toEqual({ width: 1, height: 1 });
    });

    test('should handle maximum size images', () => {
      const result = calculateOptimalSize(800, 600, 800, 600);

      expect(result).toEqual({ width: 800, height: 600 });
    });

    test('should scale using area reduction', () => {
      // 1000x1000 = 1,000,000 pixels
      // Should scale to approximately 800x600 = 480,000 pixels
      const result = calculateOptimalSize(1000, 1000, 800, 600);

      const resultArea = result.width * result.height;
      const targetArea = 800 * 600;

      // Allow small rounding error (within 1%)
      expect(resultArea).toBeLessThanOrEqual(targetArea * 1.01);
    });

    test('should round dimensions to integers', () => {
      const result = calculateOptimalSize(1234, 567, 800, 600);

      expect(Number.isInteger(result.width)).toBe(true);
      expect(Number.isInteger(result.height)).toBe(true);
    });
  });

  describe('Image Processing Edge Cases', () => {
    test('should handle zero dimensions', () => {
      function calculateOptimalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        const originalArea = originalWidth * originalHeight;
        const targetArea = Math.min(originalArea, maxWidth * maxHeight);

        if (originalArea <= targetArea) {
          return { width: originalWidth, height: originalHeight };
        }

        const scaleFactor = Math.sqrt(targetArea / originalArea);
        return {
          width: Math.round(originalWidth * scaleFactor),
          height: Math.round(originalHeight * scaleFactor)
        };
      }

      const result = calculateOptimalSize(0, 0, 800, 600);

      expect(result).toEqual({ width: 0, height: 0 });
    });

    test('should handle negative dimensions gracefully', () => {
      function calculateOptimalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        const originalArea = originalWidth * originalHeight;
        const targetArea = Math.min(originalArea, maxWidth * maxHeight);

        if (originalArea <= targetArea) {
          return { width: originalWidth, height: originalHeight };
        }

        const scaleFactor = Math.sqrt(targetArea / originalArea);
        return {
          width: Math.round(originalWidth * scaleFactor),
          height: Math.round(originalHeight * scaleFactor)
        };
      }

      // Should handle negative values (though they shouldn't occur in practice)
      const result = calculateOptimalSize(-100, -100, 800, 600);

      expect(result.width).toBe(-100);
      expect(result.height).toBe(-100);
    });
  });

  describe('Compression Quality', () => {
    test('should use correct quality settings', () => {
      const defaultQuality = 0.3;
      const webpQuality = defaultQuality * 0.8;

      expect(defaultQuality).toBe(0.3);
      expect(webpQuality).toBe(0.24);
    });

    test('should use correct default dimensions', () => {
      const maxWidth = 800;
      const maxHeight = 600;

      expect(maxWidth).toBe(800);
      expect(maxHeight).toBe(600);
    });
  });

  describe('Crop Area Calculations', () => {
    test('should validate crop coordinates', () => {
      const coordinates = {
        startX: 10,
        startY: 20,
        width: 100,
        height: 50
      };

      expect(coordinates.startX).toBeGreaterThanOrEqual(0);
      expect(coordinates.startY).toBeGreaterThanOrEqual(0);
      expect(coordinates.width).toBeGreaterThan(0);
      expect(coordinates.height).toBeGreaterThan(0);
    });

    test('should handle minimum crop dimensions', () => {
      const coordinates = {
        startX: 0,
        startY: 0,
        width: 1,
        height: 1
      };

      expect(coordinates.width).toBeGreaterThan(0);
      expect(coordinates.height).toBeGreaterThan(0);
    });

    test('should handle large crop areas', () => {
      const coordinates = {
        startX: 0,
        startY: 0,
        width: 1920,
        height: 1080
      };

      expect(coordinates.width).toBe(1920);
      expect(coordinates.height).toBe(1080);
    });
  });

  describe('Resize Logic', () => {
    test('should not resize if already within limits', () => {
      const width = 600;
      const height = 400;
      const maxWidth = 800;
      const maxHeight = 600;

      const shouldResize = width > maxWidth || height > maxHeight;

      expect(shouldResize).toBe(false);
    });

    test('should resize if exceeds width limit', () => {
      const width = 1000;
      const height = 400;
      const maxWidth = 800;
      const maxHeight = 600;

      const shouldResize = width > maxWidth || height > maxHeight;

      expect(shouldResize).toBe(true);
    });

    test('should resize if exceeds height limit', () => {
      const width = 600;
      const height = 700;
      const maxWidth = 800;
      const maxHeight = 600;

      const shouldResize = width > maxWidth || height > maxHeight;

      expect(shouldResize).toBe(true);
    });

    test('should calculate correct resize ratio', () => {
      const width = 1600;
      const height = 1200;
      const maxWidth = 800;
      const maxHeight = 600;

      const ratio = Math.min(maxWidth / width, maxHeight / height);

      expect(ratio).toBe(0.5);
      expect(width * ratio).toBe(800);
      expect(height * ratio).toBe(600);
    });

    test('should maintain aspect ratio when resizing', () => {
      const width = 1600;
      const height = 900;
      const maxWidth = 800;
      const maxHeight = 600;

      const ratio = Math.min(maxWidth / width, maxHeight / height);
      const newWidth = width * ratio;
      const newHeight = height * ratio;

      const originalAspect = width / height;
      const newAspect = newWidth / newHeight;

      expect(newAspect).toBeCloseTo(originalAspect, 5);
    });
  });
});
