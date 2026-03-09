/**
 * Screen capture and area selection system
 */

export const CaptureSystem = {
  /**
         * Start capture process
         * @param {boolean} forAskMode - Whether this capture is for ask mode
         */
  startCapture(forAskMode = false) {
    const { STATE } = window.CaptureAI;

    if (STATE.isProcessing) {
      return;
    }

    // Store original panel visibility state before hiding
    this.wasVisible = STATE.isPanelVisible;

    // Hide panel during capture
    if (window.CaptureAI.UICore && window.CaptureAI.UICore.setPanelVisibility) {
      window.CaptureAI.UICore.setPanelVisibility(false);
    }

    // Track ask mode state from parameter
    STATE.isForAskMode = forAskMode;

    // Only set prompt type if NOT for ask mode (ask mode will be handled by ask mode submission)
    if (!forAskMode) {
      STATE.currentPromptType = STATE.isAutoSolveMode ? window.CaptureAI.PROMPT_TYPES.AUTO_SOLVE : window.CaptureAI.PROMPT_TYPES.ANSWER;
    }

    this.startSelectionProcess();
  },

  /**
         * Quick capture using last area
         */
  async quickCapture() {
    const { STATE, STORAGE_KEYS } = window.CaptureAI;

    if (STATE.isProcessing) {
      return;
    }

    if (!window.CaptureAI.StorageUtils || !STORAGE_KEYS) {
      return;
    }

    const lastArea = await window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.LAST_CAPTURE_AREA);

    if (!lastArea) {
      return;
    }

    STATE.isProcessing = true;

    // Set current prompt type based on auto-solve mode
    STATE.currentPromptType = STATE.isAutoSolveMode ? window.CaptureAI.PROMPT_TYPES.AUTO_SOLVE : window.CaptureAI.PROMPT_TYPES.ANSWER;

    // Always process the image
    chrome.runtime.sendMessage({
      action: 'captureArea',
      coordinates: lastArea,
      promptType: STATE.currentPromptType
    });
  },

  /**
         * Start area selection process
         */
  startSelectionProcess() {
    const { STATE } = window.CaptureAI;

    // Create overlay
    const overlay = this.createOverlay();
    document.body.appendChild(overlay);

    // Reset drag state
    STATE.isDragging = false;
    STATE.startX = 0;
    STATE.startY = 0;
    STATE.endX = 0;
    STATE.endY = 0;

    // Add event listeners
    overlay.addEventListener('mousedown', this.onMouseDown.bind(this));
    overlay.addEventListener('mousemove', this.onMouseMove.bind(this));
    overlay.addEventListener('mouseup', this.onMouseUp.bind(this));
    overlay.addEventListener('keydown', this.onKeyDown.bind(this));

    // Focus overlay for keyboard events
    overlay.focus();

  },

  /**
         * Create selection overlay
         * @returns {HTMLElement}
         */
  createOverlay() {
    const { STATE } = window.CaptureAI;
    const overlay = document.createElement('div');
    overlay.id = 'captureai-overlay';

    // In stealth mode (UI hidden), don't show the translucent gray background
    const isStealthMode = !this.wasVisible;

    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: isStealthMode ? 'transparent' : 'rgba(0, 0, 0, 0.55)',
      cursor: isStealthMode ? 'default' : 'crosshair',
      zIndex: '2147483646',
      outline: 'none',
      transition: 'none',
      willChange: 'background-color'
    });

    overlay.tabIndex = -1;
    return overlay;
  },

  /**
         * Create selection box
         * @returns {HTMLElement}
         */
  createSelectionBox() {
    if (window.CaptureAI.STATE.selectionBox) {
      window.CaptureAI.STATE.selectionBox.remove();
    }

    const { STATE } = window.CaptureAI;
    const selectionBox = document.createElement('div');
    selectionBox.id = 'captureai-selection';

    // In stealth mode (UI hidden), hide the selection box
    const isStealthMode = !this.wasVisible;

    Object.assign(selectionBox.style, {
      position: 'absolute',
      border: isStealthMode ? 'none' : '2px dashed #218aff',
      borderRadius: isStealthMode ? '0' : '14px 14px 0 14px',
      backgroundColor: 'transparent',
      boxShadow: isStealthMode ? 'none' :
        '0 0 25px rgba(33, 138, 255, 0.8), 0 0 70px rgba(33, 138, 255, 0.4), 0 0 150px rgba(33, 138, 255, 0.2), 0 0 0 9999px rgba(0, 0, 0, 0.55)',
      pointerEvents: 'none',
      zIndex: '2147483647',
      opacity: '1',
      transition: 'none',
      willChange: 'left, top, width, height'
    });

    const overlay = document.getElementById('captureai-overlay');
    if (overlay) {
      overlay.appendChild(selectionBox);
    }

    window.CaptureAI.STATE.selectionBox = selectionBox;
    return selectionBox;
  },

  /**
         * Handle mouse down event
         * @param {MouseEvent} e - Mouse event
         */
  onMouseDown(e) {
    const { STATE } = window.CaptureAI;

    STATE.isDragging = true;
    STATE.startX = e.clientX;
    STATE.startY = e.clientY;
    STATE.endX = e.clientX;
    STATE.endY = e.clientY;

    const isStealthMode = !this.wasVisible;
    if (!isStealthMode) {
      const overlay = document.getElementById('captureai-overlay');
      if (overlay) overlay.style.backgroundColor = 'transparent';
    }

    this.createSelectionBox();
    this.updateSelectionBox();
  },

  /**
         * Handle mouse move event
         * @param {MouseEvent} e - Mouse event
         */
  onMouseMove(e) {
    const { STATE } = window.CaptureAI;

    if (!STATE.isDragging) {
      return;
    }

    STATE.endX = e.clientX;
    STATE.endY = e.clientY;
    this.updateSelectionBox();
  },

  /**
         * Handle mouse up event
         * @param {MouseEvent} e - Mouse event
         */
  onMouseUp(e) {
    const { STATE } = window.CaptureAI;

    if (!STATE.isDragging) {
      return;
    }

    STATE.isDragging = false;
    STATE.endX = e.clientX;
    STATE.endY = e.clientY;

    // Calculate selection area
    const width = Math.abs(STATE.endX - STATE.startX);
    const height = Math.abs(STATE.endY - STATE.startY);

    if (width < 10 || height < 10) {
      this.cancelSelection();
      return;
    }

    this.completeSelection();
  },

  /**
         * Handle keyboard events
         * @param {KeyboardEvent} e - Keyboard event
         */
  onKeyDown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      this.cancelSelection();
    }
  },

  /**
         * Update selection box dimensions
         */
  updateSelectionBox() {
    const { STATE } = window.CaptureAI;

    if (!STATE.selectionBox) {
      return;
    }

    const left = Math.min(STATE.startX, STATE.endX);
    const top = Math.min(STATE.startY, STATE.endY);
    const width = Math.abs(STATE.endX - STATE.startX);
    const height = Math.abs(STATE.endY - STATE.startY);

    Object.assign(STATE.selectionBox.style, {
      left: left + 'px',
      top: top + 'px',
      width: width + 'px',
      height: height + 'px'
    });
  },

  /**
         * Complete selection and initiate capture
         */
  async completeSelection() {
    const { STATE, STORAGE_KEYS } = window.CaptureAI;

    // Calculate final coordinates
    const left = Math.min(STATE.startX, STATE.endX);
    const top = Math.min(STATE.startY, STATE.endY);
    const width = Math.abs(STATE.endX - STATE.startX);
    const height = Math.abs(STATE.endY - STATE.startY);

    // Account for browser zoom level
    const zoom = window.devicePixelRatio;

    // Note: captureVisibleTab only captures the viewport, so coordinates
    // should be relative to viewport (clientX/clientY), not document.
    // We do NOT add scrollX/scrollY because the screenshot is of the viewport only.
    const coordinates = {
      startX: left * zoom,
      startY: top * zoom,
      width: width * zoom,
      height: height * zoom
    };

    // Store for quick capture
    await window.CaptureAI.StorageUtils.setValue(STORAGE_KEYS.LAST_CAPTURE_AREA, coordinates);

    // Clean up selection UI (with animation)
    this.cleanupSelection();

    // Wait slightly more for the fade to be effectively invisible for the shot
    // while still letting the user see the start of the animation
    await new Promise(resolve => setTimeout(resolve, 50));

    // Wait for DOM to update and repaint
    await new Promise(resolve => requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    }));

    // Show processing message (skip for ask mode)
    // Intentionally left empty for ask mode
    STATE.isProcessing = true;

    // Set current prompt type based on auto-solve mode (like original)
    STATE.currentPromptType = STATE.isAutoSolveMode ? window.CaptureAI.PROMPT_TYPES.AUTO_SOLVE : window.CaptureAI.PROMPT_TYPES.ANSWER;

    // Use the same capture action for both modes
    // The difference is handled by the isForAskMode flag in state
    chrome.runtime.sendMessage({
      action: 'captureArea',
      coordinates: coordinates,
      promptType: STATE.currentPromptType,
      isForAskMode: STATE.isForAskMode
    }, (_response) => {
      if (chrome.runtime.lastError) {
        console.error('Capture failed:', chrome.runtime.lastError);
        STATE.isProcessing = false;
        STATE.isForAskMode = false;

        // Restore panel visibility
        if (window.CaptureAI.UICore && window.CaptureAI.UICore.setPanelVisibility) {
          window.CaptureAI.UICore.setPanelVisibility(true);
        }
      }
    });
  },

  /**
         * Cancel selection process
         */
  cancelSelection() {
    this.cleanupSelection();

    // Restore panel to original visibility state
    this.restorePanelVisibility();
  },

  /**
         * Clean up selection UI elements
         */
  cleanupSelection() {
    const { STATE } = window.CaptureAI;
    const overlay = document.getElementById('captureai-overlay');
    const selection = STATE.selectionBox;

    // Remove overlay with fade
    if (overlay) {
      overlay.style.transition = 'opacity 0.1s ease-out';
      overlay.style.opacity = '0';
    }

    // Selection box fade (handled by its existing transition property)
    if (selection) {
      selection.style.opacity = '0';
    }

    // Final removal after animation
    setTimeout(() => {
      if (overlay) overlay.remove();
      if (selection) selection.remove();
      if (STATE.selectionBox === selection) {
        STATE.selectionBox = null;
      }
    }, 100);

    // Reset drag state immediately
    STATE.isDragging = false;

    // Restore panel to original visibility state after a brief delay
    // to separate capture UI from panel UI re-entry
    setTimeout(() => this.restorePanelVisibility(), 100);
  },

  /**
         * Restore panel visibility to original state before capture
         */
  restorePanelVisibility() {
    const { STATE } = window.CaptureAI;

    if (window.CaptureAI.UICore && window.CaptureAI.UICore.setPanelVisibility) {
      // Only show panel if it was originally visible
      window.CaptureAI.UICore.setPanelVisibility(!!this.wasVisible);
    }
  },

  /**
         * Initialize capture system
         */
  init() {
    // Any initialization code for capture system
  }
};
