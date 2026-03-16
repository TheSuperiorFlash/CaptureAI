/**
 * CaptureAI Background Service Worker
 *
 * Handles screenshot capture, backend API communication, and message routing
 * between content scripts and the extension popup.
 *
 * TABLE OF CONTENTS:
 * 0. Module Imports & Migration
 * 1. Constants & Configuration
 * 2. Message Routing
 * 3. Request Handlers
 * 4. Backend API Client
 * 5. Chrome APIs - Screenshot
 * 6. Chrome APIs - Messaging
 * 7. Chrome APIs - Tabs & Scripts
 * 8. Storage Utilities
 */

// ============================================================================
// SECTION 0: MODULE IMPORTS
// ============================================================================

/**
 * Import auth service (License Key System)
 * Note: This module is loaded dynamically in service worker environment
 */
importScripts('modules/auth-service.js');

// ============================================================================
// SECTION 1: CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Debug flag for console logging
 * NOTE: Matches CONFIG.DEBUG in modules/config.js
 */
const DEBUG = false;

/**
 * Prompt type constants
 * NOTE: Also defined in modules/config.js for content scripts
 * Keep these values in sync when making changes
 */
const PROMPT_TYPES = {
  ANSWER: 'answer',
  AUTO_SOLVE: 'auto_solve',
  ASK: 'ask'
};

/**
 * OpenAI API configuration
 */
const OPENAI_CONFIG = {
  API_URL: 'https://api.openai.com/v1/chat/completions',
  VERBOSITY: 'low',
  MAX_TOKENS: {
    AUTO_SOLVE: 2500,
    ASK: 8000,
    TEXT_ONLY: 4000,
    DEFAULT: 5000
  }
};

/**
 * Get AI configuration based on reasoning level from storage
 * @returns {Promise<Object>} Configuration object with model and reasoning effort
 */
async function getAIConfig() {
  try {
    const result = await chrome.storage.local.get('captureai-reasoning-level');
    const level = result['captureai-reasoning-level'];

    // Default to medium (1) if not set
    const reasoningLevel = level !== undefined ? level : 1;

    // Reasoning level configurations
    const configs = {
      0: { MODEL: 'gpt-4.1-nano', REASONING_EFFORT: null, USE_LEGACY_PARAMS: true },      // Low - no reasoning, uses different params
      1: { MODEL: 'gpt-5-nano', REASONING_EFFORT: 'low', USE_LEGACY_PARAMS: false },     // Medium
      2: { MODEL: 'gpt-5-nano', REASONING_EFFORT: 'medium', USE_LEGACY_PARAMS: false }   // High
    };

    // Use config if valid, otherwise fallback to medium
    const selectedConfig = configs[reasoningLevel] || configs[1];

    return {
      ...OPENAI_CONFIG,
      ...selectedConfig
    };
  } catch (error) {
    console.error('Error getting AI config:', error);
    // Return medium config as fallback
    return {
      ...OPENAI_CONFIG,
      MODEL: 'gpt-5-nano',
      REASONING_EFFORT: 'low',
      USE_LEGACY_PARAMS: false
    };
  }
}


/**
 * Error message templates
 */
const ERROR_MESSAGES = {
  NO_API_KEY: 'API key is not set',
  NO_API_KEY_POPUP: 'API key is not set, check popup',
  NO_QUESTION: 'No question provided',
  NO_IMAGE_DATA: 'No image data provided',
  CAPTURE_FAILED: 'Failed to capture screenshot',
  PROCESS_FAILED: 'Failed to process question',
  NETWORK_ERROR: 'Network error or API unavailable',
  INVALID_URL: 'Invalid URL for content script injection'
};

/**
 * Chrome storage key for API key
 */
const STORAGE_KEY_API_KEY = 'captureai-api-key';

/**
 * Content script ID for dynamic Privacy Guard registration
 */
const PRIVACY_GUARD_SCRIPT_ID = 'privacy-guard-main';


// ============================================================================
// SECTION 1.5: PRIVACY GUARD DYNAMIC REGISTRATION
// ============================================================================

/**
 * Evaluate storage state and register/unregister inject.js accordingly.
 * Uses chrome.scripting.registerContentScripts for native document_start
 * timing in MAIN world — no race conditions with async storage reads.
 *
 * Called on install, startup, and whenever relevant storage keys change.
 */
