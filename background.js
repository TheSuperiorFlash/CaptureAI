// Background service worker for CaptureAI Chrome extension

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sendToOpenAI') {
        handleOpenAIRequest(request.data, sendResponse);
        return true; // Keep message channel open for async response
    }
});

async function handleOpenAIRequest(data, sendResponse) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${data.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: data.messages
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
        console.error('Background script error:', error);
        sendResponse({ 
            success: false, 
            error: 'Network error or API unavailable' 
        });
    }
}
