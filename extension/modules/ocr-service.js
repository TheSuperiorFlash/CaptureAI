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

                // Optimize Tesseract parameters for better accuracy and token reduction
                await this.worker.setParameters({
                    tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Auto page segmentation
                    preserve_interword_spaces: '0', // Reduce excessive spacing
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!()+-=×÷/:;\'\"%@#$^&*{}[]<>_|\\~ \n',
                });

                this.isInitialized = true;
                console.log('OCR Service initialized successfully with optimized parameters');
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
        if (!text) return '';

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
     * Extract text from an image
     * @param {string} imageDataUrl - Base64 encoded image data URL
     * @param {Object} options - OCR options
     * @param {boolean} options.preprocessImage - Whether to preprocess the image for better OCR
     * @param {number} options.confidenceThreshold - Minimum confidence to accept OCR (default: 60)
     * @returns {Promise<{text: string, confidence: number, words: Array, shouldFallbackToImage: boolean}>}
     */
    async extractText(imageDataUrl, options = {}) {
        try {
            // Initialize worker if not already done
            if (!this.isInitialized) {
                await this.initialize();
            }

            const confidenceThreshold = options.confidenceThreshold || 40;
            const startTime = performance.now();

            // Perform OCR
            const result = await this.worker.recognize(imageDataUrl);

            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            // Clean the extracted text
            const rawText = result.data.text || '';
            const cleanedText = this.cleanOCRText(rawText);

            console.log(`OCR completed in ${duration}ms`);
            console.log(`Confidence: ${result.data.confidence}%`);
            console.log(`Raw text (${rawText.length} chars):`, rawText);
            console.log(`Cleaned text (${cleanedText.length} chars):`, cleanedText);

            // Determine if we should fall back to image
            const shouldFallbackToImage = result.data.confidence < confidenceThreshold || cleanedText.length === 0;

            if (shouldFallbackToImage) {
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

        // Check confidence threshold (matches default in extractText)
        const hasConfidence = ocrResult.confidence >= 40;

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
