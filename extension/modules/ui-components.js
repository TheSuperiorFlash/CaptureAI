/**
 * UI Components - buttons, toggles, and interactive elements
 */

export const UIComponents = {
  floatingUICreated: false,
  panel: null,
  buttonsContainer: null,
  askModeContainer: null,

  createUI() {
    if (this.floatingUICreated && this.panel) {
      return this.panel;
    }

    try {
      // Initialize UICore first
      if (window.CaptureAI.UICore?.init) {
        window.CaptureAI.UICore.init();
      }

      // Create the main panel using UICore
      if (window.CaptureAI.UICore?.createUI) {
        this.panel = window.CaptureAI.UICore.createUI();
      } else {
        console.error('UICore not available');
        return null;
      }

      this.attachButtons();
      this.attachAskMode();

      // Set initial state
      setTimeout(async () => {
        const { STATE } = window.CaptureAI;
        if (STATE.isAskMode) {
          this.buttonsContainer.style.display = 'none';
          this.askModeContainer.style.display = 'flex';
          this.askModeContainer.style.opacity = '1';
        } else {
          this.askModeContainer.style.display = 'none';
          this.buttonsContainer.style.display = 'flex';
        }

        // Update mode toggle visibility based on tier
        if (window.CaptureAI.UICore?.updateModeToggleForTier) {
          await window.CaptureAI.UICore.updateModeToggleForTier();
        }
      }, 50);

      this.floatingUICreated = true;
      return this.panel;

    } catch (error) {
      console.error('Failed to create UI:', error);
      return null;
    }
  },

  attachButtons() {
    if (!this.panel) {
      this.panel = window.CaptureAI.UICore?.panel || document.getElementById(window.CaptureAI.CONFIG?.PANEL_ID);
    }
    if (!this.panel) {
      return;
    }

    const theme = this.getTheme();

    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.setAttribute('data-captureai-buttons', 'true');
    this.buttonsContainer.style.cssText = `
            padding: 15px; width: 250px !important; display: flex;
            background-color: ${theme.primaryBg} !important; flex-direction: column;
            gap: 10px; box-sizing: border-box !important;
        `;

    const captureButton = this.createCaptureButton(theme);
    const quickCaptureButton = this.createQuickCaptureButton(theme);

    this.buttonsContainer.appendChild(captureButton);
    this.buttonsContainer.appendChild(quickCaptureButton);

    // Auto-solve only for Pro tier on supported sites
    if (window.CaptureAI.DomainUtils?.isOnSupportedSite()) {
      this.updateAutoSolveForTier();
    }

    if (window.CaptureAI.UICore?.attachComponent) {
      window.CaptureAI.UICore.attachComponent(this.buttonsContainer, 'after-response');
    } else {
      this.panel.appendChild(this.buttonsContainer);
    }
  },

  getTheme() {
    if (window.CaptureAI.UICore?.getCurrentTheme) {
      return window.CaptureAI.UICore.getCurrentTheme();
    }
    // Fallback theme
    return {
      primaryBg: 'white',
      headerBg: '#f5f5f5',
      toggleBg: '#f0f0f0',
      toggleInactiveBg: '#f1f1f1',
      primaryText: '#333333',
      secondaryText: '#666666',
      border: '#e0e0e0',
      buttonBorder: '#d1d1d1',
      buttonPrimary: '#4caf65',
      errorText: '#ff6b6b'
    };
  },

  createCaptureButton(theme) {
    const captureButton = document.createElement('div');
    captureButton.style.cssText = `display: flex; align-items: center; justify-content: center; padding: 10px; width: 100% !important; background-color: ${theme.buttonPrimary} !important; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.15); box-sizing: border-box !important;`;
    captureButton.innerHTML = `<img src="${window.CaptureAI?.ICONS?.CAMERA || ''}" style="width: 20px; height: 20px; margin-right: 10px;"><span style="font-weight: bold; color: white !important; font-size: 14px;">Capture a Question</span>`;

    captureButton.addEventListener('click', () => {
      if (window.CaptureAI.CaptureSystem?.startCapture) {
        window.CaptureAI.CaptureSystem.startCapture();
      }
    });

    return captureButton;
  },

  createQuickCaptureButton(theme) {
    const quickCaptureButton = document.createElement('div');
    quickCaptureButton.style.cssText = `display: flex; align-items: center; justify-content: center; padding: 10px; width: 100% !important; background-color: ${theme.toggleInactiveBg} !important; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.15); border: 1px solid ${theme.buttonBorder}; box-sizing: border-box !important;`;
    quickCaptureButton.innerHTML = `<span style="font-weight: bold; color: ${theme.primaryText} !important; font-size: 14px;">Quick Capture</span>`;

    quickCaptureButton.addEventListener('click', () => {
      if (window.CaptureAI.CaptureSystem?.quickCapture) {
        window.CaptureAI.CaptureSystem.quickCapture();
      } else {
        this.showMessage('No previous capture area found.', true);
      }
    });

    return quickCaptureButton;
  },

  createAutoSolveToggle(theme) {
    const autoSolveContainer = document.createElement('div');
    autoSolveContainer.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 4px 5px 0px 5px; width: 100% !important; box-sizing: border-box !important;';
    autoSolveContainer.innerHTML = `<span style="font-size: 14px; color: ${theme.secondaryText} !important; font-weight: 500;">Auto-solve:</span>`;
    const toggleLabel = autoSolveContainer.querySelector('span');

    const toggleSwitch = this.createToggleSwitch(theme);

    autoSolveContainer.appendChild(toggleLabel);
    autoSolveContainer.appendChild(toggleSwitch);

    return autoSolveContainer;
  },

  createToggleSwitch(theme) {
    const { STATE } = window.CaptureAI;

    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'captureai-toggle-switch';
    toggleSwitch.style.cssText = 'position: relative; display: inline-block; width: 30px; height: 20px;';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.id = 'auto-solve-toggle';
    toggleInput.checked = STATE.isAutoSolveMode;
    toggleInput.style.cssText = 'opacity: 0; width: 0; height: 0;';

    const toggleSlider = document.createElement('span');
    toggleSlider.style.cssText = `position: absolute; cursor: pointer; top: 0; left: 0; width: 30px; height: 20px; transition: .3s; border-radius: 34px; background-color: ${STATE.isAutoSolveMode ? theme.buttonPrimary : theme.toggleInactiveBg};`;

    const toggleSliderButton = document.createElement('span');
    toggleSliderButton.style.cssText = `position: absolute !important; height: 16px !important; width: 16px !important; top: 2px !important; background-color: #ffffff !important; transition: .4s !important; border-radius: 34px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important; left: ${STATE.isAutoSolveMode ? '12px' : '2px'} !important;`;

    toggleSlider.appendChild(toggleSliderButton);
    toggleSwitch.appendChild(toggleInput);
    toggleSwitch.appendChild(toggleSlider);

    toggleInput.addEventListener('change', async () => {
      if (window.CaptureAI.AutoSolve?.toggleAutoSolveMode) {
        try {
          await window.CaptureAI.AutoSolve.toggleAutoSolveMode();
          toggleSlider.style.backgroundColor = STATE.isAutoSolveMode ? theme.buttonPrimary : theme.toggleInactiveBg;
          toggleSliderButton.style.left = STATE.isAutoSolveMode ? '12px' : '2px';
        } catch (error) {
          const { CONFIG } = window.CaptureAI || {};
          if (CONFIG?.DEBUG) {
            console.error('CaptureAI: Failed to toggle auto-solve mode:', error);
          }
        }
      }
    });

    return toggleSwitch;
  },

  attachAskMode() {
    if (!this.panel) {
      this.panel = window.CaptureAI.UICore?.panel || document.getElementById(window.CaptureAI.CONFIG?.PANEL_ID);
    }
    if (!this.panel) {
      return;
    }

    const theme = this.getTheme();

    this.createAskModeComponents(theme);
    this.setupAskModeEventHandlers();

    if (window.CaptureAI.UICore?.attachComponent) {
      window.CaptureAI.UICore.attachComponent(this.askModeContainer);
    } else {
      this.panel.appendChild(this.askModeContainer);
    }
  },

  createAskModeComponents(theme) {
    // Create container
    this.askModeContainer = document.createElement('div');
    this.askModeContainer.setAttribute('data-captureai-ask', 'true');
    this.askModeContainer.id = 'ask-mode-container';
    this.askModeContainer.style.cssText = `
            padding: 15px;
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
            display: none;
            background-color: ${theme.primaryBg} !important;
            flex-direction: column;
            gap: 10px;
            box-sizing: border-box !important;
            opacity: 0;
            transform: translateY(0px);
            transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
        `;


    // Create text input wrapper
    const textInputWrapper = document.createElement('div');
    textInputWrapper.style.cssText = 'position: relative; width: 100%;';

    // Create text input
    this.askTextInput = document.createElement('textarea');
    this.askTextInput.placeholder = 'Ask anything...';
    this.askTextInput.style.cssText = `
            width: 100% !important;
            min-height: 60px;
            max-height: 150px;
            padding: 10px;
            border: 1px solid ${theme.border};
            border-radius: 8px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            color: ${theme.primaryText};
            background-color: ${theme.toggleBg};
            resize: none;
            outline: none;
            box-sizing: border-box;
            overflow-y: hidden;
        `;

    // Create image preview container for multiple images
    this.imagePreviewContainer = document.createElement('div');
    this.imagePreviewContainer.style.cssText = `
            display: none;
            position: absolute;
            top: 8px;
            left: 8px;
            z-index: 10;
            gap: 6px;
        `;

    textInputWrapper.appendChild(this.askTextInput);
    textInputWrapper.appendChild(this.imagePreviewContainer);

    // Create button row
    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display: flex; gap: 8px; width: 100%;';

    // Create attach image button
    this.attachImageButton = document.createElement('div');
    this.attachImageButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            width: 40px;
            background-color: ${theme.toggleInactiveBg} !important;
            border: 1px solid ${theme.buttonBorder};
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            box-sizing: border-box !important;
            transition: background-color 0.2s;
        `;

    const attachIcon = document.createElement('img');
    if (window.CaptureAI?.ICONS?.ATTACH) {
      attachIcon.src = window.CaptureAI.ICONS.ATTACH;
    }
    attachIcon.alt = 'Attach image';
    attachIcon.style.cssText = `
            width: 20px;
            height: 20px;
        `;

    this.attachImageButton.appendChild(attachIcon);
    this.attachImageButton.title = 'Attach image';

    // Create ask button
    this.askButton = document.createElement('div');
    this.askButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            flex: 1;
            background-color: ${theme.buttonPrimary} !important;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            box-sizing: border-box !important;
        `;

    const askButtonText = document.createElement('span');
    askButtonText.textContent = 'Ask Question';
    askButtonText.style.cssText = `
            font-weight: bold;
            color: white !important;
            font-size: 14px;
        `;

    this.askButton.appendChild(askButtonText);

    buttonRow.appendChild(this.attachImageButton);
    buttonRow.appendChild(this.askButton);

    this.askModeContainer.appendChild(textInputWrapper);
    this.askModeContainer.appendChild(buttonRow);

    this.attachedImages = [];
  },

  setupAskModeEventHandlers() {
    if (!this.askTextInput || !this.askButton || !this.attachImageButton) {
      return;
    }

    // Auto-resize functionality
    this.askTextInput.addEventListener('input', () => {
      this.resizeTextarea();
    });

    // Keyboard shortcuts
    this.askTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (this.askTextInput.value.trim() || this.attachedImages.length > 0) {
          this.handleAskModeQuestion();
        }
      }
    });

    // Ask button click
    this.askButton.addEventListener('click', () => {
      if (this.askTextInput.value.trim() || this.attachedImages.length > 0) {
        this.handleAskModeQuestion();
      }
    });

    // Attach image button click
    this.attachImageButton.addEventListener('click', () => {
      this.startImageCapture();
    });

  },

  resizeTextarea() {
    if (!this.askTextInput) {
      return;
    }
    this.askTextInput.style.height = '60px';
    const scrollHeight = this.askTextInput.scrollHeight;
    this.askTextInput.style.height = Math.min(Math.max(scrollHeight, 60), 150) + 'px';
    this.askTextInput.style.overflowY = scrollHeight > 150 ? 'auto' : 'hidden';
  },

  handleAskModeQuestion() {
    const question = this.askTextInput.value.trim();

    // Show "Processing..." message
    this.showMessage('Processing...', false);

    this.handleAskQuestion(question, this.attachedImages);
    this.clearAskInput();
  },

  clearAskInput() {
    if (this.askTextInput) {
      this.askTextInput.value = '';
      this.askTextInput.style.height = '60px';
    }
    this.removeAttachedImage();
  },

  startImageCapture() {
    try {
      if (window.CaptureAI.CaptureSystem?.startCapture) {
        // Show "Capturing..." message
        this.showMessage('Capturing...', false);

        window.CaptureAI.STATE.askModeInstance = this;
        window.CaptureAI.CaptureSystem.startCapture(true);
      }
    } catch (error) {
      const { CONFIG } = window.CaptureAI || {};
      if (CONFIG?.DEBUG) {
        console.error('CaptureAI: Failed to start image capture for ask mode:', error);
      }
    }
  },

  setAttachedImage(imageData, ocrData = null) {
    if (this.attachedImages.length >= 3) {
      return;
    }

    this.attachedImages.push({ imageData, ocrData });
    this.renderImagePreviews();

    // Clear the "Capturing..." message now that image is attached
    if (window.CaptureAI.UICore?.clearMessage) {
      window.CaptureAI.UICore.clearMessage();
    }
  },

  removeAttachedImage(index) {
    if (index !== undefined) {
      this.attachedImages.splice(index, 1);
    } else {
      this.attachedImages = [];
    }
    this.renderImagePreviews();
  },

  renderImagePreviews() {
    if (!this.imagePreviewContainer) {
      return;
    }

    // Clear existing previews safely
    while (this.imagePreviewContainer.firstChild) {
      this.imagePreviewContainer.removeChild(this.imagePreviewContainer.firstChild);
    }

    if (this.attachedImages.length === 0) {
      this.imagePreviewContainer.style.display = 'none';
      this.askTextInput.style.paddingTop = '10px';
      this.resizeTextarea();
      const theme = this.getTheme();
      this.attachImageButton.style.backgroundColor = theme.toggleInactiveBg;
      this.attachImageButton.style.display = 'flex';
      const attachIcon = this.attachImageButton.querySelector('img');
      if (attachIcon && window.CaptureAI?.ICONS?.ATTACH) {
        attachIcon.src = window.CaptureAI.ICONS.ATTACH;
      }
      return;
    }

    // Show container and adjust textarea padding
    this.imagePreviewContainer.style.display = 'flex';
    this.askTextInput.style.paddingTop = '80px';
    this.resizeTextarea();

    // Render each image preview slot
    for (let i = 0; i < this.attachedImages.length; i++) {
      const slot = this.createImagePreviewSlot(this.attachedImages[i], i);
      this.imagePreviewContainer.appendChild(slot);
    }

    // Hide attach button when at max (3 images)
    if (this.attachedImages.length >= 3) {
      this.attachImageButton.style.display = 'none';
    } else {
      this.attachImageButton.style.display = 'flex';
      this.attachImageButton.style.backgroundColor = 'rgba(40, 40, 40, 0.45)';
      const attachIcon = this.attachImageButton.querySelector('img');
      if (attachIcon && window.CaptureAI?.ICONS?.ATTACHED) {
        attachIcon.src = window.CaptureAI.ICONS.ATTACHED;
      }
    }
  },

  createImagePreviewSlot(imageEntry, index) {
    const theme = this.getTheme();

    const slot = document.createElement('div');
    slot.style.cssText = `
            position: relative;
            width: 64px;
            height: 64px;
            border-radius: 10px;
            overflow: hidden;
            border: 2px solid ${theme.border};
            background-color: ${theme.toggleBg};
            flex-shrink: 0;
        `;

    const img = document.createElement('img');
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    img.src = imageEntry.imageData;

    const removeBtn = document.createElement('div');
    removeBtn.style.cssText = `
            position: absolute;
            top: 3px;
            right: 3px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: ${theme.primaryBg};
            color: ${theme.primaryText};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 10px;
            font-weight: bold;
            line-height: 1;
        `;
    removeBtn.textContent = '\u2715';
    removeBtn.addEventListener('click', () => {
      this.removeAttachedImage(index);
    });

    slot.appendChild(img);
    slot.appendChild(removeBtn);

    return slot;
  },

  showMessage(message, isError = false) {
    if (window.CaptureAI.UICore?.showMessage) {
      window.CaptureAI.UICore.showMessage(message, isError);
    }
  },

  handleAskQuestion(question, attachedImages = []) {
    if (window.CaptureAI.UICore?.handleAskQuestion) {
      window.CaptureAI.UICore.handleAskQuestion(question, attachedImages);
    }
  },

  ensureAskModeExists() {
    if (!this.askModeContainer) {
      this.attachAskMode();
    }
    return this.askModeContainer;
  },

  updateAutoSolveVisibility() {
    if (!this.buttonsContainer) {
      return;
    }

    if (window.CaptureAI.DomainUtils?.isOnSupportedSite()) {
      this.updateAutoSolveForTier();
    } else {
      const autoSolveContainer = this.buttonsContainer.querySelector('.captureai-toggle-switch')?.closest('div');
      if (autoSolveContainer) {
        autoSolveContainer.style.display = 'none';
      }
    }
  },

  async updateAutoSolveForTier() {
    if (!this.buttonsContainer) {
      return;
    }

    const autoSolveContainer = this.buttonsContainer.querySelector('.captureai-toggle-switch')?.closest('div');

    // Check user tier
    let userTier = 'free';
    try {
      const userTierData = await chrome.storage.local.get('captureai-user-tier');
      userTier = userTierData['captureai-user-tier'] || 'free';
    } catch (error) {
      console.error('Failed to get user tier:', error);
    }

    // Only show auto-solve for Pro tier
    if (userTier === 'pro') {
      if (autoSolveContainer) {
        autoSolveContainer.style.display = 'flex';
      } else {
        const theme = this.getTheme();
        const newAutoSolveContainer = this.createAutoSolveToggle(theme);
        this.buttonsContainer.appendChild(newAutoSolveContainer);
      }
    } else {
      if (autoSolveContainer) {
        autoSolveContainer.style.display = 'none';
      }
    }
  }
};
