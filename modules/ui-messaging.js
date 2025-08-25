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
        const { STATE, CONFIG } = window.CaptureAI || {};
        
        // Normalize isError parameter
        const isErrorFlag = isError === true || isError === 'error';

        // Early return condition from original logic
        if (!STATE?.isPanelVisible && !STATE?.isShowingAnswer) {
            return;
        }

        // Show in floating panel if visible and panel exists
        if (STATE?.isPanelVisible) {
            this.showInFloatingPanel(message, isErrorFlag);
        }

        // Always handle stealthy result
        this.handleStealthyResult(message, isErrorFlag);

        // Send to popup
        this.sendToPopup(message, isErrorFlag);

        // Handle auto-hide for floating panel
        if (autoHideDelay > 0) {
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
        const { STATE } = window.CaptureAI || {};

        // Set showing answer state temporarily to allow message display
        if (STATE) {
            STATE.isShowingAnswer = true;
        }

        // Show the message (which will handle both panel and stealthy result)
        this.showMessage(response, isError);

        // Reset showing answer state
        if (STATE) {
            STATE.isShowingAnswer = false;
        }
    },

    /**
     * Handle ask question processing
     * @param {string} question - Question text
     */
    handleAskQuestion(question) {
        this.showMessage('Asking GPT-5...');

        // Send question to background script for processing
        chrome.runtime.sendMessage({
            action: 'askQuestion',
            question: question
        });
    }
};