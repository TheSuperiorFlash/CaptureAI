/**
 * Independent stealthy result module
 * Shows AI responses in bottom-right corner when floating UI is hidden
 */

export const UIStealthyResult = {
    element: null,
    fadeoutTimer: null,
    initialized: false,

    /**
     * Initialize stealthy result element immediately
     */
    init() {
        if (this.initialized) return;

        // Add Roboto font if not already added
        if (!document.querySelector('link[href*="Roboto"]')) {
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);
        }

        // Create stealthy result element
        this.element = document.createElement('div');
        this.element.id = window.CaptureAI?.CONFIG?.STEALTHY_RESULT_ID || 'captureai-stealthy-result';
        this.element.style.cssText = `
            position: fixed;
            bottom: 25px;
            right: 100px;
            max-width: 300px;
            padding: 12px;
            font-size: 14px;
            color: rgba(125, 125, 125, 0.4) !important;
            z-index: 9998;
            display: none;
            text-align: right;
            pointer-events: none;
            transition: opacity 0.5s ease;
            font-family: 'Inter', sans-serif;
        `;

        document.body.appendChild(this.element);
        this.initialized = true;

        // Cache element reference in global state if available
        if (window.CaptureAI?.STATE) {
            window.CaptureAI.STATE.uiElements.stealthyResult = this.element;
        }
        if (window.CaptureAI?.DOM_CACHE) {
            window.CaptureAI.DOM_CACHE.stealthyResult = this.element;
        }
    },

    /**
     * Show message in stealthy result
     * @param {string} message - Message to display
     * @param {boolean} isError - Whether message is an error
     */
    show(message, isError = false) {
        if (!this.element) {
            this.init(); // Initialize if not already done
        }

        // Clear existing timer
        if (this.fadeoutTimer) {
            clearTimeout(this.fadeoutTimer);
            this.fadeoutTimer = null;
        }

        // Update global state timer reference
        if (window.CaptureAI?.STATE) {
            if (window.CaptureAI.STATE.answerFadeoutTimer) {
                clearTimeout(window.CaptureAI.STATE.answerFadeoutTimer);
            }
            window.CaptureAI.STATE.answerFadeoutTimer = null;
        }

        // Set content and style
        this.element.textContent = message;
        this.element.style.color = isError ? 
            'rgba(255, 100, 100, 0.4) !important' : 
            'rgba(150, 150, 150, 0.4) !important';

        // Show with animation
        this.element.style.display = 'block';
        this.element.style.opacity = '1';

        // Auto-hide after delay
        this.fadeoutTimer = setTimeout(() => {
            this.element.style.opacity = '0';
            setTimeout(() => {
                if (this.element) {
                    this.element.style.display = 'none';
                }
            }, 500);
        }, 2500); // 2.5 second display time

        // Update global state timer reference
        if (window.CaptureAI?.STATE) {
            window.CaptureAI.STATE.answerFadeoutTimer = this.fadeoutTimer;
        }
    },

    /**
     * Hide stealthy result immediately
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            this.element.style.opacity = '0';
        }

        if (this.fadeoutTimer) {
            clearTimeout(this.fadeoutTimer);
            this.fadeoutTimer = null;
        }

        // Clear global state timer reference
        if (window.CaptureAI?.STATE) {
            if (window.CaptureAI.STATE.answerFadeoutTimer) {
                clearTimeout(window.CaptureAI.STATE.answerFadeoutTimer);
                window.CaptureAI.STATE.answerFadeoutTimer = null;
            }
        }
    },

    /**
     * Check if stealthy result should be shown (when panel is not visible)
     * @returns {boolean}
     */
    shouldShow() {
        return window.CaptureAI?.STATE ? !window.CaptureAI.STATE.isPanelVisible : true;
    },

    /**
     * Get the stealthy result element
     * @returns {HTMLElement|null}
     */
    getElement() {
        return this.element;
    }
};