async function activatePrivacyGuard() {
  try {
    const result = await chrome.storage.local.get([
      'captureai-settings',
      'captureai-user-tier'
    ]);
    const settings = result['captureai-settings'] || {};
    const tier = result['captureai-user-tier'];

    const shouldEnable = (tier === 'pro' && settings.privacyGuard?.enabled === true);

    // Build excludeMatches from domainBlacklist
    // Each domain needs two patterns: exact match and wildcard subdomain match
    // e.g. "example.com" → ["*://example.com/*", "*://*.example.com/*"]
    const blockedDomains = settings.domainBlacklist || [];
    const excludeMatches = blockedDomains.flatMap(d => [
      `*://${d}/*`,
      `*://*.${d}/*`
    ]);

    // Get current registrations
    const existing = await chrome.scripting.getRegisteredContentScripts({
      ids: [PRIVACY_GUARD_SCRIPT_ID]
    });

    if (shouldEnable) {
      const scriptConfig = {
        id: PRIVACY_GUARD_SCRIPT_ID,
        matches: ['<all_urls>'],
        js: ['inject.js'],
        runAt: 'document_start',
        world: 'MAIN',
        ...(excludeMatches.length > 0 && { excludeMatches })
      };

      if (existing.length > 0) {
        await chrome.scripting.updateContentScripts([scriptConfig]);
      } else {
        await chrome.scripting.registerContentScripts([scriptConfig]);
      }
    } else {
      if (existing.length > 0) {
        await chrome.scripting.unregisterContentScripts({
          ids: [PRIVACY_GUARD_SCRIPT_ID]
        });
      }
    }
  } catch (error) {
    if (DEBUG) {
      console.error('Privacy Guard activation error:', error);
    }
  }
}

/**
 * Auto-enable PrivacyGuard the first time a user upgrades to Pro.
 * Runs at most once per installation — guarded by the
 * 'captureai-privacy-guard-defaulted' flag in storage.
 */
async function applyPrivacyGuardDefault() {
  try {
    const result = await chrome.storage.local.get([
      'captureai-privacy-guard-defaulted',
      'captureai-settings'
    ]);

    // Only apply once
    if (result['captureai-privacy-guard-defaulted']) {
      return;
    }

    // Enable privacy guard in settings
    const settings = result['captureai-settings'] || {};
    settings.privacyGuard = { ...settings.privacyGuard, enabled: true };

    await chrome.storage.local.set({
      'captureai-settings': settings,
      'captureai-privacy-guard-defaulted': true
    });
  } catch (error) {
    if (DEBUG) {
      console.error('Privacy Guard default application error:', error);
    }
  }
}


// ============================================================================
// SECTION 2: MESSAGE ROUTING
// ============================================================================

/**
 * Chrome message listener - routes messages to appropriate handlers
 * Handles messages from content scripts and popup
 * Only runs in browser environment (not in tests)
 */
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const handlers = {
      'captureArea': handleCaptureArea,
      'askQuestion': handleAskQuestion,
      'enablePrivacyGuard': handleEnablePrivacyGuard,
      'disablePrivacyGuard': handleDisablePrivacyGuard,
      'getPrivacyGuardStatus': handleGetPrivacyGuardStatus
    };

    const handler = handlers[request.action];
    if (handler) {
      handler(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    }

    return false;
  });
}

/**
 * Chrome commands listener - handles keyboard shortcuts from manifest
 * Commands are defined in manifest.json and work globally
 * Only runs in browser environment (not in tests)
 */
if (typeof chrome !== 'undefined' && chrome.commands?.onCommand) {
  chrome.commands.onCommand.addListener((command) => {
    // Get current active tab and send command to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        if (DEBUG) {
          console.error('tabs.query error:', chrome.runtime.lastError.message);
        }
        return;
      }
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'keyboardCommand',
          command: command
        }).catch((error) => {
          if (DEBUG) {
            console.error('Failed to send command to content script:', command, error);
          }
        });
      }
    });
  });
}

/**
 * Create context menu on extension installation
 * Only runs in browser environment (not in tests)
 */
