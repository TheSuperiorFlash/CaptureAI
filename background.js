/**
 * ==================================================================================
 * CaptureAI Background Service Worker
 * ==================================================================================
 * Handles screenshot capture, OpenAI API communication, and message routing
 * for the CaptureAI Chrome extension.
 */

// ==================================================================================
// EXTENSION LIFECYCLE
// ==================================================================================

/**
 * Initialize extension on install/update
 * Injects content script into all existing tabs
 */
chrome.runtime.onInstalled.addListener(() => {
    try {
        chrome.tabs.query({}, (tabs) => {
            if (chrome.runtime.lastError) {
                return;
            }
            
            for (let tab of tabs) {
                try {
                    if (isValidUrl(tab.url)) {
                        injectContentScript(tab.id).catch(() => {});
                    }
                } catch (error) {}
            }
        });
    } catch (error) {}
});

// ==================================================================================
// MESSAGE ROUTING
// ==================================================================================

/**
 * Central message router for all extension communication
 * Routes messages from content scripts and popup to appropriate handlers
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'captureArea':
            handleCaptureArea(request, sender, sendResponse);
            return true;
        
        case 'captureForAskMode':
            handleCaptureForAskMode(request, sender, sendResponse);
            return true;
        
        case 'askQuestion':
            handleAskQuestion(request, sender, sendResponse);
            return true;
        
        default:
            return false;
    }
});

// ==================================================================================
// SCREENSHOT CAPTURE & PROCESSING
// ==================================================================================

/**
 * Handle screenshot capture and AI processing pipeline
 * @param {Object} request - Capture request with coordinates and prompt type
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
async function handleCaptureArea(request, sender, sendResponse) {
    try {
        // Step 1: Show capturing message and capture screenshot
        await showCapturingMessage(sender.tab.id);
        const imageUri = await captureScreenshot();
        
        // Step 2: Process captured image (crop and compress)
        const processedData = await processImage(imageUri, request, sender);
        
        // Step 3: Show processing message to user
        await showProcessingMessage(sender.tab.id);

        // Step 4: Get user settings
        const apiKey = await getStoredApiKey();
        const promptType = request.promptType || 'answer';
        
        // Step 5: Handle processing errors
        if (processedData?.hasError) {
            await displayResponse(sender.tab.id, processedData.error);
            sendResponse({ success: true });
            return;
        }
        
        // Step 6: Send to AI and get response (always use direct image processing)
        const aiResponse = await processWithAI(processedData, apiKey, promptType);
        
        // Step 7: Display response to user
        await displayResponse(sender.tab.id, aiResponse, promptType);
        
        sendResponse({ success: true });
        
    } catch (error) {
        sendResponse({ success: false, error: 'Capture failed' });
    }
}

// ==================================================================================
// AI PROCESSING FUNCTIONS
// ==================================================================================

/**
 * Handle capture for ask mode - returns image data instead of processing
 * @param {Object} request - Capture request
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
async function handleCaptureForAskMode(request, sender, sendResponse) {
    try {
        console.log('Starting ask mode capture...');
        
        // Step 1: Capture screenshot (no message shown for ask mode)
        console.log('Taking screenshot...');
        const imageUri = await captureScreenshot();
        
        // Step 2: Process image (crop and compress) using content script
        console.log('Processing image...');
        const processedData = await processImage(imageUri, request, sender);
        
        // Step 3: Handle processing errors
        if (processedData?.hasError) {
            sendResponse({ success: false, error: processedData.error });
            return;
        }
        
        // Step 4: Send the compressed image data to ask mode
        console.log('Sending image data to ask mode...');
        await chrome.tabs.sendMessage(sender.tab.id, {
            action: 'setAskModeImage',
            imageData: processedData.compressedImageData
        });
        
        console.log('Ask mode capture completed successfully');
        sendResponse({ success: true });
        
    } catch (error) {
        console.error('Ask mode capture error:', error);
        sendResponse({ success: false, error: `Capture for ask mode failed: ${error.message}` });
    }
}

/**
 * Handle ask question requests from UI
 * @param {Object} request - Question request
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
async function handleAskQuestion(request, sender, sendResponse) {
    try {
        const question = request.question;
        const imageData = request.imageData; // Optional image attachment
        
        // Validate question
        if (!question || question.trim().length === 0) {
            await displayResponse(sender.tab.id, 'Error: No question provided');
            sendResponse({ success: false, error: 'No question provided' });
            return;
        }

        // Get API key
        const apiKey = await getStoredApiKey();
        if (!apiKey) {
            await displayResponse(sender.tab.id, 'Error: API key is not set, check popup');
            sendResponse({ success: false, error: 'API key not set' });
            return;
        }

        // Process question with AI
        let aiResponse;
        if (imageData) {
            // Ask with image - use the unified processWithAI function
            const data = { question, imageData };
            aiResponse = await sendImgQuestionToOpenAI(data, apiKey, 'ask');
        } else {
            // Text-only ask - use existing function
            aiResponse = await sendQuestionToOpenAI(question, apiKey);
        }
        
        // Display response
        await displayResponse(sender.tab.id, aiResponse);
        sendResponse({ success: true });
        
    } catch (error) {
        await displayResponse(sender.tab.id, 'Error: Failed to process question');
        sendResponse({ success: false, error: 'Failed to process question' });
    }
}

/**
 * Send question to OpenAI ChatGPT API - ASK MODE (text-only questions from floating UI)
 * @param {string} question - Question to ask
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} AI response
 */
