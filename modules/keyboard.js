/**
 * Keyboard shortcuts and event handling
 */

export const Keyboard = {
        /**
         * Initialize keyboard shortcuts
         */
        init() {
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
        },

        /**
         * Handle keydown events
         * @param {KeyboardEvent} e - Keyboard event
         */
        handleKeyDown(e) {
            // Ignore if user is typing in an input field
            if (this.isTypingInInput(e.target)) {
                return;
            }

            // Check for CaptureAI shortcuts
            if (e.ctrlKey && e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 'x':
                        e.preventDefault();
                        this.handleCaptureShortcut();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.handleQuickCaptureShortcut();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.handleToggleShortcut();
                        break;
                }
            }

            // Handle escape key for canceling operations
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        },

        /**
         * Check if user is typing in an input field
         * @param {HTMLElement} element - Target element
         * @returns {boolean}
         */
        isTypingInInput(element) {
            if (!element || !element.tagName) return false;
            
            const tagName = element.tagName.toLowerCase();
            const inputTypes = ['input', 'textarea', 'select'];
            
            if (inputTypes.includes(tagName)) {
                return true;
            }
            
            // Check for contenteditable
            if (element.contentEditable === 'true') {
                return true;
            }
            
            // Check if element is inside an editable area
            let parent = element.parentElement;
            while (parent) {
                if (parent.contentEditable === 'true' || 
                    ['input', 'textarea'].includes(parent.tagName.toLowerCase())) {
                    return true;
                }
                parent = parent.parentElement;
            }
            
            return false;
        },

        /**
         * Handle capture shortcut (Ctrl+Shift+X)
         */
        handleCaptureShortcut() {
            if (!window.CaptureAI || !window.CaptureAI.STATE) {
                return;
            }
            
            const { STATE } = window.CaptureAI;
            
            if (STATE.isProcessing) {
                return;
            }
            
            // Check if ask mode is currently active
            const askModeContainer = document.getElementById('ask-mode-container');
            const isAskModeVisible = askModeContainer && askModeContainer.style.display !== 'none';
            
            if (window.CaptureAI.CaptureSystem && window.CaptureAI.CaptureSystem.startCapture) {
                if (isAskModeVisible && window.CaptureAI.UIAskMode) {
                    // In ask mode - start image capture for attachment
                    window.CaptureAI.STATE.askModeInstance = window.CaptureAI.UIAskMode;
                    window.CaptureAI.CaptureSystem.startCapture(true);
                } else {
                    // Normal capture mode
                    window.CaptureAI.CaptureSystem.startCapture();
                }
            }
        },

        /**
         * Handle toggle shortcut (Ctrl+Shift+E)
         */
        handleToggleShortcut() {
            // Toggle panel visibility
            if (window.CaptureAI && window.CaptureAI.UICore && window.CaptureAI.UICore.togglePanelVisibility) {
                window.CaptureAI.UICore.togglePanelVisibility();
            }
        },

        /**
         * Handle quick capture shortcut (Ctrl+Shift+F)
         */
        handleQuickCaptureShortcut() {
            if (!window.CaptureAI || !window.CaptureAI.CaptureSystem) {
                return;
            }
            
            // Check if ask mode is currently active
            const askModeContainer = document.getElementById('ask-mode-container');
            const isAskModeVisible = askModeContainer && askModeContainer.style.display !== 'none';
            
            if (window.CaptureAI.CaptureSystem.quickCapture) {
                if (isAskModeVisible && window.CaptureAI.UIAskMode) {
                    // In ask mode - use quick capture for image attachment
                    window.CaptureAI.STATE.askModeInstance = window.CaptureAI.UIAskMode;
                    window.CaptureAI.STATE.isForAskMode = true;
                    window.CaptureAI.CaptureSystem.quickCapture();
                } else {
                    // Normal quick capture mode
                    window.CaptureAI.CaptureSystem.quickCapture();
                }
            }
        },

        /**
         * Handle escape key functionality
         */
        handleEscapeKey() {
            const { STATE } = window.CaptureAI;
            
            // Cancel auto-solve mode immediately (like backup)
            if (STATE.isAutoSolveMode) {
                if (window.CaptureAI.AutoSolve && window.CaptureAI.AutoSolve.toggleAutoSolveMode) {
                    window.CaptureAI.AutoSolve.toggleAutoSolveMode(false);
                }
                return;
            }
            
            // Cancel any ongoing selection
            const overlay = document.getElementById('captureai-overlay');
            if (overlay) {
                window.CaptureAI.CaptureSystem.cancelSelection();
                return;
            }
            
            // Clear any processing state
            if (STATE.isProcessing) {
                STATE.isProcessing = false;
                // Only clear processing messages, not answers
                const resultElement = document.getElementById(window.CaptureAI.CONFIG?.RESULT_ID);
                if (resultElement && (resultElement.textContent.includes('Processing') || resultElement.textContent.includes('Capturing'))) {
                    window.CaptureAI.UIStealthyResult.hide();
                }
            }
            
            // Clear fadeout timer but don't automatically clear showing answers
            if (STATE.isShowingAnswer) {
                if (STATE.answerFadeoutTimer) {
                    clearTimeout(STATE.answerFadeoutTimer);
                    STATE.answerFadeoutTimer = null;
                }
                // Don't clear the message automatically - let it stay until a new message appears
            }
            
            // Switch back to capture mode if in ask mode
            if (STATE.isAskMode) {
                window.CaptureAI.CaptureSystem.startCapture();
                // Recreate UI to show capture interface
                setTimeout(() => {
                    window.CaptureAI.UIComponents.createUI();
                }, 100);
            }
        },

        /**
         * Add custom keyboard event listener
         * @param {string} key - Key combination
         * @param {Function} handler - Event handler
         * @param {Object} options - Options (ctrl, shift, alt)
         */
        addShortcut(key, handler, options = {}) {
            const shortcut = {
                key: key.toLowerCase(),
                handler: handler,
                ctrl: options.ctrl || false,
                shift: options.shift || false,
                alt: options.alt || false
            };
            
            // Store shortcut for cleanup
            window.CaptureAI.STATE.eventListeners.push({
                type: 'keyboard',
                shortcut: shortcut
            });
        },

        /**
         * Remove keyboard event listeners
         */
        cleanup() {
            document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        },

        /**
         * Get help text for keyboard shortcuts
         * @returns {string}
         */
        getShortcutsHelp() {
            return `
Keyboard Shortcuts:
• Ctrl+Shift+X: Start capture
• Ctrl+Shift+F: Quick capture (repeat last area)
• Ctrl+Shift+E: Toggle UI panel
• Escape: Cancel current operation
            `.trim();
        }
    };