if (typeof chrome !== 'undefined' && chrome.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener(async () => {
    // Create context menu
    chrome.contextMenus.create({
      id: 'captureai-ask-text',
      title: 'Ask CaptureAI',
      contexts: ['selection']
    });

    // Register/unregister Privacy Guard content script based on settings
    activatePrivacyGuard();

    // Set up periodic user cache refresh and refresh immediately
    chrome.alarms.create('captureai-refresh-user-cache', { periodInMinutes: 30 });
    AuthService.refreshUserCache();

    // Auto-enable PrivacyGuard for existing Pro users on extension update
    const result = await chrome.storage.local.get('captureai-user-tier');
    if (result['captureai-user-tier'] === 'pro') {
      applyPrivacyGuardDefault();
    }
  });
}

/**
 * Re-evaluate Privacy Guard registration on browser startup
 */
if (typeof chrome !== 'undefined' && chrome.runtime?.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    activatePrivacyGuard();

    // Re-create alarm on startup (alarms may not persist across restarts)
    chrome.alarms.create('captureai-refresh-user-cache', { periodInMinutes: 30 });
    AuthService.refreshUserCache();
  });
}

/**
 * Re-evaluate Privacy Guard registration when settings or tier change.
 * Also auto-enables PrivacyGuard the first time the user upgrades to Pro.
 */
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }
    if (changes['captureai-settings'] || changes['captureai-user-tier']) {
      activatePrivacyGuard();
    }
    if (changes['captureai-user-tier']?.newValue === 'pro') {
      applyPrivacyGuardDefault();
    }
  });
}

/**
 * Handle periodic alarm to refresh user cache
 */
if (typeof chrome !== 'undefined' && chrome.alarms?.onAlarm) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'captureai-refresh-user-cache') {
      try {
        await AuthService.refreshUserCache();
      } catch (error) {
        if (DEBUG) {
          console.error('Scheduled cache refresh failed:', error);
        }
      }
    }
  });
}

/**
 * Handle context menu clicks
 * Only runs in browser environment (not in tests)
 */
if (typeof chrome !== 'undefined' && chrome.contextMenus?.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'captureai-ask-text' && info.selectionText) {
      handleTextSelection(info.selectionText, tab.id);
    }
  });
}

/**
 * Handle selected text from context menu
 * Sends text to OpenAI for analysis
 *
 * @param {string} selectedText - The text selected by the user
 * @param {number} tabId - The ID of the tab where text was selected
 * @returns {Promise<void>}
 */
async function handleTextSelection(selectedText, tabId) {
  try {
    // Show processing message (optimization #6: fire-and-forget, don't await)
    showMessage(tabId, 'showProcessingMessage');

    // Send selected text to backend
    const aiResponse = await sendTextOnlyQuestion(selectedText, null);
    await displayResponse(tabId, aiResponse);

  } catch (error) {
    console.error('Text selection error:', error);
    await displayResponse(tabId, formatError('Failed to process selected text'));
  }
}


// ============================================================================
// SECTION 3: REQUEST HANDLERS
// ============================================================================

/**
 * Handle screenshot capture request from content script
 * Captures visible tab area, processes image, and sends to AI
 *
 * @param {Object} request - Message request object
 * @param {Object} request.coordinates - Selection coordinates
 * @param {number} request.coordinates.startX - Top-left X position
 * @param {number} request.coordinates.startY - Top-left Y position
 * @param {number} request.coordinates.width - Selection width
 * @param {number} request.coordinates.height - Selection height
 * @param {boolean} request.isForAskMode - If true, return image data instead of processing
 * @param {string} request.promptType - Type of AI prompt (ANSWER, AUTO_SOLVE, ASK)
 * @param {Object} sender - Message sender object with tab info
 * @param {Function} sendResponse - Callback to send response
 * @returns {void}
 */
