/**
 * Image processing utilities
 */

export const ImageProcessing = {
        /**
         * Compress image to WebP format with performance optimization
         * @param {string} imageDataUrl - Original image data URL
         * @param {number} quality - Compression quality (0-1)
         * @returns {Promise<string>}
         */
        compressImage(imageDataUrl, quality = 0.6) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    ctx.drawImage(img, 0, 0);
                    
                    try {
                        const compressedDataUrl = canvas.toDataURL('image/webp', quality);
                        resolve(compressedDataUrl);
                    } catch (error) {
                        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(jpegDataUrl);
                    }
                };
                img.onerror = (error) => {
                    reject(error);
                };
                img.src = imageDataUrl;
            });
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
         * Process captured image: crop, compress, and extract text
         * @param {string} imageUri - Full screenshot image URI
         * @param {Object} coordinates - Crop coordinates
         * @returns {Promise<Object>}
         */
        async captureAndProcess(imageUri, coordinates) {
            const { STATE } = window.CaptureAI;
            
            try {
                const croppedImage = await this.cropImage(imageUri, {
                    x: coordinates.startX,
                    y: coordinates.startY,
                    width: coordinates.width,
                    height: coordinates.height
                });

                const compressedImageData = await this.compressImage(croppedImage, 0.5);
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