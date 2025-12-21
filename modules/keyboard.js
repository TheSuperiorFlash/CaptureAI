/**
 * Keyboard shortcuts and event handling
 * Note: Main shortcuts (Ctrl+Shift+X, F, E) are handled via manifest commands
 * This module only handles Escape key for canceling operations
 */

export const Keyboard = {
  /**
         * Initialize keyboard shortcuts
         */
  init() {
    // Bind the handler once and store it for cleanup
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.boundHandleKeyDown);
  },

  /**
         * Cleanup keyboard event listeners
         */
  cleanup() {
    if (this.boundHandleKeyDown) {
      document.removeEventListener('keydown', this.boundHandleKeyDown);
      this.boundHandleKeyDown = null;
    }
  },

  /**
         * Handle keydown events
         * Only handles Escape key - other shortcuts handled by manifest commands
         * @param {KeyboardEvent} e - Keyboard event
         */
  handleKeyDown(e) {
    // Handle escape key for canceling operations
    if (e.key === 'Escape') {
      this.handleEscapeKey();
    }
  },

  /**
         * Handle command from manifest keyboard shortcut
         * Called by content.js when background.js forwards a command
         * @param {string} command - Command name from manifest.json
         */
  handleCommand(command) {
    if (!window.CaptureAI || !window.CaptureAI.STATE) {
      return;
    }

    const { STATE } = window.CaptureAI;

    switch (command) {
      case 'capture_shortcut':
        if (!STATE.isProcessing && window.CaptureAI.CaptureSystem?.startCapture) {
          window.CaptureAI.CaptureSystem.startCapture();
        }
        break;

      case 'quick_capture_shortcut':
        if (window.CaptureAI.CaptureSystem?.quickCapture) {
          window.CaptureAI.CaptureSystem.quickCapture();
        }
        break;

      case 'toggle_ui_shortcut':
        if (window.CaptureAI.UICore?.togglePanelVisibility) {
          window.CaptureAI.UICore.togglePanelVisibility();
        }
        break;
    }
  },

  /**
         * Handle escape key functionality
         */
  handleEscapeKey() {
    const { STATE, DOM_CACHE } = window.CaptureAI;

    // Always turn off auto-solve mode
    if (STATE.isAutoSolveMode) {
      if (window.CaptureAI.AutoSolve && window.CaptureAI.AutoSolve.toggleAutoSolveMode) {
        window.CaptureAI.AutoSolve.toggleAutoSolveMode(false);
      }
    }

    // Always hide the floating UI panel
    if (STATE.isPanelVisible && DOM_CACHE.panel) {
      DOM_CACHE.panel.style.display = 'none';
      STATE.isPanelVisible = false;
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
