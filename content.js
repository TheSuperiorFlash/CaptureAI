/**
 * CaptureAI Content Script - Main Entry Point
 */

(async function() {
    'use strict';

    const CaptureAIApp = {
        async init() {
            try {
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

                if (window.CaptureAI.ICONS?.init) {
                    window.CaptureAI.ICONS.init();
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
                    import(chrome.runtime.getURL('modules/event-manager.js'))
                ]);

                const [
                    configModule, storageModule, domainsModule, utilsModule, imageProcessingModule,
                    uiStealthyResultModule, uiCoreModule, uiComponentsModule, captureSystemModule,
                    autoSolveModule, messagingModule, keyboardModule, eventManagerModule
                ] = modules;

                window.CaptureAI = {
                    CONFIG: configModule.CONFIG,
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
                    EventManager: eventManagerModule.EventManager
                };

                window.CaptureAI.ICONS.init();
                return true;

            } catch (error) {
                console.error('Module loading failed:', error);
                return false;
            }
        },

        initializeSystems() {
            const systems = ['EventManager', 'Messaging', 'Keyboard', 'CaptureSystem'];
            
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
                    let preferences = {};
                    
                    if (window.CaptureAI.StorageUtils.getValues) {
                        preferences = await window.CaptureAI.StorageUtils.getValues([
                            STORAGE_KEYS.API_KEY,
                            STORAGE_KEYS.AUTO_SOLVE_MODE,
                            STORAGE_KEYS.ASK_MODE,
                            STORAGE_KEYS.LAST_CAPTURE_AREA
                        ]);
                    } else {
                        const keys = [STORAGE_KEYS.API_KEY, STORAGE_KEYS.AUTO_SOLVE_MODE, STORAGE_KEYS.ASK_MODE, STORAGE_KEYS.LAST_CAPTURE_AREA];
                        for (const key of keys) {
                            preferences[key] = await window.CaptureAI.StorageUtils.getValue(key);
                        }
                    }

                    STATE.apiKey = preferences[STORAGE_KEYS.API_KEY] || '';
                    STATE.isAutoSolveMode = preferences[STORAGE_KEYS.AUTO_SOLVE_MODE] || false;
                    STATE.isAskMode = preferences[STORAGE_KEYS.ASK_MODE] || false;
                    STATE.lastCaptureArea = preferences[STORAGE_KEYS.LAST_CAPTURE_AREA] || null;
                }
            } catch (error) {
                console.error('Failed to load preferences:', error);
            }
        },

        createUI() {
            // UI creation is now handled on-demand by keyboard shortcuts and toggle functions
            // This method is kept for backward compatibility but doesn't automatically create UI
            if (!window.CaptureAI.STATE || !window.CaptureAI.CONFIG) return;
            
            // Only create UI if explicitly requested and not already created
            const { DOM_CACHE } = window.CaptureAI;
            if (!DOM_CACHE.panel) {
                try {
                    if (window.CaptureAI.UIComponents?.createUI) {
                        window.CaptureAI.UIComponents.createUI();
                    } else {
                        this.createFallbackUI();
                    }
                } catch (error) {
                    this.createFallbackUI();
                }
            }
        },

        createFallbackUI() {
            const { CONFIG, STATE } = window.CaptureAI;
            
            if (!document.getElementById(CONFIG.PANEL_ID)) {
                const panel = document.createElement('div');
                panel.id = CONFIG.PANEL_ID;
                panel.style.cssText = `
                    position: fixed; top: 20px; right: 20px; width: 250px;
                    background: white; color: #333333; border: 1px solid #e0e0e0;
                    border-radius: 10px; padding: 0; z-index: 9999;
                    font-family: 'Inter', Arial, sans-serif; font-size: 14px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); overflow: hidden;
                `;
                
                panel.innerHTML = `
                    <div style="background: #f5f5f5; padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">CaptureAI</div>
                    <div style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Response:</div>
                        <div id="captureai-result" style="font-size: 14px; word-break: break-word; min-height: 20px;">Ready</div>
                    </div>
                    <div style="padding: 15px;">
                        <button id="captureai-capture-btn" style="width: 100%; padding: 10px; margin-bottom: 10px; border: none; border-radius: 8px; background: #4caf65; color: white; cursor: pointer; font-weight: bold;">📸 Capture Question</button>
                        <button id="captureai-quick-btn" style="width: 100%; padding: 10px; border: 1px solid #d1d1d1; border-radius: 8px; background: #f1f1f1; color: #333; cursor: pointer; font-weight: bold;">⚡ Quick Capture</button>
                    </div>
                `;
                
                document.body.appendChild(panel);
                STATE.uiElements.panel = panel;
                STATE.isPanelVisible = true;
                
                this.attachFallbackListeners();
            }
        },

        attachFallbackListeners() {
            const captureBtn = document.getElementById('captureai-capture-btn');
            const quickBtn = document.getElementById('captureai-quick-btn');
            const resultElement = document.getElementById('captureai-result');
            
            captureBtn?.addEventListener('click', () => {
                if (window.CaptureAI.CaptureSystem?.startCapture) {
                    window.CaptureAI.CaptureSystem.startCapture();
                } else if (resultElement) {
                    resultElement.textContent = 'Capture system not available';
                }
            });
            
            quickBtn?.addEventListener('click', () => {
                if (window.CaptureAI.CaptureSystem?.quickCapture) {
                    window.CaptureAI.CaptureSystem.quickCapture();
                } else if (resultElement) {
                    resultElement.textContent = 'No previous capture area';
                }
            });
        },

        handleVisibilityChange() {
            if (!window.CaptureAI?.STATE) return;

            if (document.hidden) {
                const { STATE } = window.CaptureAI;
                if (STATE.isAutoSolveMode && STATE.autoSolveTimer) {
                    clearTimeout(STATE.autoSolveTimer);
                }
            } else {
                if (window.CaptureAI.STATE.isAutoSolveMode && 
                    window.CaptureAI.DomainUtils?.isOnSupportedSite() &&
                    window.CaptureAI.AutoSolve) {
                    window.CaptureAI.AutoSolve.scheduleNextAutoSolve();
                }
            }
        },

        async refreshState() {
            if (!window.CaptureAI?.STATE) return;

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
                } catch (error) {}
            });

            const focusHandler = () => {
                try {
                    if (document.hasFocus()) {
                        this.refreshState();
                    }
                } catch (error) {}
            };

            document.addEventListener('focus', focusHandler);
            window.addEventListener('focus', focusHandler);

            window.addEventListener('beforeunload', () => {
                try {
                    window.CaptureAI.EventManager?.cleanup();
                } catch (error) {}
            });
        }
    };

    CaptureAIApp.init();

})();