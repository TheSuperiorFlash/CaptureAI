/**
 * CaptureAI Popup Script (License Key System)
 * Manages extension popup UI with license key authentication
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Apply pill rounding style from config
  try {
    const { CONFIG } = await import('./modules/config.js');
    const isPilled = CONFIG.PILLED_UI_BUTTONS;
    const buttonRadius = isPilled ? '100px' : '10px';
    const toggleRadius = isPilled ? '100px' : '6px';
    document.documentElement.style.setProperty('--config-button-radius', buttonRadius);
    document.documentElement.style.setProperty('--config-toggle-radius', toggleRadius);
  } catch (e) {
    console.error('Failed to apply pill style:', e);
  }

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
    ocrToggle: document.getElementById('ocr-toggle'),
    advancedToggle: document.getElementById('advanced-toggle'),
    advancedContent: document.getElementById('advanced-content'),
    advancedArrow: document.getElementById('advanced-arrow'),
    themeSelector: document.getElementById('theme-selector')
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
    },
    theme: 'light'
  };

  // Load and apply settings
  await loadSettings();

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
  elements.domainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDomain();
    }
  });
  elements.ocrToggle.addEventListener('click', toggleOCR);
  elements.advancedToggle.addEventListener('click', toggleAdvanced);
  elements.themeSelector.addEventListener('change', async (e) => {
    settings.theme = e.target.value;
    applyTheme(settings.theme);
    await saveSettings();
  });

  // Add Enter key support for license key input
  elements.licenseKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleActivate();
    }
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

      // Quick check: is there a license key at all? (fast storage read, no network)
      const licenseKey = await AuthService.getLicenseKey();
      if (!licenseKey) {
        showLicenseKeyInput();
        return;
      }

      // Try to get user from cache for instant UI render
      const { user, fromCache } = await AuthService.getCachedOrFreshUser();

      if (user) {
        // Show UI immediately with cached (or fresh) data
        await showMainControlsWithUser(user);

        // Always refresh in background when showing cached data so the plan
        // badge stays accurate after a Stripe upgrade. The chrome.storage.onChanged
        // listener will update the UI automatically if the tier changed.
        if (fromCache) {
          AuthService.refreshUserCache().then(freshUser => {
            if (freshUser && (freshUser.email !== user.email || freshUser.tier !== user.tier)) {
              showMainControlsWithUser(freshUser);
            }
          }).catch(() => {
            // Silent failure - we already showed cached data
          });
        }
      } else {
        // No cache and API call failed - show activation screen
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
   * Handle deactivation (clear license key)
   */
  async function handleDeactivate() {
    const confirmed = window.confirm('Are you sure you want to deactivate? You will need to enter your license key again.');

    if (!confirmed) {
      return;
    }

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
      // No email on file — send them to the website to upgrade
      try {
        await chrome.tabs.create({ url: 'https://captureai.dev/activate' });
      } catch (err) {
        console.error('Failed to open upgrade page:', err);
      }
      return;
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
    document.getElementById('help-section').classList.add('hidden'); // Hide help section when not activated
    document.getElementById('activation-subtitle').classList.remove('hidden'); // Show activation subtitle

    // Clear input
    elements.licenseKeyInput.value = '';
    elements.activateBtn.disabled = false;
    elements.activateBtn.textContent = 'Activate';
  }

  /**
   * Show main controls (activated state) - fetches fresh user from API
   * Used by handleActivate() after fresh license validation
   */
  async function showMainControls() {
    try {
      const user = await AuthService.getCurrentUser();
      await showMainControlsWithUser(user);
    } catch (error) {
      console.error('Error loading user info:', error);
      showResponseMessage('Error loading user info', 'error');
      showLicenseKeyInput();
    }
  }

  /**
   * Show main controls with a pre-fetched user object (no API call)
   * @param {Object} user - User object with email and tier
   */
  async function showMainControlsWithUser(user) {
    try {
      currentState.user = user;

      // Update UI
      elements.licenseKeySection.classList.add('hidden');
      elements.mainControls.classList.remove('hidden');
      elements.responseSection.classList.remove('hidden');
      document.getElementById('help-section').classList.remove('hidden'); // Show help section when activated
      document.getElementById('activation-subtitle').classList.add('hidden'); // Hide activation subtitle

      // Clear any previous error messages
      clearResponseMessage();

      // Display user info
      if (user.email) {
        elements.userEmail.textContent = user.email;
      } else {
        elements.userEmail.textContent = 'License activated';
      }

      applyTierUI(user.tier);

      // Get current state from content script
      await updateStateFromContentScript();
    } catch (error) {
      console.error('Error loading user info:', error);
      showResponseMessage('Error loading user info', 'error');
      showLicenseKeyInput();
    }
  }

  /**
   * Normalize tier to a safe, known value.
   * Falls back to 'free' if the provided value is invalid.
   *
   * @param {*} tier - Raw tier value from storage or API.
   * @returns {'free'|'pro'} Normalized tier string.
   */
  function normalizeTier(tier) {
    if (typeof tier === 'string') {
      const normalized = tier.trim().toLowerCase();
      if (normalized === 'free' || normalized === 'pro') {
        return normalized;
      }
    }
    console.error('Invalid tier value, defaulting to free:', tier);
    return 'free';
  }

  /**
   * Apply tier-specific UI updates: badge, upgrade button, and usage stats
   * @param {string} tier - 'free' or 'pro'
   */
  function applyTierUI(tier) {
    const normalizedTier = normalizeTier(tier);
    elements.userTier.textContent = normalizedTier.toUpperCase();

    if (normalizedTier === 'free') {
      elements.upgradeBtn.classList.remove('hidden');
      elements.userTier.classList.add('tier-free');
      elements.userTier.classList.remove('tier-pro');
      elements.settingsView.classList.add('free-tier-view');
      elements.usageSection.classList.remove('hidden');
      updateUsageStats(); // No await - load asynchronously
    } else {
      elements.upgradeBtn.classList.add('hidden');
      elements.userTier.classList.add('tier-pro');
      elements.userTier.classList.remove('tier-free');
      elements.settingsView.classList.remove('free-tier-view');
      elements.usageSection.classList.add('hidden');
    }
  }

  /**
   * Update usage statistics display
   */
  async function updateUsageStats() {
    try {
      // Try cached usage from last AI response first (avoids separate API call)
      let usage = null;
      let staleUsage = null;
      const cached = await chrome.storage.local.get('captureai-last-usage');
      const cachedUsage = cached['captureai-last-usage'];

      if (cachedUsage && cachedUsage.data && cachedUsage.updatedAt) {
        const d = cachedUsage.data;
        if (d.limitType === 'per_day') {
          const used = d.usedToday || 0;
          const limit = d.dailyLimit || 0;
          const builtUsage = {
            limitType: 'per_day',
            today: {
              used,
              limit,
              percentage: limit > 0 ? Math.round((used / limit) * 100) : 0
            }
          };
          const age = Date.now() - cachedUsage.updatedAt;
          if (age < 2 * 60 * 1000) {
            usage = builtUsage; // Fresh cache - use immediately
          } else {
            staleUsage = builtUsage; // Stale cache - keep as fallback
          }
        }
      }

      // Fall back to API call if no fresh cached data
      if (!usage) {
        try {
          usage = await AuthService.getUsage();
        } catch (e) {
          console.error('API getUsage failed', e);
          // Use stale cache rather than showing an error if we have any data
          if (staleUsage) {
            usage = staleUsage;
          } else {
            elements.usageContent.textContent = 'Unable to fetch usage data right now.';
            return;
          }
        }
      }

      // Build DOM elements instead of innerHTML to prevent XSS from API data
      elements.usageContent.textContent = '';

      if (usage.limitType === 'per_day') {
        // Free tier - show daily stats
        const used = parseInt(usage.today.used, 10) || 0;
        const limit = parseInt(usage.today.limit, 10) || 0;
        const remaining = Math.max(0, limit - used);
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
        barInner.style.setProperty('--bar-width', `${percentage}%`);
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
        barInner.style.setProperty('--bar-width', `${percentage}%`);
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
   * Toggle advanced settings section visibility
   */
  function toggleAdvanced() {
    const isExpanded = elements.advancedContent.classList.contains('expanded');
    if (isExpanded) {
      elements.advancedContent.classList.remove('expanded');
      elements.advancedArrow.classList.remove('expanded');
      elements.advancedToggle.setAttribute('aria-expanded', 'false');
    } else {
      elements.advancedContent.classList.add('expanded');
      elements.advancedArrow.classList.add('expanded');
      elements.advancedToggle.setAttribute('aria-expanded', 'true');
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
      applyTheme(settings.theme);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  /**
   * Apply theme to popup
   * @param {string} themeValue - 'auto', 'dark', or 'light'
   */
  function applyTheme(themeValue) {
    let isDark = false;
    if (themeValue === 'dark') {
      isDark = true;
    } else if (themeValue === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
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

    if (elements.themeSelector) {
      elements.themeSelector.value = settings.theme || 'auto';
    }
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
    elements.domainList.textContent = '';

    if (settings.domainBlacklist.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'domain-list-empty';
      empty.textContent = 'No domains in blacklist';
      elements.domainList.appendChild(empty);
      return;
    }

    settings.domainBlacklist.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'domain-item';

      const name = document.createElement('span');
      name.className = 'domain-name';
      name.textContent = domain;

      const btn = document.createElement('button');
      btn.className = 'remove-domain-btn';
      btn.textContent = '\u00d7';
      btn.addEventListener('click', () => removeDomain(domain));

      item.appendChild(name);
      item.appendChild(btn);
      elements.domainList.appendChild(item);
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

    if (!track || !slider || !progress) {
      return;
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

    if (!track || !slider || !progress) {
      return;
    }

    const trackWidth = track.offsetWidth;
    const trackHalfWidth = trackWidth / 2;
    const sliderWidth = 48; // Updated to match new CSS width (48px instead of 40px)
    const sliderHalfWidth = sliderWidth / 2;
    const edgePadding = sliderHalfWidth - 4;

    const positions = {
      0: edgePadding,
      1: trackHalfWidth,
      2: trackWidth - edgePadding
    };

    const centerPos = positions[level];

    slider.style.setProperty('--slider-left', (centerPos - sliderHalfWidth) + 'px');
    progress.style.setProperty('--progress-width', centerPos + 'px');

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
        throw new Error('Content script failed to respond after injection');
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
   * Listen for storage changes to update tier UI in real time
   * when the user upgrades from free to pro or vice versa,
   * and to refresh usage stats after each AI request.
   */
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') {
      return;
    }
    if (changes['captureai-user-tier']) {
      const newTier = changes['captureai-user-tier'].newValue;
      if (newTier && currentState.user && !elements.mainControls.classList.contains('hidden')) {
        currentState.user = { ...currentState.user, tier: newTier };
        applyTierUI(newTier);
      }
    }
    if (changes['captureai-last-usage'] && !elements.usageSection.classList.contains('hidden')) {
      updateUsageStats();
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