async function handleCaptureArea(request, sender, sendResponse) {
  try {
    // Show capturing message to user (optimization #6: fire-and-forget, don't await)
    showMessage(sender.tab.id, 'showCapturingMessage');

    // Capture screenshot of visible tab
    const imageUri = await captureScreenshot();

    // Read OCR setting from storage
    const settingsResult = await chrome.storage.local.get('captureai-settings');
    const settings = settingsResult['captureai-settings'] || {};
    // Skip OCR for ask-mode captures — the image is sent directly, not via text extraction
    const enableOCR = !request.isForAskMode && !settings.ocr?.disabled;

    // Process image (crop and compress)
    const processedData = await processImage(imageUri, request, sender, { enableOCR });

    // Check for image processing errors
    if (processedData?.hasError) {
      console.error('Image processing error:', processedData.error);
      await displayResponse(sender.tab.id, processedData.error);
      sendResponse({ success: true });
      return;
    }

    // Debug image logging removed - was leaking base64 screenshots to console

    // If this is for ask mode, send image data back to content script
    if (request.isForAskMode) {
      await chrome.tabs.sendMessage(sender.tab.id, {
        action: 'setAskModeImage',
        imageData: processedData.compressedImageData,
        ocrData: processedData.ocrData
      });
      sendResponse({ success: true });
      return;
    }

    // Normal capture flow - process with AI (optimization #6: fire-and-forget, don't await)
    showMessage(sender.tab.id, 'showProcessingMessage');

    const promptType = request.promptType || PROMPT_TYPES.ANSWER;

    // Check if OCR extraction succeeded and has sufficient confidence
    const ocrText = processedData.ocrData?.text || null;
    const isImageQuestion = isImageSelectionQuestion(ocrText);
    const isWrongAnswer = isWrongAnswerPrompt(ocrText);

    const hasValidOCR = ocrText &&
      ocrText.trim().length > 0 &&
      !processedData.ocrData?.shouldFallbackToImage &&
      !isImageQuestion &&
      !isWrongAnswer &&
      !request.forceImageFallback;

    // For normal captures: send OCR text instead of image data (token optimization)
    // Fallback to image if OCR fails, has low confidence, detects image-selection question,
    // or detects a wrong-answer prompt (AI needs to see red highlighting)
    const aiData = {
      imageData: hasValidOCR ? null : processedData.compressedImageData,
      ocrText: hasValidOCR ? ocrText : null,
      ocrConfidence: processedData.ocrData?.confidence || null
    };

    if (DEBUG && !hasValidOCR) {
      const reason = request.forceImageFallback
        ? 'retry after invalid response'
        : isWrongAnswer
          ? 'wrong-answer prompt detected (red highlighting)'
          : isImageQuestion
            ? 'image-selection question detected'
            : processedData.ocrData?.shouldFallbackToImage
              ? `low confidence (${processedData.ocrData?.confidence}%)`
              : 'no text extracted';
      console.warn(`OCR ${reason}, falling back to image data`);
    }

    const aiResponse = await sendToOpenAI(aiData, null, promptType);
    await displayResponse(sender.tab.id, aiResponse, promptType);
    sendResponse({ success: true });

  } catch (error) {
    console.error('Capture area error:', error);
    sendResponse({ success: false, error: 'Capture failed: ' + error.message });
  }
}

/**
 * Handle ask question request from content script
 * Processes user question with optional image attachment
 *
 * @param {Object} request - Message request object
 * @param {string} request.question - User's question text
 * @param {string} [request.imageData] - Optional base64 image data
 * @param {Object} sender - Message sender object with tab info
 * @param {Function} sendResponse - Callback to send response
 * @returns {void}
 */
async function handleAskQuestion(request, sender, sendResponse) {
  try {
    const { question, imageData, ocrData, images } = request;

    // Require a question unless images are attached
    const hasImages = !!(Array.isArray(images) && images.length > 0) || !!imageData;
    if (!question?.trim() && !hasImages) {
      await displayResponse(sender.tab.id, formatError(ERROR_MESSAGES.NO_QUESTION));
      sendResponse({ success: false, error: ERROR_MESSAGES.NO_QUESTION });
      return;
    }

    let aiResponse;

    if (images && images.length > 0) {
      // Multi-image ask mode
      aiResponse = await sendToOpenAI({
        question,
        images: images.map(img => ({
          imageData: img.imageData,
          ocrText: img.ocrData?.text || null,
          ocrConfidence: img.ocrData?.confidence || null
        }))
      }, null, PROMPT_TYPES.ASK);
    } else if (imageData) {
      // Single image (backward compat)
      aiResponse = await sendToOpenAI({
        question,
        imageData,
        ocrText: ocrData?.text,
        ocrConfidence: ocrData?.confidence
      }, null, PROMPT_TYPES.ASK);
    } else {
      // Text-only
      aiResponse = await sendTextOnlyQuestion(question, null);
    }

    await displayResponse(sender.tab.id, aiResponse);
    sendResponse({ success: true });

  } catch (error) {
    console.error('Ask question error:', error);
    await displayResponse(sender.tab.id, formatError(ERROR_MESSAGES.PROCESS_FAILED));
    sendResponse({ success: false, error: ERROR_MESSAGES.PROCESS_FAILED });
  }
}

