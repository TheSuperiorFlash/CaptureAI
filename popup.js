/**
 * CaptureAI Popup Script
 * Manages extension popup UI and communication with content script
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Get DOM elements
    const elements = {
        statusSection: document.getElementById('status-section'),
        statusMessage: document.getElementById('status-message'),
        responseSection: document.getElementById('response-section'),
        responseContent: document.getElementById('response-content'),
        apiKeySection: document.getElementById('api-key-section'),
        apiKeyInput: document.getElementById('api-key-input'),
        saveApiKeyBtn: document.getElementById('save-api-key'),
        mainControls: document.getElementById('main-controls'),
        captureBtn: document.getElementById('capture-btn'),
        quickCaptureBtn: document.getElementById('quick-capture-btn'),
        headerUiToggle: document.getElementById('header-ui-toggle'),
        helpToggle: document.getElementById('help-toggle'),
        helpContent: document.getElementById('help-content'),
        helpArrow: document.getElementById('help-arrow')
    };

    // State variables
    let currentState = {
        apiKey: '',
        isPanelVisible: false,
        hasLastCaptureArea: false,
        currentResponse: ''
    };

    // Initialize popup state and UI
    await initializePopup();

    // Event listeners
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.captureBtn.addEventListener('click', startCapture);
    elements.quickCaptureBtn.addEventListener('click', quickCapture);
    elements.headerUiToggle.addEventListener('click', togglePanel);
    elements.helpToggle.addEventListener('click', toggleHelp);

    /**
     * Initialize popup state and load user preferences
     */
    async function initializePopup() {
        try {
            // Load API key from storage
            const result = await chrome.storage.local.get(['captureai-api-key']);
            const apiKey = result['captureai-api-key'] || '';
            
            if (apiKey) {
                currentState.apiKey = apiKey;
                elements.apiKeyInput.value = '••••••••••••••••'; // Show masked key
                elements.apiKeySection.classList.add('hidden');
                elements.mainControls.classList.remove('hidden');
                
                // Get current state from content script
                await updateStateFromContentScript();
            } else {
                // Show error message when no API key is found
                showResponseMessage('Error: Could not get API key', 'error');
                elements.apiKeySection.classList.remove('hidden');
            }
        } catch (error) {
            showResponseMessage('Error initializing popup', 'error');
            // Silent error handling
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
                showResponseMessage('Content scripts cannot run on this page type', 'info');
                disableContentScriptFeatures();
                return;
            }
            
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getState' });
            
            if (response && response.success) {
                currentState = { ...currentState, ...response.state };
                updateResponseDisplay();
                updateUI();
            } else if (response && response.error === 'Modules not loaded yet') {
                // Retry after a delay if modules are still loading
                setTimeout(async () => {
                    try {
                        const retryResponse = await chrome.tabs.sendMessage(tab.id, { action: 'getState' });
                        if (retryResponse && retryResponse.success) {
                            currentState = { ...currentState, ...retryResponse.state };
                            updateResponseDisplay();
                            updateUI();
                            // Re-enable controls
                            elements.captureBtn.disabled = false;
                            elements.quickCaptureBtn.disabled = false;
                            elements.headerUiToggle.disabled = false;
                        }
                    } catch (retryError) {}
                }, 2000);
                showResponseMessage('Extension loading, please wait...', 'info');
            }
        } catch (error) {
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
        // Update quick capture button state
        elements.quickCaptureBtn.textContent = 'Quick Capture';
        
        // Update header UI toggle button
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
     * Save and validate OpenAI API key
     */
    async function saveApiKey() {
        const apiKey = elements.apiKeyInput.value.trim();
        
        if (!apiKey) {
            showResponseMessage('Please enter an API key', 'error');
            return;
        }

        try {
            // Test API key validity
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Invalid API key');
            }
            
            await chrome.storage.local.set({ 'captureai-api-key': apiKey });
            currentState.apiKey = apiKey;
            
            showResponseMessage('API key saved successfully!', 'success');
            
            setTimeout(() => {
                // Clear the response message and show main controls
                elements.responseContent.textContent = '';
                elements.responseContent.className = 'response-content empty';
            
                elements.apiKeySection.classList.add('hidden');
                elements.mainControls.classList.remove('hidden');
                updateStateFromContentScript();
            }, 1500);
            
        } catch (error) {
            showResponseMessage('Error: Invalid API key', 'error');
            // Silent error handling
            await chrome.storage.local.remove('captureai-api-key');
        }
    }

    /**
     * Start screenshot capture process
     */
    async function startCapture() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on a valid page
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                showResponseMessage('Cannot capture on this page type', 'error');
                return;
            }
            
            // Ensure content script is loaded
            await ensureContentScriptLoaded(tab.id);
            
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
            
            if (response && response.success) {
                showResponseMessage('Capture started - select an area on the page', 'info');
                window.close(); // Close popup so user can select area
            } else {
                showResponseMessage('Error starting capture', 'error');
            }
        } catch (error) {
            showResponseMessage('Page not ready - please refresh and try again', 'error');
            // Silent error handling
        }
    }

    /**
     * Perform quick capture using last saved area
     */
    async function quickCapture() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on a valid page
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                showResponseMessage('Cannot capture on this page type', 'error');
                return;
            }
            
            // Ensure content script is loaded
            await ensureContentScriptLoaded(tab.id);
            
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'quickCapture' });
            
            if (response && response.success) {
                showResponseMessage('Quick capture started', 'info');
                window.close();
            } else {
                showResponseMessage(response.error || 'Error with quick capture', 'error');
            }
        } catch (error) {
            showResponseMessage('Page not ready - please refresh and try again', 'error');
            // Silent error handling
        }
    }

    /**
     * Toggle content script panel visibility
     */
    async function togglePanel() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on a valid page
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                showResponseMessage('UI toggle not available on this page type', 'error');
                return;
            }
            
            // Ensure content script is loaded
            await ensureContentScriptLoaded(tab.id);
            
            // Execute toggle directly in content script context
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    if (window.CaptureAI && window.CaptureAI.UIHandlers && window.CaptureAI.UIHandlers.togglePanelVisibility) {
                        window.CaptureAI.UIHandlers.togglePanelVisibility();
                    }
                }
            });
            
            // Update popup state (get actual state from content script)
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getState' });
            if (response && response.success) {
                currentState.isPanelVisible = response.state.isPanelVisible;
                updateUI();
            }
            
        } catch (error) {
            showResponseMessage('Page not ready - please refresh and try again', 'error');
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
     * Ensure content script is loaded in the target tab
     * @param {number} tabId - Target tab ID
     */
    async function ensureContentScriptLoaded(tabId) {
        try {
            // Try to ping the content script
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        } catch (error) {
            // Content script not loaded, inject it
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
                // Wait longer for initialization since we have modules to load
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (injectionError) {
                throw new Error('Could not load content script');
            }
        }
    }

    /**
     * Show message in the response display area
     * @param {string} message - Message to display
     * @param {string} type - Message type ('error', 'success', 'info')
     */
    function showResponseMessage(message, type) {
        elements.responseContent.textContent = message;
        
        if (type === 'error') {
            elements.responseContent.className = 'response-content error';
        } else if (type === 'success') {
            elements.responseContent.className = 'response-content';
            elements.responseContent.style.color = '#008000';
        } else {
            elements.responseContent.className = 'response-content';
        }
    }


    /**
     * Listen for response updates from content script
     */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateResponse') {
            currentState.currentResponse = request.message;
            currentState.isError = request.isError || false;
            
            elements.responseContent.textContent = request.message;
            elements.responseContent.className = request.isError ? 'response-content error' : 'response-content';
        }
    });

    /**
     * Listen for storage changes to update UI state
     */
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes['captureai-api-key']) {
            const newApiKey = changes['captureai-api-key'].newValue;
            if (newApiKey && !currentState.apiKey) {
                // API key was just set
                currentState.apiKey = newApiKey;
                elements.apiKeySection.classList.add('hidden');
                elements.mainControls.classList.remove('hidden');
                updateStateFromContentScript();
            }
        }
    });
});