async function sendQuestionToOpenAI(question, apiKey) {
    try {
        const messages = [
            { role: "system", content: "You are a helpful assistant that provides clear, accurate, and concise answers." },
            { role: "user", content: question }
        ];

        // API Call for ASK MODE - text-only questions from floating UI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-5-nano",
                messages: messages,
                max_completion_tokens: 500,
                reasoning_effort: "low",
                verbosity: "low"
            })
        });

        if (response.ok) {
            const result = await response.json();
            return result.choices[0]?.message?.content?.trim() || 'No response found';
        } else {
            const errorData = await response.json();
            return `Error: ${errorData.error?.message || 'API request failed'}`;
        }
    } catch (error) {
        return 'Error: Network error or API unavailable';
    }
}

/**
 * Send extracted text or image data to OpenAI for processing - CAPTURE MODES (normal capture and auto-solve)
 * @param {Object} data - Image data object
 * @param {string} apiKey - OpenAI API key
 * @param {string} promptType - Type of prompt ('answer' for normal capture or 'auto_solve' for auto-solve mode)
 * @returns {Promise<string>} AI response
 */
async function sendImgQuestionToOpenAI(data, apiKey, promptType = 'answer') {
    try {
        if (!apiKey || apiKey.trim().length === 0) {
            return 'Error: API key is not set';
        }

        // Configure model and messages based on mode and prompt type
        // All modes now use gpt-5-nano for optimal speed and efficiency
        const model = "gpt-5-nano";
        const messages = buildMessages(data, promptType);


        // API Call for CAPTURE MODES - image-based questions from screenshots
        // AUTO-SOLVE: shorter responses (50 tokens) for quick answers
        // NORMAL CAPTURE: longer responses (300 tokens) for detailed answers
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_completion_tokens: 300,
                reasoning_effort: "low",
                verbosity: "low"
            })
        });

        if (response.ok) {
            const result = await response.json();
            return result.choices[0]?.message?.content?.trim() || 'No response found';
        } else {
            return `Error: OpenAI API error (${response.status}): ${response.statusText}`;
        }
    } catch (error) {
        return 'Error: Network error or API unavailable';
    }
}

// ==================================================================================
// HELPER FUNCTIONS
// ==================================================================================

/**
 * Capture screenshot of visible tab
 * @returns {Promise<string>} Screenshot data URI
 */
async function captureScreenshot() {
    return new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (imageUri) => {
            if (chrome.runtime.lastError) {
                reject(new Error('Failed to capture screenshot'));
            } else {
                resolve(imageUri);
            }
        });
    });
}

/**
 * Process captured image (send to content script for cropping/OCR)
 * @param {string} imageUri - Screenshot data URI
 * @param {Object} request - Original request with coordinates
 * @param {Object} sender - Message sender info
 * @returns {Promise<Object>} Processed image data
 */
