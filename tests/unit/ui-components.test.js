/**
 * @jest-environment jsdom
 */

/* global HTMLElement */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { storageMock, makeStorageGetMock } from '../setup/chrome-mock.js';
import { UIComponents } from '../../modules/ui-components.js';

describe('UIComponents', () => {
  beforeEach(() => {
    // Reset singleton state between tests
    UIComponents.floatingUICreated = false;
    UIComponents.panel = null;
    UIComponents.buttonsContainer = null;
    UIComponents.askModeContainer = null;
    UIComponents.askTextInput = null;
    UIComponents.askButton = null;
    UIComponents.attachImageButton = null;
    UIComponents.imagePreview = null;
    UIComponents.attachedImageData = null;
    UIComponents.attachedOCRData = null;

    // Minimal window.CaptureAI environment
    window.CaptureAI = {
      STATE: { isAskMode: false, isAutoSolveMode: false },
      CONFIG: { PANEL_ID: 'captureai-panel', DEBUG: false },
      ICONS: { CAMERA: '', ATTACH: '', ATTACHED: '' }
    };
  });

  // --------------------------------------------------------------------------
  // getTheme
  // --------------------------------------------------------------------------

  describe('getTheme()', () => {
    test('delegates to UICore.getCurrentTheme when available', () => {
      const customTheme = { primaryBg: '#111', buttonPrimary: '#222' };
      window.CaptureAI.UICore = { getCurrentTheme: jest.fn().mockReturnValue(customTheme) };

      const theme = UIComponents.getTheme();

      expect(theme).toBe(customTheme);
      expect(window.CaptureAI.UICore.getCurrentTheme).toHaveBeenCalledTimes(1);
    });

    test('returns fallback theme when UICore is absent', () => {
      const theme = UIComponents.getTheme();

      expect(theme.primaryBg).toBe('white');
      expect(theme.buttonPrimary).toBe('#4caf65');
      expect(theme.errorText).toBe('#ff6b6b');
    });

    test('returns fallback theme when UICore has no getCurrentTheme method', () => {
      window.CaptureAI.UICore = {};

      const theme = UIComponents.getTheme();

      expect(theme.primaryBg).toBe('white');
    });
  });

  // --------------------------------------------------------------------------
  // showMessage
  // --------------------------------------------------------------------------

  describe('showMessage()', () => {
    test('delegates to UICore.showMessage', () => {
      const mockFn = jest.fn();
      window.CaptureAI.UICore = { showMessage: mockFn };

      UIComponents.showMessage('Processing...', false);

      expect(mockFn).toHaveBeenCalledWith('Processing...', false);
    });

    test('does not throw when UICore.showMessage is absent', () => {
      expect(() => UIComponents.showMessage('test', true)).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // handleAskQuestion
  // --------------------------------------------------------------------------

  describe('handleAskQuestion()', () => {
    test('delegates to UICore.handleAskQuestion', () => {
      const mockFn = jest.fn();
      window.CaptureAI.UICore = { handleAskQuestion: mockFn };

      UIComponents.handleAskQuestion('my question', 'data:image/png;base64,img', null);

      expect(mockFn).toHaveBeenCalledWith('my question', 'data:image/png;base64,img', null);
    });

    test('does not throw when UICore.handleAskQuestion is absent', () => {
      expect(() => UIComponents.handleAskQuestion('q', null, null)).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // ensureAskModeExists
  // --------------------------------------------------------------------------

  describe('ensureAskModeExists()', () => {
    test('returns existing container without recreating it', () => {
      const existing = document.createElement('div');
      UIComponents.askModeContainer = existing;

      const result = UIComponents.ensureAskModeExists();

      expect(result).toBe(existing);
    });

    test('creates and returns ask mode container when none exists', () => {
      UIComponents.panel = document.createElement('div');
      window.CaptureAI.UICore = { attachComponent: jest.fn() };

      UIComponents.ensureAskModeExists();

      expect(UIComponents.askModeContainer).not.toBeNull();
      expect(UIComponents.askModeContainer instanceof HTMLElement).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // createToggleSwitch
  // --------------------------------------------------------------------------

  describe('createToggleSwitch()', () => {
    test('returns a label element with an inner checkbox input', () => {
      const theme = UIComponents.getTheme();
      const toggle = UIComponents.createToggleSwitch(theme);

      expect(toggle.tagName).toBe('LABEL');
      expect(toggle.querySelector('input[type="checkbox"]')).not.toBeNull();
    });

    test('checkbox is unchecked when isAutoSolveMode is false', () => {
      window.CaptureAI.STATE.isAutoSolveMode = false;
      const toggle = UIComponents.createToggleSwitch(UIComponents.getTheme());

      expect(toggle.querySelector('input').checked).toBe(false);
    });

    test('checkbox is checked when isAutoSolveMode is true', () => {
      window.CaptureAI.STATE.isAutoSolveMode = true;
      const toggle = UIComponents.createToggleSwitch(UIComponents.getTheme());

      expect(toggle.querySelector('input').checked).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // updateAutoSolveForTier
  // --------------------------------------------------------------------------

  describe('updateAutoSolveForTier()', () => {
    test('returns early without error when buttonsContainer is null', async () => {
      UIComponents.buttonsContainer = null;

      await expect(UIComponents.updateAutoSolveForTier()).resolves.toBeUndefined();
    });

    test('appends a toggle for pro-tier users when none exists', async () => {
      storageMock.local.get.mockImplementationOnce(
        makeStorageGetMock({ 'captureai-user-tier': 'pro' })
      );
      UIComponents.buttonsContainer = document.createElement('div');

      await UIComponents.updateAutoSolveForTier();

      expect(UIComponents.buttonsContainer.children.length).toBe(1);
    });

    test('does not append a toggle for free-tier users', async () => {
      storageMock.local.get.mockImplementationOnce(
        makeStorageGetMock({ 'captureai-user-tier': 'free' })
      );
      UIComponents.buttonsContainer = document.createElement('div');

      await UIComponents.updateAutoSolveForTier();

      expect(UIComponents.buttonsContainer.children.length).toBe(0);
    });

    test('defaults to free tier when storage has no tier key', async () => {
      storageMock.local.get.mockImplementationOnce(makeStorageGetMock({}));
      UIComponents.buttonsContainer = document.createElement('div');

      await UIComponents.updateAutoSolveForTier();

      expect(UIComponents.buttonsContainer.children.length).toBe(0);
    });

    test('shows existing toggle when user is pro', async () => {
      storageMock.local.get.mockImplementationOnce(
        makeStorageGetMock({ 'captureai-user-tier': 'pro' })
      );
      UIComponents.buttonsContainer = document.createElement('div');

      // Create a fake existing auto-solve container with a toggle switch inside
      const existingContainer = document.createElement('div');
      const fakeToggle = document.createElement('label');
      fakeToggle.className = 'captureai-toggle-switch';
      existingContainer.appendChild(fakeToggle);
      existingContainer.style.display = 'none';
      UIComponents.buttonsContainer.appendChild(existingContainer);

      await UIComponents.updateAutoSolveForTier();

      expect(existingContainer.style.display).toBe('flex');
    });

    test('hides existing toggle when user is free', async () => {
      storageMock.local.get.mockImplementationOnce(
        makeStorageGetMock({ 'captureai-user-tier': 'free' })
      );
      UIComponents.buttonsContainer = document.createElement('div');

      const existingContainer = document.createElement('div');
      const fakeToggle = document.createElement('label');
      fakeToggle.className = 'captureai-toggle-switch';
      existingContainer.appendChild(fakeToggle);
      existingContainer.style.display = 'flex';
      UIComponents.buttonsContainer.appendChild(existingContainer);

      await UIComponents.updateAutoSolveForTier();

      expect(existingContainer.style.display).toBe('none');
    });
  });
});
