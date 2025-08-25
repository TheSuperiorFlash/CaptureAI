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
            position: relative;
            display: inline-block;
            cursor: pointer;
            vertical-align: middle;
            margin-top: -17px;
        `;

        // Hidden input
        this.toggleInput = document.createElement('input');
        this.toggleInput.type = 'checkbox';
        this.toggleInput.style.cssText = `
            opacity: 0;
            width: 0;
            height: 0;
        `;

        // Toggle switch background
        const modeToggleSwitch = document.createElement('div');
        modeToggleSwitch.style.cssText = `
            position: relative;
            width: 90px;
            height: 24px;
            background-color: ${theme.toggleBg};
            border-radius: 12px;
            border: 1px solid ${theme.border};
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            font-size: 11px;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
        `;

        // Sliding indicator
        this.toggleSlider = document.createElement('div');
        this.toggleSlider.style.cssText = `
            position: absolute;
            width: 54px;
            height: 22px;
            background-color: #4caf65;
            border-radius: 11px;
            top: 0px;
            left: 0px;
            transition: all 0.3s ease;
            z-index: 1;
        `;

        // Capture label
        this.captureLabel = document.createElement('span');
        this.captureLabel.textContent = 'Capture';
        this.captureLabel.style.cssText = `
            position: absolute;
            left: 8px;
            color: white;
            font-size: 10px;
            font-weight: 500;
            z-index: 2;
            transition: color 0.3s ease;
        `;

        // Ask label
        this.askLabel = document.createElement('span');
        this.askLabel.textContent = 'Ask';
        this.askLabel.style.cssText = `
            position: absolute;
            right: 8px;
            color: ${theme.secondaryText};
            font-size: 10px;
            font-weight: 500;
            z-index: 2;
            transition: color 0.3s ease;
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
            this.toggleSlider.style.left = '52px';
            this.toggleSlider.style.width = '38px';
            this.captureLabel.style.color = theme.secondaryText;
            this.askLabel.style.color = 'white';
            this.switchToAskMode();
        } else {
            // Capture mode: slider moves left, Capture text becomes white, Ask becomes gray
            this.toggleSlider.style.left = '0px';
            this.toggleSlider.style.width = '54px';
            this.captureLabel.style.color = 'white';
            this.askLabel.style.color = theme.secondaryText;
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
            buttonsContainer.style.display = 'none';
            askModeContainer.style.display = 'flex';
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
            buttonsContainer.style.display = 'flex';
            askModeContainer.style.display = 'none';
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
                    this.toggleSlider.style.left = '52px';
                    this.toggleSlider.style.width = '38px';
                    this.captureLabel.style.color = theme.secondaryText;
                    this.askLabel.style.color = 'white';
                    this.switchToAskMode();
                } else {
                    this.toggleSlider.style.left = '0px';
                    this.toggleSlider.style.width = '54px';
                    this.captureLabel.style.color = 'white';
                    this.askLabel.style.color = theme.secondaryText;
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