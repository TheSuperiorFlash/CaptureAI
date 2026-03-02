/**
 * OCR Service Module
 * Provides text extraction from images using Tesseract.js
 */

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
     * Initialize Tesseract worker
     * @returns {Promise<void>}
     */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        // Check if Tesseract is available globally (loaded via manifest)
        if (typeof Tesseract === 'undefined') {
          throw new Error('Tesseract.js not available. Check manifest content_scripts configuration.');
        }

        if (typeof window !== 'undefined' && window.CaptureAI?.CONFIG?.DEBUG) {
          console.log('Tesseract.js found, creating worker...');
        }

        // Create worker with language parameter (workers come pre-loaded in newer versions)
        // Using modern API: createWorker(lang, oem, options)
        this.worker = await Tesseract.createWorker('eng');

        // Optimize Tesseract parameters for better accuracy and token reduction
        await this.worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Auto page segmentation
          preserve_interword_spaces: '0', // Reduce excessive spacing
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!()+-=×÷/:;\'"%@#$^&*{}[]<>_|\\~ \n'
        });

        this.isInitialized = true;
        if (typeof window !== 'undefined' && window.CaptureAI?.CONFIG?.DEBUG) {
          console.log('OCR Service initialized successfully with optimized parameters');
        }
      } catch (error) {
        console.error('Failed to initialize OCR Service:', error);
        this.isInitialized = false;
        this.initializationPromise = null;
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  /**
     * Clean and optimize OCR text to reduce token usage
     * @param {string} text - Raw OCR text
     * @returns {string} - Cleaned text
     */
  cleanOCRText(text) {
    if (!text) {
      return '';
    }

    let cleaned = text;

    // Remove excessive whitespace and newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' '); // Multiple spaces to single space
    cleaned = cleaned.replace(/\r/g, ''); // Remove carriage returns

    // Remove common OCR artifacts
    cleaned = cleaned.replace(/[|]{2,}/g, ''); // Multiple pipes
    // Note: Underscores are preserved as they're used for blank spaces in answers
    cleaned = cleaned.replace(/[~]{2,}/g, ''); // Multiple tildes
    cleaned = cleaned.replace(/[`]{2,}/g, ''); // Multiple backticks

    // Remove standalone special characters (common OCR noise)
    // Note: Underscores excluded from this pattern as they're used for blank spaces
    cleaned = cleaned.replace(/^\s*[|~`]\s*$/gm, ''); // Lines with only special chars (excluding underscores)

    // Normalize line breaks
    cleaned = cleaned.replace(/\n\s*\n/g, '\n'); // Remove empty lines

    // Trim each line
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

    // Final trim
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
     * Remove site-specific OCR noise
     * @param {string} text - Cleaned OCR text
     * @param {string} hostname - Page hostname
     * @returns {string}
     */
  cleanSiteSpecificText(text, hostname) {
    if (!text || !hostname) {
      return text || '';
    }
    if (hostname === 'vocabulary.com' || hostname.endsWith('.vocabulary.com')) {
      text = text.replace(/^(QO|Q|\(@\))[ \t]*/gm, '');
      text = text.replace(/\n{2,}/g, '\n').trim();
    }
    return text;
  }

  /**
     * Extract text from an image
     * @param {string} imageDataUrl - Base64 encoded image data URL
     * @param {Object} options - OCR options
     * @param {boolean} options.preprocessImage - Whether to preprocess the image for better OCR
     * @param {number} options.confidenceThreshold - Minimum confidence to accept OCR (default: 60)
     * @param {string} options.hostname - Page hostname for site-specific cleanup
     * @returns {Promise<{text: string, confidence: number, words: Array, shouldFallbackToImage: boolean}>}
     */
  async extractText(imageDataUrl, options = {}) {
    try {
      // Initialize worker if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      const confidenceThreshold = options.confidenceThreshold || 60;
      const startTime = performance.now();

      const isDebug = typeof window !== 'undefined' && window.CaptureAI?.CONFIG?.DEBUG;

      // Apply preprocessing if requested
      const sourceImage = options.preprocessImage
        ? await this.preprocessImage(imageDataUrl)
        : imageDataUrl;

      // Log preprocessed image URL for visual inspection in browser
      if (isDebug && options.preprocessImage) {
        console.log('CaptureAI OCR - Preprocessed image (paste URL in browser to view):');
        console.log(sourceImage);
      }

      // Perform OCR
      const result = await this.worker.recognize(sourceImage);

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Clean the extracted text
      const rawText = result.data.text || '';
      const hostname = options.hostname || '';
      const cleanedText = this.cleanSiteSpecificText(this.cleanOCRText(rawText), hostname);

      if (isDebug) {
        console.log(`OCR completed in ${duration}ms`);
        console.log(`Confidence: ${result.data.confidence}%`);
        console.log(`Raw text (${rawText.length} chars):`, rawText);
        console.log(`Cleaned text (${cleanedText.length} chars):`, cleanedText);
      }

      // Determine if we should fall back to image
      const shouldFallbackToImage = result.data.confidence < confidenceThreshold || cleanedText.length === 0;

      if (isDebug && shouldFallbackToImage) {
        console.log(`OCR confidence too low (${result.data.confidence}% < ${confidenceThreshold}%) or no text extracted - will use image instead`);
      }

      return {
        text: cleanedText,
        confidence: result.data.confidence,
        words: result.data.words || [],
        lines: result.data.lines || [],
        duration: duration,
        shouldFallbackToImage: shouldFallbackToImage
      };
    } catch (error) {
      console.error('OCR text extraction failed:', error);

      // Return empty result on error with fallback flag
      return {
        text: '',
        confidence: 0,
        words: [],
        lines: [],
        error: error.message,
        shouldFallbackToImage: true // Always fall back on error
      };
    }
  }

  /**
     * Clean up resources
     * @returns {Promise<void>}
     */
  async terminate() {
    try {
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        if (typeof window !== 'undefined' && window.CaptureAI?.CONFIG?.DEBUG) {
          console.log('OCR Service terminated');
        }
      }
    } catch (error) {
      console.error('Error terminating OCR Service:', error);
    }
  }

  /**
     * Check if the extracted text is likely valid
     * @param {Object} ocrResult - Result from extractText
     * @returns {boolean}
     */
  isValidOCRResult(ocrResult) {
    if (!ocrResult || !ocrResult.text) {
      return false;
    }

    // Check if text is not empty after trimming
    const hasText = ocrResult.text.trim().length > 0;

    // Check confidence threshold (matches default in extractText)
    const hasConfidence = ocrResult.confidence >= 60;

    return hasText && hasConfidence;
  }

  /**
     * Preprocess image for better OCR results
     * @param {string} imageDataUrl - Base64 encoded image
     * @returns {Promise<string>} - Preprocessed image data URL
     */
  async preprocessImage(imageDataUrl) {
    // Max dimension to guard against extremely large images causing memory errors
    const MAX_DIMENSION = 4000;

    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            // Guard against extremely large images (after 3x upscale)
            const scale = 3;
            if (img.width * scale > MAX_DIMENSION || img.height * scale > MAX_DIMENSION) {
              reject(new Error('Image dimensions too large for preprocessing'));
              return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Failed to get 2D canvas context for preprocessing'));
              return;
            }

            // 3x upscale so 1-2px thin lines (underlines) become 3-6px,
            // thick enough for Tesseract to recognize as characters.
            // Nearest-neighbor keeps edges sharp instead of blurring them.
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            let imageData;
            try {
              // getImageData can throw on tainted (cross-origin) canvases
              imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            } catch (securityError) {
              reject(new Error(`Cannot read image pixel data: ${securityError.message}`));
              return;
            }

            const data = imageData.data;
            const w = canvas.width;
            const h = canvas.height;

            // Step 1: Convert to grayscale with contrast stretch
            const gray = new Uint8Array(w * h);
            const factor = 1.5;
            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              const stretched = ((avg / 255 - 0.5) * factor + 0.5) * 255;
              gray[i >> 2] = stretched < 0 ? 0 : stretched > 255 ? 255 : Math.round(stretched);
            }

            // Step 2: Local smooth grow — 3x3 box blur that spreads dark
            // pixels into their neighbors, softly thickening thin strokes
            // (underlines) without the harsh artifacts of min-dilation.
            const smoothed = new Uint8Array(w * h);
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                let sum = 0;
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                  const ny = y + dy;
                  if (ny < 0 || ny >= h) {
                    continue;
                  }
                  for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    if (nx < 0 || nx >= w) {
                      continue;
                    }
                    sum += gray[ny * w + nx];
                    count++;
                  }
                }
                const avg = sum / count;
                // Bias toward darker value: blend 60% smoothed + 40% min
                // so thin dark lines grow outward while text stays readable
                const orig = gray[y * w + x];
                const dark = orig < avg ? orig : avg;
                smoothed[y * w + x] = Math.round(avg * 0.6 + dark * 0.4);
              }
            }

            // Write smoothed grayscale back to RGBA
            for (let i = 0; i < smoothed.length; i++) {
              const idx = i << 2;
              data[idx] = smoothed[i];
              data[idx + 1] = smoothed[i];
              data[idx + 2] = smoothed[i];
            }

            // Put processed image back
            ctx.putImageData(imageData, 0, 0);

            // Return processed image as data URL
            resolve(canvas.toDataURL('image/png'));
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image for preprocessing'));
        img.src = imageDataUrl;
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Create singleton instance
const ocrService = new OCRService();

export { ocrService as OCRService };