/**
 * Handle privacy guard enable request
 * Injects privacy protection script into MAIN world
 * Requires Pro tier subscription
 *
 * @param {Object} request - Message request object
 * @param {Object} sender - Message sender object with tab info
 * @param {Function} sendResponse - Callback to send response
 * @returns {void}
 */
async function handleEnablePrivacyGuard(request, sender, sendResponse) {
  try {
    // Check if user has Pro tier access
    const tierResult = await chrome.storage.local.get('captureai-user-tier');
    const tier = tierResult['captureai-user-tier'];

    if (tier !== 'pro') {
      sendResponse({ success: false, error: 'Privacy Guard requires Pro tier subscription' });
      return;
    }

    // Check if Privacy Guard is enabled in settings
    const settingsResult = await chrome.storage.local.get('captureai-settings');
    const settings = settingsResult['captureai-settings'] || {};

    if (!settings.privacyGuard?.enabled) {
      sendResponse({ success: false, error: 'Privacy Guard is disabled in settings' });
      return;
    }

    const tabId = sender.tab.id;
    const url = sender.tab.url;

    // Check if URL is valid for script injection
    if (!isValidUrl(url)) {
      sendResponse({ success: false, error: 'Cannot inject on this page type' });
      return;
    }

    // Inject privacy guard script into MAIN world
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['inject.js'],
      world: 'MAIN',
      injectImmediately: true
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('Privacy guard injection error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle privacy guard disable request
 * Note: Cannot truly disable once injected, but can signal status change
 *
 * @param {Object} request - Message request object
 * @param {Object} sender - Message sender object
 * @param {Function} sendResponse - Callback to send response
 * @returns {void}
 */
async function handleDisablePrivacyGuard(request, sender, sendResponse) {
  // Privacy guard script cannot be removed once injected
  // This just acknowledges the disable request
  sendResponse({ success: true, note: 'Privacy guard persists until page reload' });
}

/**
 * Handle privacy guard status request
 *
 * @param {Object} request - Message request object
 * @param {Object} sender - Message sender object
 * @param {Function} sendResponse - Callback to send response
 * @returns {void}
 */
async function handleGetPrivacyGuardStatus(request, sender, sendResponse) {
  // Check if inject.js is available
  try {
    sendResponse({ enabled: true, available: true });
  } catch (error) {
    sendResponse({ enabled: false, available: false });
  }
}


// ============================================================================
// SECTION 4: BACKEND API CLIENT
// ============================================================================

/**
 * Send image data to backend API for AI analysis
 * Routes through Cloudflare Workers backend with authentication
 *
 * @param {Object} data - Data to send to API
 * @param {string} data.imageData - Base64-encoded image data URI
 * @param {string} [data.question] - User question (for ASK prompt type)
 * @param {string} apiKey - DEPRECATED - No longer used (kept for backward compatibility)
 * @param {string} promptType - Type of prompt (ANSWER, AUTO_SOLVE, ASK)
 * @returns {Promise<string>} AI response text or error message
 */
async function sendToOpenAI(data, apiKey, promptType = PROMPT_TYPES.ANSWER) {
  try {
    // Check authentication
    if (typeof AuthService === 'undefined') {
      return formatError('Authentication service not available');
    }

    // Use cached user to verify activation without a blocking API call.
    // The actual sendAIRequest() call handles 401/403 by clearing the key.
    const licenseKey = await AuthService.getLicenseKey();
    if (!licenseKey) {
      return formatError('Please activate CaptureAI with a license key');
    }
    const { user } = await AuthService.getCachedOrFreshUser({ allowStale: true });
    if (!user) {
      return formatError('Please activate CaptureAI with a license key');
    }

    // Get dynamic AI configuration based on reasoning level
    const config = await getAIConfig();
    const reasoningLevel = config.USE_LEGACY_PARAMS ? 0 :
      (config.REASONING_EFFORT === 'medium' ? 2 : 1);

    // Build request payload, filtering out null/undefined values
    const requestPayload = {
      promptType: promptType,
      reasoningLevel: reasoningLevel
    };

    // Only add fields if they have valid values
    if (data.question && data.question.trim().length > 0) {
      requestPayload.question = data.question;
    }
    if (data.imageData) {
      requestPayload.imageData = data.imageData;
    }
    if (data.ocrText && data.ocrText.trim().length > 0) {
      requestPayload.ocrText = data.ocrText;
    }
    if (data.ocrConfidence !== null && data.ocrConfidence !== undefined) {
      requestPayload.ocrConfidence = data.ocrConfidence;
    }
    if (data.images && data.images.length > 0) {
      requestPayload.images = data.images;
    }

    // Send request to backend
    const response = await AuthService.sendAIRequest(requestPayload);

    // Cache usage data from response so popup can display it without a separate API call
    if (response.usage) {
      chrome.storage.local.set({
        'captureai-last-usage': { data: response.usage, updatedAt: Date.now() }
      });
    }

    return response.answer || 'No response found';

  } catch (error) {
    console.error('Backend API error:', error);
    return formatError(error.message || 'Failed to get AI response');
  }
}

/**
 * Send text-only question to backend API (no image)
 *
 * @param {string} question - User's question text
 * @param {string} apiKey - DEPRECATED - No longer used (kept for backward compatibility)
 * @returns {Promise<string>} AI response text or error message
 */
async function sendTextOnlyQuestion(question, apiKey) {
  try {
    // Check authentication
    if (typeof AuthService === 'undefined') {
      return formatError('Authentication service not available');
    }

    // Use cached user to verify activation without a blocking API call.
    // The actual sendAIRequest() call handles 401/403 by clearing the key.
    const licenseKey = await AuthService.getLicenseKey();
    if (!licenseKey) {
      return formatError('Please activate CaptureAI with a license key');
    }
    const { user } = await AuthService.getCachedOrFreshUser({ allowStale: true });
    if (!user) {
      return formatError('Please activate CaptureAI with a license key');
    }

    // Get dynamic AI configuration based on reasoning level
    const config = await getAIConfig();
    const reasoningLevel = config.USE_LEGACY_PARAMS ? 0 :
      (config.REASONING_EFFORT === 'medium' ? 2 : 1);

    // Send request to backend (text-only, no image)
    const response = await AuthService.sendAIRequest({
      question: question,
      imageData: undefined,
      promptType: PROMPT_TYPES.ASK,
      reasoningLevel: reasoningLevel
    });

    // Cache usage data from response so popup can display it without a separate API call
    if (response.usage) {
      chrome.storage.local.set({
        'captureai-last-usage': { data: response.usage, updatedAt: Date.now() }
      });
    }

    return response.answer || 'No response found';

  } catch (error) {
    console.error('Backend API error:', error);
    return formatError(error.message || 'Failed to get AI response');
  }
}


// ============================================================================
// SECTION 5: CHROME APIS - SCREENSHOT
// ============================================================================

/**
 * Capture screenshot of currently visible tab
 *
 * @returns {Promise<string>} Base64-encoded PNG image data URI
 * @throws {Error} If screenshot capture fails
 */
async function captureScreenshot() {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (imageUri) => {
      chrome.runtime.lastError
        ? reject(new Error(ERROR_MESSAGES.CAPTURE_FAILED))
        : resolve(imageUri);
    });
  });
}

