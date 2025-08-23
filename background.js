// Background service worker for CaptureAI Chrome extension
chrome.runtime.onInstalled.addListener(() => {
    // Inject content script into all open tabs
    chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
            if (isValidUrl(tab.url)) {
                injectContentScript(tab.id);
            }
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.action === 'sendToOpenAI') {
        handleOpenAIRequest(request.data, sendResponse);
        return true; // Keep message channel open for async response
    }

    if (request.action === 'captureArea') {
        handleCaptureArea(request, sender, sendResponse);
        return true; // Keep message channel open for async response
    }

    if (request.action === 'askQuestion') {
        handleAskQuestion(request, sender, sendResponse);
        return true; // Keep message channel open for async response
    }

    return false;
});

// Handle capture area requests (optimized)
async function handleCaptureArea(request, sender, sendResponse) {
    try {

        
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (imageUri) => {
            if (chrome.runtime.lastError) {

                sendResponse({ error: 'Failed to capture screenshot' });
                return;
            }
            

            
            // Send captured image to content script for processing
            chrome.tabs.sendMessage(sender.tab.id, {
                action: 'processCapturedImage',
                imageUri: imageUri,
                startX: request.coordinates.startX,
                startY: request.coordinates.startY,
                width: request.coordinates.width,
                height: request.coordinates.height
            }, async (response) => {
                if (chrome.runtime.lastError) {

                    return;
                }
                


                // Show processing message before sending to OpenAI
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: 'showProcessingMessage'
                });

                // Get API key and Pro Mode state
                const apiKey = await getStoredApiKey();
                const isProMode = await getStoredProMode();
                const promptType = request.promptType || 'answer';
                

                
                // Check for OCR errors first
                if (response && response.hasError) {
                    // Display error message directly without sending to OpenAI
                    chrome.tabs.sendMessage(sender.tab.id, {
                        action: 'displayResponse',
                        response: response.error
                    });
                    return;
                }
                
                // Check if we have the required data based on prompt type and mode
                let hasRequiredData;
                if (isProMode) {
                    // Pro Mode always needs image data
                    hasRequiredData = response && response.compressedImageData;
                } else {
                    // Standard mode: both auto-solve and manual need extracted text from OCR
                    hasRequiredData = response && response.extractedText && response.extractedText.trim().length > 0;
                }
                
                if (apiKey && hasRequiredData) {
                    let gptResponse;
                    
                    if (isProMode) {
                        // Pro Mode: always send image data regardless of prompt type
                        const compressedImageData = response.compressedImageData;
                        gptResponse = await sendExtractedTextToOpenAI({ imageData: compressedImageData }, apiKey, promptType, true);
                    } else {
                        // Standard Mode: use appropriate data type
                        if (promptType === 'auto_solve') {
                            // Standard auto-solve: use extracted text from Tesseract OCR
                            gptResponse = await sendExtractedTextToOpenAI(response.extractedText, apiKey, 'auto_solve', false);
                        } else {
                            // Standard manual capture: use extracted text
                            gptResponse = await sendExtractedTextToOpenAI(response.extractedText, apiKey, 'answer', false);
                        }
                    }

                    // Send the response back to content script for display
                    chrome.tabs.sendMessage(sender.tab.id, {
                        action: 'displayResponse',
                        response: gptResponse,
                        promptType: promptType
                    });
                } else {
                    // Silent error handling
                    chrome.tabs.sendMessage(sender.tab.id, {
                        action: 'displayResponse',
                        response: 'Error: Missing API key or failed to extract text'
                    });
                }
            });
        });
    } catch (error) {
        // Silent error handling
        sendResponse({ error: error.message });
    }
}

async function handleOpenAIRequest(data, sendResponse) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${data.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-5-nano",
                messages: data.messages,
                max_tokens: 100,
                temperature: 0
            })
        });

        if (response.ok) {
            const result = await response.json();
            sendResponse({ success: true, data: result });
        } else {
            const errorData = await response.json();
            sendResponse({
                success: false,
                error: errorData.error?.message || 'Unknown API error'
            });
        }
    } catch (error) {
        // Silent error handling
        sendResponse({
            success: false,
            error: 'Network error or API unavailable'
        });
    }
}