async function processImage(imageUri, request, sender) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(sender.tab.id, {
            action: 'processCapturedImage',
            imageUri: imageUri,
            startX: request.coordinates.startX,
            startY: request.coordinates.startY,
            width: request.coordinates.width,
            height: request.coordinates.height
        }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error('Error processing image: ' + chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Show capturing message to user
 * @param {number} tabId - Tab ID
 */
async function showCapturingMessage(tabId) {
    try {
        await new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, {
                action: 'showCapturingMessage'
            }, () => {
                resolve(); // Always resolve to continue processing
            });
        });
    } catch (e) {
        // Continue processing even if message fails
    }
}

/**
 * Show processing message to user
 * @param {number} tabId - Tab ID
 */
async function showProcessingMessage(tabId) {
    try {
        await new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, {
                action: 'showProcessingMessage'
            }, () => {
                resolve(); // Always resolve to continue processing
            });
        });
    } catch (e) {
        // Continue processing even if message fails
    }
}

/**
 * Display response to user
 * @param {number} tabId - Tab ID
 * @param {string} response - Response text
 * @param {string} promptType - Prompt type (optional)
 */
async function displayResponse(tabId, response, promptType) {
    await new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, {
            action: 'displayResponse',
            response: response,
            promptType: promptType
        }, () => {
            if (chrome.runtime.lastError) {}
            resolve();
        });
    });
}

/**
 * Process data with AI
 * @param {Object} processedData - Data from image processing
 * @param {string} apiKey - OpenAI API key
 * @param {string} promptType - Type of prompt
 * @returns {Promise<string>} AI response
 */
async function processWithAI(processedData, apiKey, promptType) {
    // Check if we have the required image data
    if (!apiKey || !processedData?.compressedImageData) {
        return 'Error: Missing API key or failed to process image';
    }
    
    // Always use direct image processing
    const imageData = { imageData: processedData.compressedImageData };
    return await sendImgQuestionToOpenAI(imageData, apiKey, promptType);
}

/**
 * Build messages array for OpenAI API based on prompt type
 * @param {Object} data - Input data (image)
 * @param {string} promptType - Type of prompt
 * @returns {Array} Messages array
 */
function buildMessages(data, promptType) {
    if (promptType === 'auto_solve') {
        // Auto-solve: always use image input
        if (!data?.imageData) {
            throw new Error('No image data provided for auto-solve');
        }
        
        const prompt = 'Answer with only the number (1, 2, 3, or 4) of the correct choice. Answer choices will go left to right, then top to bottom. If there are not exactly 4 choices or if it says Spell the word, respond with "Invalid question". Avoid choices that are red.';
        
        return [{
            role: "user",
            content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: data.imageData } }
            ]
        }];
    } else if (promptType === 'ask') {
        // Ask mode: can be text-only or text with image
        if (data?.imageData) {
            // Ask with image attachment
            return [{
                role: "user",
                content: [
                    { type: "text", text: data.question },
                    { type: "image_url", image_url: { url: data.imageData } }
                ]
            }];
        } else {
            // Ask text-only (existing behavior)
            return [{
                role: "user",
                content: data.question
            }];
        }
    } else {
        // Manual capture: always use image input
        if (!data?.imageData) {
            throw new Error('No image data provided for capture');
        }
        
        const prompt = 'Reply with answer only, avoid choices that are red.';
        
        return [{
            role: "user",
            content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: data.imageData } }
            ]
        }];
    }
}

// ==================================================================================
// CHROME EXTENSION UTILITIES
// ==================================================================================

/**
 * Validate if URL is suitable for content script injection
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 */
function isValidUrl(url) {
    return (url.startsWith('http://') || url.startsWith('https://')) &&
           !url.startsWith('chrome://') &&
           !url.startsWith('chrome-extension://') &&
           !url.startsWith('chrome.google.com');
}

/**
 * Inject content script into a specific tab
 * @param {number} tabId - Tab ID to inject into
 */
async function injectContentScript(tabId) {
    try {
        chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError) {
                return;
            }
            if (isValidUrl(tab.url)) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {}
                });
            }
        });
    } catch (error) {
        // Silently handle errors
    }
}

// ==================================================================================
// STORAGE UTILITIES
// ==================================================================================

/**
 * Get stored OpenAI API key from Chrome storage
 * @returns {Promise<string>} API key or empty string
 */
async function getStoredApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['captureai-api-key'], (result) => {
            resolve(result['captureai-api-key'] || '');
        });
    });
}

// Pro Mode removed - direct image processing is now the default