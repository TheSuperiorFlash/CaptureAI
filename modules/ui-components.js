/**
 * UI Component creation and management - Original Design from Backup
 */

export const UIComponents = {
    /**
     * Create main UI elements with exact original styling
     */
    createUI() {
        const { STATE, CONFIG, DOM_CACHE } = window.CaptureAI;
        
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
        panel.id = CONFIG.PANEL_ID;
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
        logo.src = window.CaptureAI.ICONS.CHECKMARK;
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
            STATE.isAskMode = modeToggleInput.checked;
            
            // Update UI based on mode
            if (STATE.isAskMode) {
                // Ask mode: slider moves right, Ask text becomes white, Capture becomes gray
                modeToggleSlider.style.left = '49px';
                captureLabel.style.color = UI_COLORS.secondaryText;
                askLabel.style.color = 'white';
                this.switchToAskMode();
            } else {
                // Capture mode: slider moves left, Capture text becomes white, Ask becomes gray
                modeToggleSlider.style.left = '0px';
                captureLabel.style.color = 'white';
                askLabel.style.color = UI_COLORS.secondaryText;
                this.switchToCaptureMode();
            }

            // Save mode preference
            if (window.CaptureAI.StorageUtils && window.CaptureAI.STORAGE_KEYS) {
                window.CaptureAI.StorageUtils.setValue(window.CaptureAI.STORAGE_KEYS.ASK_MODE, STATE.isAskMode);
            }
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
            border-bottom: none;
            font-size: 14px;
            color: ${UI_COLORS.primaryText} !important;
            min-height: 52px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        `;

        const responseTitle = document.createElement('div');
        responseTitle.textContent = 'Response:';
        responseTitle.style.cssText = `
            font-size: 12px;
            color: ${UI_COLORS.secondaryText} !important;
            margin-bottom: 5px;
        `;

        const responseContent = document.createElement('div');
        responseContent.id = CONFIG.RESULT_ID;
        responseContent.style.cssText = `
            font-size: 14px;
            color: ${UI_COLORS.primaryText} !important;
            word-break: break-word;
            background-color: transparent !important;
            background: transparent !important;
            flex: 1;
            line-height: 1.3;
            min-height: 18px;
        `;

        // Update UI based on API key status
        if (!STATE.apiKey) {
            responseContent.textContent = 'Error: API key is not set';
            responseContent.style.color = `${UI_COLORS.errorText} !important`;
        }

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
        captureIcon.src = window.CaptureAI.ICONS.CAMERA;
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
            if (window.CaptureAI.CaptureSystem && window.CaptureAI.CaptureSystem.startCapture) {
                window.CaptureAI.CaptureSystem.startCapture();
            }
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
            if (window.CaptureAI.CaptureSystem && window.CaptureAI.CaptureSystem.quickCapture) {
                window.CaptureAI.CaptureSystem.quickCapture();
            } else {
                this.showMessage('No previous capture area found.', true);
            }
        });

        buttonsContainer.appendChild(quickCaptureButton);

        // Add auto-solve toggle for supported sites
        if (window.CaptureAI.DomainUtils && window.CaptureAI.DomainUtils.isOnSupportedSite()) {
            const autoSolveContainer = document.createElement('div');
            autoSolveContainer.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 4px 5px 0px 5px;
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
            toggleInput.checked = STATE.isAutoSolveMode;
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
                background-color: ${STATE.isAutoSolveMode ? UI_COLORS.buttonPrimary : UI_COLORS.toggleInactiveBg};
                transition: .3s;
                border-radius: 34px;
            `;

            const toggleSliderButton = document.createElement('span');
            toggleSliderButton.style.cssText = `
                position: absolute;
                height: 16px;
                width: 16px;
                left: ${STATE.isAutoSolveMode ? '12px' : '2px'};
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

            toggleInput.addEventListener('change', async () => {
                if (window.CaptureAI.AutoSolve && window.CaptureAI.AutoSolve.toggleAutoSolveMode) {
                    try {
                        await window.CaptureAI.AutoSolve.toggleAutoSolveMode();
                    } catch (error) {}
                }
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
                    this.handleAskQuestion(askTextInput.value.trim());
                    askTextInput.value = ''; // Clear the text input
                    askTextInput.style.height = '60px'; // Reset height to minimum
                }
            }
            // Shift+Enter will use default behavior (new line)
        });

        // Add ask button functionality
        askButton.addEventListener('click', () => {
            if (askTextInput.value.trim()) {
                this.handleAskQuestion(askTextInput.value.trim());
                askTextInput.value = ''; // Clear the text input
                askTextInput.style.height = '60px'; // Reset height to minimum
            }
        });

        askModeContainer.appendChild(askTextInput);
        askModeContainer.appendChild(askButton);

        panel.appendChild(buttonsContainer);
        panel.appendChild(askModeContainer);

        // Make draggable if handler available
        if (window.CaptureAI.UIHandlers && window.CaptureAI.UIHandlers.makeDraggable) {
            window.CaptureAI.UIHandlers.makeDraggable(panel, header);
        }

        const stealthyResult = document.createElement('div');
        stealthyResult.id = CONFIG.STEALTHY_RESULT_ID;
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

        STATE.uiElements.panel = panel;
        STATE.uiElements.stealthyResult = stealthyResult;
        DOM_CACHE.panel = panel;
        DOM_CACHE.stealthyResult = stealthyResult;
        DOM_CACHE.resultElement = responseContent;

        STATE.isPanelVisible = false;

        return panel;
    },

    // Mode switching functions
    switchToAskMode() {
        const buttonsContainer = document.getElementById(window.CaptureAI.CONFIG.PANEL_ID)?.querySelector('div[style*="padding: 15px"]');
        const askModeContainer = document.getElementById('ask-mode-container');

        if (buttonsContainer && askModeContainer) {
            buttonsContainer.style.display = 'none';
            askModeContainer.style.display = 'flex';
        }
    },

    switchToCaptureMode() {
        const buttonsContainer = document.getElementById(window.CaptureAI.CONFIG.PANEL_ID)?.querySelector('div[style*="padding: 15px"]');
        const askModeContainer = document.getElementById('ask-mode-container');

        if (buttonsContainer && askModeContainer) {
            buttonsContainer.style.display = 'flex';
            askModeContainer.style.display = 'none';
        }
    },

    // Handle Ask question
    handleAskQuestion(question) {
        this.showMessage('Asking GPT-5...');

        // Send question to background script for processing
        chrome.runtime.sendMessage({
            action: 'askQuestion',
            question: question
        });
    },

    // Show message in UI
    showMessage(message, isError = false, autoHideDelay = 0) {
        const { STATE, CONFIG } = window.CaptureAI;
        
        if (!STATE.isPanelVisible && !STATE.isShowingAnswer) {
            return;
        }

        // Define UI colors (same as in createUI)
        const isDarkMode = false; // Set to false for light theme, true for dark theme
        const UI_COLORS = isDarkMode ? {
            primaryText: '#ffffff',
            errorText: '#ff6b6b'
        } : {
            primaryText: '#333333',
            errorText: '#ff6b6b'
        };

        const resultElement = document.getElementById(CONFIG.RESULT_ID);
        const stealthyResult = document.getElementById(CONFIG.STEALTHY_RESULT_ID);

        if (resultElement) {
            resultElement.textContent = message;
            // Ensure no blue background and proper text color
            resultElement.style.backgroundColor = 'transparent';
            resultElement.style.background = 'transparent';
            if (isError) {
                resultElement.style.color = UI_COLORS.errorText;
            } else {
                resultElement.style.color = UI_COLORS.primaryText; // Use theme-appropriate text color
            }
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

        // Always handle stealthy result
        if (stealthyResult) {
            if (STATE.answerFadeoutTimer) {
                clearTimeout(STATE.answerFadeoutTimer);
            }

            stealthyResult.textContent = message;
            stealthyResult.style.color = isError ? 'rgba(255, 100, 100, 0.4) !important' : 'rgba(150, 150, 150, 0.4) !important';

            if (!STATE.isPanelVisible) {
                stealthyResult.style.display = 'block';
                stealthyResult.style.opacity = '1';

                STATE.answerFadeoutTimer = setTimeout(function() {
                    stealthyResult.style.opacity = '0';

                    setTimeout(() => {
                        stealthyResult.style.display = 'none';
                    }, 500);
                }, 2500); // ANSWER_FADEOUT_TIME
            }
        }
    }
};