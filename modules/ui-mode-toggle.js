/**
 * Mode toggle component (Capture/Ask mode switching)
 * Handles the toggle switch in the header and mode transitions
 */

export const UIModeToggle = {
    toggleContainer: null,
    toggleInput: null,
    toggleSlider: null,
    captureLabel: null,
    askLabel: null,

    /**
     * Attach mode toggle to panel header
     * @param {HTMLElement} panel - Panel element
     */
    attachTo(panel) {
        const header = panel.querySelector('div[style*="cursor: move"]');
        if (!header) return;

        this.create();
        header.appendChild(this.toggleContainer);
        this.initializeState();
    },

    /**
     * Create mode toggle switch with labels
     */
    create() {
        const theme = window.CaptureAI.UITheme.getCurrentTheme();

        // Create toggle container
        this.toggleContainer = document.createElement('div');
        this.toggleContainer.style.cssText = `
            position: relative !important;
            display: inline-block !important;
            cursor: pointer !important;
            vertical-align: middle !important;
            margin-top: 1px !important;
            box-sizing: border-box !important;
            float: none !important;
            clear: none !important;
            transform: none !important;
        `;

        // Hidden input
        this.toggleInput = document.createElement('input');
        this.toggleInput.type = 'checkbox';
        this.toggleInput.style.cssText = `
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            z-index: -1 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: none !important;
        `;

        // Toggle switch background
        const modeToggleSwitch = document.createElement('div');
        modeToggleSwitch.style.cssText = `
            position: relative !important;
            width: 90px !important;
            height: 24px !important;
            background-color: ${theme.toggleBg} !important;
            border-radius: 12px !important;
            border: 1px solid ${theme.border} !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            align-items: center !important;
            font-size: 11px !important;
            font-weight: 500 !important;
            font-family: 'Inter', sans-serif !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            float: none !important;
            clear: none !important;
            transform: none !important;
            overflow: hidden !important;
        `;

        // Sliding indicator
        this.toggleSlider = document.createElement('div');
        this.toggleSlider.style.cssText = `
            position: absolute !important;
            width: 54px !important;
            height: 22px !important;
            background-color: #4caf65 !important;
            border-radius: 11px !important;
            top: 0px !important;
            left: 0px !important;
            transition: all 0.3s ease !important;
            z-index: 1 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-sizing: border-box !important;
            transform: none !important;
        `;

        // Capture label
        this.captureLabel = document.createElement('span');
        this.captureLabel.textContent = 'Capture';
        this.captureLabel.style.cssText = `
            position: absolute !important;
            left: 8px !important;
            color: white !important;
            font-size: 10px !important;
            font-weight: 500 !important;
            z-index: 2 !important;
            transition: color 0.3s ease !important;
            font-family: 'Inter', sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: none !important;
            text-decoration: none !important;
            line-height: normal !important;
            white-space: nowrap !important;
        `;

        // Ask label
        this.askLabel = document.createElement('span');
        this.askLabel.textContent = 'Ask';
        this.askLabel.style.cssText = `
            position: absolute !important;
            right: 8px !important;
            color: ${theme.secondaryText} !important;
            font-size: 10px !important;
            font-weight: 500 !important;
            z-index: 2 !important;
            transition: color 0.3s ease !important;
            font-family: 'Inter', sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: none !important;
            text-decoration: none !important;
            line-height: normal !important;
            white-space: nowrap !important;
        `;

        // Assemble components
        modeToggleSwitch.appendChild(this.toggleSlider);
        modeToggleSwitch.appendChild(this.captureLabel);
        modeToggleSwitch.appendChild(this.askLabel);
        this.toggleContainer.appendChild(this.toggleInput);
        this.toggleContainer.appendChild(modeToggleSwitch);

        // Add event listeners
        this.toggleInput.addEventListener('change', () => this.handleToggle());
        modeToggleSwitch.addEventListener('click', () => {
            this.toggleInput.checked = !this.toggleInput.checked;
            this.handleToggle();
        });
    },

    /**
     * Handle mode toggle switch
     */
    handleToggle() {
        const { STATE, STORAGE_KEYS } = window.CaptureAI;
        const theme = window.CaptureAI.UITheme.getCurrentTheme();
        
        STATE.isAskMode = this.toggleInput.checked;
        
        // Update UI based on mode
        if (STATE.isAskMode) {
            // Ask mode: slider moves right, Ask text becomes white, Capture becomes gray
            this.toggleSlider.style.setProperty('left', '52px', 'important');
            this.toggleSlider.style.setProperty('width', '38px', 'important');
            this.captureLabel.style.setProperty('color', theme.secondaryText, 'important');
            this.askLabel.style.setProperty('color', 'white', 'important');
            this.switchToAskMode();
        } else {
            // Capture mode: slider moves left, Capture text becomes white, Ask becomes gray
            this.toggleSlider.style.setProperty('left', '0px', 'important');
            this.toggleSlider.style.setProperty('width', '54px', 'important');
            this.captureLabel.style.setProperty('color', 'white', 'important');
            this.askLabel.style.setProperty('color', theme.secondaryText, 'important');
            this.switchToCaptureMode();
        }

        // Save mode preference
        if (window.CaptureAI.StorageUtils && STORAGE_KEYS) {
            window.CaptureAI.StorageUtils.setValue(STORAGE_KEYS.ASK_MODE, STATE.isAskMode);
        }
    },

    /**
     * Switch to Ask mode UI
     */
    switchToAskMode() {
        const { CONFIG } = window.CaptureAI;
        const panel = document.getElementById(CONFIG.PANEL_ID);
        
        const buttonsContainer = panel?.querySelector('div[style*="padding: 15px"]');
        const askModeContainer = document.getElementById('ask-mode-container');

        if (buttonsContainer && askModeContainer) {
            // Add transition styles
            this.addTransitionStyles(buttonsContainer);
            this.addTransitionStyles(askModeContainer);
            
            // Fade out buttons container
            buttonsContainer.style.opacity = '0';
            buttonsContainer.style.transform = 'translateY(0px)';
            
            setTimeout(() => {
                buttonsContainer.style.display = 'none';
                askModeContainer.style.display = 'flex';
                
                // Fade in ask mode container
                setTimeout(() => {
                    askModeContainer.style.opacity = '1';
                    askModeContainer.style.transform = 'translateY(0)';
                }, 10);
            }, 150);
        }
    },

    /**
     * Switch to Capture mode UI
     */
    switchToCaptureMode() {
        const { CONFIG } = window.CaptureAI;
        const panel = document.getElementById(CONFIG.PANEL_ID);
        
        const buttonsContainer = panel?.querySelector('div[style*="padding: 15px"]');
        const askModeContainer = document.getElementById('ask-mode-container');

        if (buttonsContainer && askModeContainer) {
            // Add transition styles
            this.addTransitionStyles(buttonsContainer);
            this.addTransitionStyles(askModeContainer);
            
            // Fade out ask mode container
            askModeContainer.style.opacity = '0';
            askModeContainer.style.transform = 'translateY(0px)';
            
            setTimeout(() => {
                askModeContainer.style.display = 'none';
                buttonsContainer.style.display = 'flex';
                
                // Fade in buttons container
                setTimeout(() => {
                    buttonsContainer.style.opacity = '1';
                    buttonsContainer.style.transform = 'translateY(0)';
                }, 10);
            }, 150);
        }
    },

    /**
     * Add transition styles to element
     * @param {HTMLElement} element - Element to add transitions to
     */
    addTransitionStyles(element) {
        if (!element) return;
        
        element.style.transition = 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out';
        
        // Initialize transform and opacity if not set
        if (!element.style.opacity) {
            element.style.opacity = '1';
        }
        if (!element.style.transform) {
            element.style.transform = 'translateY(0)';
        }
    },

    /**
     * Initialize toggle state from stored preferences
     */
    async initializeState() {
        const { STATE, STORAGE_KEYS } = window.CaptureAI;
        const theme = window.CaptureAI.UITheme.getCurrentTheme();

        // Load saved Ask mode state
        if (window.CaptureAI.StorageUtils && STORAGE_KEYS) {
            try {
                const savedAskMode = await window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.ASK_MODE, false);
                STATE.isAskMode = savedAskMode;
                this.toggleInput.checked = savedAskMode;

                // Update UI to match saved state
                if (STATE.isAskMode) {
                    this.toggleSlider.style.setProperty('left', '52px', 'important');
                    this.toggleSlider.style.setProperty('width', '38px', 'important');
                    this.captureLabel.style.setProperty('color', theme.secondaryText, 'important');
                    this.askLabel.style.setProperty('color', 'white', 'important');
                    this.switchToAskMode();
                } else {
                    this.toggleSlider.style.setProperty('left', '0px', 'important');
                    this.toggleSlider.style.setProperty('width', '54px', 'important');
                    this.captureLabel.style.setProperty('color', 'white', 'important');
                    this.askLabel.style.setProperty('color', theme.secondaryText, 'important');
                    this.switchToCaptureMode();
                }
            } catch (error) {
                // Use default state if loading fails
                STATE.isAskMode = false;
            }
        }
    },

    /**
     * Get current mode
     * @returns {boolean} True if in Ask mode, false if in Capture mode
     */
    isAskMode() {
        return window.CaptureAI.STATE?.isAskMode || false;
    },

    /**
     * Programmatically switch to Ask mode
     */
    activateAskMode() {
        if (this.toggleInput && !this.toggleInput.checked) {
            this.toggleInput.checked = true;
            this.handleToggle();
        }
    },

    /**
     * Programmatically switch to Capture mode
     */
    activateCaptureMode() {
        if (this.toggleInput && this.toggleInput.checked) {
            this.toggleInput.checked = false;
            this.handleToggle();
        }
    }
};