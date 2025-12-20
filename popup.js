/**
 * CaptureAI Popup Script (License Key System)
 * Manages extension popup UI with license key authentication
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const elements = {
    statusSection: document.getElementById('status-section'),
    statusMessage: document.getElementById('status-message'),
    responseSection: document.getElementById('response-section'),
    responseContent: document.getElementById('response-content'),
    migrationNotice: document.getElementById('migration-notice'),
    migrationNoticeText: document.getElementById('migration-notice-text'),
    licenseKeySection: document.getElementById('license-key-section'),
    licenseKeyInput: document.getElementById('license-key-input'),
    activateBtn: document.getElementById('activate-btn'),
    mainControls: document.getElementById('main-controls'),
    userEmail: document.getElementById('user-email'),
    userTier: document.getElementById('user-tier'),
    usageSection: document.getElementById('usage-stats'),
    usageContent: document.getElementById('usage-content'),
    upgradeBtn: document.getElementById('upgrade-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    captureBtn: document.getElementById('capture-btn'),
    quickCaptureBtn: document.getElementById('quick-capture-btn'),
    headerUiToggle: document.getElementById('header-ui-toggle'),
    helpToggle: document.getElementById('help-toggle'),
    helpContent: document.getElementById('help-content'),
    helpArrow: document.getElementById('help-arrow'),
    reasoningSlider: document.getElementById('reasoning-slider')
  };

  // State variables
  let currentState = {
    user: null,
    isPanelVisible: false,
    hasLastCaptureArea: false,
    currentResponse: ''
  };

  // Initialize popup state and UI
  await initializePopup();

  // License key event listeners
  elements.activateBtn.addEventListener('click', handleActivate);
  elements.logoutBtn.addEventListener('click', handleDeactivate);
  elements.upgradeBtn.addEventListener('click', handleUpgrade);

  // Main control event listeners
  elements.captureBtn.addEventListener('click', startCapture);
  elements.quickCaptureBtn.addEventListener('click', quickCapture);
  elements.headerUiToggle.addEventListener('click', togglePanel);
  elements.helpToggle.addEventListener('click', toggleHelp);

  // Setup reasoning toggle
  setupReasoningToggle();

  // Add Enter key support for license key input
  elements.licenseKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleActivate();
  });

  /**
   * Initialize popup state and check for license key
   */
  async function initializePopup() {
    try {
      // Check for migration notice
      const migrationNotice = await Migration.getMigrationNotice();
      if (migrationNotice) {
        elements.migrationNoticeText.textContent = migrationNotice;
        elements.migrationNotice.classList.remove('hidden');
        // Clear the notice after showing it
        setTimeout(() => {
          Migration.clearMigrationNotice();
          elements.migrationNotice.classList.add('hidden');
        }, 10000); // Hide after 10 seconds
      }

      // Load reasoning level from storage
      const result = await chrome.storage.local.get('captureai-reasoning-level');
      const reasoningLevel = result['captureai-reasoning-level'];
      const level = reasoningLevel !== undefined ? reasoningLevel : 1;
      elements.reasoningSlider.value = level;

      // Load and display custom keybinds
      await updateKeybindsDisplay();

      // Check if activated (has valid license key)
      const isActivated = await AuthService.isActivated();

      if (isActivated) {
        await showMainControls();
      } else {
        showLicenseKeyInput();
      }
    } catch (error) {
      console.error('Initialization error:', error);
      showResponseMessage('Error initializing popup', 'error');
      showLicenseKeyInput();
    }
  }

  /**
   * Handle license key activation
   */
  async function handleActivate() {
    const licenseKey = elements.licenseKeyInput.value.trim();

    if (!licenseKey) {
      showResponseMessage('Please enter a license key', 'error');
      return;
    }

    elements.activateBtn.disabled = true;
    elements.activateBtn.textContent = 'Activating...';

    try {
      await AuthService.validateKey(licenseKey);
      showResponseMessage('License key activated successfully!', 'success');

      setTimeout(async () => {
        await showMainControls();
      }, 500);
    } catch (error) {
      console.error('Activation error:', error);
      showResponseMessage(error.message || 'Invalid license key', 'error');
      elements.activateBtn.disabled = false;
      elements.activateBtn.textContent = 'Activate';
    }
  }


  /**
   * Handle buy pro click - prompt for email
   */
  async function handleBuyPro() {
    const email = prompt('Enter your email to receive your Pro license key:');

    if (!email) return;

    // Validate email
    if (!email.includes('@')) {
      showResponseMessage('Please enter a valid email address', 'error');
      return;
    }

    elements.buyProBtn.disabled = true;
    elements.buyProBtn.textContent = 'Opening checkout...';

    try {
      const checkout = await AuthService.createCheckoutSession(email);

      // Open Stripe checkout in new tab
      chrome.tabs.create({ url: checkout.url });

      showResponseMessage('Check your email for your license key after payment!', 'success');

      // Re-enable button after a delay
      setTimeout(() => {
        elements.buyProBtn.disabled = false;
        elements.buyProBtn.textContent = 'Buy Pro Key ($9.99/month)';
      }, 3000);
    } catch (error) {
      console.error('Checkout error:', error);
      showResponseMessage(error.message || 'Failed to start checkout', 'error');
      elements.buyProBtn.disabled = false;
      elements.buyProBtn.textContent = 'Buy Pro Key ($9.99/month)';
    }
  }

  /**
   * Handle deactivation (clear license key)
   */
  async function handleDeactivate() {
    const confirm = window.confirm('Are you sure you want to deactivate? You will need to enter your license key again.');

    if (!confirm) return;

    try {
      await AuthService.clearKey();
      currentState.user = null;
      showResponseMessage('License key cleared', 'success');

      setTimeout(() => {
        showLicenseKeyInput();
      }, 500);
    } catch (error) {
      console.error('Deactivation error:', error);
      showResponseMessage('Failed to clear license key', 'error');
    }
  }

  /**
   * Handle upgrade button click
   */
  async function handleUpgrade() {
    if (!currentState.user || !currentState.user.email) {
      const email = prompt('Enter your email to upgrade:');
      if (!email) return;

      if (!email.includes('@')) {
        showResponseMessage('Please enter a valid email address', 'error');
        return;
      }

      return handleBuyProWithEmail(email);
    }

    return handleBuyProWithEmail(currentState.user.email);
  }

  async function handleBuyProWithEmail(email) {
    elements.upgradeBtn.disabled = true;
    elements.upgradeBtn.textContent = 'Loading...';

    try {
      const checkout = await AuthService.createCheckoutSession(email);

      chrome.tabs.create({ url: checkout.url });

      showResponseMessage('Check your email for your Pro license key after payment!', 'success');

      elements.upgradeBtn.disabled = false;
      elements.upgradeBtn.textContent = 'Upgrade to Pro';
    } catch (error) {
      console.error('Upgrade error:', error);
      showResponseMessage(error.message || 'Failed to start upgrade', 'error');
      elements.upgradeBtn.disabled = false;
      elements.upgradeBtn.textContent = 'Upgrade to Pro';
    }
  }

  /**
   * Show license key input screen
   */
  function showLicenseKeyInput() {
    elements.licenseKeySection.classList.remove('hidden');
    elements.mainControls.classList.add('hidden');

    // Clear input
    elements.licenseKeyInput.value = '';
    elements.activateBtn.disabled = false;
    elements.activateBtn.textContent = 'Activate';
  }

  /**
   * Show main controls (activated state)
   */
  async function showMainControls() {
    try {
      // Get user info
      const user = await AuthService.getCurrentUser();
      currentState.user = user;

      // Update UI
      elements.licenseKeySection.classList.add('hidden');
      elements.mainControls.classList.remove('hidden');

      // Display user info
      if (user.email) {
        elements.userEmail.textContent = user.email;
      } else {
        elements.userEmail.textContent = 'License activated';
      }

      elements.userTier.textContent = user.tier.toUpperCase();

      // Show upgrade button only for free tier
      if (user.tier === 'free') {
        elements.upgradeBtn.classList.remove('hidden');
        elements.userTier.style.background = '#999';
      } else {
        elements.upgradeBtn.classList.add('hidden');
        // Purple gradient for Pro tier
        elements.userTier.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }

      // Load and display usage stats (only for free tier)
      if (user.tier === 'free') {
        await updateUsageStats();
        elements.usageSection.classList.remove('hidden');
      } else {
        elements.usageSection.classList.add('hidden');
      }

      // Show reasoning slider only for Pro tier
      const reasoningSection = document.getElementById('reasoning-section');
      if (user.tier === 'pro') {
        reasoningSection.classList.remove('hidden');
      } else {
        reasoningSection.classList.add('hidden');
      }

      // Get current state from content script
      await updateStateFromContentScript();
    } catch (error) {
      console.error('Error loading user info:', error);
      showResponseMessage('Error loading user info', 'error');
      showLicenseKeyInput();
    }
  }

  /**
   * Update usage statistics display
   */
  async function updateUsageStats() {
    try {
      const usage = await AuthService.getUsage();

      let html = '';

      if (usage.limitType === 'per_day') {
        // Free tier - show daily stats
        html = `
          <div style="font-size: 13px; color: #333; margin-bottom: 4px;">
            <strong>${usage.today.used}</strong> / ${usage.today.limit} requests today
          </div>
          <div style="width: 100%; height: 6px; background-color: #e0e0e0; border-radius: 3px; overflow: hidden;">
            <div style="width: ${usage.today.percentage}%; height: 100%; background-color: #218aff; transition: width 0.3s;"></div>
          </div>
          <div style="font-size: 11px; color: #666; margin-top: 4px;">
            ${usage.today.remaining} requests remaining
          </div>
        `;
      } else {
        // Pro tier - show per-minute stats
        html = `
          <div style="font-size: 13px; color: #333; margin-bottom: 4px;">
            <strong>${usage.lastMinute.used}</strong> / ${usage.lastMinute.limit} requests/minute
          </div>
          <div style="width: 100%; height: 6px; background-color: #e0e0e0; border-radius: 3px; overflow: hidden;">
            <div style="width: ${usage.lastMinute.percentage}%; height: 100%; background-color: #218aff; transition: width 0.3s;"></div>
          </div>
          <div style="font-size: 11px; color: #666; margin-top: 4px;">
            ${usage.today.used} requests used today (unlimited)
          </div>
        `;
      }

      elements.usageContent.innerHTML = html;
    } catch (error) {
      console.error('Error loading usage stats:', error);
      elements.usageContent.innerHTML = '<div style="font-size: 12px; color: #999;">Unable to load usage stats</div>';
    }
  }

  /**
   * Get current state from content script
   */
  async function updateStateFromContentScript() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Check if we're on a valid page for content scripts
      if (tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('moz-extension://') ||
          tab.url.startsWith('edge-extension://') ||
          tab.url === 'about:blank' ||
          tab.url.startsWith('about:')) {
        showResponseMessage('Extension doesn\'t work on this page. Please open a different website.', 'info');
        disableContentScriptFeatures();
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getState' });

      if (response && response.success) {
        currentState = { ...currentState, ...response.state };
        updateResponseDisplay();
        updateUI();
      } else if (response && response.error === 'Modules not loaded yet') {
        setTimeout(async () => {
          try {
            const retryResponse = await chrome.tabs.sendMessage(tab.id, { action: 'getState' });
            if (retryResponse && retryResponse.success) {
              currentState = { ...currentState, ...retryResponse.state };
              updateResponseDisplay();
              updateUI();
              elements.captureBtn.disabled = false;
              elements.quickCaptureBtn.disabled = false;
              elements.headerUiToggle.disabled = false;
            }
          } catch (_retryError) {
            // Silent
          }
        }, 2000);
        showResponseMessage('Extension loading, please wait...', 'info');
      }
    } catch (_error) {
      showResponseMessage('Page not ready for CaptureAI features', 'info');
      disableContentScriptFeatures();
    }
  }

  /**
   * Disable features that require content script when not available
   */
  function disableContentScriptFeatures() {
    elements.captureBtn.disabled = true;
    elements.quickCaptureBtn.disabled = true;
    elements.headerUiToggle.disabled = true;
  }

  /**
   * Update popup UI elements based on current state
   */
  function updateUI() {
    elements.quickCaptureBtn.textContent = 'Quick Capture';
    elements.headerUiToggle.textContent = currentState.isPanelVisible ? 'Hide UI' : 'Show UI';
  }

  /**
   * Update the response content display area
   */
  function updateResponseDisplay() {
    if (currentState.currentResponse) {
      elements.responseContent.textContent = currentState.currentResponse;
      elements.responseContent.className = 'response-content';
    } else {
      elements.responseContent.textContent = '';
      elements.responseContent.className = 'response-content empty';
    }
  }

  /**
   * Start screenshot capture process
   */
  async function startCapture() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        showResponseMessage('Cannot capture on this page type', 'error');
        return;
      }

      await ensureContentScriptLoaded(tab.id);

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });

      if (response && response.success) {
        showResponseMessage('Capture started - select an area on the page', 'info');
        window.close();
      } else {
        showResponseMessage('Error starting capture', 'error');
      }
    } catch (_error) {
      showResponseMessage('Page not ready - please refresh and try again', 'error');
    }
  }

  /**
   * Perform quick capture using last saved area
   */
  async function quickCapture() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        showResponseMessage('Cannot capture on this page type', 'error');
        return;
      }

      await ensureContentScriptLoaded(tab.id);

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'quickCapture' });

      if (response && response.success) {
        showResponseMessage('Quick capture started', 'info');
        window.close();
      } else {
        showResponseMessage(response.error || 'Error with quick capture', 'error');
      }
    } catch (_error) {
      showResponseMessage('Page not ready - please refresh and try again', 'error');
    }
  }

  /**
   * Toggle content script panel visibility
   */
  async function togglePanel() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        showResponseMessage('UI toggle not available on this page type', 'error');
        return;
      }

      await ensureContentScriptLoaded(tab.id);

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          if (window.CaptureAI && window.CaptureAI.UICore && window.CaptureAI.UICore.togglePanelVisibility) {
            window.CaptureAI.UICore.togglePanelVisibility();
          }
        }
      });

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getState' });
      if (response && response.success) {
        currentState.isPanelVisible = response.state.isPanelVisible;
        updateUI();
      }

    } catch (_error) {
      showResponseMessage('Page not ready - please refresh and try again', 'error');
    }
  }

  /**
   * Toggle help section visibility
   */
  function toggleHelp() {
    const isExpanded = elements.helpContent.classList.contains('expanded');

    if (isExpanded) {
      elements.helpContent.classList.remove('expanded');
      elements.helpArrow.classList.remove('expanded');
    } else {
      elements.helpContent.classList.add('expanded');
      elements.helpArrow.classList.add('expanded');
    }
  }

  /**
   * Ensure content script is loaded in the target tab
   */
  async function ensureContentScriptLoaded(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (_error) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (_injectionError) {
        throw new Error('Could not load content script');
      }
    }
  }

  /**
   * Show message in the response display area
   */
  function showResponseMessage(message, type) {
    elements.responseContent.textContent = message;

    if (type === 'error') {
      elements.responseContent.className = 'response-content error';
    } else if (type === 'success') {
      elements.responseContent.className = 'response-content';
      elements.responseContent.style.color = '#008000';
    } else {
      elements.responseContent.className = 'response-content';
    }
  }

  /**
   * Listen for response updates from content script
   */
  chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    if (request.action === 'updateResponse') {
      currentState.currentResponse = request.message;
      currentState.isError = request.isError || false;

      elements.responseContent.textContent = request.message;
      elements.responseContent.className = request.isError ? 'response-content error' : 'response-content';
    }
  });

  /**
   * Update keybinds display with user's custom shortcuts
   */
  async function updateKeybindsDisplay() {
    try {
      const commands = await chrome.commands.getAll();

      const keybindMap = {
        'toggle_ui_shortcut': {
          selector: '.help-item:nth-child(2) .help-shortcut',
          description: 'Toggle UI panel'
        },
        'capture_shortcut': {
          selector: '.help-item:nth-child(3) .help-shortcut',
          description: 'Start area capture'
        },
        'quick_capture_shortcut': {
          selector: '.help-item:nth-child(4) .help-shortcut',
          description: 'Quick capture'
        }
      };

      commands.forEach(command => {
        if (keybindMap[command.name]) {
          const element = document.querySelector(keybindMap[command.name].selector);
          if (element) {
            element.textContent = command.shortcut || 'Not set';
          }
        }
      });
    } catch (error) {
      console.error('Error loading keybinds:', error);
    }
  }

  /**
   * Save reasoning level to storage
   */
  async function saveReasoningLevel() {
    try {
      const level = parseInt(elements.reasoningSlider.value);
      await chrome.storage.local.set({ 'captureai-reasoning-level': level });
    } catch (error) {
      console.error('Error saving reasoning level:', error);
    }
  }

  /**
   * Setup reasoning toggle interaction
   */
  function setupReasoningToggle() {
    const track = document.getElementById('reasoning-toggle-track');
    const slider = document.getElementById('reasoning-toggle-slider');
    const progress = document.getElementById('reasoning-toggle-progress');
    const lowLabel = document.querySelector('.reasoning-label-low');
    const mediumLabel = document.querySelector('.reasoning-label-medium');
    const highLabel = document.querySelector('.reasoning-label-high');

    if (!track || !slider || !progress) return;

    function updateToggleUI(level) {
      const trackWidth = track.offsetWidth;
      const sliderWidth = 40;
      const sliderHalfWidth = sliderWidth / 2;
      const edgePadding = sliderHalfWidth;

      const positions = {
        0: edgePadding,
        1: trackWidth / 2,
        2: trackWidth - edgePadding
      };

      const centerPos = positions[level];

      slider.style.left = (centerPos - sliderHalfWidth) + 'px';
      progress.style.width = centerPos + 'px';

      lowLabel.style.color = level === 0 ? '#218aff' : '#666666';
      lowLabel.style.fontWeight = level === 0 ? '600' : '500';

      mediumLabel.style.color = level === 1 ? '#218aff' : '#666666';
      mediumLabel.style.fontWeight = level === 1 ? '600' : '500';

      highLabel.style.color = level === 2 ? '#218aff' : '#666666';
      highLabel.style.fontWeight = level === 2 ? '600' : '500';
    }

    track.addEventListener('click', async (e) => {
      const rect = track.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const trackWidth = rect.width;

      let newLevel;
      if (clickX < trackWidth / 3) {
        newLevel = 0;
      } else if (clickX < (trackWidth * 2 / 3)) {
        newLevel = 1;
      } else {
        newLevel = 2;
      }

      elements.reasoningSlider.value = newLevel;
      updateToggleUI(newLevel);
      await saveReasoningLevel();
    });

    const currentLevel = elements.reasoningSlider.value !== '' ? parseInt(elements.reasoningSlider.value) : 1;
    updateToggleUI(currentLevel);
  }
});
