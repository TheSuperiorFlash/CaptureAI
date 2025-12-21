/**
 * OCR Service Module
 * Provides text extraction from images using Tesseract.js
 */

class OCRService {
    constructor() {
        this.worker = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.Tesseract = null;
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

                console.log('Tesseract.js found, creating worker...');

                // Create worker with language parameter (workers come pre-loaded in newer versions)
                // Using modern API: createWorker(lang, oem, options)
                this.worker = await Tesseract.createWorker('eng');

                this.isInitialized = true;
                console.log('OCR Service initialized successfully');
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
     * Extract text from an image
     * @param {string} imageDataUrl - Base64 encoded image data URL
     * @param {Object} options - OCR options
     * @param {boolean} options.preprocessImage - Whether to preprocess the image for better OCR
     * @returns {Promise<{text: string, confidence: number, words: Array}>}
     */
    async extractText(imageDataUrl, options = {}) {
        try {
            // Initialize worker if not already done
            if (!this.isInitialized) {
                await this.initialize();
            }

            const startTime = performance.now();

            // Perform OCR
            const result = await this.worker.recognize(imageDataUrl);

            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            console.log(`OCR completed in ${duration}ms`);
            console.log(`Extracted text (${result.data.text.length} chars):`, result.data.text.substring(0, 100));
            console.log(`Confidence: ${result.data.confidence}%`);

            return {
                text: result.data.text.trim(),
                confidence: result.data.confidence,
                words: result.data.words || [],
                lines: result.data.lines || [],
                duration: duration
            };
        } catch (error) {
            console.error('OCR text extraction failed:', error);

            // Return empty result on error rather than throwing
            return {
                text: '',
                confidence: 0,
                words: [],
                lines: [],
                error: error.message
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
                console.log('OCR Service terminated');
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

        // Check confidence threshold (consider valid if above 30%)
        const hasConfidence = ocrResult.confidence >= 30;

        return hasText && hasConfidence;
    }

    /**
     * Preprocess image for better OCR results
     * @param {string} imageDataUrl - Base64 encoded image
     * @returns {Promise<string>} - Preprocessed image data URL
     */
    async preprocessImage(imageDataUrl) {
        return new Promise((resolve, reject) => {
            try {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw original image
                    ctx.drawImage(img, 0, 0);

                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // Apply grayscale and contrast enhancement
                    for (let i = 0; i < data.length; i += 4) {
                        // Convert to grayscale
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

                        // Enhance contrast (simple thresholding)
                        const enhanced = avg > 128 ? 255 : 0;

                        data[i] = enhanced;     // R
                        data[i + 1] = enhanced; // G
                        data[i + 2] = enhanced; // B
                    }

                    // Put processed image back
                    ctx.putImageData(imageData, 0, 0);

                    // Return processed image as data URL
                    resolve(canvas.toDataURL('image/png'));
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
