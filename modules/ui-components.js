/**
 * UI Components orchestrator - lightweight coordinator for floating UI
 * Assembles all UI modules and provides unified interface
 */

export const UIComponents = {
    floatingUICreated: false,
    panel: null,

    /**
     * Create complete floating UI by assembling all modules
     * Only creates floating UI once, subsequent calls return existing panel
     * @returns {HTMLElement} Panel element
     */
    createUI() {
        if (this.floatingUICreated && this.panel) {
            return this.panel;
        }

        const { STATE, CONFIG, DOM_CACHE } = window.CaptureAI;
        
        try {
            // Initialize theme system
            window.CaptureAI.UITheme.init();
            
            // Create core panel structure
            this.panel = window.CaptureAI.UIPanelCore.create();
            
            // Attach mode toggle to header
            window.CaptureAI.UIModeToggle.attachTo(this.panel);
            
            // Attach buttons container
            window.CaptureAI.UIButtons.attachTo(this.panel);
            
            // Attach ask mode UI
            window.CaptureAI.UIAskMode.attachTo(this.panel);

            // Mark as created
            this.floatingUICreated = true;

            return this.panel;

        } catch (error) {
            console.error('Failed to create floating UI:', error);
            return null;
        }
    },

    /**
     * Ensure floating UI is created before calling UI-dependent functions
     * @returns {boolean} True if UI is ready
     */
    ensureUICreated() {
        if (!this.floatingUICreated) {
            this.createUI();
        }
        return this.floatingUICreated;
    },

    /**
     * Switch to Ask mode (creates UI if needed)
     */
    switchToAskMode() {
        this.ensureUICreated();
        if (window.CaptureAI.UIModeToggle) {
            window.CaptureAI.UIModeToggle.switchToAskMode();
        }
    },

    /**
     * Switch to Capture mode (creates UI if needed)
     */
    switchToCaptureMode() {
        this.ensureUICreated();
        if (window.CaptureAI.UIModeToggle) {
            window.CaptureAI.UIModeToggle.switchToCaptureMode();
        }
    },

    /**
     * Handle ask question (creates UI if needed)
     * @param {string} question - Question text
     */
    handleAskQuestion(question) {
        this.ensureUICreated();
        if (window.CaptureAI.UIMessaging) {
            window.CaptureAI.UIMessaging.handleAskQuestion(question);
        }
    },

    /**
     * Show message - works independently of floating UI
     * Routes to messaging module which handles both panel and stealthy result
     * @param {string} message - Message to display
     * @param {boolean|string} isError - Whether message is an error
     * @param {number} autoHideDelay - Auto-hide delay in milliseconds
     */
    showMessage(message, isError = false, autoHideDelay = 0) {
        if (window.CaptureAI.UIMessaging) {
            window.CaptureAI.UIMessaging.showMessage(message, isError, autoHideDelay);
        }
    },

    /**
     * Display AI response - works independently of floating UI
     * @param {string} response - AI response text
     * @param {boolean} isError - Whether response is an error
     */
    displayAIResponse(response, isError = false) {
        if (window.CaptureAI.UIMessaging) {
            window.CaptureAI.UIMessaging.displayAIResponse(response, isError);
        }
    },

    /**
     * Check if floating UI has been created
     * @returns {boolean} True if floating UI exists
     */
    isFloatingUICreated() {
        return this.floatingUICreated;
    },

    /**
     * Get panel element
     * @returns {HTMLElement|null} Panel element
     */
    getPanel() {
        return this.panel;
    },

    /**
     * Force recreation of floating UI (for testing/debugging)
     */
    recreateUI() {
        if (this.panel) {
            this.panel.remove();
        }
        this.floatingUICreated = false;
        this.panel = null;
        return this.createUI();
    },

    /**
     * Update auto-solve toggle visibility based on supported site
     */
    updateAutoSolveVisibility() {
        if (this.floatingUICreated && window.CaptureAI.UIButtons) {
            window.CaptureAI.UIButtons.updateAutoSolveVisibility();
        }
    },

    /**
     * Get current mode (Ask/Capture)
     * @returns {string} 'ask' or 'capture'
     */
    getCurrentMode() {
        const { STATE } = window.CaptureAI;
        return STATE?.isAskMode ? 'ask' : 'capture';
    },

    /**
     * Check if panel is visible
     * @returns {boolean} True if panel is visible
     */
    isPanelVisible() {
        const { STATE } = window.CaptureAI;
        return STATE?.isPanelVisible || false;
    }
};