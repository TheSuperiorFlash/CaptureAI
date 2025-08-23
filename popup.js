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
        autoSolveSection: document.getElementById('auto-solve-section'),
        headerUiToggle: document.getElementById('header-ui-toggle'),
        proModeToggle: document.getElementById('pro-mode-toggle')
    };

    // State variables
    let currentState = {
        apiKey: '',
        isPanelVisible: false,
        isAutoSolveMode: false,
        hasLastCaptureArea: false,
        isOnSupportedSite: false,
        currentResponse: '',
        isProMode: false
    };

    // Initialize popup
    await initializePopup();

    // Event listeners
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.captureBtn.addEventListener('click', startCapture);
    elements.quickCaptureBtn.addEventListener('click', quickCapture);
    elements.headerUiToggle.addEventListener('click', togglePanel);
    elements.proModeToggle.addEventListener('change', toggleProMode);

    // Initialize popup state
    async function initializePopup() {
        try {
            // Load API key and Pro Mode from storage
            const result = await chrome.storage.local.get(['captureai-api-key', 'captureai-pro-mode']);
            const apiKey = result['captureai-api-key'] || '';
            const isProMode = result['captureai-pro-mode'] || false;
            
            // Initialize Pro Mode state
            currentState.isProMode = isProMode;
            elements.proModeToggle.checked = isProMode;
            
            if (apiKey) {
                currentState.apiKey = apiKey;
                elements.apiKeyInput.value = '••••••••••••••••'; // Show masked key
                elements.apiKeySection.classList.add('hidden');
                elements.mainControls.classList.remove('hidden');
                elements.autoSolveSection.classList.remove('hidden');
                
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

    // Get state from content script
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
            }
        } catch (error) {
            showResponseMessage('Page not ready for CaptureAI features', 'info');
            disableContentScriptFeatures();
            console.log('Could not get state from content script:', error);
        }
    }

    // Disable features that require content script
    function disableContentScriptFeatures() {
        elements.captureBtn.disabled = true;
        elements.quickCaptureBtn.disabled = true;
        elements.headerUiToggle.disabled = true;
        // Auto-solve section kept hidden (container preserved for future use)
        elements.autoSolveSection.classList.add('hidden');
    }

    // Auto-solve toggle functions removed - container preserved for future use

    // Update UI based on current state
    function updateUI() {
        // Update quick capture button state
        elements.quickCaptureBtn.textContent = 'Quick Capture';
        
        // Update header UI toggle button
        elements.headerUiToggle.textContent = currentState.isPanelVisible ? 'Hide UI' : 'Show UI';

        // Keep auto-solve section hidden (container preserved for future use)
        elements.autoSolveSection.classList.add('hidden');
    }

    // Update response display
    function updateResponseDisplay() {
        if (currentState.currentResponse) {
            elements.responseContent.textContent = currentState.currentResponse;
            elements.responseContent.className = 'response-content';
        } else {
            elements.responseContent.textContent = '';
            elements.responseContent.className = 'response-content empty';
        }
    }

    // Save API key
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

    // Start capture
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

    // Quick capture
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

    // Toggle panel visibility
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
            
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
            
            if (response && response.success) {
                currentState.isPanelVisible = !currentState.isPanelVisible;
                updateUI();
            } else {
                showResponseMessage('Error toggling panel', 'error');
            }
        } catch (error) {
            showResponseMessage('Page not ready - please refresh and try again', 'error');
            // Silent error handling
        }
    }

    // Toggle Pro Mode
    async function toggleProMode() {
        try {
            console.log('Pro Mode toggle clicked, current state:', currentState.isProMode);
            
            currentState.isProMode = elements.proModeToggle.checked;
            
            // Save Pro Mode state to storage
            await chrome.storage.local.set({ 'captureai-pro-mode': currentState.isProMode });
            
            // Send Pro Mode state to content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { 
                    action: 'setProMode', 
                    isProMode: currentState.isProMode 
                });
                
                if (response && response.success) {
                    console.log('Pro Mode updated successfully:', currentState.isProMode);
                    // Status message removed - Pro Mode toggle is silent
                } else {
                    console.log('Pro Mode update response:', response);
                }
            } catch (error) {
                console.log('Could not communicate with content script for Pro Mode:', error);
                // Still save the state locally even if content script communication fails
            }
            
        } catch (error) {
            // Silent error handling
            showResponseMessage('Error updating Pro Mode', 'error');
            // Revert toggle state on error
            elements.proModeToggle.checked = !elements.proModeToggle.checked;
            currentState.isProMode = elements.proModeToggle.checked;
        }
    }

    // Auto-solve toggle function removed - functionality moved to floating UI only

    // Ensure content script is loaded
    async function ensureContentScriptLoaded(tabId) {
        try {
            // Try to ping the content script
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        } catch (error) {
            // Content script not loaded, inject it
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['libs/html2 canvas.min.js', 'content.js']
                });
                // Wait a bit for initialization
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (injectionError) {
                throw new Error('Could not load content script');
            }
        }
    }

    // Show message in response box
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

    // Show status message
    function showStatus(message, type) {
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = `status status-${type}`;
        elements.statusSection.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            elements.statusSection.classList.add('hidden');
        }, 3000);
    }

    // Listen for response updates from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateResponse') {
            currentState.currentResponse = request.message;
            currentState.isError = request.isError || false;
            
            elements.responseContent.textContent = request.message;
            elements.responseContent.className = request.isError ? 'response-content error' : 'response-content';
        }
    });

    // Listen for storage changes to update API key status
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
