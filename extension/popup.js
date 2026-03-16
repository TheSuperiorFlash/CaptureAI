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
    licenseKeySection: document.getElementById('license-key-section'),
    licenseKeyInput: document.getElementById('license-key-input'),
    activateBtn: document.getElementById('activate-btn'),
    mainControls: document.getElementById('main-controls'),
    userEmail: document.getElementById('user-email'),
    userTier: document.getElementById('user-tier'),
    usageSection: document.getElementById('usage-stats'),
    usageContent: document.getElementById('usage-content'),
    upgradeBtn: document.getElementById('upgrade-btn'),
    manageBillingBtn: document.getElementById('manage-billing-btn'),
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
    addCurrentSiteBtn: document.getElementById('add-current-site-btn'),
    domainList: document.getElementById('domain-list'),
    settingsReasoningSlider: document.getElementById('settings-reasoning-slider'),
    settingsReasoningToggleTrack: document.getElementById('settings-reasoning-toggle-track'),
    settingsReasoningToggleSlider: document.getElementById('settings-reasoning-toggle-slider'),
    settingsReasoningToggleProgress: document.getElementById('settings-reasoning-toggle-progress'),
    advancedToggle: document.getElementById('advanced-toggle'),
    advancedContent: document.getElementById('advanced-content'),
    advancedArrow: document.getElementById('advanced-arrow'),
    themeSelector: document.getElementById('theme-selector'),
    privacyGuardBanner: document.getElementById('privacy-guard-banner'),
    privacyGuardBannerDismiss: document.getElementById('privacy-guard-banner-dismiss'),
    usageWarningBanner: document.getElementById('usage-warning-banner'),
    usageWarningBannerDismiss: document.getElementById('usage-warning-banner-dismiss'),
    usageWarningTitle: document.getElementById('usage-warning-title'),
    usageWarningMessage: document.getElementById('usage-warning-message')
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
  elements.manageBillingBtn.addEventListener('click', handleManageBilling);

  // Main control event listeners
  elements.captureBtn.addEventListener('click', startCapture);
  elements.quickCaptureBtn.addEventListener('click', quickCapture);
  elements.headerUiToggle.addEventListener('click', togglePanel);
  elements.helpToggle.addEventListener('click', toggleHelp);
  elements.settingsBtn.addEventListener('click', showSettings);
  elements.backToMainBtn.addEventListener('click', showMainView);

  // Banner event listeners
  elements.privacyGuardBannerDismiss.addEventListener('click', dismissPrivacyGuardBanner);
  elements.usageWarningBannerDismiss.addEventListener('click', dismissUsageWarningBanner);

  // Settings event listeners
  elements.privacyGuardToggle.addEventListener('click', togglePrivacyGuard);
  elements.addCurrentSiteBtn.addEventListener('click', addCurrentSite);
  elements.advancedToggle.addEventListener('click', toggleAdvanced);
  if (elements.themeSelector) {
    elements.themeSelector.addEventListener('change', async (e) => {
      settings.theme = e.target.value;
      applyTheme(settings.theme);
      await saveSettings();
    });
  }

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
   * Handle upgrade button click — opens Stripe Customer Portal pre-configured for Pro upgrade
   */
  async function handleUpgrade() {
    try {
      const data = await AuthService.getPortalUrl('pro');
      chrome.tabs.create({ url: data.url });
    } catch (err) {
      console.error('Failed to open upgrade portal:', err);
      showResponseMessage('Failed to open upgrade page', 'error');
    }
  }

  /**
   * Handle manage billing button click
   */
  async function handleManageBilling() {
    try {
      const data = await AuthService.getPortalUrl();
      chrome.tabs.create({ url: data.url });
    } catch (err) {
      console.error('Failed to open billing portal:', err);
      showResponseMessage('Failed to open billing portal', 'error');
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

      await applyTierUI(user.tier);

      // Check if one-time PrivacyGuard banner should be shown
      await checkPrivacyGuardBanner();

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
   * Falls back to 'basic' if the provided value is invalid.
   *
   * @param {*} tier - Raw tier value from storage or API.
   * @returns {'basic'|'pro'} Normalized tier string.
   */
  function normalizeTier(tier) {
    if (typeof tier === 'string') {
      const normalized = tier.trim().toLowerCase();
      if (normalized === 'basic' || normalized === 'pro') {
        return normalized;
      }
    }
    console.error('Invalid tier value, defaulting to basic:', tier);
    return 'basic';
  }

  /**
   * Apply tier-specific UI updates: badge, upgrade button, and usage stats
   * @param {string} tier - 'basic' or 'pro'
   */
  async function applyTierUI(tier) {
    const normalizedTier = normalizeTier(tier);
    elements.userTier.textContent = normalizedTier.toUpperCase();

    if (normalizedTier === 'basic') {
      // Ensure PrivacyGuard is disabled for Basic tier (handles edge cases like downgrades)
      if (settings.privacyGuard.enabled) {
        // Save the state before disabling, so we can restore it if user upgrades back
        await chrome.storage.local.set({ 'captureai-privacy-guard-before-downgrade': true });
        settings.privacyGuard.enabled = false;
        elements.privacyGuardToggle.classList.remove('active');
        saveSettings();
      }

      elements.upgradeBtn.classList.remove('hidden');
      elements.userTier.classList.add('tier-basic');
      elements.userTier.classList.remove('tier-pro');
      elements.settingsView.classList.add('basic-tier-view');
      elements.usageSection.classList.remove('hidden');
      updateUsageStats(); // No await - load asynchronously
    } else {
      // Check if PrivacyGuard was previously enabled before a downgrade
      const result = await chrome.storage.local.get('captureai-privacy-guard-before-downgrade');
      if (result['captureai-privacy-guard-before-downgrade'] === true && !settings.privacyGuard.enabled) {
        settings.privacyGuard.enabled = true;
        elements.privacyGuardToggle.classList.add('active');
        saveSettings();
        // Clear the flag
        await chrome.storage.local.remove('captureai-privacy-guard-before-downgrade');
      }

      elements.upgradeBtn.classList.add('hidden');
      elements.userTier.classList.add('tier-pro');
      elements.userTier.classList.remove('tier-basic');
      elements.settingsView.classList.remove('basic-tier-view');
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
        // Basic tier - show daily stats
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

      // Check if warning banner should be shown
      checkUsageWarningBanner(usage);
    } catch (error) {
      console.error('Error loading usage stats:', error);
      elements.usageContent.textContent = 'Unable to load usage stats';
      // Hide warning banner on error
      elements.usageWarningBanner.classList.add('hidden');
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

    // Setup reasoning toggle for settings page
    setupSettingsReasoningToggle();

    if (elements.themeSelector) {
      elements.themeSelector.value = settings.theme || 'auto';
    }
  }

  /**
   * Show the one-time PrivacyGuard auto-enable banner if applicable.
   * Only shown while PrivacyGuard is actually active — avoids stale
   * "PrivacyGuard is now on" messages after it has been disabled.
   */
  async function checkPrivacyGuardBanner() {
    const result = await chrome.storage.local.get([
      'captureai-privacy-guard-defaulted',
      'captureai-privacy-guard-notice-seen',
      'captureai-settings'
    ]);
    const savedSettings = result['captureai-settings'] || {};
    const isPrivacyGuardEnabled = savedSettings.privacyGuard?.enabled === true;
    const shouldShow = result['captureai-privacy-guard-defaulted'] === true
      && result['captureai-privacy-guard-notice-seen'] !== true
      && isPrivacyGuardEnabled;

    elements.privacyGuardBanner.classList.toggle('hidden', !shouldShow);
  }

  /**
   * Dismiss the PrivacyGuard auto-enable banner and persist the decision.
   */
  async function dismissPrivacyGuardBanner() {
    await chrome.storage.local.set({ 'captureai-privacy-guard-notice-seen': true });
    elements.privacyGuardBanner.classList.add('hidden');
  }

  /**
   * Check if usage warning banner should be shown.
   * Shows banner only when at 80% usage or 5 requests remaining on Basic tier.
   * @param {Object} usage - Usage object with limitType and today stats
   */
  function checkUsageWarningBanner(usage) {
    if (!usage || usage.limitType !== 'per_day') {
      // Only show for Basic tier (per_day limit)
      elements.usageWarningBanner.classList.add('hidden');
      return;
    }

    const used = parseInt(usage.today.used, 10) || 0;
    const limit = parseInt(usage.today.limit, 10) || 0;
    const remaining = Math.max(0, limit - used);
    const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;

    // Show warning if at 80% or 5 requests remaining
    const shouldShow = percentage >= 80 || remaining <= 5;

    if (shouldShow) {
      // Update banner message based on condition
      if (remaining <= 5) {
        elements.usageWarningMessage.textContent = `Only ${remaining} request${remaining === 1 ? '' : 's'} remaining today.`;
      } else {
        elements.usageWarningMessage.textContent = `You've used ${percentage}% of your daily limit (${used} of ${limit} requests).`;
      }
      elements.usageWarningBanner.classList.remove('hidden');
    } else {
      elements.usageWarningBanner.classList.add('hidden');
    }
  }

  /**
   * Dismiss the usage warning banner.
   */
  function dismissUsageWarningBanner() {
    elements.usageWarningBanner.classList.add('hidden');
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

    // Show banner on the active webpage when enabling
    if (settings.privacyGuard.enabled) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          await ensureContentScriptLoaded(tab.id);
          chrome.tabs.sendMessage(tab.id, { action: 'showPrivacyGuardBanner' })
            .catch(err => console.warn('CaptureAI: Banner delivery failed:', err));
        }
      } catch (bannerError) {
        console.warn('CaptureAI: Could not send PrivacyGuard banner:', bannerError);
      }
    }
  }

  /**
   * Add the current tab's hostname to the blacklist
   */
  async function addCurrentSite() {
    let hostname;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) {
        return;
      }
      hostname = new URL(tab.url).hostname.toLowerCase();
    } catch (tabError) {
      console.warn('CaptureAI: Could not get current tab URL:', tabError);
      return;
    }

    if (!hostname || hostname.startsWith('chrome') || hostname === 'newtab') {
      return;
    }

    if (settings.domainBlacklist.includes(hostname)) {
      return;
    }

    settings.domainBlacklist.push(hostname);
    await saveSettings();
    renderDomainList();
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
      empty.textContent = 'No websites added';
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

      const isDailyLimit = request.isError && request.message.includes('Daily limit reached');
      const isMinuteLimit = request.isError && request.message.includes('Rate limit reached');

      if (isDailyLimit || isMinuteLimit) {
        renderRateLimitError(isDailyLimit);
      } else {
        elements.responseContent.textContent = request.message;
        elements.responseContent.className = request.isError ? 'response-content error' : 'response-content';
      }
    }
  });

  /**
   * Render a user-friendly rate limit error in the response area.
   * For daily limit errors on Basic tier, adds an inline Upgrade CTA.
   * @param {boolean} isDailyLimit - true for daily limit, false for per-minute
   */
  function renderRateLimitError(isDailyLimit) {
    elements.responseContent.className = 'response-content error';
    elements.responseContent.textContent = '';

    const msgEl = document.createElement('span');

    if (isDailyLimit) {
      msgEl.textContent = 'Daily limit reached. Upgrade to Pro for unlimited requests.';
    } else {
      msgEl.textContent = 'Rate limit reached. Please wait a moment and try again.';
    }

    elements.responseContent.appendChild(msgEl);

    // Show upgrade CTA inline for Basic tier users who hit the daily cap
    const isBasicTier = currentState.user?.tier === 'basic' || currentState.user?.tier === 'Basic';
    if (isDailyLimit && isBasicTier) {
      const upgradeBtn = document.createElement('button');
      upgradeBtn.textContent = 'Upgrade to Pro →';
      upgradeBtn.className = 'inline-upgrade-btn';
      upgradeBtn.addEventListener('click', handleUpgrade);
      elements.responseContent.appendChild(upgradeBtn);
    }
  }

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
      if (newTier && currentState.user) {
        currentState.user = { ...currentState.user, tier: newTier };
        applyTierUI(newTier); // Fire and forget - will update UI in background
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
