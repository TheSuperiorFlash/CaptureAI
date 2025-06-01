(function() {
    'use strict';

    // Configuration Constants
    const DEBUG = true;
    const PANEL_ID = 'captureai-panel';
    const RESULT_ID = 'captureai-result';
    const STEALTHY_RESULT_ID = 'captureai-stealthy-result';
    const AUTO_SOLVE_MODE_STORAGE = 'captureai-auto-solve-mode';
    const API_KEY_STORAGE = 'captureai-api-key';
    const LAST_CAPTURE_AREA_STORAGE = 'captureai-last-capture-area';
    const AUTO_SOLVE_COOLDOWN = 1000;
    const ANSWER_FADEOUT_TIME = 2000;
    const AUTO_SOLVE_DELAY = 1500;
    const ESC_KEY_CODE = 'Escape';
    const MAX_INVALID_QUESTIONS = 2;

    // Default icons (placeholders)
    const CHECKMARK_ICON = chrome.runtime.getURL('icons/icon128.png');
    const CAMERA_ICON = chrome.runtime.getURL('icons/camera.png');

    // State variables
    let isDragging = false;
    let startX, startY, endX, endY;
    let selectionBox = null;
    let lastCaptureArea = null;
    let apiKey = '';
    let isPanelVisible = false;
    let isAutoSolveMode = false;
    let isProcessing = false;
    let answerFadeoutTimer = null;
    let invalidQuestionCount = 0;
    let uiElements = {};
    let isShowingAnswer = false;

    // Chrome storage helpers
    function setValue(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, resolve);
        });
    }

    function getValue(key, defaultValue = null) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key] !== undefined ? result[key] : defaultValue);
            });
        });
    }

    // Domain detection function
    function isOnVocabulary() {
        return window.location.hostname.includes('vocabulary.com');
    }

    // Prompt types (removed HINT)
    const PROMPT_TYPES = {
        ANSWER: 'This is an image of a question. Please answer it directly and concisely without any explanations. Just provide the correct answer. If an answer choice is red, you must pick a different one.',
        AUTO_SOLVE: 'This should be an image of a question related to vocabulary in some way with 4 multiple choice answers or 4 different images, if it is not respond "Invalid Question", and if it a valid question respond with either 1,2,3, or 4. If the question is asking for the best picture, top left is 1, top right is 2, bottom left is 3, bottom right is 4. If an answer choice is red, you must pick a different one.'
    };

    // Debug logger
    const log = (message, data = null) => {
        if (DEBUG && message) {
            if (data) {
                console.log(`[CaptureAI] ${message}`, data);
            } else {
                console.log(`[CaptureAI] ${message}`);
            }
        }
    };

    // Debounce function
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Create UI elements
    function createUI() {
        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 250px !important;
            background-color: white !important;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            z-index: 9999;
            font-family: Arial, Helvetica, sans-serif;
            color: #333333 !important;
            overflow: hidden;
            transition: opacity 0.3s ease;
            display: none;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            padding: 10px 15px;
            justify-content: space-between;
            background-color: #f5f5f5 !important;
            border-bottom: 1px solid #e0e0e0 !important;
            cursor: move;
        `;

        const logo = document.createElement('img');
        logo.src = CHECKMARK_ICON;
        logo.style.cssText = `
            width: 24px;
            height: 24px;
            margin-right: 10px;
            color: #333333 !important;
        `;

        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            display: flex;
            align-items: center;
        `;

        const title = document.createElement('span');
        title.textContent = 'CaptureAI';
        title.style.cssText = `
            font-weight: bold;
            font-size: 16px;
            margin-right: 10px;
            color: #333333 !important;
        `;

        titleContainer.appendChild(logo);
        titleContainer.appendChild(title);

        if (isOnVocabulary()) {
            const toggleContainer = document.createElement('div');
            toggleContainer.style.cssText = `
                display: flex;
                align-items: center;
            `;

            const toggleLabel = document.createElement('span');
            toggleLabel.textContent = 'Auto:';
            toggleLabel.style.cssText = `
                font-size: 12px;
                margin-right: 5px;
                color: #333333 !important;
            `;

            const toggleSwitch = document.createElement('label');
            toggleSwitch.className = 'captureai-toggle-switch';
            toggleSwitch.style.cssText = `
                position: relative;
                display: inline-block;
                width: 30px;
                height: 20px;
            `;

            const toggleInput = document.createElement('input');
            toggleInput.type = 'checkbox';
            toggleInput.checked = isAutoSolveMode;
            toggleInput.style.cssText = `
                opacity: 0;
                width: 0;
                height: 0;
            `;

            const toggleSlider = document.createElement('span');
            toggleSlider.style.cssText = `
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                width: 30px;
                height: 20px;
                background-color: ${isAutoSolveMode ? '#4caf65' : '#e0e0e0'};
                transition: .3s;
                border-radius: 34px;
            `;

            const toggleSliderButton = document.createElement('span');
            toggleSliderButton.style.cssText = `
                position: absolute;
                height: 16px;
                width: 16px;
                left: ${isAutoSolveMode ? '12px' : '2px'};
                bottom: 2px;
                background-color: white !important;
                transition: .4s;
                border-radius: 34px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            `;

            toggleSlider.appendChild(toggleSliderButton);

            toggleSwitch.appendChild(toggleInput);
            toggleSwitch.appendChild(toggleSlider);

            toggleInput.addEventListener('change', () => {
                isAutoSolveMode = toggleInput.checked;
                setValue(AUTO_SOLVE_MODE_STORAGE, isAutoSolveMode);

                toggleSliderButton.style.left = isAutoSolveMode ? '12px' : '2px';
                toggleSlider.style.backgroundColor = isAutoSolveMode ? '#4caf65' : '#e0e0e0';

                log(`Auto-solve mode ${isAutoSolveMode ? 'enabled' : 'disabled'}`);
            });

            toggleContainer.appendChild(toggleLabel);
            toggleContainer.appendChild(toggleSwitch);

            header.appendChild(titleContainer);
            header.appendChild(toggleContainer);
        } else {
            header.appendChild(titleContainer);
        }
        panel.appendChild(header);

        function toggleCaptureButtons(show) {
            if (buttonsContainer) {
                buttonsContainer.style.display = show ? 'flex' : 'none';
            }
        }

        const responseContainer = document.createElement('div');
        responseContainer.style.cssText = `
            padding: 10px 15px;
            background-color: white !important;
            border-bottom: 0px solid #e0e0e0;
            font-size: 14px;
            color: #333333 !important;
            min-height: 20px;
        `;

        const responseTitle = document.createElement('div');
        responseTitle.textContent = 'Response:';
        responseTitle.style.cssText = `
            font-size: 12px;
            color: #666666 !important;
            margin-bottom: 5px;
        `;

        const responseContent = document.createElement('div');
        responseContent.id = RESULT_ID;
        responseContent.style.cssText = `
            font-size: 14px;
            color: #333333 !important;
            word-break: break-word;
        `;

        if (!apiKey) {
            responseContent.textContent = 'Error: Could not get API key';
            responseContent.style.color = '#ff0000 !important';
        }

        responseContainer.appendChild(responseTitle);
        responseContainer.appendChild(responseContent);
        panel.appendChild(responseContainer);

        if (!apiKey) {
            const apiKeyContainer = document.createElement('div');
            apiKeyContainer.style.cssText = `
                padding: 10px 15px;
                background-color: white !important;
                border-bottom: 0px solid #e0e0e0;
            `;

            const apiKeyInput = document.createElement('input');
            apiKeyInput.type = 'password';
            apiKeyInput.placeholder = 'Enter OpenAI API Key';
            apiKeyInput.style.cssText = `
                width: 100% !important;
                padding: 10px;
                border: 1px solid #d1d1d1 !important;
                border-radius: 8px;
                box-sizing: border-box;
                margin-bottom: 5px;
                color: #444444 !important;
                font-size: 14px;
            `;

            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save API Key';
            saveButton.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px 10px;
                width: 220px !important;
                min-width: 220px !important;
                max-width: 220px !important;
                background-color: #4caf65 !important;
                border-radius: 8px;
                cursor: pointer;
                margin: 0 auto;
                box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                color: white !important;
                font-weight: bold;
                font-size: 14px;
                border: none;
                box-sizing: border-box !important;
            `;

            saveButton.addEventListener('click', () => {
                const newApiKey = apiKeyInput.value.trim();
                if (newApiKey) {
                    apiKey = newApiKey;
                    setValue(API_KEY_STORAGE, apiKey);
                    apiKeyContainer.remove();
                    responseContent.textContent = 'API key saved successfully!';
                    responseContent.style.color = '#008000 !important';
                    toggleCaptureButtons(true);
                    setTimeout(() => {
                        responseContent.textContent = '';
                        responseContent.style.color = '#333333 !important';
                    }, 2000);
                }
            });

            apiKeyContainer.appendChild(apiKeyInput);
            apiKeyContainer.appendChild(saveButton);
            panel.appendChild(apiKeyContainer);
        }

        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            padding: 15px;
            width: 220px !important;
            min-width: 220px !important;
            max-width: 220px !important;
            display: ${apiKey ? 'flex' : 'none'};
            background-color: white !important;
            flex-direction: column;
            gap: 10px;
            box-sizing: border-box !important;
        `;

        const captureButton = document.createElement('div');
        captureButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            width: 220px !important;
            min-width: 220px !important;
            max-width: 220px !important;
            background-color: #4caf65 !important;
            border-radius: 8px;
            cursor: pointer;
            margin: 0 auto;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            box-sizing: border-box !important;
        `;

        const captureIcon = document.createElement('img');
        captureIcon.src = CAMERA_ICON;
        captureIcon.style.cssText = `
            width: 20px;
            height: 20px;
            margin-right: 10px;
            color: #333333 !important;
        `;

        const captureText = document.createElement('span');
        captureText.textContent = 'Capture A Question';
        captureText.style.cssText = `
            font-weight: bold;
            color: white !important;
            font-size: 14px;
        `;

        captureButton.appendChild(captureIcon);
        captureButton.appendChild(captureText);
        captureButton.addEventListener('click', () => {
            startCapture(false, PROMPT_TYPES.ANSWER);
        });

        buttonsContainer.appendChild(captureButton);

        const quickCaptureButton = document.createElement('div');
        quickCaptureButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            width: 220px !important;
            min-width: 220px !important;
            max-width: 220px !important;
            background-color: #f1f1f1 !important;
            border-radius: 8px;
            cursor: pointer;
            margin: 0 auto;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            border: 1px solid #d1d1d1;
            box-sizing: border-box !important;
        `;

        const quickCaptureText = document.createElement('span');
        quickCaptureText.textContent = 'Quick Capture';
        quickCaptureText.style.cssText = `
            font-weight: bold;
            color: #444444 !important;
            font-size: 14px;
        `;

        quickCaptureButton.appendChild(quickCaptureText);

        quickCaptureButton.addEventListener('click', () => {
            if (lastCaptureArea) {
                showMessage('Capturing Image...');
                captureScreenshot(lastCaptureArea, PROMPT_TYPES.ANSWER, true);
            } else {
                showMessage('No previous capture area found. Please use "Capture A Question" first.', true);
            }
        });

        buttonsContainer.appendChild(quickCaptureButton);
        panel.appendChild(buttonsContainer);

        makeDraggable(panel, header);

        const stealthyResult = document.createElement('div');
        stealthyResult.id = STEALTHY_RESULT_ID;
        stealthyResult.style.cssText = `
            position: fixed;
            bottom: 25px;
            right: 100px;
            max-width: 300px;
            padding: 12px;
            font-size: 14px;
            color: rgba(125, 125, 125, 0.4) !important;
            z-index: 9998;
            display: none;
            text-align: right;
            pointer-events: none;
            transition: opacity 0.5s ease;
        `;

        document.body.appendChild(panel);
        document.body.appendChild(stealthyResult);

        uiElements.panel = panel;
        uiElements.stealthyResult = stealthyResult;

        return { panel, stealthyResult };
    }

    // Make an element draggable
    function makeDraggable(element, handle) {
        let offsetX = 0, offsetY = 0;

        const startDrag = (e) => {
            e.preventDefault();
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;

            document.addEventListener('mousemove', moveElement);
            document.addEventListener('mouseup', stopMoving);
        };

        handle.addEventListener('mousedown', startDrag);

        function moveElement(e) {
            e.preventDefault();
            element.style.left = (e.clientX - offsetX) + 'px';
            element.style.top = (e.clientY - offsetY) + 'px';
        }

        function stopMoving() {
            document.removeEventListener('mousemove', moveElement);
            document.removeEventListener('mouseup', stopMoving);
        }
    }

    // Simulate keypress
    function simulateKeypress(key, pressEnter = false) {
        const activeElement = document.activeElement;
        let success = false;

        try {
            if (activeElement &&
                (activeElement.isContentEditable ||
                    activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'TEXTAREA')) {

                const inputEvent = new InputEvent('input', {
                    inputType: 'insertText',
                    data: key,
                    bubbles: true,
                    cancelable: true
                });

                activeElement.focus();
                activeElement.value = (activeElement.value || '') + key;
                activeElement.dispatchEvent(inputEvent);
                success = true;
            }
        } catch (e) {
            log('Error in primary keypress method:', e);
        }

        if (!success && activeElement &&
            (activeElement.isContentEditable ||
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA')) {
            try {
                activeElement.focus();

                const event = new KeyboardEvent('keydown', {
                    key: key,
                    code: 'Digit' + key,
                    keyCode: key.charCodeAt(0),
                    which: key.charCodeAt(0),
                    bubbles: true,
                    cancelable: true
                });
                success = true;
            } catch (e) {
                log('Error in fallback keypress method:', e);
            }
        }

        if (!success && document.activeElement) {
            try {
                const event = new KeyboardEvent('keydown', {
                    key: key,
                    code: 'Digit' + key,
                    keyCode: key.charCodeAt(0),
                    which: key.charCodeAt(0),
                    bubbles: true,
                    cancelable: true
                });
                document.activeElement.dispatchEvent(event);
            } catch (e) {
                log('Error in last resort keypress method:', e);
            }
        }

        if (pressEnter) {
            setTimeout(function() {
                try {
                    const enterEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true,
                        cancelable: true
                    });

                    if (activeElement && activeElement.dispatchEvent) {
                        activeElement.dispatchEvent(enterEvent);
                    }
                } catch (e) {
                    log('Error in primary Enter keypress method:', e);
                }

                if (activeElement &&
                    (activeElement.isContentEditable ||
                        activeElement.tagName === 'INPUT' ||
                        activeElement.tagName === 'TEXTAREA')) {
                    try {
                        activeElement.focus();
                        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                    } catch (e) {
                        log('Error in fallback Enter keypress method:', e);
                    }
                }

                try {
                    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                } catch (e) {
                    log('Error in last resort Enter keypress method:', e);
                }
            }, 750);
        }
    }

    // Start capture process
    function startCapture(stealthMode = false, promptType = PROMPT_TYPES.ANSWER, skipMessage = false) {
        if (!apiKey) {
            showMessage('Error: API key is not set', true);
            return;
        }

        if (!skipMessage) {
            showMessage('Select an area to capture...');
        }

        const useStealthMode = stealthMode || !isPanelVisible;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: ${useStealthMode ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.3)'};
            z-index: 10000;
            cursor: ${useStealthMode ? 'default' : 'crosshair'};
        `;

        const instructions = document.createElement('div');
        instructions.textContent = 'Click and drag to select an area';
        instructions.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            z-index: 10001;
            display: ${useStealthMode ? 'none' : 'block'};
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(instructions);

        overlay.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            if (selectionBox) {
                selectionBox.remove();
            }

            selectionBox = document.createElement('div');
            selectionBox.style.cssText = `
                position: fixed;
                border: 2px dashed #2e7d32;
                background-color: rgba(46, 125, 50, 0.2);
                z-index: 10001;
                pointer-events: none;
                visibility: ${isPanelVisible ? 'visible' : 'hidden'};
            `;
            document.body.appendChild(selectionBox);
        });

        overlay.addEventListener('mousemove', (e) => {
            if (isDragging) {
                endX = e.clientX;
                endY = e.clientY;

                const left = Math.min(startX, endX);
                const top = Math.min(startY, endY);
                const width = Math.abs(endX - startX);
                const height = Math.abs(endY - startY);

                if (isPanelVisible) {
                    selectionBox.style.left = left + 'px';
                    selectionBox.style.top = top + 'px';
                    selectionBox.style.width = width + 'px';
                    selectionBox.style.height = height + 'px';
                }
            }
        });

        overlay.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                endX = e.clientX;
                endY = e.clientY;

                const left = Math.min(startX, endX);
                const top = Math.min(startY, endY);
                const width = Math.abs(endX - startX);
                const height = Math.abs(endY - startY);

                overlay.remove();
                instructions.remove();

                if (width > 5 && height > 5) {
                    const captureArea = { left, top, width, height };

                    lastCaptureArea = captureArea;
                    setValue(LAST_CAPTURE_AREA_STORAGE, lastCaptureArea);

                    showMessage('Capturing Image...');

                    captureScreenshot(captureArea, promptType);
                } else {
                    showMessage('Selection too small. Please try again.', true);
                    if (selectionBox) {
                        selectionBox.remove();
                    }
                }
            }
        });
    }

    // Handle invalid questions
    function handleInvalidQuestion() {
        invalidQuestionCount++;

        if (invalidQuestionCount >= MAX_INVALID_QUESTIONS) {
            log('Auto-Solve: Maximum invalid questions reached, disabling auto-solve');
            setTimeout(() => {
                showMessage('Too many invalid questions, disabling auto-solve.', true);
            }, 10);

            isAutoSolveMode = false;
            setValue(AUTO_SOLVE_MODE_STORAGE, false);

            const toggleInput = document.querySelector('.captureai-toggle-switch input');
            if (toggleInput) {
                toggleInput.checked = false;
                const toggleSlider = toggleInput.nextElementSibling;
                if (toggleSlider) {
                    toggleSlider.style.backgroundColor = '#e0e0e0';
                    const sliderButton = toggleSlider.firstElementChild;
                    if (sliderButton) sliderButton.style.left = '2px';
                }
            }

            invalidQuestionCount = 0;
            return;
        }

        setTimeout(() => {
            simulateKeypress('', true);
            setTimeout(() => {
                if (isAutoSolveMode) {
                    startAutoSolveLoop();
                }
            }, 2000);
        }, 500);
    }

    // Start auto-solve loop
    function startAutoSolveLoop() {
        if (!isOnVocabulary()) {
            showMessage('Auto-solve only works on vocabulary.com', true);
            return;
        }
        addEscapeKeyListener();
        if (!isAutoSolveMode || !lastCaptureArea) {
            if (!lastCaptureArea) {
                showMessage('No capture area defined. Please capture a question first.', true);
            }
            return;
        }

        captureScreenshot(lastCaptureArea, PROMPT_TYPES.AUTO_SOLVE);
    }

    // Add ESC key listener
    function addEscapeKeyListener() {
        if (!isAutoSolveMode) return;

        const escapeHandler = function(e) {
            if (e.key === ESC_KEY_CODE && isAutoSolveMode) {
                isAutoSolveMode = false;
                setValue(AUTO_SOLVE_MODE_STORAGE, false);

                const toggleInput = document.querySelector('.captureai-toggle-switch input');
                if (toggleInput) toggleInput.checked = false;
                const toggleSlider = toggleInput?.nextElementSibling;
                if (toggleSlider) toggleSlider.style.backgroundColor = '#e0e0e0';
                const sliderButton = toggleSlider?.firstElementChild;
                if (sliderButton) sliderButton.style.left = '2px';

                document.removeEventListener('keydown', escapeHandler);
            }
        };

        document.addEventListener('keydown', escapeHandler);
    }

    // Capture screenshot
    function captureScreenshot(area, promptType = PROMPT_TYPES.ANSWER, isQuickCapture = false) {
        const panel = document.getElementById(PANEL_ID);
        const stealthyResult = document.getElementById(STEALTHY_RESULT_ID);

        const panelRect = panel.getBoundingClientRect();
        const stealthyRect = stealthyResult.getBoundingClientRect();

        const panelOverlaps = !(
            area.left > panelRect.right ||
            area.left + area.width < panelRect.left ||
            area.top > panelRect.bottom ||
            area.top + area.height < panelRect.top
        );

        const stealthyOverlaps = !(
            area.left > stealthyRect.right ||
            area.left + area.width < stealthyRect.left ||
            area.top > stealthyRect.bottom ||
            area.top + area.height < stealthyRect.top
        );

        const originalPanelDisplay = panelOverlaps ? panel.style.display : null;
        const originalStealthyDisplay = stealthyOverlaps ? stealthyResult.style.display : null;

        if (panelOverlaps) {
            panel.style.display = 'none';
        }

        if (stealthyOverlaps) {
            stealthyResult.style.display = 'none';
        }

        if (selectionBox) {
            selectionBox.remove();
            selectionBox = null;
        }

        showMessage(isQuickCapture ? 'Quick capturing...' : 'Capturing image...');
        html2canvas(document.documentElement, {
            x: area.left,
            y: area.top,
            width: area.width,
            height: area.height,
            useCORS: true,
            allowTaint: true,
            logging: DEBUG,
            scale: 1.5
        }).then(canvas => {
            if (panelOverlaps) {
                panel.style.display = originalPanelDisplay;
            }

            if (stealthyOverlaps) {
                stealthyResult.style.display = originalStealthyDisplay;
            }

            try {
                const screenshotDataUrl = canvas.toDataURL('image/png');
                showMessage('Processing image...');
                sendToOpenAI(screenshotDataUrl, promptType);
            } catch (error) {
                log('Error converting canvas to data URL', error);
                showMessage('Error capturing screenshot. See console for details.', true);
            }
        }).catch(error => {
            if (panelOverlaps) {
                panel.style.display = originalPanelDisplay;
            }

            if (stealthyOverlaps) {stealthyResult.style.display = originalStealthyDisplay;
            }

            log('Error capturing with html2canvas', error);
            showMessage('Error capturing screenshot. See console for details.', true);
        });
    }

    // Send to OpenAI via background script
    function sendToOpenAI(imageDataUrl, promptType = PROMPT_TYPES.ANSWER) {
        if (isProcessing) {
            return;
        }

        isProcessing = true;

        if (isAutoSolveMode) {
            if (!isOnVocabulary()) {
                showMessage('Auto-solve only works on vocabulary.com', true);
                return;
            }
            promptType = PROMPT_TYPES.AUTO_SOLVE;
        }

        const messages = [
            {
                'role': 'user',
                'content': [
                    {
                        'type': 'text',
                        'text': promptType
                    },
                    {
                        'type': 'image_url',
                        'image_url': {
                            'url': imageDataUrl
                        }
                    }
                ]
            }
        ];

        // Send to background script
        chrome.runtime.sendMessage({
            action: 'sendToOpenAI',
            data: {
                messages: messages,
                apiKey: apiKey
            }
        }, (response) => {
            try {
                if (response.success) {
                    const answer = response.data.choices[0].message.content.trim();

                    if (isAutoSolveMode) {
                        if (answer === "Invalid Question") {
                            handleInvalidQuestion();
                            showMessage('Invalid Question', false);
                            return;
                        } else if (/^[1-4]$/i.test(answer)) {
                            if (isPanelVisible) {
                                showMessage('Answering Question...');
                            }
                            simulateKeypress(answer, true);

                            invalidQuestionCount = 0;
                            addEscapeKeyListener();

                            setTimeout(() => {
                                if (isAutoSolveMode) {
                                    startAutoSolveLoop();
                                }
                            }, AUTO_SOLVE_DELAY);

                            return;
                        }
                    }

                    if (isAutoSolveMode && promptType !== PROMPT_TYPES.HINT) {
                        setTimeout(() => startAutoSolveLoop(), AUTO_SOLVE_DELAY);
                    }
                    isShowingAnswer = true;
                    showMessage(answer);
                    isShowingAnswer = false;
                } else {
                    showMessage(`Error: ${response.error || 'Unknown error'}`, true);
                }
            } catch (error) {
                log('Error processing API response', error);
                showMessage('Error processing API response. See console for details.', true);
            } finally {
                setTimeout(() => {
                    isProcessing = false;
                }, AUTO_SOLVE_COOLDOWN);
            }
        });
    }

    // Show message
    function showMessage(message, isError = false, autoHideDelay = 0) {
        if (!isPanelVisible && !isShowingAnswer) {
            return;
        }

        const resultElement = document.getElementById(RESULT_ID);
        const stealthyResult = document.getElementById(STEALTHY_RESULT_ID);

        if (resultElement) {
            resultElement.textContent = message;
            resultElement.style.color = isError ? '#ff0000 !important' : '#333333 !important';
        }

        if (autoHideDelay > 0 && resultElement) {
            setTimeout(() => {
                resultElement.textContent = '';
            }, autoHideDelay);
        }

        if (stealthyResult) {
            if (answerFadeoutTimer) {
                clearTimeout(answerFadeoutTimer);
            }

            stealthyResult.textContent = message;
            stealthyResult.style.color = isError ? 'rgba(255, 100, 100, 0.4) !important' : 'rgba(150, 150, 150, 0.4) !important';

            if (!isPanelVisible) {
                stealthyResult.style.display = 'block';
                stealthyResult.style.opacity = '1';

                answerFadeoutTimer = setTimeout(function() {
                    stealthyResult.style.opacity = '0';

                    setTimeout(() => {
                        stealthyResult.style.display = 'none';
                    }, 500);
                }, ANSWER_FADEOUT_TIME);
            }
        }
    }

    // Toggle panel visibility
    function togglePanelVisibility() {
        const panel = uiElements.panel || document.getElementById(PANEL_ID);
        const stealthyResult = uiElements.stealthyResult || document.getElementById(STEALTHY_RESULT_ID);

        isPanelVisible = !isPanelVisible;

        if (isPanelVisible) {
            panel.style.display = 'block';
            stealthyResult.style.display = 'none';

            if (answerFadeoutTimer) {
                clearTimeout(answerFadeoutTimer);
                answerFadeoutTimer = null;
            }
        } else {
            panel.style.display = 'none';

            const resultElement = document.getElementById(RESULT_ID);
            if (resultElement && resultElement.textContent.trim()) {
                stealthyResult.textContent = resultElement.textContent;
                stealthyResult.style.display = 'block';
                stealthyResult.style.opacity = '1';

                answerFadeoutTimer = setTimeout(function() {
                    stealthyResult.style.opacity = '0';

                    setTimeout(() => {
                        stealthyResult.style.display = 'none';
                    }, 500);
                }, ANSWER_FADEOUT_TIME);
            }
        }
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'ping') {
            sendResponse({ success: true });
            return;
        }
        if (request.action === 'togglePanel') {
            togglePanelVisibility();
            sendResponse({ success: true });
        } else if (request.action === 'startCapture') {
            startCapture(false, PROMPT_TYPES.ANSWER);
            sendResponse({ success: true });
        } else if (request.action === 'quickCapture') {
            if (lastCaptureArea) {
                showMessage('Capturing Image...');
                captureScreenshot(lastCaptureArea, PROMPT_TYPES.ANSWER, true);
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'No previous capture area found' });
            }
        } else if (request.action === 'toggleAutoSolve') {
            if (isOnVocabulary()) {
                isAutoSolveMode = !isAutoSolveMode;
                setValue(AUTO_SOLVE_MODE_STORAGE, isAutoSolveMode);
                
                const toggleInput = document.querySelector('.captureai-toggle-switch input');
                if (toggleInput) {
                    toggleInput.checked = isAutoSolveMode;
                    const toggleSlider = toggleInput.nextElementSibling;
                    if (toggleSlider) {
                        toggleSlider.style.backgroundColor = isAutoSolveMode ? '#4caf65' : '#e0e0e0';
                        const sliderButton = toggleSlider.firstElementChild;
                        if (sliderButton) sliderButton.style.left = isAutoSolveMode ? '12px' : '2px';
                    }
                }
                sendResponse({ success: true, autoSolveMode: isAutoSolveMode });
            } else {
                sendResponse({ success: false, error: 'Auto-solve only works on vocabulary.com' });
            }
        } else if (request.action === 'getState') {
            sendResponse({
                success: true,
                state: {
                    isPanelVisible,
                    isAutoSolveMode,
                    hasLastCaptureArea: !!lastCaptureArea,
                    isOnVocabulary: isOnVocabulary(),
                    apiKey: !!apiKey
                }
            });
        }
    });

    // Initialize
    async function initialize() {
        // Load stored values
        apiKey = await getValue(API_KEY_STORAGE, '');
        isAutoSolveMode = await getValue(AUTO_SOLVE_MODE_STORAGE, false);
        lastCaptureArea = await getValue(LAST_CAPTURE_AREA_STORAGE, null);

        const ui = createUI();
        uiElements = {
            panel: ui.panel,
            stealthyResult: ui.stealthyResult
        };

        // Keyboard shortcuts (removed CTRL+SHIFT+L)
        const handleKeydown = debounce((e) => {
            // CTRL+SHIFT+X for "Capture A Question"
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'x') {
                e.preventDefault();
                startCapture(false, PROMPT_TYPES.ANSWER);
            }

            // CTRL+SHIFT+F for Quick Capture
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                if (lastCaptureArea) {
                    showMessage('Capturing Image...');
                    captureScreenshot(lastCaptureArea, PROMPT_TYPES.ANSWER);
                } else {
                    showMessage('No previous capture area found. Please select an area first.', true);
                }
            }

            // CTRL+SHIFT+E to toggle UI visibility
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                togglePanelVisibility();
            }
        }, 300);

        document.addEventListener('keydown', handleKeydown);

        log('CaptureAI content script initialized successfully');
    }

    // Run after delay
    setTimeout(initialize, 1000);
})();