/**
 * Process captured image - sends to content script for cropping and compression
 *
 * @param {string} imageUri - Base64-encoded full screenshot
 * @param {Object} request - Original request with coordinates
 * @param {Object} sender - Message sender with tab info
 * @returns {Promise<Object>} Processed image data with compressedImageData
 * @throws {Error} If image processing fails
 */
async function processImage(imageUri, request, sender, options = {}) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'processCapturedImage',
      imageUri: imageUri,
      startX: request.coordinates.startX,
      startY: request.coordinates.startY,
      width: request.coordinates.width,
      height: request.coordinates.height,
      enableOCR: options.enableOCR !== undefined ? options.enableOCR : true
    }, (response) => {
      chrome.runtime.lastError
        ? reject(new Error('Error processing image: ' + chrome.runtime.lastError.message))
        : resolve(response);
    });
  });
}


// ============================================================================
// SECTION 6: CHROME APIS - MESSAGING
// ============================================================================

/**
 * Send status message to content script (e.g., "Capturing...", "Processing...")
 *
 * @param {number} tabId - Chrome tab ID
 * @param {string} messageType - Type of message to display
 * @returns {Promise<void>}
 */
async function showMessage(tabId, messageType) {
  try {
    await new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: messageType }, () => resolve());
    });
  } catch (error) {
    if (DEBUG) {
      console.error('CaptureAI: Failed to show message:', messageType, error);
    }
  }
}

