/**
 * UI Buttons module - Action buttons for the floating panel
 * Creates capture button, quick capture button, and auto-solve toggle
 */

export const UIButtons = {
    buttonsContainer: null,

    /**
     * Attach buttons to panel
     * @param {HTMLElement} panel - Panel element
     */
    attachTo(panel) {
        this.create();
        window.CaptureAI.UIPanelCore.attachComponent(this.buttonsContainer, 'after-response');
    },

    /**
     * Create all buttons and container
     */
    create() {
        const theme = window.CaptureAI.UITheme.getCurrentTheme();

        this.buttonsContainer = document.createElement('div');
        this.buttonsContainer.style.cssText = `
            padding: 15px;
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
            display: flex;
            background-color: ${theme.primaryBg} !important;
            flex-direction: column;
            gap: 10px;
            box-sizing: border-box !important;
        `;

        // Create buttons
        const captureButton = this.createCaptureButton(theme);
        const quickCaptureButton = this.createQuickCaptureButton(theme);

        this.buttonsContainer.appendChild(captureButton);
        this.buttonsContainer.appendChild(quickCaptureButton);

        // Add auto-solve toggle for supported sites
        if (window.CaptureAI.DomainUtils?.isOnSupportedSite()) {
            const autoSolveContainer = this.createAutoSolveToggle(theme);
            this.buttonsContainer.appendChild(autoSolveContainer);
        }
    },

    /**
     * Create main capture button
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Capture button element
     */
    createCaptureButton(theme) {
        const captureButton = document.createElement('div');
        captureButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            width: 100% !important;
            background-color: ${theme.buttonPrimary} !important;
            border-radius: 8px;
            cursor: pointer;
            margin: 0 auto;
            box-shadow: ${window.CaptureAI.UITheme.getButtonShadow()};
            box-sizing: border-box !important;
        `;

        // Icon
        const captureIcon = document.createElement('img');
        captureIcon.src = window.CaptureAI.ICONS.CAMERA;
        captureIcon.style.cssText = `
            width: 20px;
            height: 20px;
            margin-right: 10px;
            color: #ffffff !important;
        `;

        // Text
        const captureText = document.createElement('span');
        captureText.textContent = 'Capture a Question';
        captureText.style.cssText = `
            font-weight: bold;
            color: white !important;
            font-size: 14px;
        `;

        captureButton.appendChild(captureIcon);
        captureButton.appendChild(captureText);

        // Event listener
        captureButton.addEventListener('click', () => {
            if (window.CaptureAI.CaptureSystem?.startCapture) {
                window.CaptureAI.CaptureSystem.startCapture();
            }
        });

        return captureButton;
    },

    /**
     * Create quick capture button
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Quick capture button element
     */
    createQuickCaptureButton(theme) {
        const quickCaptureButton = document.createElement('div');
        quickCaptureButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            width: 100% !important;
            background-color: ${theme.toggleInactiveBg} !important;
            border-radius: 8px;
            cursor: pointer;
            margin: 0 auto;
            box-shadow: ${window.CaptureAI.UITheme.getButtonShadow()};
            border: 1px solid ${theme.buttonBorder};
            box-sizing: border-box !important;
        `;

        const quickCaptureText = document.createElement('span');
        quickCaptureText.textContent = 'Quick Capture';
        quickCaptureText.style.cssText = `
            font-weight: bold;
            color: ${theme.primaryText} !important;
            font-size: 14px;
        `;

        quickCaptureButton.appendChild(quickCaptureText);

        // Event listener
        quickCaptureButton.addEventListener('click', () => {
            if (window.CaptureAI.CaptureSystem?.quickCapture) {
                window.CaptureAI.CaptureSystem.quickCapture();
            } else {
                window.CaptureAI.UIMessaging.showMessage('No previous capture area found.', true);
            }
        });

        return quickCaptureButton;
    },

    /**
     * Create auto-solve toggle for supported sites
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Auto-solve toggle container
     */
    createAutoSolveToggle(theme) {
        const { STATE } = window.CaptureAI;

        const autoSolveContainer = document.createElement('div');
        autoSolveContainer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 5px 0px 5px;
            width: 100% !important;
            box-sizing: border-box !important;
        `;

        // Label
        const toggleLabel = document.createElement('span');
        toggleLabel.textContent = 'Auto-solve:';
        toggleLabel.style.cssText = `
            font-size: 14px;
            color: ${theme.secondaryText} !important;
            font-weight: 500;
            text-align: left;
        `;

        // Toggle switch
        const toggleSwitch = this.createToggleSwitch(theme);

        autoSolveContainer.appendChild(toggleLabel);
        autoSolveContainer.appendChild(toggleSwitch);

        return autoSolveContainer;
    },

    /**
     * Create toggle switch for auto-solve
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Toggle switch element
     */
    createToggleSwitch(theme) {
        const { STATE } = window.CaptureAI;

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
            background-color: ${STATE.isAutoSolveMode ? theme.buttonPrimary : theme.autoSolveInactiveBg};
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

        // Add tooltip
        toggleSwitch.title = 'Toggle auto-solve mode';

        // Event listener
        toggleInput.addEventListener('change', async () => {
            if (window.CaptureAI.AutoSolve?.toggleAutoSolveMode) {
                try {
                    await window.CaptureAI.AutoSolve.toggleAutoSolveMode();
                    // Update toggle appearance
                    this.updateAutoSolveToggleAppearance(toggleSlider, toggleSliderButton, theme);
                } catch (error) {
                    // Handle error silently
                }
            }
        });

        return toggleSwitch;
    },

    /**
     * Update auto-solve toggle appearance
     * @param {HTMLElement} toggleSlider - Toggle slider element
     * @param {HTMLElement} toggleSliderButton - Toggle slider button element
     * @param {Object} theme - Theme colors
     */
    updateAutoSolveToggleAppearance(toggleSlider, toggleSliderButton, theme) {
        const { STATE } = window.CaptureAI;

        toggleSlider.style.backgroundColor = STATE.isAutoSolveMode ? theme.buttonPrimary : theme.autoSolveInactiveBg;
        toggleSliderButton.style.left = STATE.isAutoSolveMode ? '12px' : '2px';
    },

    /**
     * Get buttons container element
     * @returns {HTMLElement|null} Buttons container
     */
    getContainer() {
        return this.buttonsContainer;
    },

    /**
     * Update auto-solve toggle visibility based on supported site
     */
    updateAutoSolveVisibility() {
        if (!this.buttonsContainer) return;

        const autoSolveContainer = this.buttonsContainer.querySelector('.captureai-toggle-switch')?.closest('div');
        
        if (window.CaptureAI.DomainUtils?.isOnSupportedSite()) {
            if (autoSolveContainer) {
                autoSolveContainer.style.display = 'flex';
            } else {
                // Create and add auto-solve toggle if it doesn't exist
                const theme = window.CaptureAI.UITheme.getCurrentTheme();
                const newAutoSolveContainer = this.createAutoSolveToggle(theme);
                this.buttonsContainer.appendChild(newAutoSolveContainer);
            }
        } else {
            if (autoSolveContainer) {
                autoSolveContainer.style.display = 'none';
            }
        }
    }
};