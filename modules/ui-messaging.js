/**
 * UI Messaging coordination module
 * Coordinates message display between floating panel and stealthy result
 */

export const UIMessaging = {
    initialized: false,

    /**
     * Initialize messaging system
     */
    init() {
        if (this.initialized) return;

        // Initialize stealthy result
        if (window.CaptureAI?.UIStealthyResult) {
            window.CaptureAI.UIStealthyResult.init();
        }

        this.initialized = true;
    },

    /**
     * Show message in appropriate UI component
     * @param {string} message - Message to display
     * @param {boolean|string} isError - Whether message is an error (boolean or 'error'/'success'/'info')
     * @param {number} autoHideDelay - Auto-hide delay in milliseconds
     */
    showMessage(message, isError = false, autoHideDelay = 0) {
        const { STATE } = window.CaptureAI || {};
        
        // Normalize isError parameter
        const isErrorFlag = isError === true || isError === 'error';

        // Show in floating panel if visible and panel exists
        if (STATE?.isPanelVisible) {
            this.showInFloatingPanel(message, isErrorFlag);
        }

        // Always handle stealthy result (this will show/hide based on panel visibility)
        this.handleStealthyResult(message, isErrorFlag);

        // Send to popup (always available)
        this.sendToPopup(message, isErrorFlag);

        // Handle auto-hide for floating panel
        if (autoHideDelay > 0 && STATE?.isPanelVisible) {
            this.scheduleAutoHide(message, autoHideDelay);
        }
    },

    /**
     * Show message in floating panel result element
     * @param {string} message - Message to display
     * @param {boolean} isError - Whether message is an error
     */
    showInFloatingPanel(message, isError) {
        const { CONFIG } = window.CaptureAI || {};
        const resultElement = document.getElementById(CONFIG?.RESULT_ID || 'captureai-result');

        if (resultElement) {
            const theme = window.CaptureAI?.UITheme?.getCurrentTheme();
            
            resultElement.textContent = message;
            resultElement.style.backgroundColor = 'transparent';
            resultElement.style.background = 'transparent';
            
            if (theme) {
                resultElement.style.color = isError ? theme.errorText : theme.primaryText;
            } else {
                resultElement.style.color = isError ? '#ff6b6b' : '#333333';
            }
        }
    },

    /**
     * Handle stealthy result display logic
     * @param {string} message - Message to display
     * @param {boolean} isError - Whether message is an error
     */
    handleStealthyResult(message, isError) {
        const { STATE } = window.CaptureAI || {};
        
        if (window.CaptureAI?.UIStealthyResult) {
            // Show stealthy result when panel is not visible
            if (!STATE?.isPanelVisible) {
                window.CaptureAI.UIStealthyResult.show(message, isError);
            } else {
                // Hide stealthy result when panel is visible
                window.CaptureAI.UIStealthyResult.hide();
            }
        }
    },

    /**
     * Send message to popup
     * @param {string} message - Message to display
     * @param {boolean} isError - Whether message is an error
     */
    sendToPopup(message, isError) {
        try {
            chrome.runtime.sendMessage({
                action: 'updateResponse',
                message: message,
                isError: isError
            });
        } catch (error) {
            // Popup might not be open, ignore error
        }
    },

    /**
     * Schedule auto-hide for floating panel message
     * @param {string} message - Original message (for clearing check)
     * @param {number} delay - Delay in milliseconds
     */
    scheduleAutoHide(message, delay) {
        const { CONFIG } = window.CaptureAI || {};
        
        setTimeout(() => {
            const resultElement = document.getElementById(CONFIG?.RESULT_ID || 'captureai-result');
            if (resultElement && resultElement.textContent === message) {
                resultElement.textContent = '';
            }
        }, delay);
    },

    /**
     * Display AI response (called from messaging.js)
     * @param {string} response - AI response text
     * @param {boolean} isError - Whether response is an error
     */
    displayAIResponse(response, isError = false) {
        // Simply show the message - it will respect panel visibility and show in appropriate UI
        this.showMessage(response, isError);
    },

    /**
     * Handle ask question processing
     * @param {string} question - Question text
     * @param {string|null} imageData - Optional base64 image data
     */
    handleAskQuestion(question, imageData = null) {
        this.showMessage('Asking AI...');

        // Send question to background script for processing
        const message = {
            action: 'askQuestion',
            question: question
        };
        
        // Add image data if provided
        if (imageData) {
            message.imageData = imageData;
        }
        
        chrome.runtime.sendMessage(message);
    }
};