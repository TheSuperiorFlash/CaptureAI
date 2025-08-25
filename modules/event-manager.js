/**
 * Event management and cleanup utilities
 */

export const EventManager = {
        /**
         * Initialize event manager
         */
        init() {
            // Set up cleanup on page unload
            window.addEventListener('beforeunload', this.cleanup.bind(this));
            window.addEventListener('unload', this.cleanup.bind(this));
        },

        /**
         * Add event listener with automatic tracking for cleanup
         * @param {HTMLElement} element - Target element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {Object} options - Event options
         */
        addEventListener(element, event, handler, options = {}) {
            if (!element || !event || !handler) return;
            
            element.addEventListener(event, handler, options);
            
            // Track for cleanup
            window.CaptureAI.STATE.eventListeners.push({
                element: element,
                event: event,
                handler: handler,
                options: options
            });
        },


        /**
         * Clean up all event listeners and resources
         */
        cleanup() {
            const { STATE } = window.CaptureAI;
            
            // Remove all tracked event listeners
            STATE.eventListeners.forEach(listener => {
                if (listener.element && listener.event && listener.handler) {
                    try {
                        listener.element.removeEventListener(listener.event, listener.handler);
                    } catch (error) {
                        // Silent cleanup
                    }
                }
            });
            
            // Clear the array
            STATE.eventListeners = [];
            
            // Clean up timers
            if (STATE.answerFadeoutTimer) {
                clearTimeout(STATE.answerFadeoutTimer);
                STATE.answerFadeoutTimer = null;
            }
            
            if (STATE.autoSolveTimer) {
                clearTimeout(STATE.autoSolveTimer);
                STATE.autoSolveTimer = null;
            }
            
            // OCR removed - direct image processing only
            
            // Clean up UI elements
            this.cleanupUI();
        },

        /**
         * Clean up UI elements
         */
        cleanupUI() {
            const { DOM_CACHE } = window.CaptureAI;
            
            // Remove panel
            if (DOM_CACHE.panel) {
                try {
                    DOM_CACHE.panel.remove();
                } catch (error) {
                    // Silent cleanup
                }
                DOM_CACHE.panel = null;
            }
            
            // Remove stealthy result
            if (DOM_CACHE.stealthyResult) {
                try {
                    DOM_CACHE.stealthyResult.remove();
                } catch (error) {
                    // Silent cleanup
                }
                DOM_CACHE.stealthyResult = null;
            }
            
            // Remove any overlay
            const overlay = document.getElementById('captureai-overlay');
            if (overlay) {
                try {
                    overlay.remove();
                } catch (error) {
                    // Silent cleanup
                }
            }
            
            // Remove any selection box
            const selectionBox = document.getElementById('captureai-selection');
            if (selectionBox) {
                try {
                    selectionBox.remove();
                } catch (error) {
                    // Silent cleanup
                }
            }
        },

        /**
         * Reset application state
         */
        resetState() {
            const { STATE } = window.CaptureAI;
            
            // Reset processing state
            STATE.isProcessing = false;
            STATE.isShowingAnswer = false;
            STATE.isDragging = false;
            STATE.currentPromptType = null;
            
            // Reset coordinates
            STATE.startX = 0;
            STATE.startY = 0;
            STATE.endX = 0;
            STATE.endY = 0;
            
            // Clear selection box reference
            STATE.selectionBox = null;
        },

        /**
         * Handle errors gracefully
         */
        handleError() {
            
            // Show user-friendly error message
            if (window.CaptureAI.UIHandlers) {
                window.CaptureAI.UIHandlers.showMessage(
                    'An error occurred. Please try again.',
                    'error'
                );
            }
            
            // Reset state if needed
            this.resetState();
        },

        /**
         * Add global error handlers
         */
        addGlobalErrorHandlers() {
            // Handle uncaught errors
            window.addEventListener('error', (event) => {
                // Only handle errors from our extension
                if (event.filename && event.filename.includes('chrome-extension://')) {
                    this.handleError(event.error, 'Global Error');
                }
            });
            
            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError(event.reason, 'Unhandled Promise');
            });
        }
    };