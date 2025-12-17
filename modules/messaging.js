/**
 * Chrome extension messaging and communication
 */

export const Messaging = {
  /**
         * Initialize message listeners
         */
  init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      return this.handleMessage(request, sender, sendResponse);
    });
  },

  /**
         * Handle incoming messages
         * @param {Object} request - Message request
         * @param {Object} sender - Message sender
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'ping':
        sendResponse({ success: true });
        return false;

      case 'getState':
        return this.handleGetState(sendResponse);

      case 'startCapture':
        return this.handleStartCapture(sendResponse);

      case 'quickCapture':
        return this.handleQuickCapture(sendResponse);

      case 'togglePanel':
        return this.handleTogglePanel(sendResponse);

      case 'setAutoSolve':
        return this.handleSetAutoSolve(request, sendResponse);

      case 'setAskModeImage':
        return this.handleSetAskModeImage(request, sendResponse);

      case 'processCapturedImage':
        return this.handleProcessCapturedImage(request, sendResponse);

      case 'showCapturingMessage':
        return this.handleShowCapturingMessage(sendResponse);

      case 'showProcessingMessage':
        return this.handleShowProcessingMessage(sendResponse);

      case 'displayResponse':
        return this.handleDisplayResponse(request, sendResponse);

      case 'debugLogImage':
        return this.handleDebugLogImage(request, sendResponse);

      default:
        sendResponse({ success: false, error: 'Unknown action' });
        return false;
    }
  },

  /**
         * Handle get state request
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleGetState(sendResponse) {
    // Check if modules are loaded
    if (!window.CaptureAI || !window.CaptureAI.STATE || !window.CaptureAI.STORAGE_KEYS) {
      sendResponse({
        success: false,
        error: 'Modules not loaded yet'
      });
      return false;
    }

    const { STATE, STORAGE_KEYS } = window.CaptureAI;

    // Helper to build state response
    const buildStateResponse = (hasLastCaptureArea = false) => ({
      success: true,
      state: {
        isPanelVisible: STATE.isPanelVisible || false,
        isAutoSolveMode: STATE.isAutoSolveMode || false,
        hasLastCaptureArea,
        isOnSupportedSite: window.CaptureAI.DomainUtils ? window.CaptureAI.DomainUtils.isOnSupportedSite() : false,
        currentResponse: STATE.currentResponse || ''
      }
    });

    // Get last capture area from storage
    if (window.CaptureAI.StorageUtils?.getValue) {
      window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.LAST_CAPTURE_AREA)
        .then(lastArea => sendResponse(buildStateResponse(!!lastArea)))
        .catch(() => sendResponse(buildStateResponse(false)));
    } else {
      // Fallback response when storage isn't available
      sendResponse(buildStateResponse(false));
    }

    return true; // Keep message channel open
  },

  /**
         * Handle start capture request
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleStartCapture(sendResponse) {
    if (!window.CaptureAI || !window.CaptureAI.CaptureSystem) {
      sendResponse({ success: false, error: 'CaptureSystem not loaded' });
      return false;
    }

    try {
      window.CaptureAI.CaptureSystem.startCapture();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return false;
  },

  /**
         * Handle quick capture request
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleQuickCapture(sendResponse) {
    if (!window.CaptureAI || !window.CaptureAI.CaptureSystem) {
      sendResponse({ success: false, error: 'CaptureSystem not loaded' });
      return false;
    }

    // Handle async operation without blocking
    (async () => {
      try {
        await window.CaptureAI.CaptureSystem.quickCapture();
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep message channel open for async response
  },

  /**
         * Handle toggle panel request
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleTogglePanel(sendResponse) {
    if (window.CaptureAI && window.CaptureAI.UICore && window.CaptureAI.UICore.togglePanelVisibility) {
      window.CaptureAI.UICore.togglePanelVisibility();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'UICore not available' });
    }
    return false;
  },

  /**
         * Handle set Auto Solve request
         * @param {Object} request - Message request
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleSetAutoSolve(request, sendResponse) {
    try {
      const { STATE } = window.CaptureAI;
      STATE.isAutoSolveMode = request.isAutoSolveMode;

      // Update UI toggle if exists
      const toggle = document.getElementById('auto-solve-toggle');
      if (toggle) {
        toggle.checked = request.isAutoSolveMode;
      }

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return false;
  },

  /**
         * Handle process captured image request
         * @param {Object} request - Message request with image data
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleProcessCapturedImage(request, sendResponse) {
    const coordinates = {
      startX: request.startX,
      startY: request.startY,
      width: request.width,
      height: request.height
    };

    window.CaptureAI.ImageProcessing.captureAndProcess(request.imageUri, coordinates)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({
          hasError: true,
          error: 'Failed to process captured image: ' + error.message
        });
      });

    return true; // Keep message channel open for async response
  },

  /**
         * Handle show capturing message request
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleShowCapturingMessage(sendResponse) {
    // Don't show "Capturing..." message when ask mode is visible
    const isAskModeVisible = window.CaptureAI.Utils?.isAskModeActive();

    if (!isAskModeVisible && window.CaptureAI.UICore?.showMessage) {
      window.CaptureAI.UICore.showMessage('Capturing...', false);
    }
    sendResponse({ success: true });
    return false;
  },

  /**
         * Handle show processing message request
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleShowProcessingMessage(sendResponse) {
    if (window.CaptureAI.UICore?.showMessage) {
      window.CaptureAI.UICore.showMessage('Processing...', false);
    }
    sendResponse({ success: true });
    return false;
  },

  /**
         * Handle display response request
         * @param {Object} request - Message request with response data
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleDisplayResponse(request, sendResponse) {
    const { STATE } = window.CaptureAI;

    // Handle async operation with proper error handling
    (async () => {
      try {
        STATE.isProcessing = false;
        STATE.currentResponse = request.response;

        // Show response in UI FIRST (like backup)
        this.displayRegularResponse(request.response);

        // Then handle auto-solve processing if needed
        if (request.promptType === window.CaptureAI.PROMPT_TYPES.AUTO_SOLVE) {
          if (window.CaptureAI.AutoSolve && window.CaptureAI.AutoSolve.handleAutoSolveResponse) {
            await window.CaptureAI.AutoSolve.handleAutoSolveResponse(request.response);
          }
        }

        // Notify popup if available - don't fail on popup errors
        try {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({
              action: 'updateResponse',
              message: request.response,
              isError: request.response.startsWith('Error:')
            }, () => {
              // Ignore response or errors - popup might not be open
              if (chrome.runtime.lastError) {
                // Silent handling of popup communication errors
              }
            });
          }
        } catch (_error) {
          // Extension context might be invalidated, continue processing
        }

        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep message channel open for async response
  },

  /**
         * Display regular response in UI
         * @param {string} response - Response text
         */
  displayRegularResponse(response) {
    const { STATE } = window.CaptureAI;

    // Determine message type
    const isError = response.startsWith('Error:') || response.includes('failed');

    // Use new messaging system to display AI response
    if (window.CaptureAI.UICore) {
      window.CaptureAI.UICore.displayAIResponse(response, isError);
    } else {
      // Fallback to direct UI components call
      STATE.isShowingAnswer = true;
      window.CaptureAI.UICore.showMessage(response, isError);
      STATE.isShowingAnswer = false;
    }
  },

  /**
         * Handle set ask mode image request
         * @param {Object} request - Message request with image data
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleSetAskModeImage(request, sendResponse) {
    const { STATE } = window.CaptureAI;

    try {
      // Reset processing state and restore panel
      STATE.isProcessing = false;
      STATE.isForAskMode = false;

      // Restore panel visibility to original state
      if (window.CaptureAI.DOM_CACHE && window.CaptureAI.DOM_CACHE.panel) {
        // Use the capture system's original visibility state
        if (window.CaptureAI.CaptureSystem && window.CaptureAI.CaptureSystem.wasVisible) {
          window.CaptureAI.DOM_CACHE.panel.style.display = 'block';
          STATE.isPanelVisible = true;
        } else {
          window.CaptureAI.DOM_CACHE.panel.style.display = 'none';
          STATE.isPanelVisible = false;
        }
      }

      // Pass image data to ask mode instance
      if (STATE.askModeInstance && STATE.askModeInstance.setAttachedImage) {
        STATE.askModeInstance.setAttachedImage(request.imageData);
      }

      // Clear the ask mode instance reference
      STATE.askModeInstance = null;

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }

    return false;
  },

  /**
         * Handle debug log image request
         * @param {Object} request - Message request with image data
         * @param {Function} sendResponse - Response callback
         * @returns {boolean}
         */
  handleDebugLogImage(request, sendResponse) {
    try {
      // Log image data on its own line for easy copying
      console.log('CaptureAI Debug - Captured Image Data:');
      console.log(request.imageData);

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return false;
  },

  /**
         * Send message to background script
         * @param {Object} message - Message to send
         * @returns {Promise<Object>}
         */
  sendToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
};
