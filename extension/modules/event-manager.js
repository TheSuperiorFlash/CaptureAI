/**
 * Event management and cleanup utilities
 */

export const EventManager = {
  /**
         * Initialize event manager
         */
  init() {
    // Set up cleanup on page unload (using only beforeunload to avoid permissions policy violation)
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  },

  /**
         * Add event listener with automatic tracking for cleanup
         * @param {HTMLElement} element - Target element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {Object} options - Event options
         */
  addEventListener(element, event, handler, options = {}) {
    if (!element || !event || !handler) {
      return;
    }

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
        } catch (_error) {
          // Silent cleanup
        }
      }
    });

    // Clear the array
    STATE.eventListeners = [];

    // Clean up keyboard event listeners
    if (window.CaptureAI.Keyboard?.cleanup) {
      window.CaptureAI.Keyboard.cleanup();
    }

    // Clean up timers
    if (STATE.answerFadeoutTimer) {
      clearTimeout(STATE.answerFadeoutTimer);
      STATE.answerFadeoutTimer = null;
    }

    if (STATE.autoSolveTimer) {
      clearTimeout(STATE.autoSolveTimer);
      STATE.autoSolveTimer = null;
    }

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
      } catch (_error) {
        // Silent cleanup
      }
      DOM_CACHE.panel = null;
    }

    // Remove stealthy result
    if (DOM_CACHE.stealthyResult) {
      try {
        DOM_CACHE.stealthyResult.remove();
      } catch (_error) {
        // Silent cleanup
      }
      DOM_CACHE.stealthyResult = null;
    }

    // Remove any overlay
    const overlay = document.getElementById('captureai-overlay');
    if (overlay) {
      try {
        overlay.remove();
      } catch (_error) {
        // Silent cleanup
      }
    }

    // Remove any selection box
    const selectionBox = document.getElementById('captureai-selection');
    if (selectionBox) {
      try {
        selectionBox.remove();
      } catch (_error) {
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
         * @param {Error} error - Error object
         * @param {string} context - Context where error occurred
         */
  handleError(error, context) {
    if (window.CaptureAI.CONFIG?.DEBUG) {
      console.error(`CaptureAI Error [${context}]:`, error);
    }

    // Show user-friendly error message
    if (window.CaptureAI.UICore) {
      window.CaptureAI.UICore.showMessage(
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

    // Handle unhandled promise rejections - only from extension code
    window.addEventListener('unhandledrejection', (event) => {
      // Filter: only handle rejections from our extension
      const reason = event.reason;
      const stack = reason?.stack || '';
      if (stack.includes('chrome-extension://')) {
        this.handleError(reason, 'Unhandled Promise');
      }
    });
  }
};
