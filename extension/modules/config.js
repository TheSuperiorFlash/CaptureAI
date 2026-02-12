/**
 * Configuration constants and global settings for CaptureAI
 */

// Configuration Constants
export const CONFIG = {
  DEBUG: true,
  PANEL_ID: 'captureai-panel',
  RESULT_ID: 'captureai-result',
  STEALTHY_RESULT_ID: 'captureai-stealthy-result',
  ESC_KEY_CODE: 'Escape',
  MAX_INVALID_QUESTIONS: 2
};

// Timing Constants (all values in milliseconds)
export const TIMING = {
  ANSWER_FADEOUT: 2000,
  AUTO_SOLVE_ANSWER_DELAY: 500,
  AUTO_SOLVE_CYCLE_DELAY: 2500,
  SCRIPT_INJECTION_WAIT: 3000,
  POPUP_MESSAGE_DELAY: 1500,
  MODULE_RETRY_DELAY: 2000
};

// Storage Keys
export const STORAGE_KEYS = {
  API_KEY: 'captureai-api-key',
  AUTO_SOLVE_MODE: 'captureai-auto-solve-mode',
  LAST_CAPTURE_AREA: 'captureai-last-capture-area',
  ASK_MODE: 'captureai-ask-mode',
  REASONING_LEVEL: 'captureai-reasoning-level'
};

// Prompt types
// NOTE: These constants are also defined in background.js for service worker
// Keep these values in sync when making changes
export const PROMPT_TYPES = {
  ANSWER: 'answer',
  AUTO_SOLVE: 'auto_solve',
  ASK: 'ask'
};

// Default icons (will be populated after Chrome APIs are available)
export const ICONS = {
  CHECKMARK: null,
  CAMERA: null,
  ATTACH: null,
  ATTACHED: null,

  // Initialize icons when Chrome APIs are ready
  init() {
    this.CHECKMARK = chrome.runtime.getURL('icons/icon128.png');
    this.CAMERA = chrome.runtime.getURL('icons/camera.png');
    this.ATTACH = chrome.runtime.getURL('icons/attach.png');
    this.ATTACHED = chrome.runtime.getURL('icons/attached.png');
  }
};

// Global state object
export const STATE = {
  isDragging: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  selectionBox: null,
  lastCaptureArea: null,
  apiKey: '',
  isPanelVisible: false,
  isProcessing: false,
  answerFadeoutTimer: null,
  uiElements: {},
  isShowingAnswer: false,
  currentPromptType: null,
  eventListeners: [],
  isAutoSolveMode: false,
  autoSolveTimer: null,
  invalidQuestionCount: 0,
  autoSolveToggle: null,
  isAskMode: false,
  currentResponse: '',
  userTier: 'free'  // User tier: 'free' or 'pro'
};

// Cached DOM elements
export const DOM_CACHE = {
  panel: null,
  stealthyResult: null
};
