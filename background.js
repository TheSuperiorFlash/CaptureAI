/**
 * CaptureAI Background Service Worker
 * Handles screenshot capture, OpenAI API communication, and message routing
 */

const PROMPT_TYPES = {
    ANSWER: 'answer',
    AUTO_SOLVE: 'auto_solve',
    ASK: 'ask'
};

const OPENAI_CONFIG = {
    MODEL: 'gpt-5-nano',
    API_URL: 'https://api.openai.com/v1/chat/completions',
    REASONING_EFFORT: 'low',
    VERBOSITY: 'low',
    MAX_TOKENS: {
        AUTO_SOLVE: 2500,
        ASK: 8000,
        DEFAULT: 5000
    }
};

const PROMPTS = {
    AUTO_SOLVE: 'Answer with only the number (1, 2, 3, or 4) of the correct choice. Answer choices will go left to right, then top to bottom. If there are not exactly 4 choices or if it says Spell the word, respond with "Invalid question". Avoid choices that are red.',
    ANSWER: 'Reply with answer only, avoid choices that are red.',
    ASK_SYSTEM: 'You are a helpful assistant that provides clear, accurate, and concise answers.'
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const handlers = {
        'captureArea': handleCaptureArea,
        'askQuestion': handleAskQuestion
    };

    const handler = handlers[request.action];
    if (handler) {
        handler(request, sender, sendResponse);
        return true;
    }
    
    return false;
});

async function handleCaptureArea(request, sender, sendResponse) {
    try {
        await showMessage(sender.tab.id, 'showCapturingMessage');
        const imageUri = await captureScreenshot();
        const processedData = await processImage(imageUri, request, sender);

        if (processedData?.hasError) {
            console.error('Image processing error:', processedData.error);
            await displayResponse(sender.tab.id, processedData.error);
            sendResponse({ success: true });
            return;
        }

        // Check if this is for ask mode (image attachment)
        if (request.isForAskMode) {
            // Send image data back to content script for ask mode
            await chrome.tabs.sendMessage(sender.tab.id, {
                action: 'setAskModeImage',
                imageData: processedData.compressedImageData
            });
            sendResponse({ success: true });
            return;
        }

        // Normal capture flow - process with AI
        await showMessage(sender.tab.id, 'showProcessingMessage');
        const apiKey = await getStoredApiKey();
        const promptType = request.promptType || PROMPT_TYPES.ANSWER;

        const aiData = {
            imageData: processedData.compressedImageData
        };

        const aiResponse = await sendToOpenAI(aiData, apiKey, promptType);
        await displayResponse(sender.tab.id, aiResponse, promptType);
        sendResponse({ success: true });

    } catch (error) {
        console.error('Capture area error:', error);
        sendResponse({ success: false, error: 'Capture failed: ' + error.message });
    }
}

async function handleAskQuestion(request, sender, sendResponse) {
    try {
        const { question, imageData } = request;
        
        if (!question?.trim()) {
            await displayResponse(sender.tab.id, 'Error: No question provided');
            sendResponse({ success: false, error: 'No question provided' });
            return;
        }

        const apiKey = await getStoredApiKey();
        if (!apiKey) {
            await displayResponse(sender.tab.id, 'Error: API key is not set, check popup');
            sendResponse({ success: false, error: 'API key not set' });
            return;
        }

        const aiResponse = imageData 
            ? await sendToOpenAI({ question, imageData }, apiKey, PROMPT_TYPES.ASK)
            : await sendTextOnlyQuestion(question, apiKey);
        
        await displayResponse(sender.tab.id, aiResponse);
        sendResponse({ success: true });
        
    } catch (error) {
        console.error('Ask question error:', error);
        await displayResponse(sender.tab.id, 'Error: Failed to process question');
        sendResponse({ success: false, error: 'Failed to process question' });
    }
}

