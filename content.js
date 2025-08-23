(function() {
    'use strict';

    // Configuration Constants
    const DEBUG = true;
    const PANEL_ID = 'captureai-panel';
    const RESULT_ID = 'captureai-result';
    const API_KEY_STORAGE_KEY = 'captureai-api-key';
    const STEALTHY_RESULT_ID = 'captureai-stealthy-result';
    const LAST_CAPTURE_AREA_STORAGE = 'captureai-last-capture-area';
    const AUTO_SOLVE_MODE_STORAGE = 'captureai-auto-solve-mode';
    const ANSWER_FADEOUT_TIME = 2000;
    const ESC_KEY_CODE = 'Escape';
    const MAX_INVALID_QUESTIONS = 2;
    const AUTO_SOLVE_ANSWER_DELAY = 500;  // Delay before simulating keypress for answer
    const AUTO_SOLVE_CYCLE_DELAY = 2000;  // Delay between auto-solve cycles

    // Prompt types
    const PROMPT_TYPES = {
        ANSWER: 'answer',
        AUTO_SOLVE: 'auto_solve'
    };

    // Default icons
    const CHECKMARK_ICON = chrome.runtime.getURL('icons/icon128.png');
    const CAMERA_ICON = chrome.runtime.getURL('icons/camera.png');

    // State variables
    let tesseractWorker = null;
    let tesseractInitialized = false;
    let isDragging = false;
    let startX, startY, endX, endY;
    let selectionBox = null;
    let lastCaptureArea = null;
    let apiKey = '';
    let isPanelVisible = false;
    let isProcessing = false;
    let answerFadeoutTimer = null;
    let uiElements = {};
    let isShowingAnswer = false;
    let currentPromptType = null;
    let eventListeners = [];

    // Auto-solve variables
    let isAutoSolveMode = false;
    let autoSolveTimer = null;
    let invalidQuestionCount = 0;
    let autoSolveToggle = null;

    // Pro Mode variables
    let isProMode = false;
    const PRO_MODE_STORAGE = 'captureai-pro-mode';

    // Mode variables
    let isAskMode = false;
    const ASK_MODE_STORAGE = 'captureai-ask-mode';

    // Cached DOM elements
    const domCache = {
        panel: null,
        stealthyResult: null,
        resultElement: null
    };

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

    // Domain detection functions
    function isOnSupportedSite() {
        return isOnVocabulary() || isOnQuizlet();
    }

    function isOnQuizlet() {
        return window.location.hostname.includes('quizlet.com');
    }

    function isOnVocabulary() {
        return window.location.hostname.includes('vocabulary.com');
    }

    // Check if current site has strict CSP that blocks web workers
    function isOnStrictCSPSite() {
        const strictCSPDomains = [
            // Google services
            'accounts.google.com',
            'docs.google.com',
            'drive.google.com',
            'mail.google.com',
            'classroom.google.com',
            'meet.google.com',
            'calendar.google.com',
            'cloud.google.com',

            // Microsoft services
            'outlook.com',
            'office.com',
            'microsoft.com',
            'sharepoint.com',
            'teams.microsoft.com',

            // Social media and major platforms
            'github.com',
            'gist.github.com',
            'facebook.com',
            'instagram.com',
            'twitter.com',
            'x.com',
            'linkedin.com',

            // Banking and financial
            'chase.com',
            'bankofamerica.com',
            'wellsfargo.com',
            'paypal.com',

            // Other major sites
            'aws.amazon.com',
            'dropbox.com',
            'slack.com',
            'zoom.us',
            'atlassian.com',
            'jira.com',
            'confluence.com'
        ];

        const hostname = window.location.hostname;
        return strictCSPDomains.some(domain => hostname.includes(domain));
    }

    // Debug logger (disabled)
    const log = () => {};

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

    // Initialize Tesseract (optimized to prevent redundant initialization)
    async function initializeTesseract() {
        if (tesseractInitialized || tesseractWorker) {
            return tesseractWorker;
        }

        try {
            // Check if Tesseract is already loaded globally
            if (typeof Tesseract === 'undefined') {
                await loadTesseractScript();
            }

            try {
                tesseractWorker = await Tesseract.createWorker();
                await tesseractWorker.load();
                await tesseractWorker.loadLanguage('eng');
                await tesseractWorker.initialize('eng');

                tesseractInitialized = true;
                return tesseractWorker;
            } catch (error) {
                // Silently handle worker creation and initialization errors
                tesseractInitialized = false;
                tesseractWorker = null;
                return null;
            }
        } catch (error) {
            // Silently handle script loading errors
            tesseractInitialized = false;
            tesseractWorker = null;
            return null;
        }
    }

    function loadTesseractScript() {
        return new Promise((resolve, reject) => {
            // Suppress CSP errors by catching them before they reach the console
            const originalConsoleError = console.error;
            console.error = function(...args) {
                // Filter out CSP errors related to Tesseract worker creation
                if (args.length > 0 && typeof args[0] === 'string' &&
                    (args[0].includes('Refused to create a worker from') ||
                     args[0].includes('Content Security Policy'))) {
                    // Silently ignore CSP errors
                    return;
                }
                // Pass through all other errors
                return originalConsoleError.apply(console, args);
            };

            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('libs/tesseract.min.js');
            script.onload = () => {
                // Restore original console.error after script loads
                setTimeout(() => { console.error = originalConsoleError; }, 1000);

                if (typeof Tesseract !== 'undefined') {
                    resolve();
                } else {
                    reject(new Error('Tesseract is undefined after loading'));
                }
            };
            script.onerror = () => {
                // Restore original console.error on error
                console.error = originalConsoleError;
                reject(new Error('Failed to load Tesseract'));
            };
            document.head.appendChild(script);
        });
    }

    // Create UI elements
    function createUI() {
        // Add Roboto font
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        // ===== UI COLOR CONFIGURATION =====
        // Change isDarkMode to switch between themes
        const isDarkMode = false; // Set to false for light theme, true for dark theme
        
        // Theme colors - automatically selected based on isDarkMode
        const UI_COLORS = isDarkMode ? {
            // DARK THEME
            // Main panel backgrounds
            primaryBg: 'rgba(0, 0, 0, 0.3)',        // Main panel background
            headerBg: 'rgba(0, 0, 0, 0.4)',         // Header background (slightly darker)
            
            // UI element backgrounds
            toggleBg: 'rgba(40, 40, 40, 0.2)',      // Toggle switches and input fields
            toggleInactiveBg: 'rgba(60, 60, 60, 0.2)', // Inactive toggle states
            
            // Text colors
            primaryText: '#ffffff',                  // Main text color
            secondaryText: '#cccccc',               // Secondary/muted text
            
            // Borders and accents
            border: 'rgba(170,170,170,0.15)',       // General border color
            buttonBorder: 'rgba(102,102,102,0.2)',  // Button border color
            
            // Button colors
            buttonPrimary: '#4caf65',               // Primary action buttons
            errorText: '#ff6b6b'                    // Error text color
        } : {
            // LIGHT THEME
            // Main panel backgrounds
            primaryBg: 'white',                     // Main panel background
            headerBg: '#f5f5f5',                   // Header background (light gray)
            
            // UI element backgrounds
            toggleBg: '#f0f0f0',                   // Toggle switches and input fields
            toggleInactiveBg: '#f1f1f1',           // Inactive toggle states
            
            // Text colors
            primaryText: '#333333',                // Main text color (dark gray)
            secondaryText: '#666666',              // Secondary/muted text (medium gray)
            
            // Borders and accents
            border: '#e0e0e0',                     // General border color (light gray)
            buttonBorder: '#d1d1d1',               // Button border color (slightly darker gray)
            
            // Button colors
            buttonPrimary: '#4caf65',              // Primary action buttons
            errorText: '#ff6b6b'                   // Error text color
        };
        // ===== END COLOR CONFIGURATION =====

        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 250px !important;
            background-color: ${UI_COLORS.primaryBg} !important;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
            z-index: 9999;
            font-family: 'Roboto', sans-serif;
            color: ${UI_COLORS.primaryText} !important;
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
            background-color: ${UI_COLORS.headerBg} !important;
            border-bottom: 1px solid ${UI_COLORS.border} !important;
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
            background-color: transparent;
        `;

        const title = document.createElement('span');
        title.textContent = 'CaptureAI';
        title.style.cssText = `
            font-weight: bold;
            font-size: 16px;
            margin-right: 10px;
            color: ${UI_COLORS.primaryText} !important;
        `;

        titleContainer.appendChild(logo);
        titleContainer.appendChild(title);

        // Create mode toggle switch with labels inside
        const modeToggleContainer = document.createElement('div');
        modeToggleContainer.style.cssText = `
            position: relative;
            display: inline-block;
            cursor: pointer;
            vertical-align: middle;
            margin-top: -17px;
        `;

        const modeToggleInput = document.createElement('input');
        modeToggleInput.type = 'checkbox';
        modeToggleInput.style.cssText = `
            opacity: 0;
            width: 0;
            height: 0;
        `;

        const modeToggleSwitch = document.createElement('div');
        modeToggleSwitch.style.cssText = `
            position: relative;
            width: 100px;
            height: 24px;
            background-color: ${UI_COLORS.toggleBg};
            border-radius: 12px;
            border: 1px solid ${UI_COLORS.border};
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            font-size: 11px;
            font-weight: 500;
            font-family: 'Roboto', sans-serif;
        `;

        const modeToggleSlider = document.createElement('div');
        modeToggleSlider.style.cssText = `
            position: absolute;
            width: 50px;
            height: 22px;
            background-color: #4caf65;
            border-radius: 11px;
            top: 0px;
            left: 0px;
            transition: all 0.3s ease;
            z-index: 1;
        `;

        const captureLabel = document.createElement('span');
        captureLabel.textContent = 'Capture';
        captureLabel.style.cssText = `
            position: absolute;
            left: 8px;
            color: white;
            font-size: 10px;
            font-weight: 500;
            z-index: 2;
            transition: color 0.3s ease;
        `;

        const askLabel = document.createElement('span');
        askLabel.textContent = 'Ask';
        askLabel.style.cssText = `
            position: absolute;
            right: 15px;
            color: ${UI_COLORS.secondaryText};
            font-size: 10px;
            font-weight: 500;
            z-index: 2;
            transition: color 0.3s ease;
        `;

        modeToggleSwitch.appendChild(modeToggleSlider);
        modeToggleSwitch.appendChild(captureLabel);
        modeToggleSwitch.appendChild(askLabel);
        modeToggleContainer.appendChild(modeToggleInput);
        modeToggleContainer.appendChild(modeToggleSwitch);

        // Add toggle functionality
        const toggleMode = () => {
            isAskMode = modeToggleInput.checked;
            
            // Update UI based on mode
            if (isAskMode) {
                // Ask mode: slider moves right, Ask text becomes white, Capture becomes gray
                modeToggleSlider.style.left = '49px';
                captureLabel.style.color = '${UI_COLORS.secondaryText}';
                askLabel.style.color = 'white';
                switchToAskMode();
            } else {
                // Capture mode: slider moves left, Capture text becomes white, Ask becomes gray
                modeToggleSlider.style.left = '0px';
                captureLabel.style.color = 'white';
                askLabel.style.color = '${UI_COLORS.secondaryText}';
                switchToCaptureMode();
            }

            // Save mode preference
            setValue(ASK_MODE_STORAGE, isAskMode);
        };

        modeToggleInput.addEventListener('change', toggleMode);
        modeToggleSwitch.addEventListener('click', () => {
            modeToggleInput.checked = !modeToggleInput.checked;
            toggleMode();
        });

        header.appendChild(titleContainer);
        header.appendChild(modeToggleContainer);
        panel.appendChild(header);

        const responseContainer = document.createElement('div');
        responseContainer.style.cssText = `
            padding: 10px 15px;
            background-color: ${UI_COLORS.primaryBg} !important;
            border-bottom: 0px solid ${UI_COLORS.border};
            font-size: 14px;
            color: ${UI_COLORS.primaryText} !important;
            min-height: 20px;
        `;

        const responseTitle = document.createElement('div');
        responseTitle.textContent = 'Response:';
        responseTitle.style.cssText = `
            font-size: 12px;
            color: ${UI_COLORS.secondaryText} !important;
            margin-bottom: 5px;
        `;

        const responseContent = document.createElement('div');
        responseContent.id = RESULT_ID;
        responseContent.style.cssText = `
            font-size: 14px;
            color: ${UI_COLORS.primaryText} !important;
            word-break: break-word;
        `;

        updateUIWithApiKey();

        responseContainer.appendChild(responseTitle);
        responseContainer.appendChild(responseContent);
        panel.appendChild(responseContainer);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            padding: 15px;
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
            display: flex;
            background-color: ${UI_COLORS.primaryBg} !important;
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
            width: 100% !important;
            background-color: ${UI_COLORS.buttonPrimary} !important;
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
            color: #ffffff !important;
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
            startCapture(false);
        });

        buttonsContainer.appendChild(captureButton);

        const quickCaptureButton = document.createElement('div');
        quickCaptureButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            width: 100% !important;
            background-color: ${UI_COLORS.toggleInactiveBg} !important;
            border-radius: 8px;
            cursor: pointer;
            margin: 0 auto;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            border: 1px solid ${UI_COLORS.buttonBorder};
            box-sizing: border-box !important;
        `;

        const quickCaptureText = document.createElement('span');
        quickCaptureText.textContent = 'Quick Capture';
        quickCaptureText.style.cssText = `
            font-weight: bold;
            color: ${UI_COLORS.primaryText} !important;
            font-size: 14px;
        `;

        quickCaptureButton.appendChild(quickCaptureText);

        quickCaptureButton.addEventListener('click', () => {
            if (lastCaptureArea) {
                showMessage('Capturing Image...');

                // Set current prompt type based on auto-solve mode for floating UI quick capture
                currentPromptType = isAutoSolveMode ? PROMPT_TYPES.AUTO_SOLVE : PROMPT_TYPES.ANSWER;

                const coordinates = {
                    startX: lastCaptureArea.left,
                    startY: lastCaptureArea.top,
                    width: lastCaptureArea.width,
                    height: lastCaptureArea.height
                };
                chrome.runtime.sendMessage({
                    action: 'captureArea',
                    coordinates: coordinates,
                    promptType: currentPromptType
                });
            } else {
                showMessage('No previous capture area found.', true);
            }
        });

        buttonsContainer.appendChild(quickCaptureButton);

        // Add auto-solve toggle for supported sites
        if (isOnSupportedSite()) {
            const autoSolveContainer = document.createElement('div');
            autoSolveContainer.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 15px 8px 15px;
                width: 100% !important;
                box-sizing: border-box !important;
            `;

            const toggleLabel = document.createElement('span');
            toggleLabel.textContent = 'Auto-solve:';
            toggleLabel.style.cssText = `
                font-size: 14px;
                color: ${UI_COLORS.primaryText} !important;
                font-weight: 500;
                text-align: left;
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
            toggleInput.id = 'captureai-header-auto-solve-toggle';
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
                background-color: ${isAutoSolveMode ? UI_COLORS.buttonPrimary : UI_COLORS.toggleInactiveBg};
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
                background-color: #ffffff !important;
                transition: .4s;
                border-radius: 34px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            `;

            toggleSlider.appendChild(toggleSliderButton);
            toggleSwitch.appendChild(toggleInput);
            toggleSwitch.appendChild(toggleSlider);

            // Add tooltip for auto-solve toggle
            toggleSwitch.title = 'Toggle auto-solve mode';

            toggleInput.addEventListener('change', () => {
                toggleAutoSolveMode();
            });

            autoSolveContainer.appendChild(toggleLabel);
            autoSolveContainer.appendChild(toggleSwitch);
            buttonsContainer.appendChild(autoSolveContainer);
        }

        // Create Ask mode UI components
        const askModeContainer = document.createElement('div');
        askModeContainer.id = 'ask-mode-container';
        askModeContainer.style.cssText = `
            padding: 15px;
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
            display: none;
            background-color: ${UI_COLORS.primaryBg} !important;
            flex-direction: column;
            gap: 10px;
            box-sizing: border-box !important;
        `;

        const askTextInput = document.createElement('textarea');
        askTextInput.placeholder = 'Ask anything...';
        askTextInput.style.cssText = `
            width: 100% !important;
            min-height: 60px;
            max-height: 150px;
            padding: 10px;
            border: 1px solid ${UI_COLORS.border};
            border-radius: 8px;
            font-family: 'Roboto', sans-serif;
            font-size: 14px;
            color: ${UI_COLORS.primaryText};
            background-color: ${UI_COLORS.toggleBg};
            resize: none;
            outline: none;
            box-sizing: border-box;
            overflow-y: hidden;
        `;


        const askButton = document.createElement('div');
        askButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            width: 100% !important;
            background-color: ${UI_COLORS.buttonPrimary} !important;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            box-sizing: border-box !important;
        `;

        const askButtonText = document.createElement('span');
        askButtonText.textContent = 'Ask Question';
        askButtonText.style.cssText = `
            font-weight: bold;
            color: white !important;
            font-size: 14px;
        `;

        askButton.appendChild(askButtonText);

        // Add auto-resize functionality
        askTextInput.addEventListener('input', () => {
            // Reset height to allow shrinking
            askTextInput.style.height = '60px';

            // Calculate the scroll height and set new height
            const scrollHeight = askTextInput.scrollHeight;
            const maxHeight = 150; // max-height from CSS
            const minHeight = 60; // min-height from CSS

            if (scrollHeight > minHeight) {
                askTextInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
            }

            // Show scrollbar if content exceeds max height
            if (scrollHeight > maxHeight) {
                askTextInput.style.overflowY = 'auto';
            } else {
                askTextInput.style.overflowY = 'hidden';
            }
        });

        // Add keyboard shortcuts: Enter to send, Shift+Enter for new line
        askTextInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default Enter behavior (new line)
                if (askTextInput.value.trim()) {
                    handleAskQuestion(askTextInput.value.trim());
                    askTextInput.value = ''; // Clear the text input
                    askTextInput.style.height = '60px'; // Reset height to minimum
                }
            }
            // Shift+Enter will use default behavior (new line)
        });

        // Add ask button functionality
        askButton.addEventListener('click', () => {
            if (askTextInput.value.trim()) {
                handleAskQuestion(askTextInput.value.trim());
                askTextInput.value = ''; // Clear the text input
                askTextInput.style.height = '60px'; // Reset height to minimum
            }
        });

        askModeContainer.appendChild(askTextInput);
        askModeContainer.appendChild(askButton);

        panel.appendChild(buttonsContainer);
        panel.appendChild(askModeContainer);

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
            font-family: 'Roboto', sans-serif;
        `;

        document.body.appendChild(panel);
        document.body.appendChild(stealthyResult);

        uiElements.panel = panel;
        uiElements.stealthyResult = stealthyResult;

        return { panel, stealthyResult };
    }

    // Mode switching functions
    function switchToAskMode() {
        const buttonsContainer = document.getElementById(PANEL_ID)?.querySelector('div[style*="padding: 15px"]');
        const askModeContainer = document.getElementById('ask-mode-container');

        if (buttonsContainer && askModeContainer) {
            buttonsContainer.style.display = 'none';
            askModeContainer.style.display = 'flex';
        }
    }

    function switchToCaptureMode() {
        const buttonsContainer = document.getElementById(PANEL_ID)?.querySelector('div[style*="padding: 15px"]');
        const askModeContainer = document.getElementById('ask-mode-container');

        if (buttonsContainer && askModeContainer) {
            buttonsContainer.style.display = 'flex';
            askModeContainer.style.display = 'none';
        }
    }

    // Handle Ask question
    function handleAskQuestion(question) {
        showMessage('Asking ChatGPT...');

        // Send question to background script for processing
        chrome.runtime.sendMessage({
            action: 'askQuestion',
            question: question
        });
    }

    // Initialize Ask mode UI state
    function initializeAskModeUI() {
        const modeToggleInput = document.querySelector('#captureai-panel input[type="checkbox"]');
        const modeToggleSlider = document.querySelector('#captureai-panel div[style*="background-color: #4caf65"]');
        const captureLabel = document.querySelector('#captureai-panel span[style*="left: 8px"]');
        const askLabel = document.querySelector('#captureai-panel span[style*="right: 15px"]');

        if (modeToggleInput && modeToggleSlider && captureLabel && askLabel) {
            modeToggleInput.checked = isAskMode;

            if (isAskMode) {
                // Ask mode: slider right, Ask text white, Capture gray
                modeToggleSlider.style.left = '49px';
                captureLabel.style.color = '${UI_COLORS.secondaryText}';
                askLabel.style.color = 'white';
                switchToAskMode();
            } else {
                // Capture mode: slider left, Capture text white, Ask gray
                modeToggleSlider.style.left = '0px';
                captureLabel.style.color = 'white';
                askLabel.style.color = '${UI_COLORS.secondaryText}';
                switchToCaptureMode();
            }
        }
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

                }

                if (activeElement &&
                    (activeElement.isContentEditable ||
                        activeElement.tagName === 'INPUT' ||
                        activeElement.tagName === 'TEXTAREA')) {
                    try {
                        activeElement.focus();
                        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                    } catch (e) {

                    }
                }

                try {
                    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                } catch (e) {

                }
            }, 750);
        }
    }

    // Start capture process (optimized)
    function startCapture(stealthMode = false, skipMessage = false) {
        if (!apiKey) {
            showMessage('Error: API key is not set', true);
            return;
        }

        if (isProcessing) {
            showMessage('Already processing a capture...', true);
            return;
        }

        // Set current prompt type based on auto-solve mode
        currentPromptType = isAutoSolveMode ? PROMPT_TYPES.AUTO_SOLVE : PROMPT_TYPES.ANSWER;

        if (!skipMessage) {
            showMessage('Select an area to capture...');
        }

        // Start the selection process
        startSelectionProcess(stealthMode);
    }

    // Start selection process
    function startSelectionProcess(stealthMode = false) {
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
            cursor: ${useStealthMode ? 'crosshair' : 'crosshair'};
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
            font-family: 'Roboto', sans-serif;
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
            // Always clean up overlay and instructions first
            overlay.remove();
            instructions.remove();

            if (isDragging) {
                isDragging = false;
                endX = e.clientX;
                endY = e.clientY;

                const left = Math.min(startX, endX);
                const top = Math.min(startY, endY);
                const width = Math.abs(endX - startX);
                const height = Math.abs(endY - startY);

                if (width > 5 && height > 5) {
                    const captureArea = { left, top, width, height };

                    // Convert to the format expected by background script
                    const coordinates = {
                        startX: left,
                        startY: top,
                        width: width,
                        height: height
                    };

                    lastCaptureArea = captureArea;
                    setValue(LAST_CAPTURE_AREA_STORAGE, lastCaptureArea);

                    showMessage('Capturing Image...');

                    // Use chrome.tabs.captureVisibleTab via background script
                    chrome.runtime.sendMessage({
                        action: 'captureArea',
                        coordinates: coordinates,
                        promptType: currentPromptType
                    });
                } else {
                    showMessage('Selection too small. Please try again.', true);
                }

                if (selectionBox) {
                    selectionBox.remove();
                }
            }
        });
    }

    // Compress image to reduce token usage while maintaining readability
    function compressImage(canvas) {
        const maxWidth = 400;
        const maxHeight = 300;
        const quality = isProMode ? 0.6 : 1;

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = canvas;

        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;

            if (width > height) {
                width = maxWidth;
                height = maxWidth / aspectRatio;
            } else {
                height = maxHeight;
                width = maxHeight * aspectRatio;
            }

            // Create new canvas with compressed dimensions
            const compressedCanvas = document.createElement('canvas');
            const compressedCtx = compressedCanvas.getContext('2d');

            compressedCanvas.width = Math.round(width);
            compressedCanvas.height = Math.round(height);

            // Draw resized image
            compressedCtx.drawImage(canvas, 0, 0, Math.round(width), Math.round(height));

            // Convert to WebP with compression for smaller file size
            return compressedCanvas.toDataURL('image/webp', quality);
        }

        // If image is already small enough, just compress quality
        return canvas.toDataURL('image/webp', quality);
    }

    // Process captured image with optional OCR (optimized for auto-solve)
    async function captureAndProcess(imageUri, startX, startY, width, height) {
        isProcessing = true;

        try {
            const pixelRatio = window.devicePixelRatio || 1;

            // Create and load image
            const img = new Image();
            img.crossOrigin = 'anonymous';

            const imageLoadPromise = new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = imageUri;
            });

            const loadedImg = await imageLoadPromise;

            // Create canvas for cropping
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Adjust coordinates and size by device pixel ratio
            const adjustedStartX = Math.round(startX * pixelRatio);
            const adjustedStartY = Math.round(startY * pixelRatio);
            const adjustedWidth = Math.round(width * pixelRatio);
            const adjustedHeight = Math.round(height * pixelRatio);

            canvas.width = adjustedWidth;
            canvas.height = adjustedHeight;

            // Draw the cropped portion
            ctx.drawImage(
                loadedImg,
                adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight,
                0, 0, adjustedWidth, adjustedHeight
            );

            // Compress image to reduce token usage while maintaining readability
            const compressedImageData = compressImage(canvas);

            // Skip OCR for all Pro Mode operations to save resources and improve speed
            if (isProMode) {
                return {
                    extractedText: '', // Not needed for Pro Mode (uses image directly)
                    compressedImageData: compressedImageData
                };
            }

            // Run OCR for Standard Mode auto-solve and manual capture
            // Ensure Tesseract is initialized
            if (!tesseractInitialized || !tesseractWorker) {
                const initResult = await initializeTesseract();
                if (!initResult) {
                    // Tesseract initialization failed, return error immediately
                    return {
                        extractedText: '',
                        error: 'This website is not supported with standard mode, try again in pro mode.',
                        hasError: true
                    };
                }
            }

            // Wrap Tesseract operations in additional error handling to prevent _malloc errors in Chrome console
            let cleanedText = '';
            try {
                if (tesseractWorker) {
                    const { data: { text } } = await tesseractWorker.recognize(compressedImageData);
                    cleanedText = text.trim();
                } else {
                    // Worker is null, return error
                    return {
                        extractedText: '',
                        error: 'This website is not supported with standard mode, try again in pro mode.',
                        hasError: true
                    };
                }
            } catch (tesseractError) {
                // Silently handle Tesseract-specific errors (like _malloc) without logging to console
                // This prevents errors from appearing in chrome://extensions error log
                return {
                    extractedText: '',
                    error: 'This website is not supported with standard mode, try again in pro mode.',
                    hasError: true
                };
            }

            return {
                extractedText: cleanedText,
                compressedImageData: compressedImageData
            };

        } catch (error) {
            // Silent error handling - don't log to console to avoid chrome://extensions errors
            return {
                extractedText: '',
                error: 'This website is not supported with standard mode, try again in pro mode.',
                hasError: true
            };
        } finally {
            isProcessing = false;
        }
    }





    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'processCapturedImage') {

            showMessage('Processing Image...');
            captureAndProcess(request.imageUri, request.startX, request.startY, request.width, request.height)
                .then(response => {
                    sendResponse(response);
                })
                .catch(error => {
                    // Silent error handling - don't log to console to avoid chrome://extensions errors
                    sendResponse({
                        extractedText: '',
                        error: 'This website is not supported with standard mode, try again in pro mode.',
                        hasError: true
                    });
                });
            return true; // Keep message channel open for async response
        }

        if (request.action === 'displayResponse') {
            // Display the response from background script
            isShowingAnswer = true;
            showMessage(request.response);
            isShowingAnswer = false;
            return;
        }

        if (request.action === 'ping') {
            sendResponse({ success: true });
            return;
        }
        if (request.action === 'togglePanel') {
            togglePanelVisibility();
            sendResponse({ success: true });
        } else if (request.action === 'startCapture') {
            startCapture(false);
            sendResponse({ success: true });
        } else if (request.action === 'quickCapture') {
            if (lastCaptureArea) {
                showMessage('Capturing Image...');

                // Set current prompt type based on auto-solve mode for quick capture
                currentPromptType = isAutoSolveMode ? PROMPT_TYPES.AUTO_SOLVE : PROMPT_TYPES.ANSWER;

                const coordinates = {
                    startX: lastCaptureArea.left,
                    startY: lastCaptureArea.top,
                    width: lastCaptureArea.width,
                    height: lastCaptureArea.height
                };
                chrome.runtime.sendMessage({
                    action: 'captureArea',
                    coordinates: coordinates,
                    promptType: currentPromptType
                });
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'No previous capture area found' });
            }
        } else if (request.action === 'toggleAutoSolve') {
            toggleAutoSolveMode();
            sendResponse({ success: true, isAutoSolveMode: isAutoSolveMode });
        } else if (request.action === 'getState') {
            sendResponse({
                success: true,
                state: {
                    isPanelVisible,
                    hasLastCaptureArea: !!lastCaptureArea,
                    isOnSupportedSite: isOnSupportedSite(),
                    apiKey: !!apiKey,
                    currentResponse: document.getElementById(RESULT_ID)?.textContent || '',
                    isAutoSolveMode: isAutoSolveMode
                }
            });
        }
    });

    // Update UI based on API key status
    function updateUIWithApiKey() {
        const resultElement = document.getElementById(RESULT_ID);
        if (resultElement) {
            if (!apiKey) {
                resultElement.textContent = 'Error: API key is not set';
                resultElement.style.color = '#ff0000 !important';
            } else {
                resultElement.textContent = '';
                resultElement.style.color = '${UI_COLORS.primaryText} !important';
            }
        }
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
            resultElement.style.color = isError ? '${UI_COLORS.errorText} !important' : '${UI_COLORS.primaryText} !important';
        }

        // Send message to popup
        try {
            chrome.runtime.sendMessage({
                action: 'updateResponse',
                message: message,
                isError: isError
            });
        } catch (error) {
            // Popup might not be open, ignore error
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

    // Add message listeners for Chrome API communication
    function addMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {


            switch (request.action) {
                case 'processCapturedImage':
                    handleProcessCapturedImage(request, sendResponse);
                    return true; // Keep message channel open

                case 'showProcessingMessage':
                    showMessage('Processing with AI...');
                    break;

                case 'displayResponse':
                    handleDisplayResponse(request.response, request.promptType);
                    break;

                case 'toggleAutoSolve':
                    toggleAutoSolveMode();
                    sendResponse({ success: true, isAutoSolveMode: isAutoSolveMode });
                    break;

                case 'setProMode':

                    isProMode = request.isProMode;
                    setValue(PRO_MODE_STORAGE, isProMode);

                    sendResponse({ success: true, isProMode: isProMode });
                    break;

                case 'getState':
                    sendResponse({
                        success: true,
                        state: {
                            isAutoSolveMode: isAutoSolveMode,
                            isProMode: isProMode,
                            isPanelVisible: isPanelVisible,
                            hasLastCaptureArea: !!lastCaptureArea,
                            isOnSupportedSite: isOnSupportedSite()
                        }
                    });
                    break;

                default:

            }
        });
    }

    // Handle captured image processing
    async function handleProcessCapturedImage(request, sendResponse) {
        try {
            const result = await captureAndProcess(
                request.imageUri,
                request.startX,
                request.startY,
                request.width,
                request.height
            );
            sendResponse(result);
        } catch (error) {

            sendResponse({
                extractedText: '',
                error: 'This website is not supported, try again in pro mode.',
                hasError: true
            });
        }
    }

    // Handle AI response display
    function handleDisplayResponse(response, promptType) {
        if (response) {
            const resultElement = domCache.resultElement || document.getElementById(RESULT_ID);
            if (resultElement) {
                resultElement.textContent = response;
                domCache.resultElement = resultElement;
            }

            // Handle auto-solve mode responses
            if (isAutoSolveMode && promptType === 'auto_solve') {
                handleAutoSolveResponse(response);
            }
        }
    }

    // Toggle auto-solve mode
    function toggleAutoSolveMode() {
        isAutoSolveMode = !isAutoSolveMode;

        // Save state immediately
        setValue(AUTO_SOLVE_MODE_STORAGE, isAutoSolveMode);

        // Update UI toggle appearance immediately
        updateAutoSolveToggleUI();

        if (isAutoSolveMode) {
            invalidQuestionCount = 0; // Reset counter when enabling
        } else {
            // Cancel any pending auto-solve timer immediately
            if (autoSolveTimer) {
                clearTimeout(autoSolveTimer);
                autoSolveTimer = null;
            }
        }
    }

    // Update auto-solve toggle UI appearance
    function updateAutoSolveToggleUI() {
        // Update header toggle (only toggle remaining)
        const headerToggle = document.getElementById('captureai-header-auto-solve-toggle');
        if (headerToggle) {
            headerToggle.checked = isAutoSolveMode;
            const toggleSlider = headerToggle.parentElement.querySelector('span');
            const toggleButton = toggleSlider?.querySelector('span');

            if (toggleSlider) {
                toggleSlider.style.backgroundColor = isAutoSolveMode ? '#4CAF50' : '#ccc';
            }
            if (toggleButton) {
                toggleButton.style.left = isAutoSolveMode ? '12px' : '2px';
            }
        }
    }



    // Handle auto-solve responses
    function handleAutoSolveResponse(response) {
        const cleanResponse = response.trim().toLowerCase();

        if (cleanResponse.includes('invalid question')) {
            invalidQuestionCount++;

            if (invalidQuestionCount >= MAX_INVALID_QUESTIONS) {
                showMessage('Too many invalid questions. Stopping auto-solve.', true);
                isAutoSolveMode = false;
                setValue(AUTO_SOLVE_MODE_STORAGE, false);
                updateAutoSolveToggleUI();
                return;
            }

            // Press Enter to advance to next question even for invalid questions
            setTimeout(() => {
                simulateKeypress('', true); // Empty key, just press Enter
            }, AUTO_SOLVE_ANSWER_DELAY);
        } else {
            // Valid response, reset counter
            invalidQuestionCount = 0;

            // Try to simulate keypress for the answer
            const answerMatch = cleanResponse.match(/[1-4]/);
            if (answerMatch) {
                const answerNumber = answerMatch[0];
                setTimeout(() => {
                    simulateKeypress(answerNumber, true);
                }, AUTO_SOLVE_ANSWER_DELAY);
            }
        }

        // Schedule next auto-solve cycle if still enabled
        if (isAutoSolveMode) {
            scheduleNextAutoSolve();
        }
    }

    // Schedule next auto-solve cycle
    function scheduleNextAutoSolve() {
        if (!isAutoSolveMode) return;

        autoSolveTimer = setTimeout(() => {
            if (isAutoSolveMode && lastCaptureArea) {
                // Use quick capture for auto-solve loop
                const coordinates = {
                    startX: lastCaptureArea.left,
                    startY: lastCaptureArea.top,
                    width: lastCaptureArea.width,
                    height: lastCaptureArea.height
                };

                // Capture image for auto-solve mode
                chrome.runtime.sendMessage({
                    action: 'captureArea',
                    coordinates: coordinates,
                    promptType: 'auto_solve',
                    imageData: null // Will be filled by background script
                });
            }
        }, AUTO_SOLVE_CYCLE_DELAY); // Delay between captures
    }

    // Clean up event listeners
    function cleanupEventListeners() {
        eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        eventListeners = [];

        if (autoSolveTimer) {
            clearTimeout(autoSolveTimer);
            autoSolveTimer = null;
        }

        if (answerFadeoutTimer) {
            clearTimeout(answerFadeoutTimer);
            answerFadeoutTimer = null;
        }
    }

    // Add event listener with cleanup tracking
    function addTrackedEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        eventListeners.push({ element, event, handler });
    }

    // Initialize (optimized)
    async function initialize() {
        try {
            // Add global error handler to suppress Tesseract _malloc errors from Web Workers
            window.addEventListener('error', (event) => {
                // Check if the error is from Tesseract and contains _malloc
                if (event.filename && event.filename.includes('tesseract') &&
                    event.message && event.message.includes('_malloc')) {
                    // Prevent the error from appearing in Chrome extensions console
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            });

            // Also handle unhandled promise rejections from Tesseract
            window.addEventListener('unhandledrejection', (event) => {
                if (event.reason && event.reason.message &&
                    event.reason.message.includes('_malloc')) {
                    // Prevent the error from appearing in Chrome extensions console
                    event.preventDefault();
                    return false;
                }
            });

            // Load stored values
            apiKey = await getValue(API_KEY_STORAGE_KEY, '');
            lastCaptureArea = await getValue(LAST_CAPTURE_AREA_STORAGE, null);
            isAutoSolveMode = await getValue(AUTO_SOLVE_MODE_STORAGE, false);
            isProMode = await getValue(PRO_MODE_STORAGE, false);
            isAskMode = await getValue(ASK_MODE_STORAGE, false);



            // Initialize Tesseract in background
            initializeTesseract().catch(error => {

            });

            // Create UI
            const ui = createUI();
            uiElements = {
                panel: ui.panel,
                stealthyResult: ui.stealthyResult
            };

            // Cache DOM elements
            domCache.panel = ui.panel;
            domCache.stealthyResult = ui.stealthyResult;
            domCache.resultElement = document.getElementById(RESULT_ID);

            // Update auto-solve toggle UI to match loaded state
            updateAutoSolveToggleUI();
            
            // Initialize Ask mode UI state
            initializeAskModeUI();

            // Add message listeners
            addMessageListeners();

            // Keyboard shortcuts
            const handleKeydown = debounce((e) => {
                // CTRL+SHIFT+X for "Capture A Question"
                if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'x') {
                    e.preventDefault();
                    startCapture(false);
                }

                // CTRL+SHIFT+F for Quick Capture
                if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
                    e.preventDefault();
                    if (lastCaptureArea) {
                        showMessage('Capturing Image...');

                        // Set current prompt type based on auto-solve mode for keyboard shortcut
                        currentPromptType = isAutoSolveMode ? PROMPT_TYPES.AUTO_SOLVE : PROMPT_TYPES.ANSWER;

                        const coordinates = {
                            startX: lastCaptureArea.left,
                            startY: lastCaptureArea.top,
                            width: lastCaptureArea.width,
                            height: lastCaptureArea.height
                        };
                        chrome.runtime.sendMessage({
                            action: 'captureArea',
                            coordinates: coordinates,
                            promptType: currentPromptType
                        });
                    } else {
                        showMessage('No previous capture area found.', true);
                    }
                }

                // CTRL+SHIFT+E to toggle UI visibility
                if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
                    e.preventDefault();
                    togglePanelVisibility();
                }

                // Escape key to cancel auto-solve mode immediately
                if (e.key === 'Escape' && isAutoSolveMode) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Immediately disable auto-solve mode
                    isAutoSolveMode = false;
                    setValue(AUTO_SOLVE_MODE_STORAGE, false);

                    // Clear any pending auto-solve timer immediately
                    if (autoSolveTimer) {
                        clearTimeout(autoSolveTimer);
                        autoSolveTimer = null;
                    }

                    // Update UI immediately
                    updateAutoSolveToggleUI();

                    // Show immediate feedback
                    showMessage('Auto-solve mode disabled.', true);
                }
            }, 300);

            addTrackedEventListener(document, 'keydown', handleKeydown);

            // Listen for storage changes
            const storageChangeHandler = (changes, namespace) => {
                if (namespace === 'local' && changes[API_KEY_STORAGE_KEY]) {
                    apiKey = changes[API_KEY_STORAGE_KEY].newValue;
                    updateUIWithApiKey();
                }
            };

            chrome.storage.onChanged.addListener(storageChangeHandler);

            // Cleanup on page unload
            addTrackedEventListener(window, 'beforeunload', cleanupEventListeners);


        } catch (error) {

        }
    }

    // Run after delay
    setTimeout(initialize, 1000);
})();