/**
 * Send AI response to content script for display
 *
 * @param {number} tabId - Chrome tab ID
 * @param {string} response - AI response text or error message
 * @param {string} [promptType] - Type of prompt used (for context)
 * @returns {Promise<void>}
 */
async function displayResponse(tabId, response, promptType) {
  await new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, {
      action: 'displayResponse',
      response: response,
      promptType: promptType
    }, () => {
      if (chrome.runtime.lastError) {
        // Ignore errors (tab may have closed)
      }
      resolve();
    });
  });

  // Send directly to popup (eliminates content script relay round-trip)
  chrome.runtime.sendMessage({
    action: 'updateResponse',
    message: response,
    isError: typeof response === 'string' && response.startsWith('Error:')
  }).catch(() => {
    // Popup may not be open - ignore
  });
}


// ============================================================================
// SECTION 7: CHROME APIS - TABS & SCRIPTS
// ============================================================================

/**
 * Check if URL is valid for content script injection
 * Rejects chrome:// URLs, extension pages, and Chrome Web Store
 *
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid for injection
 */
function isValidUrl(url) {
  return (url.startsWith('http://') || url.startsWith('https://')) &&
    !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.includes('chrome.google.com/webstore');
}



// ============================================================================
// SECTION 8: STORAGE UTILITIES
// ============================================================================

/**
 * Retrieve stored OpenAI API key from Chrome storage
 *
 * @returns {Promise<string>} API key or empty string if not set
 */
async function getStoredApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY_API_KEY], (result) => {
      resolve(result[STORAGE_KEY_API_KEY] || '');
    });
  });
}


// ============================================================================
// SECTION 9: UTILITY FUNCTIONS
// ============================================================================

/**
 * Format error message with consistent "Error: " prefix
 *
 * @param {string} message - Error message text
 * @returns {string} Formatted error message
 */
function formatError(message) {
  return `Error: ${message}`;
}

/**
 * Detects if OCR text indicates a wrong-answer prompt (e.g. "Try again"),
 * where the AI needs to see the image to identify which option is highlighted in red.
 * @param {string} text - OCR extracted text
 * @returns {boolean} true if a wrong-answer prompt is detected
 */
function isWrongAnswerPrompt(text) {
  if (!text) {
    return false;
  }
  const lower = text.toLowerCase();
  const patterns = [
    /\btry\s+again\b/,
    /\bincorrect\b/,
    /\bwrong\s+answer\b/,
    /\bnot\s+(quite|correct|right)\b/,
    /\bthat('s|\s+is|\s+was)\s+(not|wrong|incorrect)\b/,
    /\bplease\s+try\s+again\b/,
    /\btry\s+once\s+more\b/,
    /\banswer\s+(is\s+)?(wrong|incorrect)\b/,
    /\bprogress\s*:\s*0\s+points\b/
  ];
  return patterns.some(pattern => pattern.test(lower));
}

/**
 * Detects if OCR text describes an image-selection question,
 * where the AI needs to see the actual image to answer correctly.
 * @param {string} text - OCR extracted text
 * @returns {boolean} true if question requires image analysis
 */
function isImageSelectionQuestion(text) {
  if (!text) {
    return false;
  }
  const lower = text.toLowerCase();
  // If OCR text contains references to images/pictures, AI needs to see them
  return /\b(image|picture|photo|diagram|graph|chart|figure|table|map|illustration|drawing)s?\b/.test(lower);
}


// ============================================================================
// TEST EXPORTS
// ============================================================================

/**
 * Export functions for testing (CommonJS for Jest compatibility)
 * Only exports when running in test environment
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Constants
    PROMPT_TYPES,
    OPENAI_CONFIG,
    ERROR_MESSAGES,
    STORAGE_KEY_API_KEY,

    // Functions
    getAIConfig,
    formatError,
    isImageSelectionQuestion,
    isWrongAnswerPrompt,
    sendToOpenAI,
    sendTextOnlyQuestion,
    getStoredApiKey,
    captureScreenshot,
    isValidUrl,
    processImage,
    showMessage,
    displayResponse,
    handleCaptureArea,
    handleAskQuestion,
    handleEnablePrivacyGuard,
    handleDisablePrivacyGuard,
    handleGetPrivacyGuardStatus,
    handleTextSelection,
    applyPrivacyGuardDefault
  };
}
