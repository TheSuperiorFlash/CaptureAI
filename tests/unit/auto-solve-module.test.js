/**
 * Unit Tests for Auto-Solve Module
 *
 * Tests the AutoSolve module including response handling,
 * answer extraction, state management, and timer control
 */

import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { AutoSolve } from '../../modules/auto-solve.js';

describe('AutoSolve Module', () => {
  let mockWindow;
  let mockDocument;
  let mockChrome;

  beforeEach(() => {
    // Reset timers
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Mock window.CaptureAI structure
    mockWindow = {
      CaptureAI: {
        STATE: {
          isAutoSolveMode: false,
          isProcessing: false,
          invalidQuestionCount: 0,
          autoSolveTimer: null,
          currentPromptType: null
        },
        STORAGE_KEYS: {
          AUTO_SOLVE_MODE: 'auto-solve-mode',
          LAST_CAPTURE_AREA: 'last-capture-area'
        },
        CONFIG: {
          MAX_INVALID_QUESTIONS: 3
        },
        TIMING: {
          AUTO_SOLVE_CYCLE_DELAY: 2000,
          AUTO_SOLVE_ANSWER_DELAY: 1000
        },
        PROMPT_TYPES: {
          AUTO_SOLVE: 'AUTO_SOLVE'
        },
        StorageUtils: {
          getValue: jest.fn(),
          setValue: jest.fn()
        },
        DomainUtils: {
          isOnSupportedSite: jest.fn(() => true)
        },
        Utils: {
          debounce: jest.fn((fn) => fn)
        }
      }
    };

    // Mock document
    mockDocument = {
      getElementById: jest.fn(),
      activeElement: null
    };

    // Mock chrome
    mockChrome = {
      runtime: {
        sendMessage: jest.fn(),
        lastError: null
      }
    };

    global.window = mockWindow;
    global.document = mockDocument;
    global.chrome = mockChrome;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('handleAutoSolveResponse', () => {
    test('should extract valid answer and reset invalid counter', async () => {
      const response = 'The correct answer is 3';

      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.invalidQuestionCount = 2;

      await AutoSolve.handleAutoSolveResponse(response);

      // Should reset invalid counter for valid response
      expect(mockWindow.CaptureAI.STATE.invalidQuestionCount).toBe(0);
      expect(mockWindow.CaptureAI.STATE.isProcessing).toBe(false);
    });

    test('should handle invalid question response', async () => {
      const response = 'Invalid question';

      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.invalidQuestionCount = 0;

      await AutoSolve.handleAutoSolveResponse(response);

      // Should increment invalid counter
      expect(mockWindow.CaptureAI.STATE.invalidQuestionCount).toBe(1);
      expect(mockWindow.CaptureAI.STATE.isProcessing).toBe(false);
    });

    test('should disable auto-solve after max invalid questions', async () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.invalidQuestionCount = 2; // One more will hit max (3)

      // Reset last response to prevent duplicate filtering
      AutoSolve.lastAutoSolveResponse = null;
      AutoSolve.lastAutoSolveTime = 0;

      AutoSolve.toggleAutoSolveMode = jest.fn();

      await AutoSolve.handleAutoSolveResponse('Invalid question');

      expect(mockWindow.CaptureAI.STATE.invalidQuestionCount).toBe(3);
      expect(AutoSolve.toggleAutoSolveMode).toHaveBeenCalledWith(false);
    });

    test('should handle error responses', async () => {
      const response = 'Error: API timeout';

      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.invalidQuestionCount = 0;

      await AutoSolve.handleAutoSolveResponse(response);

      // Errors count as invalid
      expect(mockWindow.CaptureAI.STATE.invalidQuestionCount).toBe(1);
    });

    test('should ignore duplicate responses within 1 second', async () => {
      const response = 'The answer is 2';

      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      AutoSolve.lastAutoSolveResponse = response;
      AutoSolve.lastAutoSolveTime = Date.now();

      const initialProcessing = mockWindow.CaptureAI.STATE.isProcessing;
      await AutoSolve.handleAutoSolveResponse(response);

      // Should be ignored, processing state unchanged
      expect(mockWindow.CaptureAI.STATE.isProcessing).toBe(initialProcessing);
    });

    test('should not process when auto-solve is disabled', async () => {
      const response = 'The answer is 1';

      mockWindow.CaptureAI.STATE.isAutoSolveMode = false;
      const spy = jest.spyOn(AutoSolve, 'scheduleNextAutoSolve');

      await AutoSolve.handleAutoSolveResponse(response);

      // Should not schedule next auto-solve
      expect(spy).not.toHaveBeenCalled();
    });

    test('should schedule next auto-solve after processing', async () => {
      const response = 'The answer is 4';

      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      const spy = jest.spyOn(AutoSolve, 'scheduleNextAutoSolve');

      await AutoSolve.handleAutoSolveResponse(response);

      expect(spy).toHaveBeenCalled();
    });

    test('should handle no response found', async () => {
      const response = 'No response found';

      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.invalidQuestionCount = 0;

      await AutoSolve.handleAutoSolveResponse(response);

      expect(mockWindow.CaptureAI.STATE.invalidQuestionCount).toBe(1);
    });
  });

  describe('getAutoSolveCaptureArea', () => {
    test('should return null when no last capture area', async () => {
      mockWindow.CaptureAI.StorageUtils.getValue.mockResolvedValue(null);

      const result = await AutoSolve.getAutoSolveCaptureArea();

      expect(result).toBeNull();
    });

    test('should convert stored area to coordinates format (left/top format)', async () => {
      const storedArea = {
        left: 10,
        top: 20,
        width: 100,
        height: 50
      };
      mockWindow.CaptureAI.StorageUtils.getValue.mockResolvedValue(storedArea);

      const result = await AutoSolve.getAutoSolveCaptureArea();

      expect(result).toEqual({
        startX: 10,
        startY: 20,
        width: 100,
        height: 50
      });
    });

    test('should handle startX/startY format', async () => {
      const storedArea = {
        startX: 15,
        startY: 25,
        width: 200,
        height: 75
      };
      mockWindow.CaptureAI.StorageUtils.getValue.mockResolvedValue(storedArea);

      const result = await AutoSolve.getAutoSolveCaptureArea();

      expect(result).toEqual({
        startX: 15,
        startY: 25,
        width: 200,
        height: 75
      });
    });

    test('should return null for invalid coordinates', async () => {
      const storedArea = {
        left: undefined,
        top: 20,
        width: 100,
        height: 50
      };
      mockWindow.CaptureAI.StorageUtils.getValue.mockResolvedValue(storedArea);

      const result = await AutoSolve.getAutoSolveCaptureArea();

      expect(result).toBeNull();
    });
  });

  describe('scheduleNextAutoSolve', () => {
    test('should schedule timer when auto-solve is enabled', () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;

      AutoSolve.scheduleNextAutoSolve();

      expect(mockWindow.CaptureAI.STATE.autoSolveTimer).not.toBeNull();
    });

    test('should not schedule when auto-solve is disabled', () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = false;

      AutoSolve.scheduleNextAutoSolve();

      expect(mockWindow.CaptureAI.STATE.autoSolveTimer).toBeNull();
    });

    test('should clear existing timer before scheduling new one', () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.autoSolveTimer = 123;

      const spy = jest.spyOn(AutoSolve, 'cancelAutoSolve');

      AutoSolve.scheduleNextAutoSolve();

      expect(spy).toHaveBeenCalled();
    });

    test('should use correct delay from TIMING config', () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      const performSpy = jest.spyOn(AutoSolve, 'performAutoSolve');

      AutoSolve.scheduleNextAutoSolve();

      jest.advanceTimersByTime(2000); // TIMING.AUTO_SOLVE_CYCLE_DELAY

      expect(performSpy).toHaveBeenCalled();
    });
  });

  describe('cancelAutoSolve', () => {
    test('should clear active timer', () => {
      mockWindow.CaptureAI.STATE.autoSolveTimer = 456;

      AutoSolve.cancelAutoSolve();

      expect(mockWindow.CaptureAI.STATE.autoSolveTimer).toBeNull();
      // clearTimeout is called with fake timers
    });

    test('should handle no active timer', () => {
      mockWindow.CaptureAI.STATE.autoSolveTimer = null;

      expect(() => AutoSolve.cancelAutoSolve()).not.toThrow();
      expect(mockWindow.CaptureAI.STATE.autoSolveTimer).toBeNull();
    });
  });

  describe('performAutoSolve', () => {
    test('should not run when auto-solve is disabled', async () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = false;

      await AutoSolve.performAutoSolve();

      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('should not run when already processing', async () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.isProcessing = true;

      await AutoSolve.performAutoSolve();

      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('should disable auto-solve on unsupported site', async () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.DomainUtils.isOnSupportedSite.mockReturnValue(false);

      const spy = jest.spyOn(AutoSolve, 'toggleAutoSolveMode');

      await AutoSolve.performAutoSolve();

      expect(spy).toHaveBeenCalledWith(false);
    });

    test('should disable after max invalid questions reached', async () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.invalidQuestionCount = 3; // At max

      const spy = jest.spyOn(AutoSolve, 'toggleAutoSolveMode');

      await AutoSolve.performAutoSolve();

      expect(spy).toHaveBeenCalledWith(false);
    });
  });

  describe('Answer Extraction Patterns', () => {
    test('should extract single digit answers', () => {
      const responses = [
        'The answer is 1',
        'Choose option 2',
        'Select 3',
        'Answer: 4'
      ];

      responses.forEach((response, index) => {
        const match = response.match(/[1-4]/);
        expect(match).not.toBeNull();
        expect(match[0]).toBe(String(index + 1));
      });
    });

    test('should not match invalid numbers', () => {
      const responses = ['0', '5', '6', '7', '8', '9'];

      responses.forEach((response) => {
        const match = response.match(/[1-4]/);
        expect(match).toBeNull();
      });
    });

    test('should extract first valid number from complex response', () => {
      const response = 'After analyzing options 1-4, I recommend option 2 because it aligns with principle 3';
      const match = response.match(/[1-4]/);

      expect(match[0]).toBe('1'); // First match
    });

    test('should handle lowercase text', () => {
      const response = 'the correct answer is 3';
      const cleanResponse = response.trim().toLowerCase();
      const match = cleanResponse.match(/[1-4]/);

      expect(match[0]).toBe('3');
    });
  });

  describe('Invalid Response Detection', () => {
    test('should detect invalid question responses', () => {
      const responses = [
        'Invalid question',
        'INVALID QUESTION',
        'This is an invalid question',
        'invalid question detected'
      ];

      responses.forEach((response) => {
        const cleanResponse = response.trim().toLowerCase();
        expect(cleanResponse.includes('invalid question')).toBe(true);
      });
    });

    test('should detect no response found', () => {
      const response = 'No response found';
      const cleanResponse = response.trim().toLowerCase();

      expect(cleanResponse.includes('no response found')).toBe(true);
    });

    test('should detect error responses', () => {
      const responses = [
        'Error: Connection timeout',
        'error: invalid input',
        'ERROR: Failed to process'
      ];

      responses.forEach((response) => {
        const cleanResponse = response.trim().toLowerCase();
        expect(cleanResponse.startsWith('error:')).toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete auto-solve cycle', async () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.invalidQuestionCount = 0;

      // Simulate receiving a valid response
      await AutoSolve.handleAutoSolveResponse('The answer is 2');

      expect(mockWindow.CaptureAI.STATE.isProcessing).toBe(false);
      expect(mockWindow.CaptureAI.STATE.invalidQuestionCount).toBe(0);
    });

    test('should handle invalid question streak', async () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.invalidQuestionCount = 0;

      const toggleSpy = jest.spyOn(AutoSolve, 'toggleAutoSolveMode');

      // Simulate 3 different invalid responses in a row (to avoid duplicate filtering)
      AutoSolve.lastAutoSolveResponse = null;
      await AutoSolve.handleAutoSolveResponse('Invalid question 1');

      AutoSolve.lastAutoSolveResponse = null;
      await AutoSolve.handleAutoSolveResponse('Invalid question 2');

      AutoSolve.lastAutoSolveResponse = null;
      await AutoSolve.handleAutoSolveResponse('Invalid question 3');

      expect(mockWindow.CaptureAI.STATE.invalidQuestionCount).toBe(3);
      expect(toggleSpy).toHaveBeenCalledWith(false);
    });

    test('should reset invalid counter on valid response', async () => {
      mockWindow.CaptureAI.STATE.isAutoSolveMode = true;
      mockWindow.CaptureAI.STATE.invalidQuestionCount = 2;

      // Valid response should reset counter
      await AutoSolve.handleAutoSolveResponse('Answer is 1');

      expect(mockWindow.CaptureAI.STATE.invalidQuestionCount).toBe(0);
    });
  });
});
