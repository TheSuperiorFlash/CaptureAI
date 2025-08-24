/**
 * CaptureAI Content Script - Main Entry Point
 * Dynamic ES6 Module imports for content script compatibility
 */

(async function() {
    'use strict';

/**
 * Main application controller
 */
const CaptureAIApp = {
        /**
         * Initialize the application
         */
        async init() {
            try {
                // Wait for DOM to be ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => this.initializeApp());
                } else {
                    await this.initializeApp();
                }
            } catch (error) {}
        },

        /**
         * Initialize the application components
         */
        async initializeApp() {
            try {
                // Load modules using dynamic imports
                const modulesLoaded = await this.loadModules();
                if (!modulesLoaded) {
                    throw new Error('Failed to load ES6 modules');
                }


                // Initialize icons after Chrome APIs are available
                if (window.CaptureAI.ICONS && window.CaptureAI.ICONS.init) {
                    window.CaptureAI.ICONS.init();
                }

                // Initialize core systems
                this.initializeSystems();

                // Load user preferences
                await this.loadUserPreferences();

                // Set up error handling (after EventManager is loaded)
                if (window.CaptureAI.EventManager) {
                    window.CaptureAI.EventManager.addGlobalErrorHandlers();
                }

                // OCR removed - now using direct image processing only

                // Initialize auto-solve if on supported site
                if (window.CaptureAI.DomainUtils && window.CaptureAI.DomainUtils.isOnSupportedSite()) {
                    if (window.CaptureAI.AutoSolve) {
                        await window.CaptureAI.AutoSolve.init();
                    }
                }

                // Create UI immediately to ensure stealthy result is available
                this.createUI();

                // Register event handlers AFTER modules are loaded
                this.setupEventHandlers();


            } catch (error) {
                if (window.CaptureAI.EventManager && window.CaptureAI.EventManager.handleError) {
                    window.CaptureAI.EventManager.handleError(error, 'App Initialization');
                }
            }
        },

        /**
         * Load modules using dynamic imports
         */
        async loadModules() {
            try {
                
                // Dynamic import all modules (now converted to ES6)
                const configModule = await import(chrome.runtime.getURL('modules/config.js'));
                const storageModule = await import(chrome.runtime.getURL('modules/storage.js'));
                const domainsModule = await import(chrome.runtime.getURL('modules/domains.js'));
                const utilsModule = await import(chrome.runtime.getURL('modules/utils.js'));
                // OCR module removed
                const imageProcessingModule = await import(chrome.runtime.getURL('modules/image-processing.js'));
                const uiComponentsModule = await import(chrome.runtime.getURL('modules/ui-components.js'));
                const uiHandlersModule = await import(chrome.runtime.getURL('modules/ui-handlers.js'));
                const captureSystemModule = await import(chrome.runtime.getURL('modules/capture-system.js'));
                const autoSolveModule = await import(chrome.runtime.getURL('modules/auto-solve.js'));
                const messagingModule = await import(chrome.runtime.getURL('modules/messaging.js'));
                const keyboardModule = await import(chrome.runtime.getURL('modules/keyboard.js'));
                const eventManagerModule = await import(chrome.runtime.getURL('modules/event-manager.js'));
                
                // Initialize global CaptureAI object with all imported modules
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
                    // OCRUtils removed
                    ImageProcessing: imageProcessingModule.ImageProcessing,
                    UIComponents: uiComponentsModule.UIComponents,
                    UIHandlers: uiHandlersModule.UIHandlers,
                    CaptureSystem: captureSystemModule.CaptureSystem,
                    AutoSolve: autoSolveModule.AutoSolve,
                    Messaging: messagingModule.Messaging,
                    Keyboard: keyboardModule.Keyboard,
                    EventManager: eventManagerModule.EventManager
                };
                
                
                // Add message handlers after modules are loaded
                this.setupMessageHandlers();
                
                return true;
                
            } catch (error) {
                return false;
            }
        },
        
        /**
         * Setup message handlers for popup communication
         */
        setupMessageHandlers() {
            // Message handling is already set up in messaging.js - no need to duplicate
            // The duplicate listener was causing every response to be processed twice!
        },

        /**
         * Initialize core systems
         */
        initializeSystems() {
            // Initialize event management
            if (window.CaptureAI.EventManager && window.CaptureAI.EventManager.init) {
                window.CaptureAI.EventManager.init();
            }

            // Initialize messaging system  
            if (window.CaptureAI.Messaging && window.CaptureAI.Messaging.init) {
                window.CaptureAI.Messaging.init();
            }

            // Initialize keyboard shortcuts
            if (window.CaptureAI.Keyboard && window.CaptureAI.Keyboard.init) {
                window.CaptureAI.Keyboard.init();
            }

            // Initialize capture system
            if (window.CaptureAI.CaptureSystem && window.CaptureAI.CaptureSystem.init) {
                window.CaptureAI.CaptureSystem.init();
            }
        },

        /**
         * Load user preferences from storage
         */
        async loadUserPreferences() {
            if (!window.CaptureAI.STATE || !window.CaptureAI.STORAGE_KEYS || !window.CaptureAI.StorageUtils) {
                return;
            }

            const { STATE, STORAGE_KEYS } = window.CaptureAI;

            try {
                // Check if extension context is still valid
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
                    let preferences;
                    
                    // Try to use getValues method first
                    if (window.CaptureAI.StorageUtils.getValues) {
                        preferences = await window.CaptureAI.StorageUtils.getValues([
                            STORAGE_KEYS.API_KEY,
                            STORAGE_KEYS.AUTO_SOLVE_MODE,
                            STORAGE_KEYS.ASK_MODE,
                            STORAGE_KEYS.LAST_CAPTURE_AREA
                        ]);
                    } else {
                        // Fallback to individual getValue calls
                        preferences = {};
                        preferences[STORAGE_KEYS.API_KEY] = await window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.API_KEY);
                        preferences[STORAGE_KEYS.AUTO_SOLVE_MODE] = await window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.AUTO_SOLVE_MODE);
                        preferences[STORAGE_KEYS.ASK_MODE] = await window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.ASK_MODE);
                        preferences[STORAGE_KEYS.LAST_CAPTURE_AREA] = await window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.LAST_CAPTURE_AREA);
                    }

                    // Apply loaded preferences
                    STATE.apiKey = preferences[STORAGE_KEYS.API_KEY] || '';
                    STATE.isAutoSolveMode = preferences[STORAGE_KEYS.AUTO_SOLVE_MODE] || false;
                    STATE.isAskMode = preferences[STORAGE_KEYS.ASK_MODE] || false;
                    STATE.lastCaptureArea = preferences[STORAGE_KEYS.LAST_CAPTURE_AREA] || null;

                } else {}

            } catch (error) {
            }
        },

        /**
         * Create the main UI
         */
        createUI() {
            if (!window.CaptureAI.STATE || !window.CaptureAI.CONFIG) {
                return;
            }

            try {
                // Use sophisticated UI components if available
                if (window.CaptureAI.UIComponents && window.CaptureAI.UIComponents.createUI) {
                    const panel = window.CaptureAI.UIComponents.createUI();
                    
                    // Load user preferences for UI state
                    this.loadUIState();
                    
                } else {
                    this.createFallbackUI();
                }
            } catch (error) {
                try {
                    this.createFallbackUI();
                } catch (fallbackError) {}
            }
        },
        
        /**
         * Load UI state from storage
         */
        async loadUIState() {
            try {
                const { STATE, STORAGE_KEYS } = window.CaptureAI;
                
                // Pro Mode toggle removed
                
                // Update Auto-solve toggle if on supported site
                const autoSolveToggle = document.getElementById('auto-solve-toggle');
                if (autoSolveToggle) {
                    autoSolveToggle.checked = STATE.isAutoSolveMode;
                }
                
            } catch (error) {}
        },
        
        /**
         * Create fallback UI when sophisticated components aren't available
         */
        createFallbackUI() {
            const { CONFIG, STATE } = window.CaptureAI;
            
            // Create a simple floating panel
            if (!document.getElementById(CONFIG.PANEL_ID)) {
                const panel = document.createElement('div');
                panel.id = CONFIG.PANEL_ID;
                panel.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 250px;
                    background: white;
                    color: #333333;
                    border: 1px solid #e0e0e0;
                    border-radius: 10px;
                    padding: 0;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    z-index: 9999;
                    font-family: 'Roboto', Arial, sans-serif;
                    font-size: 14px;
                    display: block;
                    overflow: hidden;
                `;
                
                panel.innerHTML = `
                    <div style="background: #f5f5f5; padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">CaptureAI</div>
                    <div style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Response:</div>
                        <div id="captureai-result" style="font-size: 14px; color: #333; word-break: break-word; min-height: 20px;">Ready</div>
                    </div>
                    <div style="padding: 15px;">
                        <button id="captureai-capture-btn" style="width: 100%; padding: 10px; margin-bottom: 10px; border: none; border-radius: 8px; background: #4caf65; color: white; cursor: pointer; font-size: 14px; font-weight: bold;">📸 Capture A Question</button>
                        <button id="captureai-quick-btn" style="width: 100%; padding: 10px; border: 1px solid #d1d1d1; border-radius: 8px; background: #f1f1f1; color: #333; cursor: pointer; font-size: 14px; font-weight: bold;">⚡ Quick Capture</button>
                    </div>
                `;
                
                document.body.appendChild(panel);
                STATE.uiElements.panel = panel;
                STATE.isPanelVisible = true;
                
                // Add event listeners
                const captureBtn = document.getElementById('captureai-capture-btn');
                const quickBtn = document.getElementById('captureai-quick-btn');
                const resultElement = document.getElementById('captureai-result');
                
                if (captureBtn) {
                    captureBtn.addEventListener('click', () => {
                        if (window.CaptureAI.CaptureSystem && window.CaptureAI.CaptureSystem.startCapture) {
                            window.CaptureAI.CaptureSystem.startCapture();
                        } else {
                            if (resultElement) resultElement.textContent = 'Capture system not available';
                        }
                    });
                }
                
                if (quickBtn) {
                    quickBtn.addEventListener('click', () => {
                        if (window.CaptureAI.CaptureSystem && window.CaptureAI.CaptureSystem.quickCapture) {
                            window.CaptureAI.CaptureSystem.quickCapture();
                        } else {
                            if (resultElement) resultElement.textContent = 'No previous capture area';
                        }
                    });
                }
                
            }
        },

        /**
         * Handle page visibility changes
         */
        handleVisibilityChange() {
            if (!window.CaptureAI || !window.CaptureAI.STATE) {
                return;
            }

            if (document.hidden) {
                // Page is hidden, pause auto-solve if active
                const { STATE } = window.CaptureAI;
                if (STATE.isAutoSolveMode && STATE.autoSolveTimer) {
                    clearTimeout(STATE.autoSolveTimer);
                }
            } else {
                // Page is visible, resume auto-solve if needed
                if (window.CaptureAI.STATE.isAutoSolveMode && 
                    window.CaptureAI.DomainUtils && 
                    window.CaptureAI.DomainUtils.isOnSupportedSite() &&
                    window.CaptureAI.AutoSolve) {
                    window.CaptureAI.AutoSolve.scheduleNextAutoSolve();
                }
            }
        },

        /**
         * Handle page focus changes
         */
        handleFocusChange() {
            if (!window.CaptureAI) {
                return;
            }
            
            if (document.hasFocus()) {
                // Page gained focus, check if we need to refresh state
                this.refreshState();
            }
        },

        /**
         * Refresh application state
         */
        async refreshState() {
            if (!window.CaptureAI || !window.CaptureAI.STATE) {
                return;
            }

            try {
                await this.loadUserPreferences();
                
                // UI will be created on demand via keyboard shortcuts or popup
            } catch (error) {}
        },

        /**
         * Set up event handlers after modules are loaded
         */
        setupEventHandlers() {
            // Add page visibility and focus handlers
            document.addEventListener('visibilitychange', () => {
                try {
                    this.handleVisibilityChange();
                } catch (error) {}
            });

            document.addEventListener('focus', () => {
                try {
                    this.handleFocusChange();
                } catch (error) {}
            });

            window.addEventListener('focus', () => {
                try {
                    this.handleFocusChange();
                } catch (error) {}
            });

            // Clean up on page unload
            window.addEventListener('beforeunload', () => {
                try {
                    this.cleanup();
                } catch (error) {}
            });
        },

        /**
         * Clean up resources
         */
        cleanup() {
            if (window.CaptureAI && window.CaptureAI.EventManager) {
                window.CaptureAI.EventManager.cleanup();
            }
        }
    };

    // Initialize the application
    CaptureAIApp.init();


})();