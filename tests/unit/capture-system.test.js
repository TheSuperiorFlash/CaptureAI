/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for Capture System Module
 *
 * Tests the actual CaptureSystem module from extension/modules/capture-system.js
 * focusing on coordinate normalization, selection validation, and zoom scaling
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CaptureSystem } from '../../modules/capture-system.js';

describe('Capture System Module', () => {
  let mockState;

  beforeEach(() => {
    mockState = {
      isProcessing: false,
      isPanelVisible: true,
      isDragging: false,
      isAutoSolveMode: false,
      isForAskMode: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      selectionBox: null,
      currentPromptType: null
    };

    window.CaptureAI = {
      STATE: mockState,
      DOM_CACHE: {
        panel: document.createElement('div')
      },
      STORAGE_KEYS: {
        LAST_CAPTURE_AREA: 'captureai-last-capture-area'
      },
      PROMPT_TYPES: {
        ANSWER: 'ANSWER',
        AUTO_SOLVE: 'AUTO_SOLVE'
      },
      StorageUtils: {
        getValue: jest.fn().mockResolvedValue(null),
        setValue: jest.fn().mockResolvedValue(undefined)
      }
    };

    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1,
      writable: true,
      configurable: true
    });

    // Mock requestAnimationFrame
    window.requestAnimationFrame = jest.fn((cb) => {
      cb();
      return 0;
    });
  });

  afterEach(() => {
    // Clean up any overlay elements
    const overlay = document.getElementById('captureai-overlay');
    if (overlay) overlay.remove();
    if (mockState.selectionBox) {
      mockState.selectionBox.remove();
      mockState.selectionBox = null;
    }
  });

  describe('updateSelectionBox', () => {
    test('should do nothing when selectionBox is null', () => {
      mockState.selectionBox = null;
      expect(() => CaptureSystem.updateSelectionBox()).not.toThrow();
    });

    test('should normalize coordinates (top-left to bottom-right)', () => {
      const box = document.createElement('div');
      mockState.selectionBox = box;

      // Drag from bottom-right to top-left
      mockState.startX = 200;
      mockState.startY = 300;
      mockState.endX = 50;
      mockState.endY = 100;

      CaptureSystem.updateSelectionBox();

      expect(box.style.left).toBe('50px');
      expect(box.style.top).toBe('100px');
      expect(box.style.width).toBe('150px');
      expect(box.style.height).toBe('200px');
    });

    test('should handle normal top-left to bottom-right drag', () => {
      const box = document.createElement('div');
      mockState.selectionBox = box;

      mockState.startX = 10;
      mockState.startY = 20;
      mockState.endX = 110;
      mockState.endY = 120;

      CaptureSystem.updateSelectionBox();

      expect(box.style.left).toBe('10px');
      expect(box.style.top).toBe('20px');
      expect(box.style.width).toBe('100px');
      expect(box.style.height).toBe('100px');
    });

    test('should handle zero-size selection', () => {
      const box = document.createElement('div');
      mockState.selectionBox = box;

      mockState.startX = 100;
      mockState.startY = 100;
      mockState.endX = 100;
      mockState.endY = 100;

      CaptureSystem.updateSelectionBox();

      expect(box.style.width).toBe('0px');
      expect(box.style.height).toBe('0px');
    });
  });

  describe('onMouseUp', () => {
    test('should do nothing when not dragging', () => {
      mockState.isDragging = false;
      const spy = jest.spyOn(CaptureSystem, 'cancelSelection');

      CaptureSystem.onMouseUp({ clientX: 100, clientY: 100 });

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should cancel selection for too-small width', () => {
      mockState.isDragging = true;
      mockState.startX = 100;
      mockState.startY = 100;
      const spy = jest.spyOn(CaptureSystem, 'cancelSelection').mockImplementation(() => {});

      CaptureSystem.onMouseUp({ clientX: 105, clientY: 200 }); // width=5 < 10

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should cancel selection for too-small height', () => {
      mockState.isDragging = true;
      mockState.startX = 100;
      mockState.startY = 100;
      const spy = jest.spyOn(CaptureSystem, 'cancelSelection').mockImplementation(() => {});

      CaptureSystem.onMouseUp({ clientX: 200, clientY: 105 }); // height=5 < 10

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should complete selection for valid size', () => {
      mockState.isDragging = true;
      mockState.startX = 100;
      mockState.startY = 100;
      const spy = jest.spyOn(CaptureSystem, 'completeSelection').mockImplementation(() => {});

      CaptureSystem.onMouseUp({ clientX: 200, clientY: 200 }); // 100x100, valid

      expect(spy).toHaveBeenCalled();
      expect(mockState.isDragging).toBe(false);
      spy.mockRestore();
    });

    test('should handle reverse drag (end before start)', () => {
      mockState.isDragging = true;
      mockState.startX = 200;
      mockState.startY = 200;
      const spy = jest.spyOn(CaptureSystem, 'completeSelection').mockImplementation(() => {});

      CaptureSystem.onMouseUp({ clientX: 100, clientY: 100 }); // abs diff = 100x100

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should enforce minimum 10x10 selection', () => {
      mockState.isDragging = true;
      mockState.startX = 50;
      mockState.startY = 50;
      const cancelSpy = jest.spyOn(CaptureSystem, 'cancelSelection').mockImplementation(() => {});
      const completeSpy = jest.spyOn(CaptureSystem, 'completeSelection').mockImplementation(() => {});

      // Exactly 9x9 — too small
      CaptureSystem.onMouseUp({ clientX: 59, clientY: 59 });

      expect(cancelSpy).toHaveBeenCalled();
      expect(completeSpy).not.toHaveBeenCalled();
      cancelSpy.mockRestore();
      completeSpy.mockRestore();
    });
  });

  describe('onMouseDown', () => {
    test('should set dragging state and coordinates', () => {
      jest.spyOn(CaptureSystem, 'createSelectionBox').mockReturnValue(document.createElement('div'));
      jest.spyOn(CaptureSystem, 'updateSelectionBox').mockImplementation(() => {});

      CaptureSystem.onMouseDown({ clientX: 150, clientY: 250 });

      expect(mockState.isDragging).toBe(true);
      expect(mockState.startX).toBe(150);
      expect(mockState.startY).toBe(250);
      expect(mockState.endX).toBe(150);
      expect(mockState.endY).toBe(250);
    });
  });

  describe('onMouseMove', () => {
    test('should do nothing when not dragging', () => {
      mockState.isDragging = false;
      const spy = jest.spyOn(CaptureSystem, 'updateSelectionBox');

      CaptureSystem.onMouseMove({ clientX: 100, clientY: 100 });

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should update end coordinates when dragging', () => {
      mockState.isDragging = true;
      jest.spyOn(CaptureSystem, 'updateSelectionBox').mockImplementation(() => {});

      CaptureSystem.onMouseMove({ clientX: 300, clientY: 400 });

      expect(mockState.endX).toBe(300);
      expect(mockState.endY).toBe(400);
    });
  });

  describe('onKeyDown', () => {
    test('should cancel selection on Escape', () => {
      const spy = jest.spyOn(CaptureSystem, 'cancelSelection').mockImplementation(() => {});

      CaptureSystem.onKeyDown({ key: 'Escape' });

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should cancel selection on Esc (legacy)', () => {
      const spy = jest.spyOn(CaptureSystem, 'cancelSelection').mockImplementation(() => {});

      CaptureSystem.onKeyDown({ key: 'Esc' });

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should not cancel on other keys', () => {
      const spy = jest.spyOn(CaptureSystem, 'cancelSelection').mockImplementation(() => {});

      CaptureSystem.onKeyDown({ key: 'Enter' });
      CaptureSystem.onKeyDown({ key: 'a' });

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('createOverlay', () => {
    test('should create overlay with crosshair cursor when panel visible', () => {
      mockState.isPanelVisible = true;
      const overlay = CaptureSystem.createOverlay();

      expect(overlay.id).toBe('captureai-overlay');
      expect(overlay.style.cursor).toBe('crosshair');
      expect(overlay.style.position).toBe('fixed');
      expect(overlay.style.zIndex).toBe('2147483646');
    });

    test('should create transparent overlay in stealth mode', () => {
      mockState.isPanelVisible = false;
      const overlay = CaptureSystem.createOverlay();

      expect(overlay.style.backgroundColor).toBe('transparent');
      expect(overlay.style.cursor).toBe('default');
    });
  });

  describe('startCapture', () => {
    test('should not start when processing', () => {
      mockState.isProcessing = true;
      const spy = jest.spyOn(CaptureSystem, 'startSelectionProcess');

      CaptureSystem.startCapture();

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should hide panel and start selection', () => {
      const spy = jest.spyOn(CaptureSystem, 'startSelectionProcess').mockImplementation(() => {});
      window.CaptureAI.DOM_CACHE.panel.style.display = 'block';

      CaptureSystem.startCapture();

      expect(window.CaptureAI.DOM_CACHE.panel.style.display).toBe('none');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should set auto-solve prompt type when auto-solve active', () => {
      jest.spyOn(CaptureSystem, 'startSelectionProcess').mockImplementation(() => {});
      mockState.isAutoSolveMode = true;

      CaptureSystem.startCapture();

      expect(mockState.currentPromptType).toBe('AUTO_SOLVE');
    });

    test('should set answer prompt type normally', () => {
      jest.spyOn(CaptureSystem, 'startSelectionProcess').mockImplementation(() => {});

      CaptureSystem.startCapture();

      expect(mockState.currentPromptType).toBe('ANSWER');
    });

    test('should not set prompt type for ask mode', () => {
      jest.spyOn(CaptureSystem, 'startSelectionProcess').mockImplementation(() => {});

      CaptureSystem.startCapture(true);

      expect(mockState.isForAskMode).toBe(true);
      expect(mockState.currentPromptType).toBeNull();
    });
  });

  describe('quickCapture', () => {
    test('should not capture when processing', async () => {
      mockState.isProcessing = true;

      await CaptureSystem.quickCapture();

      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('should not capture when no last area stored', async () => {
      window.CaptureAI.StorageUtils.getValue.mockResolvedValue(null);

      await CaptureSystem.quickCapture();

      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('should capture with last area', async () => {
      const lastArea = { startX: 10, startY: 20, width: 100, height: 50 };
      window.CaptureAI.StorageUtils.getValue.mockResolvedValue(lastArea);

      await CaptureSystem.quickCapture();

      expect(mockState.isProcessing).toBe(true);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'captureArea',
          coordinates: lastArea,
          promptType: 'ANSWER'
        })
      );
    });
  });

  describe('module exports', () => {
    test('should export CaptureSystem object', () => {
      expect(CaptureSystem).toBeDefined();
      expect(typeof CaptureSystem.startCapture).toBe('function');
      expect(typeof CaptureSystem.quickCapture).toBe('function');
      expect(typeof CaptureSystem.updateSelectionBox).toBe('function');
      expect(typeof CaptureSystem.cancelSelection).toBe('function');
      expect(typeof CaptureSystem.completeSelection).toBe('function');
    });
  });
});