async function sendToOpenAI(data, apiKey, promptType = PROMPT_TYPES.ANSWER) {
    try {
        if (!apiKey?.trim()) {
            return 'Error: API key is not set';
        }

        const messages = buildMessages(data, promptType);
        const tokenKey = promptType === PROMPT_TYPES.AUTO_SOLVE ? 'AUTO_SOLVE' : 
                        promptType === PROMPT_TYPES.ASK ? 'ASK' : 'DEFAULT';
        const maxTokens = OPENAI_CONFIG.MAX_TOKENS[tokenKey];

        const response = await fetch(OPENAI_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: OPENAI_CONFIG.MODEL,
                messages: messages,
                max_completion_tokens: maxTokens,
                reasoning_effort: OPENAI_CONFIG.REASONING_EFFORT,
                verbosity: OPENAI_CONFIG.VERBOSITY
            })
        });

        if (response.ok) {
            const result = await response.json();
            return result.choices[0]?.message?.content?.trim() || 'No response found';
        }
        
        const errorText = await response.text();
        console.error('OpenAI API Error:', response.status, errorText);
        return `Error: OpenAI API error (${response.status}): ${response.statusText}`;
    } catch (error) {
        console.error('Network error:', error);
        return `Error: Network error or API unavailable - ${error.message}`;
    }
}

async function sendTextOnlyQuestion(question, apiKey) {
    try {
        const messages = [
            { role: "system", content: PROMPTS.ASK_SYSTEM },
            { role: "user", content: question }
        ];

        const response = await fetch(OPENAI_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: OPENAI_CONFIG.MODEL,
                messages: messages,
                max_completion_tokens: 4000,
                reasoning_effort: OPENAI_CONFIG.REASONING_EFFORT,
                verbosity: OPENAI_CONFIG.VERBOSITY
            })
        });

        if (response.ok) {
            const result = await response.json();
            return result.choices[0]?.message?.content?.trim() || 'No response found';
        }
        
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
        console.error('Text-only API Error:', response.status, errorData);
        return `Error: ${errorData.error?.message || 'API request failed'}`;
    } catch (error) {
        console.error('Text-only network error:', error);
        return `Error: Network error or API unavailable - ${error.message}`;
    }
}

function buildMessages(data, promptType) {
    if (!data?.imageData) {
        throw new Error(`No image data provided for ${promptType}`);
    }

    const prompts = {
        [PROMPT_TYPES.AUTO_SOLVE]: PROMPTS.AUTO_SOLVE,
        [PROMPT_TYPES.ANSWER]: PROMPTS.ANSWER
    };

    if (promptType === PROMPT_TYPES.ASK && data.question) {
        return [{
            role: "user",
            content: [
                { type: "text", text: data.question },
                { type: "image_url", image_url: { url: data.imageData } }
            ]
        }];
    }

    const prompt = prompts[promptType] || PROMPTS.ANSWER;
    return [{
        role: "user",
        content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: data.imageData } }
        ]
    }];
}

async function captureScreenshot() {
    return new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (imageUri) => {
            chrome.runtime.lastError 
                ? reject(new Error('Failed to capture screenshot'))
                : resolve(imageUri);
        });
    });
}

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
            chrome.runtime.lastError
                ? reject(new Error('Error processing image: ' + chrome.runtime.lastError.message))
                : resolve(response);
        });
    });
}

async function showMessage(tabId, messageType) {
    try {
        await new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, { action: messageType }, () => resolve());
        });
    } catch (e) {}
}

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

function isValidUrl(url) {
    return (url.startsWith('http://') || url.startsWith('https://')) &&
           !url.startsWith('chrome://') &&
           !url.startsWith('chrome-extension://') &&
           !url.startsWith('chrome.google.com');
}

async function injectContentScript(tabId) {
    try {
        chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError) return;
            
            if (isValidUrl(tab.url)) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {}
                });
            }
        });
    } catch (error) {}
}

async function getStoredApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['captureai-api-key'], (result) => {
            resolve(result['captureai-api-key'] || '');
        });
    });
}