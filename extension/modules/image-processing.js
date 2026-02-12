/**
 * Image processing utilities
 */

import { OCRService } from './ocr-service.js';

export const ImageProcessing = {
  /**
         * Compress image with advanced optimization for token reduction
         * @param {string} imageDataUrl - Original image data URL
         * @param {number} quality - Compression quality (0-1)
         * @param {Object} options - Compression options
         * @returns {Promise<string>}
         */
  compressImage(imageDataUrl, quality = 0.3, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Smart resize for token optimization
        const { width: newWidth, height: newHeight } = this.calculateOptimalSize(
          img.width,
          img.height,
          options.maxWidth || 800,
          options.maxHeight || 600
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Enhanced rendering for better compression
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Try WebP first (best compression), fallback to JPEG if unsupported
        this.tryCompression(canvas, 'image/webp', quality * 0.8)
          .then(webpResult => {
            if (webpResult) {
              resolve(webpResult);
            } else {
              // WebP not supported, use JPEG
              const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
              resolve(jpegDataUrl);
            }
          })
          .catch(() => {
            // Fallback to simple JPEG compression
            const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(jpegDataUrl);
          });
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = imageDataUrl;
    });
  },

  /**
         * Try compression with specific format and quality
         * @param {HTMLCanvasElement} canvas - Canvas element
         * @param {string} mimeType - MIME type for compression
         * @param {number} quality - Compression quality
         * @returns {Promise<string>}
         */
  tryCompression(canvas, mimeType, quality) {
    return new Promise((resolve) => {
      try {
        const result = canvas.toDataURL(mimeType, quality);
        resolve(result);
      } catch (_error) {
        resolve(null);
      }
    });
  },

  /**
         * Calculate optimal dimensions for token efficiency
         * @param {number} originalWidth - Original image width
         * @param {number} originalHeight - Original image height
         * @param {number} maxWidth - Maximum allowed width
         * @param {number} maxHeight - Maximum allowed height
         * @returns {Object} New dimensions
         */
  calculateOptimalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
    // Calculate area reduction for token optimization
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
  },

  /**
         * Crop image to specified coordinates
         * @param {string} imageDataUrl - Original image data URL
         * @param {Object} cropArea - Crop area {x, y, width, height}
         * @returns {Promise<string>}
         */
  cropImage(imageDataUrl, cropArea) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        ctx.drawImage(
          img,
          cropArea.x, cropArea.y, cropArea.width, cropArea.height,
          0, 0, cropArea.width, cropArea.height
        );

        const croppedDataUrl = canvas.toDataURL('image/png');
        resolve(croppedDataUrl);
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  },

  /**
         * Process captured image: crop, compress, OCR, and optimize for token reduction
         * Optimization #5: OCR and compression run in parallel on the cropped image
         * @param {string} imageUri - Full screenshot image URI
         * @param {Object} coordinates - Crop coordinates
         * @param {Object} options - Processing options
         * @param {boolean} options.enableOCR - Whether to perform OCR extraction (default: true)
         * @returns {Promise<Object>}
         */
  async captureAndProcess(imageUri, coordinates, options = {}) {
    const { enableOCR = true } = options;

    try {
      const croppedImage = await this.cropImage(imageUri, {
        x: coordinates.startX,
        y: coordinates.startY,
        width: coordinates.width,
        height: coordinates.height
      });

      // Use consistent compression settings for all modes (optimization #4: reduced from 800x600 to 640x480)
      const compressionOptions = {
        maxWidth: 640,
        maxHeight: 480
      };

      // Optimization #5: Run OCR and compression in parallel
      const [compressedImageData, ocrData] = await Promise.all([
        // Compression task
        this.compressImage(croppedImage, 0.3, compressionOptions),
        // OCR task (only if enabled)
        enableOCR
          ? this.performOCR(croppedImage)
          : Promise.resolve(null)
      ]);

      const result = {
        success: true,
        compressedImageData: compressedImageData
      };

      // Add OCR data if available
      if (ocrData) {
        result.ocrData = ocrData;
      }

      return result;
    } catch (error) {
      return {
        hasError: true,
        error: 'Failed to process the captured image: ' + error.message
      };
    }
  },

  /**
   * Perform OCR extraction on image (helper for parallel processing)
   * @param {string} imageDataUrl - Image data URL
   * @returns {Promise<Object>} OCR result data
   */
  async performOCR(imageDataUrl) {
    try {
      console.log('Starting OCR extraction...');
      const ocrResult = await OCRService.extractText(imageDataUrl, {
        confidenceThreshold: 60 // Require 60% confidence to use OCR
      });

      console.log(`OCR extraction completed: ${ocrResult.text.length} characters extracted (Confidence: ${ocrResult.confidence}%)`);
      if (ocrResult.shouldFallbackToImage) {
        console.log('OCR quality insufficient - will use image data instead');
      } else if (ocrResult.text.length > 0) {
        console.log('OCR Full Text:', ocrResult.text);
      }

      return {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        hasValidText: OCRService.isValidOCRResult(ocrResult) && !ocrResult.shouldFallbackToImage,
        shouldFallbackToImage: ocrResult.shouldFallbackToImage,
        duration: ocrResult.duration
      };
    } catch (ocrError) {
      console.warn('OCR extraction failed, continuing without OCR data:', ocrError);
      return {
        text: '',
        confidence: 0,
        hasValidText: false,
        shouldFallbackToImage: true,
        error: ocrError.message
      };
    }
  },

  /**
         * Resize image if too large (optimized for faster OCR)
         * @param {string} imageDataUrl - Image data URL
         * @param {number} maxWidth - Maximum width
         * @param {number} maxHeight - Maximum height
         * @returns {Promise<string>}
         */
  resizeImage(imageDataUrl, maxWidth = 640, maxHeight = 480) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxWidth && img.height <= maxHeight) {
          resolve(imageDataUrl);
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const resizedDataUrl = canvas.toDataURL('image/png');
        resolve(resizedDataUrl);
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  }
};

// For browser: attach to window.CaptureAI
if (typeof window !== 'undefined') {
  window.CaptureAI = window.CaptureAI || {};
  window.CaptureAI.ImageProcessing = ImageProcessing;
}
