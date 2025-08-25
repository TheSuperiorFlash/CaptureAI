/**
 * Ask Mode UI components
 * Creates textarea, ask button, and handles question input functionality
 */

export const UIAskMode = {
    askModeContainer: null,
    askTextInput: null,
    askButton: null,

    /**
     * Attach Ask mode UI to panel
     * @param {HTMLElement} panel - Panel element
     */
    attachTo(panel) {
        this.create();
        window.CaptureAI.UIPanelCore.attachComponent(this.askModeContainer, 'bottom');
    },

    /**
     * Create Ask mode container and components
     */
    create() {
        const theme = window.CaptureAI.UITheme.getCurrentTheme();

        this.askModeContainer = this.createContainer(theme);
        this.askTextInput = this.createTextInput(theme);
        this.askButton = this.createAskButton(theme);

        // Add components to container
        this.askModeContainer.appendChild(this.askTextInput);
        this.askModeContainer.appendChild(this.askButton);

        // Set up functionality
        this.setupAutoResize();
        this.setupKeyboardShortcuts();
        this.setupButtonHandler();
    },

    /**
     * Create Ask mode container
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Container element
     */
    createContainer(theme) {
        const askModeContainer = document.createElement('div');
        askModeContainer.id = 'ask-mode-container';
        askModeContainer.style.cssText = `
            padding: 15px;
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
            display: none;
            background-color: ${theme.primaryBg} !important;
            flex-direction: column;
            gap: 10px;
            box-sizing: border-box !important;
        `;

        return askModeContainer;
    },

    /**
     * Create text input textarea
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Textarea element
     */
    createTextInput(theme) {
        const askTextInput = document.createElement('textarea');
        askTextInput.placeholder = 'Ask anything...';
        askTextInput.style.cssText = `
            width: 100% !important;
            min-height: 60px;
            max-height: 150px;
            padding: 10px;
            border: 1px solid ${theme.border};
            border-radius: 8px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            color: ${theme.primaryText};
            background-color: ${theme.toggleBg};
            resize: none;
            outline: none;
            box-sizing: border-box;
            overflow-y: hidden;
        `;

        return askTextInput;
    },

    /**
     * Create Ask button
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Button element
     */
    createAskButton(theme) {
        const askButton = document.createElement('div');
        askButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            width: 100% !important;
            background-color: ${theme.buttonPrimary} !important;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: ${window.CaptureAI.UITheme.getButtonShadow()};
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
        return askButton;
    },

    /**
     * Set up auto-resize functionality for textarea
     */
    setupAutoResize() {
        if (!this.askTextInput) return;

        this.askTextInput.addEventListener('input', () => {
            // Reset height to allow shrinking
            this.askTextInput.style.height = '60px';

            // Calculate the scroll height and set new height
            const scrollHeight = this.askTextInput.scrollHeight;
            const maxHeight = 150; // max-height from CSS
            const minHeight = 60; // min-height from CSS

            if (scrollHeight > minHeight) {
                this.askTextInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
            }

            // Show scrollbar if content exceeds max height
            if (scrollHeight > maxHeight) {
                this.askTextInput.style.overflowY = 'auto';
            } else {
                this.askTextInput.style.overflowY = 'hidden';
            }
        });
    },

    /**
     * Set up keyboard shortcuts (Enter to send, Shift+Enter for new line)
     */
    setupKeyboardShortcuts() {
        if (!this.askTextInput) return;

        this.askTextInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default Enter behavior (new line)
                if (this.askTextInput.value.trim()) {
                    this.handleAskQuestion(this.askTextInput.value.trim());
                    this.clearInput();
                }
            }
            // Shift+Enter will use default behavior (new line)
        });
    },

    /**
     * Set up ask button click handler
     */
    setupButtonHandler() {
        if (!this.askButton || !this.askTextInput) return;

        this.askButton.addEventListener('click', () => {
            if (this.askTextInput.value.trim()) {
                this.handleAskQuestion(this.askTextInput.value.trim());
                this.clearInput();
            }
        });
    },

    /**
     * Handle ask question processing
     * @param {string} question - Question text
     */
    handleAskQuestion(question) {
        if (window.CaptureAI.UIMessaging) {
            window.CaptureAI.UIMessaging.handleAskQuestion(question);
        }
    },

    /**
     * Clear input and reset height
     */
    clearInput() {
        if (this.askTextInput) {
            this.askTextInput.value = '';
            this.askTextInput.style.height = '60px'; // Reset height to minimum
        }
    },

    /**
     * Show Ask mode container
     */
    show() {
        if (this.askModeContainer) {
            this.askModeContainer.style.display = 'flex';
        }
    },

    /**
     * Hide Ask mode container
     */
    hide() {
        if (this.askModeContainer) {
            this.askModeContainer.style.display = 'none';
        }
    },

    /**
     * Focus on the text input
     */
    focus() {
        if (this.askTextInput) {
            this.askTextInput.focus();
        }
    },

    /**
     * Get the Ask mode container element
     * @returns {HTMLElement|null} Container element
     */
    getContainer() {
        return this.askModeContainer;
    },

    /**
     * Get current question text
     * @returns {string} Current question text
     */
    getCurrentQuestion() {
        return this.askTextInput ? this.askTextInput.value.trim() : '';
    },

    /**
     * Set question text in the input
     * @param {string} question - Question to set
     */
    setQuestion(question) {
        if (this.askTextInput) {
            this.askTextInput.value = question;
            // Trigger input event to handle auto-resize
            this.askTextInput.dispatchEvent(new Event('input'));
        }
    }
};