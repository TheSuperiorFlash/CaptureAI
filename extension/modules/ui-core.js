/**
 * Core UI module - consolidated panel, theme, messaging, and handlers
 */

export const UICore = {
  initialized: false,
  floatingUICreated: false,
  panel: null,
  themeCSS: null,
  modeToggleElement: null,

  init() {
    if (this.initialized) {
      return;
    }

    this.loadFont();

    // Listen for dark mode changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.refreshThemeFromSettings();
    });

    // Listen for storage changes
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes['captureai-settings']) {
          this.refreshThemeFromSettings(changes['captureai-settings'].newValue);
        }
      });
    }

    // Set initial mode
    this.refreshThemeFromSettings();

    this.initialized = true;
  },

  async refreshThemeFromSettings(settingsOverride = null) {
    let themeValue = 'light';
    try {
      if (settingsOverride && settingsOverride.theme) {
        themeValue = settingsOverride.theme;
      } else if (chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get('captureai-settings');
        if (result['captureai-settings'] && result['captureai-settings'].theme) {
          themeValue = result['captureai-settings'].theme;
        }
      }
    } catch (e) {
      console.error('Failed to load theme settings:', e);
    }

    let isDark = false;
    if (themeValue === 'dark') {
      isDark = true;
    } else if (themeValue === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.updateThemeMode(isDark);

    // Apply pill style from config
    const { CONFIG } = window.CaptureAI;
    if (CONFIG.PILLED_UI_BUTTONS) {
      document.documentElement.setAttribute('data-pill-style', 'true');
    } else {
      document.documentElement.removeAttribute('data-pill-style');
    }
  },

  loadFont() {
    if (!document.querySelector('link[href*="Inter"]')) {
      const fontLink = document.createElement('link');
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
  },



  updateThemeMode(isDark) {
    this.isDarkMode = isDark;
    if (this.panel) {
      if (isDark) {
        this.panel.setAttribute('data-theme', 'dark');
      } else {
        this.panel.removeAttribute('data-theme');
      }
    }
  },

  injectThemeCSS() {
    if (!document.head.querySelector('#captureai-theme')) {
      const link = document.createElement('link');
      link.id = 'captureai-theme';
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('modules/theme.css');
      document.head.appendChild(link);
    }
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

      this.injectThemeCSS();
      if (this.isDarkMode !== undefined) {
        this.updateThemeMode(this.isDarkMode);
      } else {
        this.updateThemeMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }

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

    const panel = document.createElement('div');
    panel.id = CONFIG.PANEL_ID;
    panel.style.cssText = `
            position: fixed; top: 20px; right: 20px; width: 250px !important;
            background-color: var(--color-floating-panel-background) !important; 
            border-radius: var(--border-radius-floating-panel);
            backdrop-filter: var(--backdrop-floating-panel) !important; -webkit-backdrop-filter: var(--backdrop-floating-panel) !important;
            box-shadow: var(--shadow-floating-panel); z-index: 9999;
            font-family: var(--font-family-base); color: var(--color-floating-panel-text) !important;
            overflow: hidden; transition: opacity 0.1s ease-in-out; 
            opacity: 0; pointer-events: none;
        `;

    return panel;
  },

  createHeader() {
    const header = document.createElement('div');
    header.style.cssText = `
            display: flex; align-items: center; padding: var(--space-size-base-12) var(--space-size-base-15);
            justify-content: space-between; background-color: var(--color-base-transparent) !important;
            border-bottom: var(--space-size-base-1) solid var(--color-border-subtle-default) !important; cursor: move;
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
            font-weight: var(--font-weight-base-bold); font-size: var(--font-size-base-16); margin-right: var(--space-size-base-10);
            color: var(--color-text-primary-default) !important;
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

    const responseContainer = document.createElement('div');
    responseContainer.style.cssText = `
            padding: var(--space-size-base-10) var(--space-size-base-15); background-color: transparent !important;
            font-size: var(--font-size-base-14); color: var(--color-text-primary-default) !important;
            min-height: var(--size-base-52); box-sizing: border-box;
            display: flex; flex-direction: column;
        `;

    const responseTitle = document.createElement('div');
    responseTitle.textContent = 'Response:';
    responseTitle.style.cssText = `
            font-size: 14px; color: var(--color-text-secondary-default) !important; margin-bottom: var(--space-size-base-5);
        `;

    const responseContent = document.createElement('div');
    responseContent.id = CONFIG.RESULT_ID;
    responseContent.style.cssText = `
            font-size: var(--font-size-base-14); color: var(--color-text-primary-default) !important;
            word-break: break-word; background-color: var(--color-base-transparent) !important;
            flex: 1; line-height: 1.3; min-height: 18px;
        `;

    if (!STATE.apiKey) {
      responseContent.textContent = 'Extension is not activated';
      responseContent.style.color = `var(--color-text-danger-default) !important`;
    }

    responseContainer.appendChild(responseTitle);
    responseContainer.appendChild(responseContent);

    return responseContainer;
  },

  createModeToggle() {
    const { STATE } = window.CaptureAI;

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

    const modeToggleSwitch = document.createElement('div');
    modeToggleSwitch.style.cssText = `
            position: relative !important;
            width: var(--size-base-90) !important;
            height: 22px !important;
            background-color: var(--color-toggle-track-background) !important;
            border-radius: var(--border-radius-toggle-track) !important;
            box-shadow: 0 0 0 1px var(--color-toggle-track-border) !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            align-items: center !important;
            font-size: var(--font-size-base-11) !important;
            font-weight: var(--font-weight-base-medium) !important;
            font-family: var(--font-family-base) !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
        `;

    // Sliding indicator
    const toggleSlider = document.createElement('div');
    toggleSlider.style.cssText = `
            position: absolute !important;
            width: ${STATE.isAskMode ? '34px' : '56px'} !important;
            height: 22px !important;
            background-color: var(--color-toggle-active-background) !important;
            border-radius: var(--border-radius-toggle-slider) !important;
            top: 0 !important;
            left: ${STATE.isAskMode ? '56px' : '-1px'} !important;
            transition: all 0.3s ease !important;
            z-index: 1 !important;
            transform: translateZ(0) !important;
        `;

    // Capture label
    const captureLabel = document.createElement('span');
    captureLabel.textContent = 'Capture';
    captureLabel.style.cssText = `
            position: absolute !important;
            left: var(--space-size-base-8) !important;
            color: ${STATE.isAskMode ? 'var(--color-text-secondary-default)' : 'var(--color-text-inverse-default)'} !important;
            font-size: var(--font-size-base-10) !important;
            font-weight: var(--font-weight-base-medium) !important;
            z-index: 2 !important;
            transition: color 0.3s ease !important;
            font-family: var(--font-family-base) !important;
            white-space: nowrap !important;
        `;

    // Ask label
    const askLabel = document.createElement('span');
    askLabel.textContent = 'Ask';
    askLabel.style.cssText = `
            position: absolute !important;
            right: var(--space-size-base-8) !important;
            color: ${STATE.isAskMode ? 'var(--color-text-inverse-default)' : 'var(--color-text-secondary-default)'} !important;
            font-size: var(--font-size-base-10) !important;
            font-weight: var(--font-weight-base-medium) !important;
            z-index: 2 !important;
            transition: color 0.3s ease !important;
            font-family: var(--font-family-base) !important;
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
        toggleSlider.style.left = '55px';
        toggleSlider.style.width = '38px';
        captureLabel.style.color = 'var(--color-text-secondary-default)';
        askLabel.style.color = 'var(--color-text-inverse-default)';
      } else {
        toggleSlider.style.left = '-1px';
        toggleSlider.style.width = '55px';
        captureLabel.style.color = 'var(--color-text-inverse-default)';
        askLabel.style.color = 'var(--color-text-secondary-default)';
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

  setPanelVisibility(visible) {
    const { STATE, DOM_CACHE } = window.CaptureAI;
    if (!DOM_CACHE.panel) return;

    if (visible) {
      DOM_CACHE.panel.style.opacity = '1';
      DOM_CACHE.panel.style.pointerEvents = 'auto';
      STATE.isPanelVisible = true;
    } else {
      DOM_CACHE.panel.style.opacity = '0';
      DOM_CACHE.panel.style.pointerEvents = 'none';
      STATE.isPanelVisible = false;
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

      // If we just created it, we need a frame delay for the transition to show
      requestAnimationFrame(() => {
        this.setPanelVisibility(true);
      });
      return;
    }

    this.setPanelVisibility(!STATE.isPanelVisible);
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

    this.showInFloatingPanel(message, isErrorFlag);
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
      resultElement.textContent = message;
      resultElement.style.backgroundColor = 'transparent';
      resultElement.style.color = isError ? 'var(--color-text-danger-default)' : 'var(--color-text-primary-default)';
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

    this.showInFloatingPanel(response, isErrorFlag);

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

  handleAskQuestion(question, attachedImages = []) {
    const message = { action: 'askQuestion', question: question };
    if (attachedImages.length > 0) {
      message.images = attachedImages.map(img => ({
        imageData: img.imageData,
        ocrData: img.ocrData
      }));
    }

    chrome.runtime.sendMessage(message);
  }
};
