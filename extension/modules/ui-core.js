/**
 * Core UI module - consolidated panel, theme, messaging, and handlers
 */

export const UICore = {
  initialized: false,
  floatingUICreated: false,
  panel: null,
  currentTheme: null,
  modeToggleElement: null,  // Store reference to mode toggle

  async init() {
    if (this.initialized) {
      return;
    }

    // Font loading removed - using system fonts to avoid CSP violations on third-party sites
    this.currentTheme = this.getThemeColors(false);
    this.initialized = true;
  },

  getThemeColors(isDarkMode = false) {
    return isDarkMode ? {
      primaryBg: 'rgba(0, 0, 0, 0.3)',
      headerBg: 'rgba(0, 0, 0, 0.4)',
      toggleBg: 'rgba(40, 40, 40, 0.2)',
      toggleInactiveBg: 'rgba(60, 60, 60, 0.2)',
      primaryText: '#ffffff',
      secondaryText: '#cccccc',
      border: 'rgba(170,170,170,0.15)',
      buttonBorder: 'rgba(102,102,102,0.2)',
      buttonPrimary: '#218aff',
      errorText: '#ff6b6b'
    } : {
      primaryBg: 'white',
      headerBg: '#f5f5f5',
      toggleBg: '#f0f0f0',
      toggleInactiveBg: '#f1f1f1',
      primaryText: '#333333',
      secondaryText: '#666666',
      border: '#e0e0e0',
      buttonBorder: '#d1d1d1',
      buttonPrimary: '#218aff',
      errorText: '#ff6b6b'
    };
  },

  getCurrentTheme() {
    if (!this.initialized) {
      this.init();
    }
    return this.currentTheme;
  },

  getPanelShadow() {
    return '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
  },

  createUI() {
    if (this.floatingUICreated && this.panel) {
      return this.panel;
    }

    const { STATE, CONFIG, DOM_CACHE } = window.CaptureAI;

    try {
      if (!this.initialized) {
        this.init();
      }

      this.panel = this.createPanel();
      const header = this.createHeader();
      const responseContainer = this.createResponseContainer();

      this.panel.appendChild(header);
      this.panel.appendChild(responseContainer);

      this.makeDraggable(this.panel, header);
      document.body.appendChild(this.panel);

      STATE.uiElements.panel = this.panel;
      DOM_CACHE.panel = this.panel;
      DOM_CACHE.resultElement = document.getElementById(CONFIG.RESULT_ID);
      STATE.isPanelVisible = false;

      // Components will be attached by UIComponents.createUI() if called from there

      this.floatingUICreated = true;
      return this.panel;

    } catch (error) {
      console.error('Failed to create UI:', error);
      return null;
    }
  },

  createPanel() {
    const { CONFIG } = window.CaptureAI;
    const theme = this.getCurrentTheme();

    const panel = document.createElement('div');
    panel.id = CONFIG.PANEL_ID;
    panel.style.cssText = `
            position: fixed; top: 20px; right: 20px; width: 250px !important;
            background-color: ${theme.primaryBg} !important; border-radius: 10px;
            box-shadow: ${this.getPanelShadow()}; z-index: 9999;
            font-family: 'Inter', sans-serif; color: ${theme.primaryText} !important;
            overflow: hidden; transition: opacity 0.3s ease; display: none;
        `;

    return panel;
  },

  createHeader() {
    const theme = this.getCurrentTheme();

    const header = document.createElement('div');
    header.style.cssText = `
            display: flex; align-items: center; padding: 10px 15px;
            justify-content: space-between; background-color: ${theme.headerBg} !important;
            border-bottom: 1px solid ${theme.border} !important; cursor: move;
        `;

    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = 'display: flex; align-items: center;';

    const logo = document.createElement('img');
    if (window.CaptureAI?.ICONS?.CHECKMARK) {
      logo.src = window.CaptureAI.ICONS.CHECKMARK;
    }
    logo.style.cssText = 'width: 24px; height: 24px; margin-right: 10px;';

    const title = document.createElement('span');
    title.textContent = 'CaptureAI';
    title.style.cssText = `
            font-weight: bold; font-size: 16px; margin-right: 10px;
            color: ${theme.primaryText} !important;
        `;

    titleContainer.appendChild(logo);
    titleContainer.appendChild(title);
    header.appendChild(titleContainer);

    // Add mode toggle to right side of header (Pro tier only)
    // Initially hidden, will be shown for Pro users by updateModeToggleForTier()
    this.modeToggleElement = this.createModeToggle();
    if (this.modeToggleElement) {
      this.modeToggleElement.style.display = 'none';  // Initially hidden
      header.appendChild(this.modeToggleElement);
    }

    return header;
  },

  createResponseContainer() {
    const { STATE, CONFIG } = window.CaptureAI;
    const theme = this.getCurrentTheme();

    const responseContainer = document.createElement('div');
    responseContainer.style.cssText = `
            padding: 10px 15px; background-color: ${theme.primaryBg} !important;
            font-size: 14px; color: ${theme.primaryText} !important;
            min-height: 52px; box-sizing: border-box;
            display: flex; flex-direction: column;
        `;

    const responseTitle = document.createElement('div');
    responseTitle.textContent = 'Response:';
    responseTitle.style.cssText = `
            font-size: 12px; color: ${theme.secondaryText} !important; margin-bottom: 5px;
        `;

    const responseContent = document.createElement('div');
    responseContent.id = CONFIG.RESULT_ID;
    responseContent.style.cssText = `
            font-size: 14px; color: ${theme.primaryText} !important;
            word-break: break-word; background-color: transparent !important;
            flex: 1; line-height: 1.3; min-height: 18px;
        `;

    if (!STATE.apiKey) {
      responseContent.textContent = 'Extension is not activated';
      responseContent.style.color = `${theme.errorText} !important`;
    }

    responseContainer.appendChild(responseTitle);
    responseContainer.appendChild(responseContent);

    return responseContainer;
  },

  createModeToggle() {
    const { STATE } = window.CaptureAI;
    const theme = this.getCurrentTheme();

    // Create toggle container
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
            position: relative !important;
            display: inline-block !important;
            cursor: pointer !important;
            vertical-align: middle !important;
            margin-top: 1px !important;
            box-sizing: border-box !important;
        `;

    // Hidden input
    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.checked = STATE.isAskMode || false;
    toggleInput.style.cssText = `
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            z-index: -1 !important;
        `;

    // Toggle switch background
    const modeToggleSwitch = document.createElement('div');
    modeToggleSwitch.style.cssText = `
            position: relative !important;
            width: 90px !important;
            height: 24px !important;
            background-color: ${theme.toggleBg} !important;
            border-radius: 12px !important;
            border: 1px solid ${theme.border} !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            align-items: center !important;
            font-size: 11px !important;
            font-weight: 500 !important;
            font-family: 'Inter', sans-serif !important;
            overflow: hidden !important;
        `;

    // Sliding indicator
    const toggleSlider = document.createElement('div');
    toggleSlider.style.cssText = `
            position: absolute !important;
            width: ${STATE.isAskMode ? '38px' : '54px'} !important;
            height: 24px !important;
            background-color: ${theme.buttonPrimary} !important;
            border-radius: 12px !important;
            top: 0px !important;
            left: ${STATE.isAskMode ? '52px' : '0px'} !important;
            transition: all 0.3s ease !important;
            z-index: 1 !important;
        `;

    // Capture label
    const captureLabel = document.createElement('span');
    captureLabel.textContent = 'Capture';
    captureLabel.style.cssText = `
            position: absolute !important;
            left: 8px !important;
            color: ${STATE.isAskMode ? theme.secondaryText : 'white'} !important;
            font-size: 10px !important;
            font-weight: 500 !important;
            z-index: 2 !important;
            transition: color 0.3s ease !important;
            font-family: 'Inter', sans-serif !important;
            white-space: nowrap !important;
        `;

    // Ask label
    const askLabel = document.createElement('span');
    askLabel.textContent = 'Ask';
    askLabel.style.cssText = `
            position: absolute !important;
            right: 8px !important;
            color: ${STATE.isAskMode ? 'white' : theme.secondaryText} !important;
            font-size: 10px !important;
            font-weight: 500 !important;
            z-index: 2 !important;
            transition: color 0.3s ease !important;
            font-family: 'Inter', sans-serif !important;
            white-space: nowrap !important;
        `;

    // Assemble components
    modeToggleSwitch.appendChild(toggleSlider);
    modeToggleSwitch.appendChild(captureLabel);
    modeToggleSwitch.appendChild(askLabel);
    toggleContainer.appendChild(toggleInput);
    toggleContainer.appendChild(modeToggleSwitch);

    // Add event listener
    const handleToggle = () => {
      STATE.isAskMode = toggleInput.checked;

      // Update UI
      if (STATE.isAskMode) {
        toggleSlider.style.left = '52px';
        toggleSlider.style.width = '38px';
        captureLabel.style.color = theme.secondaryText;
        askLabel.style.color = 'white';
      } else {
        toggleSlider.style.left = '0px';
        toggleSlider.style.width = '54px';
        captureLabel.style.color = 'white';
        askLabel.style.color = theme.secondaryText;
      }

      // Switch UI mode
      this.switchMode(STATE.isAskMode);

      // Save preference
      if (window.CaptureAI.StorageUtils && window.CaptureAI.STORAGE_KEYS) {
        window.CaptureAI.StorageUtils.setValue(window.CaptureAI.STORAGE_KEYS.ASK_MODE, STATE.isAskMode);
      }
    };

    toggleInput.addEventListener('change', handleToggle);
    modeToggleSwitch.addEventListener('click', () => {
      toggleInput.checked = !toggleInput.checked;
      handleToggle();
    });

    return toggleContainer;
  },

  switchMode(isAskMode) {
    const { CONFIG } = window.CaptureAI;
    const panel = document.getElementById(CONFIG.PANEL_ID);
    const buttonsContainer = panel?.querySelector('[data-captureai-buttons]');
    let askContainer = panel?.querySelector('[data-captureai-ask]');

    if (isAskMode && !askContainer && window.CaptureAI.UIComponents) {
      window.CaptureAI.UIComponents.ensureAskModeExists();
      askContainer = panel?.querySelector('[data-captureai-ask]');
    }

    if (!buttonsContainer) {
      return;
    }

    if (isAskMode) {
      // Switch to ask mode
      buttonsContainer.style.display = 'none';
      if (askContainer) {
        askContainer.style.display = 'flex';
        askContainer.style.opacity = '1';
      }
    } else {
      // Switch to capture mode
      if (askContainer) {
        askContainer.style.display = 'none';
        askContainer.style.opacity = '0';
      }
      buttonsContainer.style.display = 'flex';
    }
  },

  attachComponent(component, position = 'bottom') {
    if (!this.panel) {
      return;
    }

    switch (position) {
      case 'after-response': {
        const responseContainer = this.panel.children[1];
        if (responseContainer?.nextSibling) {
          this.panel.insertBefore(component, responseContainer.nextSibling);
        } else {
          this.panel.appendChild(component);
        }
        break;
      }
      default:
        this.panel.appendChild(component);
        break;
    }
  },

  async updateModeToggleForTier() {
    if (!this.modeToggleElement) {
      return;
    }

    // Check user tier from storage
    let userTier = 'free';
    try {
      const userTierData = await chrome.storage.local.get('captureai-user-tier');
      userTier = userTierData['captureai-user-tier'] || 'free';
    } catch (error) {
      console.error('Failed to get user tier:', error);
    }

    // Only show ask mode toggle for Pro tier
    if (userTier === 'pro') {
      this.modeToggleElement.style.display = 'inline-block';
    } else {
      this.modeToggleElement.style.display = 'none';
      // Also ensure ask mode is disabled for free users
      const { STATE } = window.CaptureAI;
      if (STATE.isAskMode) {
        STATE.isAskMode = false;
        this.switchMode(false);
      }
    }
  },

  togglePanelVisibility() {
    const { STATE, DOM_CACHE } = window.CaptureAI;

    if (!DOM_CACHE.panel) {
      if (window.CaptureAI.UIComponents?.createUI) {
        window.CaptureAI.UIComponents.createUI();
      } else {
        this.createUI();
      }
    }

    if (DOM_CACHE.panel) {
      DOM_CACHE.panel.style.display = STATE.isPanelVisible ? 'none' : 'block';
      STATE.isPanelVisible = !STATE.isPanelVisible;
    }
  },

  makeDraggable(element, handle) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = element.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    });

    function onMouseMove(e) {
      if (!isDragging) {
        return;
      }

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      element.style.left = Math.min(maxX, Math.max(0, initialX + dx)) + 'px';
      element.style.top = Math.min(maxY, Math.max(0, initialY + dy)) + 'px';
      element.style.right = 'auto';
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  },

  showMessage(message, isError = false, autoHideDelay = 0) {
    const { STATE } = window.CaptureAI || {};
    const isErrorFlag = isError === true || isError === 'error';

    if (STATE?.isPanelVisible) {
      this.showInFloatingPanel(message, isErrorFlag);
    }

    this.sendToPopup(message, isErrorFlag);

    if (autoHideDelay > 0 && STATE?.isPanelVisible) {
      this.scheduleAutoHide(message, autoHideDelay);
    }
  },

  clearMessage() {
    const { CONFIG } = window.CaptureAI || {};
    const resultElement = document.getElementById(CONFIG?.RESULT_ID || 'captureai-result');

    if (resultElement) {
      resultElement.textContent = '';
    }
  },

  showInFloatingPanel(message, isError) {
    const { CONFIG } = window.CaptureAI || {};
    const resultElement = document.getElementById(CONFIG?.RESULT_ID || 'captureai-result');

    if (resultElement) {
      const theme = this.getCurrentTheme();

      resultElement.textContent = message;
      resultElement.style.backgroundColor = 'transparent';
      resultElement.style.color = isError ? theme.errorText : theme.primaryText;
    }
  },

  handleStealthyResult(message, isError) {
    const { STATE } = window.CaptureAI || {};

    if (window.CaptureAI?.UIStealthyResult) {
      if (!STATE?.isPanelVisible) {
        window.CaptureAI.UIStealthyResult.show(message, isError);
      } else {
        window.CaptureAI.UIStealthyResult.hide();
      }
    }
  },

  sendToPopup(message, isError) {
    try {
      chrome.runtime.sendMessage({
        action: 'updateResponse',
        message: message,
        isError: isError
      });
    } catch (error) {
      const { CONFIG } = window.CaptureAI || {};
      if (CONFIG?.DEBUG) {
        console.error('CaptureAI: Failed to send message to popup:', error);
      }
    }
  },

  scheduleAutoHide(message, delay) {
    const { CONFIG } = window.CaptureAI || {};

    setTimeout(() => {
      const resultElement = document.getElementById(CONFIG?.RESULT_ID || 'captureai-result');
      if (resultElement && resultElement.textContent === message) {
        resultElement.textContent = '';
      }
    }, delay);
  },

  displayAIResponse(response, isError = false) {
    const { STATE } = window.CaptureAI || {};
    const isErrorFlag = isError === true || isError === 'error';

    if (STATE?.isPanelVisible) {
      this.showInFloatingPanel(response, isErrorFlag);
    }

    // OpenAI responses DO go to stealth result
    this.handleStealthyResult(response, isErrorFlag);
    this.sendToPopup(response, isErrorFlag);
  },

  showStealthyResult(message) {
    const { STATE } = window.CaptureAI || {};

    // Direct stealth result call (for auto-solve messages etc.)
    if (window.CaptureAI?.UIStealthyResult) {
      if (!STATE?.isPanelVisible) {
        window.CaptureAI.UIStealthyResult.show(message, false);
      } else {
        window.CaptureAI.UIStealthyResult.hide();
      }
    }
  },

  handleAskQuestion(question, imageData = null, ocrData = null) {
    const message = { action: 'askQuestion', question: question };
    if (imageData) {
      message.imageData = imageData;
    }
    if (ocrData) {
      message.ocrData = ocrData;
    }

    chrome.runtime.sendMessage(message);
  }
};
