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
        autoSolveToggle: document.getElementById('auto-solve-toggle'),
        headerUiToggle: document.getElementById('header-ui-toggle')
    };

    // State variables
    let currentState = {
        apiKey: '',
        isPanelVisible: false,
        isAutoSolveMode: false,
        hasLastCaptureArea: false,
        isOnVocabulary: false,
        currentResponse: ''
    };

    // Initialize popup
    await initializePopup();

    // Event listeners
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.captureBtn.addEventListener('click', startCapture);
    elements.quickCaptureBtn.addEventListener('click', quickCapture);
    elements.headerUiToggle.addEventListener('click', togglePanel);
    elements.autoSolveToggle.addEventListener('change', toggleAutoSolve);

    // Initialize popup state
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
                elements.apiKeySection.classList.remove('hidden');
            }
        } catch (error) {
            showResponseMessage('Error initializing popup', 'error');
            console.error('Popup initialization error:', error);
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
        elements.autoSolveToggle.disabled = true;
        elements.autoSolveSection.classList.add('hidden');
    }

    // Update UI based on current state
    function updateUI() {
        // Update quick capture button state
        elements.quickCaptureBtn.disabled = !currentState.hasLastCaptureArea;
        elements.quickCaptureBtn.textContent = currentState.hasLastCaptureArea ? 
            'Quick Capture' : 'Quick Capture (No Area)';

        // Update header UI toggle button
        elements.headerUiToggle.textContent = currentState.isPanelVisible ? 'Hide UI' : 'Show UI';

        // Show/hide auto-solve section based on domain
        if (currentState.isOnVocabulary) {
            elements.autoSolveSection.classList.remove('hidden');
            elements.autoSolveToggle.checked = currentState.isAutoSolveMode;
        } else {
            elements.autoSolveSection.classList.add('hidden');
        }
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
            await chrome.storage.local.set({ 'captureai-api-key': apiKey });
            currentState.apiKey = apiKey;
            
            showResponseMessage('API key saved successfully!', 'success');
            
            setTimeout(() => {
                elements.apiKeySection.classList.add('hidden');
                elements.mainControls.classList.remove('hidden');
                updateStateFromContentScript();
            }, 1500);
            
        } catch (error) {
            showResponseMessage('Error saving API key', 'error');
            console.error('Error saving API key:', error);
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
            console.error('Capture error:', error);
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
            console.error('Quick capture error:', error);
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
            console.error('Toggle panel error:', error);
        }
    }

    // Toggle auto-solve mode
    async function toggleAutoSolve() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on a valid page
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                showResponseMessage('Auto-solve not available on this page type', 'error');
                return;
            }
            
            // Ensure content script is loaded
            await ensureContentScriptLoaded(tab.id);
            
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleAutoSolve' });
            
            if (response && response.success) {
                currentState.isAutoSolveMode = response.autoSolveMode;
            } else {
                showResponseMessage(response.error || 'Error toggling auto-solve', 'error');
                // Revert toggle state
                elements.autoSolveToggle.checked = currentState.isAutoSolveMode;
            }
        } catch (error) {
            showResponseMessage('Page not ready - please refresh and try again', 'error');
            console.error('Toggle auto-solve error:', error);
            // Revert toggle state
            elements.autoSolveToggle.checked = currentState.isAutoSolveMode;
        }
    }

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
