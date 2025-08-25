/**
 * Image processing utilities
 */

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
                    
                    // Try multiple compression strategies and pick the smallest
                    const compressionPromises = [
                        // Strategy 1: WebP with lower quality
                        this.tryCompression(canvas, 'image/webp', quality * 0.8),
                        // Strategy 2: JPEG with medium quality
                        this.tryCompression(canvas, 'image/jpeg', quality),
                        // Strategy 3: WebP with very low quality
                        this.tryCompression(canvas, 'image/webp', 0.2)
                    ];
                    
                    Promise.all(compressionPromises).then(results => {
                        // Pick the smallest result that's still readable
                        const smallest = results.reduce((prev, curr) => 
                            curr && curr.length < prev.length ? curr : prev
                        );
                        resolve(smallest);
                    }).catch(() => {
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
                } catch (error) {
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
         * Process captured image: crop, compress, and optimize for token reduction
         * @param {string} imageUri - Full screenshot image URI
         * @param {Object} coordinates - Crop coordinates
         * @returns {Promise<Object>}
         */
        async captureAndProcess(imageUri, coordinates) {
            
            try {
                const croppedImage = await this.cropImage(imageUri, {
                    x: coordinates.startX,
                    y: coordinates.startY,
                    width: coordinates.width,
                    height: coordinates.height
                });

                // Use consistent compression settings for all modes
                const compressionOptions = {
                    maxWidth: 800,
                    maxHeight: 600
                };
                
                const compressedImageData = await this.compressImage(croppedImage, 0.3, compressionOptions);
                
                return { 
                    success: true, 
                    compressedImageData: compressedImageData 
                };
            } catch (error) {
                return { 
                    hasError: true, 
                    error: 'Failed to process the captured image: ' + error.message 
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
        resizeImage(imageDataUrl, maxWidth = 800, maxHeight = 600) {
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