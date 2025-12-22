/**
 * CaptureAI Content Script - Main Entry Point
 */

(async function() {
  'use strict';

  const CaptureAIApp = {
    async init() {
      try {
        // Tesseract.js is loaded via manifest content_scripts, check if available
        if (typeof Tesseract !== 'undefined') {
          console.log('Tesseract.js loaded successfully via manifest');
        } else {
          console.warn('Tesseract.js not available - OCR will not work');
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
          await this.initializeApp();
        }
      } catch (error) {
        console.error('CaptureAI init error:', error);
      }
    },

    async initializeApp() {
      try {
        const modulesLoaded = await this.loadModules();
        if (!modulesLoaded) {
          throw new Error('Failed to load modules');
        }

        this.initializeSystems();
        await this.loadUserPreferences();

        if (window.CaptureAI.EventManager) {
          window.CaptureAI.EventManager.addGlobalErrorHandlers();
        }

        if (window.CaptureAI.DomainUtils?.isOnSupportedSite() && window.CaptureAI.AutoSolve) {
          await window.CaptureAI.AutoSolve.init();
        }

        window.CaptureAI.UIStealthyResult.init();
        window.CaptureAI.UICore.init();

        this.setupEventHandlers();

      } catch (error) {
        window.CaptureAI.EventManager?.handleError(error, 'App Initialization');
      }
    },

    async loadModules() {
      try {
        const modules = await Promise.all([
          import(chrome.runtime.getURL('modules/config.js')),
          import(chrome.runtime.getURL('modules/storage.js')),
          import(chrome.runtime.getURL('modules/domains.js')),
          import(chrome.runtime.getURL('modules/utils.js')),
          import(chrome.runtime.getURL('modules/image-processing.js')),
          import(chrome.runtime.getURL('modules/ui-stealthy-result.js')),
          import(chrome.runtime.getURL('modules/ui-core.js')),
          import(chrome.runtime.getURL('modules/ui-components.js')),
          import(chrome.runtime.getURL('modules/capture-system.js')),
          import(chrome.runtime.getURL('modules/auto-solve.js')),
          import(chrome.runtime.getURL('modules/messaging.js')),
          import(chrome.runtime.getURL('modules/keyboard.js')),
          import(chrome.runtime.getURL('modules/event-manager.js')),
          import(chrome.runtime.getURL('modules/privacy-guard.js'))
        ]);

        const [
          configModule, storageModule, domainsModule, utilsModule, imageProcessingModule,
          uiStealthyResultModule, uiCoreModule, uiComponentsModule, captureSystemModule,
          autoSolveModule, messagingModule, keyboardModule, eventManagerModule, privacyGuardModule
        ] = modules;

        window.CaptureAI = {
          CONFIG: configModule.CONFIG,
          TIMING: configModule.TIMING,
          STORAGE_KEYS: configModule.STORAGE_KEYS,
          PROMPT_TYPES: configModule.PROMPT_TYPES,
          ICONS: configModule.ICONS,
          STATE: configModule.STATE,
          DOM_CACHE: configModule.DOM_CACHE,
          StorageUtils: storageModule.StorageUtils,
          setValue: storageModule.setValue,
          getValue: storageModule.getValue,
          DomainUtils: domainsModule.DomainUtils,
          Utils: utilsModule.Utils,
          ImageProcessing: imageProcessingModule.ImageProcessing,
          UIStealthyResult: uiStealthyResultModule.UIStealthyResult,
          UICore: uiCoreModule.UICore,
          UIComponents: uiComponentsModule.UIComponents,
          CaptureSystem: captureSystemModule.CaptureSystem,
          AutoSolve: autoSolveModule.AutoSolve,
          Messaging: messagingModule.Messaging,
          Keyboard: keyboardModule.Keyboard,
          EventManager: eventManagerModule.EventManager,
          PrivacyGuard: privacyGuardModule.PrivacyGuard
        };

        window.CaptureAI.ICONS.init();
        return true;

      } catch (error) {
        console.error('Module loading failed:', error);
        return false;
      }
    },

    initializeSystems() {
      const systems = ['EventManager', 'Messaging', 'Keyboard', 'CaptureSystem', 'PrivacyGuard'];

      systems.forEach(system => {
        if (window.CaptureAI[system]?.init) {
          window.CaptureAI[system].init();
        }
      });
    },

    async loadUserPreferences() {
      if (!window.CaptureAI.STATE || !window.CaptureAI.STORAGE_KEYS || !window.CaptureAI.StorageUtils) {
        return;
      }

      const { STATE, STORAGE_KEYS } = window.CaptureAI;

      try {
        if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
          const preferences = await window.CaptureAI.StorageUtils.getValues([
            STORAGE_KEYS.API_KEY,
            STORAGE_KEYS.AUTO_SOLVE_MODE,
            STORAGE_KEYS.ASK_MODE,
            STORAGE_KEYS.LAST_CAPTURE_AREA
          ]);

          // Check for license key (new system) first, fallback to API key (old system)
          const licenseKeyResult = await chrome.storage.local.get('captureai-license-key');
          const licenseKey = licenseKeyResult['captureai-license-key'];

          // Load user tier
          const userTierResult = await chrome.storage.local.get('captureai-user-tier');
          const userTier = userTierResult['captureai-user-tier'] || 'free';

          STATE.apiKey = licenseKey || preferences[STORAGE_KEYS.API_KEY] || '';
          STATE.userTier = userTier;
          STATE.isAutoSolveMode = preferences[STORAGE_KEYS.AUTO_SOLVE_MODE] || false;
          STATE.isAskMode = preferences[STORAGE_KEYS.ASK_MODE] || false;
          STATE.lastCaptureArea = preferences[STORAGE_KEYS.LAST_CAPTURE_AREA] || null;
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    },


    handleVisibilityChange() {
      if (!window.CaptureAI?.STATE) {
        return;
      }

      if (document.hidden) {
        const { STATE } = window.CaptureAI;
        if (STATE.isAutoSolveMode && STATE.autoSolveTimer) {
          clearTimeout(STATE.autoSolveTimer);
        }
      } else {
        // Only schedule next auto-solve if not currently processing
        if (window.CaptureAI.STATE.isAutoSolveMode &&
                    !window.CaptureAI.STATE.isProcessing &&
                    window.CaptureAI.DomainUtils?.isOnSupportedSite() &&
                    window.CaptureAI.AutoSolve) {
          window.CaptureAI.AutoSolve.scheduleNextAutoSolve();
        }
      }
    },

    async refreshState() {
      if (!window.CaptureAI?.STATE) {
        return;
      }

      try {
        await this.loadUserPreferences();
      } catch (error) {
        console.error('Failed to refresh state:', error);
      }
    },

    setupEventHandlers() {
      document.addEventListener('visibilitychange', () => {
        try {
          this.handleVisibilityChange();
        } catch (error) {
          if (window.CaptureAI?.CONFIG?.DEBUG) {
            console.error('CaptureAI: Visibility change error:', error);
          }
        }
      });

      const focusHandler = () => {
        try {
          if (document.hasFocus()) {
            this.refreshState();
          }
        } catch (error) {
          if (window.CaptureAI?.CONFIG?.DEBUG) {
            console.error('CaptureAI: Focus handler error:', error);
          }
        }
      };

      document.addEventListener('focus', focusHandler);
      window.addEventListener('focus', focusHandler);

      window.addEventListener('beforeunload', () => {
        try {
          window.CaptureAI.EventManager?.cleanup();
        } catch (error) {
          if (window.CaptureAI?.CONFIG?.DEBUG) {
            console.error('CaptureAI: Cleanup error:', error);
          }
        }
      });
    }
  };

  CaptureAIApp.init();

})();
