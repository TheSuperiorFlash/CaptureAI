/**
 * Unit Tests for Config Module
 * Tests configuration constants, storage keys, state defaults, and icon initialization
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const { resetChromeMocks } = require('../setup/chrome-mock');

let CONFIG, TIMING, STORAGE_KEYS, PROMPT_TYPES, ICONS, STATE, DOM_CACHE;

beforeEach(() => {
  resetChromeMocks();
  // Re-require to get fresh module state
  jest.resetModules();
  const config = require('../../extension/modules/config.js');
  CONFIG = config.CONFIG;
  TIMING = config.TIMING;
  STORAGE_KEYS = config.STORAGE_KEYS;
  PROMPT_TYPES = config.PROMPT_TYPES;
  ICONS = config.ICONS;
  STATE = config.STATE;
  DOM_CACHE = config.DOM_CACHE;
});

describe('CONFIG constants', () => {
  test('should have DEBUG set to false', () => {
    expect(CONFIG.DEBUG).toBe(false);
  });

  test('should have correct PANEL_ID', () => {
    expect(CONFIG.PANEL_ID).toBe('captureai-panel');
  });

  test('should have correct RESULT_ID', () => {
    expect(CONFIG.RESULT_ID).toBe('captureai-result');
  });

  test('should have correct STEALTHY_RESULT_ID', () => {
    expect(CONFIG.STEALTHY_RESULT_ID).toBe('captureai-stealthy-result');
  });

  test('should have correct ESC_KEY_CODE', () => {
    expect(CONFIG.ESC_KEY_CODE).toBe('Escape');
  });

  test('should have MAX_INVALID_QUESTIONS as a number', () => {
    expect(typeof CONFIG.MAX_INVALID_QUESTIONS).toBe('number');
    expect(CONFIG.MAX_INVALID_QUESTIONS).toBeGreaterThan(0);
  });
});

describe('TIMING constants', () => {
  test('should have all timing values as positive numbers', () => {
    Object.entries(TIMING).forEach(([key, value]) => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });

  test('should have expected timing keys', () => {
    expect(TIMING).toHaveProperty('ANSWER_FADEOUT');
    expect(TIMING).toHaveProperty('AUTO_SOLVE_ANSWER_DELAY');
    expect(TIMING).toHaveProperty('AUTO_SOLVE_CYCLE_DELAY');
    expect(TIMING).toHaveProperty('SCRIPT_INJECTION_WAIT');
    expect(TIMING).toHaveProperty('POPUP_MESSAGE_DELAY');
    expect(TIMING).toHaveProperty('MODULE_RETRY_DELAY');
  });
});

describe('STORAGE_KEYS', () => {
  test('should have captureai prefix on all keys', () => {
    Object.values(STORAGE_KEYS).forEach(value => {
      expect(value).toMatch(/^captureai-/);
    });
  });

  test('should have expected storage keys', () => {
    expect(STORAGE_KEYS.API_KEY).toBe('captureai-api-key');
    expect(STORAGE_KEYS.AUTO_SOLVE_MODE).toBe('captureai-auto-solve-mode');
    expect(STORAGE_KEYS.LAST_CAPTURE_AREA).toBe('captureai-last-capture-area');
    expect(STORAGE_KEYS.ASK_MODE).toBe('captureai-ask-mode');
    expect(STORAGE_KEYS.REASONING_LEVEL).toBe('captureai-reasoning-level');
  });

  test('should have unique values', () => {
    const values = Object.values(STORAGE_KEYS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('PROMPT_TYPES', () => {
  test('should have expected prompt types', () => {
    expect(PROMPT_TYPES.ANSWER).toBe('answer');
    expect(PROMPT_TYPES.AUTO_SOLVE).toBe('auto_solve');
    expect(PROMPT_TYPES.ASK).toBe('ask');
  });

  test('should have exactly 3 prompt types', () => {
    expect(Object.keys(PROMPT_TYPES)).toHaveLength(3);
  });
});

describe('ICONS', () => {
  test('should have null initial values', () => {
    expect(ICONS.CHECKMARK).toBeNull();
    expect(ICONS.CAMERA).toBeNull();
    expect(ICONS.ATTACH).toBeNull();
    expect(ICONS.ATTACHED).toBeNull();
  });

  test('should have init method', () => {
    expect(typeof ICONS.init).toBe('function');
  });

  test('init should populate icon URLs using chrome.runtime.getURL', () => {
    ICONS.init();
    expect(ICONS.CHECKMARK).toBe('chrome-extension://mock-id/icons/icon128.png');
    expect(ICONS.CAMERA).toBe('chrome-extension://mock-id/icons/camera.png');
    expect(ICONS.ATTACH).toBe('chrome-extension://mock-id/icons/attach.png');
    expect(ICONS.ATTACHED).toBe('chrome-extension://mock-id/icons/attached.png');
  });
});

describe('STATE', () => {
  test('should have correct default values', () => {
    expect(STATE.isDragging).toBe(false);
    expect(STATE.startX).toBe(0);
    expect(STATE.startY).toBe(0);
    expect(STATE.endX).toBe(0);
    expect(STATE.endY).toBe(0);
    expect(STATE.selectionBox).toBeNull();
    expect(STATE.lastCaptureArea).toBeNull();
    expect(STATE.apiKey).toBe('');
    expect(STATE.isPanelVisible).toBe(false);
    expect(STATE.isProcessing).toBe(false);
    expect(STATE.answerFadeoutTimer).toBeNull();
    expect(STATE.isShowingAnswer).toBe(false);
    expect(STATE.currentPromptType).toBeNull();
    expect(STATE.isAutoSolveMode).toBe(false);
    expect(STATE.autoSolveTimer).toBeNull();
    expect(STATE.invalidQuestionCount).toBe(0);
    expect(STATE.autoSolveToggle).toBeNull();
    expect(STATE.isAskMode).toBe(false);
    expect(STATE.currentResponse).toBe('');
    expect(STATE.userTier).toBe('free');
  });

  test('should have eventListeners as empty array', () => {
    expect(Array.isArray(STATE.eventListeners)).toBe(true);
    expect(STATE.eventListeners).toHaveLength(0);
  });

  test('should have uiElements as empty object', () => {
    expect(typeof STATE.uiElements).toBe('object');
    expect(Object.keys(STATE.uiElements)).toHaveLength(0);
  });
});

describe('DOM_CACHE', () => {
  test('should have null initial values', () => {
    expect(DOM_CACHE.panel).toBeNull();
    expect(DOM_CACHE.stealthyResult).toBeNull();
  });
});
