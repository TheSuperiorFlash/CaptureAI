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
    settingsBtn: document.getElementById('settings-btn'),
    mainView: document.getElementById('main-view'),
    settingsView: document.getElementById('settings-view'),
    backToMainBtn: document.getElementById('back-to-main-btn'),
    privacyGuardToggle: document.getElementById('privacy-guard-toggle'),
    privacyGuardItem: document.getElementById('privacy-guard-item'),
    reasoningLevelItem: document.getElementById('reasoning-level-item'),
    domainInput: document.getElementById('domain-input'),
    addDomainBtn: document.getElementById('add-domain-btn'),
    domainList: document.getElementById('domain-list'),
    settingsReasoningSlider: document.getElementById('settings-reasoning-slider'),
    settingsReasoningToggleTrack: document.getElementById('settings-reasoning-toggle-track'),
    settingsReasoningToggleSlider: document.getElementById('settings-reasoning-toggle-slider'),
    settingsReasoningToggleProgress: document.getElementById('settings-reasoning-toggle-progress'),
    ocrToggle: document.getElementById('ocr-toggle')
  };

  // State variables
  let currentState = {
    user: null,
    isPanelVisible: false,
    hasLastCaptureArea: false,
    currentResponse: ''
  };

  // Settings state
  let settings = {
    privacyGuard: {
      enabled: false
    },
    domainBlacklist: [],
    reasoningLevel: 1,
    ocr: {
      disabled: false  // Changed from enabled to disabled
    }
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
  elements.settingsBtn.addEventListener('click', showSettings);
  elements.backToMainBtn.addEventListener('click', showMainView);

  // Settings event listeners
  elements.privacyGuardToggle.addEventListener('click', togglePrivacyGuard);
  elements.addDomainBtn.addEventListener('click', addDomain);
  elements.domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addDomain();
  });
  elements.ocrToggle.addEventListener('click', toggleOCR);

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
        // Clear response message before showing main controls
        clearResponseMessage();
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

    try {
      const checkout = await AuthService.createCheckoutSession(email);

      // Open Stripe checkout in new tab
      chrome.tabs.create({ url: checkout.url });

      showResponseMessage('Check your email for your license key after payment!', 'success');
    } catch (error) {
      console.error('Checkout error:', error);
      showResponseMessage(error.message || 'Failed to start checkout', 'error');
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
    elements.responseSection.classList.add('hidden'); // Hide response section when not activated

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
      elements.responseSection.classList.remove('hidden'); // Show response section when activated

      // Clear any previous error messages
      clearResponseMessage();

      // Display user info
      if (user.email) {
        elements.userEmail.textContent = user.email;
      } else {
        elements.userEmail.textContent = 'License activated';
      }

      elements.userTier.textContent = user.tier.toUpperCase();

      // Show upgrade button and hide settings button for free tier
      if (user.tier === 'free') {
        elements.upgradeBtn.classList.remove('hidden');
        elements.userTier.classList.add('tier-free');
        elements.userTier.classList.remove('tier-pro');
        elements.settingsBtn.classList.add('settings-hidden');
      } else {
        elements.upgradeBtn.classList.add('hidden');
        // Purple gradient for Pro tier
        elements.userTier.classList.add('tier-pro');
        elements.userTier.classList.remove('tier-free');
        elements.settingsBtn.classList.remove('settings-hidden');
      }

      // Load and display usage stats (only for free tier)
      if (user.tier === 'free') {
        await updateUsageStats();
        elements.usageSection.classList.remove('hidden');
      } else {
        elements.usageSection.classList.add('hidden');
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
  /**
   * Sanitize a value for safe insertion into the DOM (prevent XSS)
   */
  function sanitize(value) {
    const str = String(value);
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function updateUsageStats() {
    try {
      const usage = await AuthService.getUsage();

      // Build DOM elements instead of innerHTML to prevent XSS from API data
      elements.usageContent.textContent = '';

      if (usage.limitType === 'per_day') {
        // Free tier - show daily stats
        const used = parseInt(usage.today.used, 10) || 0;
        const limit = parseInt(usage.today.limit, 10) || 0;
        const remaining = parseInt(usage.today.remaining, 10) || 0;
        const percentage = Math.min(100, Math.max(0, parseFloat(usage.today.percentage) || 0));

        const statsDiv = document.createElement('div');
        statsDiv.className = 'usage-stat-text';
        const strong = document.createElement('strong');
        strong.textContent = used;
        statsDiv.appendChild(strong);
        statsDiv.appendChild(document.createTextNode(` / ${limit} requests today`));

        const barOuter = document.createElement('div');
        barOuter.className = 'usage-bar-outer';
        const barInner = document.createElement('div');
        barInner.className = 'usage-bar-inner';
        barInner.style.width = `${percentage}%`;
        barOuter.appendChild(barInner);

        const remainingDiv = document.createElement('div');
        remainingDiv.className = 'usage-remaining-text';
        remainingDiv.textContent = `${remaining} requests remaining`;

        elements.usageContent.appendChild(statsDiv);
        elements.usageContent.appendChild(barOuter);
        elements.usageContent.appendChild(remainingDiv);
      } else {
        // Pro tier - show per-minute stats
        const used = parseInt(usage.lastMinute.used, 10) || 0;
        const limit = parseInt(usage.lastMinute.limit, 10) || 0;
        const todayUsed = parseInt(usage.today.used, 10) || 0;
        const percentage = Math.min(100, Math.max(0, parseFloat(usage.lastMinute.percentage) || 0));

        const statsDiv = document.createElement('div');
        statsDiv.className = 'usage-stat-text';
        const strong = document.createElement('strong');
        strong.textContent = used;
        statsDiv.appendChild(strong);
        statsDiv.appendChild(document.createTextNode(` / ${limit} requests/minute`));

        const barOuter = document.createElement('div');
        barOuter.className = 'usage-bar-outer';
        const barInner = document.createElement('div');
        barInner.className = 'usage-bar-inner';
        barInner.style.width = `${percentage}%`;
        barOuter.appendChild(barInner);

        const todayDiv = document.createElement('div');
        todayDiv.className = 'usage-remaining-text';
        todayDiv.textContent = `${todayUsed} requests used today (unlimited)`;

        elements.usageContent.appendChild(statsDiv);
        elements.usageContent.appendChild(barOuter);
        elements.usageContent.appendChild(todayDiv);
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
      elements.usageContent.textContent = 'Unable to load usage stats';
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
   * Show settings view
   */
  async function showSettings() {
    elements.mainView.classList.add('hidden');
    elements.settingsView.classList.remove('hidden');

    // Load settings
    await loadSettings();
  }

  /**
   * Show main view
   */
  function showMainView() {
    elements.settingsView.classList.add('hidden');
    elements.mainView.classList.remove('hidden');
  }

  /**
   * Load settings from storage
   */
  async function loadSettings() {
    try {
      // Load settings from storage
      const result = await chrome.storage.local.get('captureai-settings');
      if (result['captureai-settings']) {
        settings = { ...settings, ...result['captureai-settings'] };
      }

      // Load reasoning level (stored separately for backward compatibility)
      const reasoningResult = await chrome.storage.local.get('captureai-reasoning-level');
      if (reasoningResult['captureai-reasoning-level'] !== undefined) {
        settings.reasoningLevel = reasoningResult['captureai-reasoning-level'];
      }

      // Update UI with loaded settings
      updateSettingsUI();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  /**
   * Update settings UI elements
   */
  function updateSettingsUI() {
    // Privacy Guard toggle
    if (settings.privacyGuard.enabled) {
      elements.privacyGuardToggle.classList.add('active');
    } else {
      elements.privacyGuardToggle.classList.remove('active');
    }

    // Domain blacklist
    renderDomainList();

    // Reasoning level slider
    elements.settingsReasoningSlider.value = settings.reasoningLevel;
    updateSettingsReasoningToggleUI(settings.reasoningLevel);

    // OCR toggle (inverted - toggle shows disabled state)
    if (settings.ocr.disabled) {
      elements.ocrToggle.classList.add('active');
    } else {
      elements.ocrToggle.classList.remove('active');
    }

    // Setup reasoning toggle for settings page
    setupSettingsReasoningToggle();
  }

  /**
   * Toggle Privacy Guard on/off
   */
  async function togglePrivacyGuard() {
    // Toggle state
    settings.privacyGuard.enabled = !settings.privacyGuard.enabled;

    // Update UI
    if (settings.privacyGuard.enabled) {
      elements.privacyGuardToggle.classList.add('active');
    } else {
      elements.privacyGuardToggle.classList.remove('active');
    }

    // Save settings
    await saveSettings();

    // Show message
    if (settings.privacyGuard.enabled) {
      alert('PrivacyGuard enabled. Reload pages for protection to take effect.');
    }
  }

  /**
   * Add domain to blacklist
   */
  async function addDomain() {
    const domain = elements.domainInput.value.trim().toLowerCase();

    if (!domain) {
      return;
    }

    // Basic domain validation
    const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    if (!domainPattern.test(domain)) {
      alert('Please enter a valid domain (e.g., example.com)');
      return;
    }

    // Check if already in blacklist
    if (settings.domainBlacklist.includes(domain)) {
      alert('Domain already in blacklist');
      return;
    }

    // Add to blacklist
    settings.domainBlacklist.push(domain);

    // Save and update UI
    await saveSettings();
    renderDomainList();
    elements.domainInput.value = '';
  }

  /**
   * Remove domain from blacklist
   */
  async function removeDomain(domain) {
    settings.domainBlacklist = settings.domainBlacklist.filter(d => d !== domain);
    await saveSettings();
    renderDomainList();
  }

  /**
   * Render domain list
   */
  function renderDomainList() {
    if (settings.domainBlacklist.length === 0) {
      elements.domainList.innerHTML = '<div style="font-size: 11px; color: #999; font-style: italic; text-align: center; padding: 15px;">No domains in blacklist</div>';
      return;
    }

    elements.domainList.innerHTML = settings.domainBlacklist
      .map(domain => `
        <div class="domain-item">
          <span class="domain-name">${domain}</span>
          <button class="remove-domain-btn" data-domain="${domain}">×</button>
        </div>
      `)
      .join('');

    // Add remove event listeners
    elements.domainList.querySelectorAll('.remove-domain-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const domain = e.target.getAttribute('data-domain');
        removeDomain(domain);
      });
    });
  }

  /**
   * Toggle OCR on/off (inverted logic - toggle controls disabled state)
   */
  async function toggleOCR() {
    settings.ocr.disabled = !settings.ocr.disabled;

    // Update UI
    if (settings.ocr.disabled) {
      elements.ocrToggle.classList.add('active');
    } else {
      elements.ocrToggle.classList.remove('active');
    }

    // Save settings
    await saveSettings();
  }

  /**
   * Setup reasoning toggle for settings page
   */
  function setupSettingsReasoningToggle() {
    const track = elements.settingsReasoningToggleTrack;
    const slider = elements.settingsReasoningToggleSlider;
    const progress = elements.settingsReasoningToggleProgress;

    if (!track || !slider || !progress) return;

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

      settings.reasoningLevel = newLevel;
      elements.settingsReasoningSlider.value = newLevel;
      updateSettingsReasoningToggleUI(newLevel);
      await saveSettings();

      // Also save to old storage key for backward compatibility
      await chrome.storage.local.set({ 'captureai-reasoning-level': newLevel });
    });

    const currentLevel = elements.settingsReasoningSlider.value !== '' ? parseInt(elements.settingsReasoningSlider.value) : 1;
    updateSettingsReasoningToggleUI(currentLevel);
  }

  /**
   * Update settings reasoning toggle UI
   */
  function updateSettingsReasoningToggleUI(level) {
    const track = elements.settingsReasoningToggleTrack;
    const slider = elements.settingsReasoningToggleSlider;
    const progress = elements.settingsReasoningToggleProgress;

    if (!track || !slider || !progress) return;

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

    slider.style.setProperty('left', (centerPos - sliderHalfWidth) + 'px');
    progress.style.setProperty('width', centerPos + 'px');

    // Update labels in settings view
    const lowLabel = elements.settingsView.querySelector('.reasoning-label-low');
    const mediumLabel = elements.settingsView.querySelector('.reasoning-label-medium');
    const highLabel = elements.settingsView.querySelector('.reasoning-label-high');

    if (lowLabel && mediumLabel && highLabel) {
      lowLabel.classList.toggle('active', level === 0);
      mediumLabel.classList.toggle('active', level === 1);
      highLabel.classList.toggle('active', level === 2);
    }
  }

  /**
   * Save settings to storage
   */
  async function saveSettings() {
    try {
      await chrome.storage.local.set({ 'captureai-settings': settings });

      // Also save reasoning level to old storage key for backward compatibility
      await chrome.storage.local.set({ 'captureai-reasoning-level': settings.reasoningLevel });
    } catch (error) {
      console.error('Error saving settings:', error);
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
        // Wait for content script to be ready (poll instead of fixed delay)
        for (let i = 0; i < 15; i++) {
          try {
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            return;
          } catch {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
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
      elements.responseContent.className = 'response-content success';
    } else {
      elements.responseContent.className = 'response-content';
    }
  }

  /**
   * Clear the response message
   */
  function clearResponseMessage() {
    elements.responseContent.textContent = '';
    elements.responseContent.className = 'response-content empty';
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

});