// Handle ask question requests
async function handleAskQuestion(request, sender, sendResponse) {
    try {
        const question = request.question;
        
        if (!question || question.trim().length === 0) {
            chrome.tabs.sendMessage(sender.tab.id, {
                action: 'displayResponse',
                response: 'Error: No question provided'
            });
            return;
        }

        // Get API key
        const apiKey = await getStoredApiKey();
        
        if (!apiKey) {
            chrome.tabs.sendMessage(sender.tab.id, {
                action: 'displayResponse',
                response: 'Error: API key is not set'
            });
            return;
        }

        // Send question to ChatGPT
        const gptResponse = await sendQuestionToOpenAI(question, apiKey);
        
        // Display response
        chrome.tabs.sendMessage(sender.tab.id, {
            action: 'displayResponse',
            response: gptResponse
        });
        
    } catch (error) {
        chrome.tabs.sendMessage(sender.tab.id, {
            action: 'displayResponse',
            response: 'Error: Failed to process question'
        });
    }
}

// Send question to OpenAI ChatGPT
async function sendQuestionToOpenAI(question, apiKey) {
    try {
        const messages = [
            { role: "system", content: "You are a helpful assistant that provides clear, accurate, and concise answers." },
            { role: "user", content: question }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-5-nano",
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (response.ok) {
            const result = await response.json();
            const aiResponse = result.choices[0]?.message?.content?.trim() || 'No response found';
            return aiResponse;
        } else {
            const errorData = await response.json();
            return `Error: ${errorData.error?.message || 'API request failed'}`;
        }
    } catch (error) {
        return 'Error: Network error or API unavailable';
    }
}

// Helper function to validate URLs
function isValidUrl(url) {
    return (url.startsWith('http://') || url.startsWith('https://')) &&
           !url.startsWith('chrome://') &&
           !url.startsWith('chrome-extension://') &&
           !url.startsWith('chrome.google.com');
}

async function injectContentScript(tabId) {
    try {
        chrome.tabs.get(tabId, (tab) => {
            if (isValidUrl(tab.url)) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        // Silently handle injection errors
                    }
                });
            }
        });
    } catch (error) {
        // Silently handle errors
    }
}

async function getStoredApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['captureai-api-key'], (result) => {
            resolve(result['captureai-api-key'] || '');
        });
    });
}

async function getStoredProMode() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['captureai-pro-mode'], (result) => {
            resolve(result['captureai-pro-mode'] || false);
        });
    });
}

async function sendExtractedTextToOpenAI(data, apiKey, promptType = 'answer', isProMode = false) {
    try {

        
        if (!apiKey || apiKey.trim().length === 0) {
            return 'Error: API key is not set';
        }
        
        let messages;
        let model = "gpt-5-nano";
        
        if (promptType === 'auto_solve') {
            if (isProMode) {
                // Pro Mode auto-solve: send image directly to gpt-5-nano
                if (!data || !data.imageData) {
                    return 'Error: No image data provided for Pro Mode auto-solve';
                }
                
                const prompt = 'Answer with only the number (1, 2, 3, or 4) of the correct choice. Answer choices will go left to right, then top to bottom. If there are not exactly 4 choices or if it says Spell the word, respond with "Invalid question". Avoid choices that are red.';
                
                messages = [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: data.imageData } }
                        ]
                    }
                ];
            } else {
                // Standard auto-solve: use Tesseract OCR + text processing
                if (!data || data.trim().length === 0) {
                    return 'Error: No text extracted from image for standard auto-solve';
                }
                
                const prompt = 'Answer with only the number (1, 2, 3, or 4) of the correct choice. If there are not exactly 4 choices, respond with "Invalid question". Avoid choices containing @ and ®.';
                
                messages = [
                    { role: "system", content: "You are a helpful assistant that answers questions accurately and concisely." },
                    { role: "user", content: `${prompt}\n\nQuestion: "${data}"` }
                ];
            }
        } else {
            if (isProMode) {
                // Pro Mode manual capture: send image directly to gpt-5-nano
                if (!data || !data.imageData) {
                    return 'Error: No image data provided for Pro Mode capture';
                }
                
                const prompt = 'Reply with answer only, avoid choices that are red.';
                
                messages = [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: data.imageData } }
                        ]
                    }
                ];
            } else {
                // Standard manual capture: use extracted text
                if (!data || data.trim().length === 0) {
                    return 'Error: No text extracted from image';
                }
                
                const prompt = 'Reply with answer only.';
                messages = [
                    { role: "system", content: "You are a helpful assistant that answers questions accurately and concisely." },
                    { role: "user", content: `${prompt}\n\nQuestion: "${data}"`}
                ];
            }
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: 150,
                temperature: 0
            })
        });

        if (response.ok) {
            const result = await response.json();
            const aiResponse = result.choices[0]?.message?.content?.trim() || 'No response found';
            return aiResponse;
        } else {
            return `Error: OpenAI API error (${response.status})`;
        }
    } catch (error) {

        return 'Error: Network error or API unavailable';
    }
}
