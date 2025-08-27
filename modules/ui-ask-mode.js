/**
 * Ask Mode UI components
 * Creates textarea, ask button, and handles question input functionality
 */

export const UIAskMode = {
    askModeContainer: null,
    askTextInput: null,
    askButton: null,
    attachImageButton: null,
    imagePreview: null,
    attachedImageData: null,

    /**
     * Attach Ask mode UI to panel
     */
    attachTo() {
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
        this.attachImageButton = this.createAttachImageButton(theme);
        this.askButton = this.createAskButton(theme);
        this.imagePreview = this.createImagePreview(theme);

        // Create wrapper for text input with image preview
        const textInputWrapper = this.createTextInputWrapper();
        
        // Add components to container
        this.askModeContainer.appendChild(textInputWrapper);
        this.askModeContainer.appendChild(this.createButtonRow());

        // Set up functionality
        this.setupAutoResize();
        this.setupKeyboardShortcuts();
        this.setupButtonHandler();
        this.setupAttachImageHandler();
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
            opacity: 0;
            transform: translateY(0px);
            transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
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
     * Create button row container
     * @returns {HTMLElement} Button row element
     */
    createButtonRow() {
        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = `
            display: flex;
            gap: 8px;
            width: 100%;
        `;

        // Set flex property for ask button to take remaining space
        if (this.askButton) {
            this.askButton.style.flex = '1';
        }

        buttonRow.appendChild(this.attachImageButton);
        buttonRow.appendChild(this.askButton);
        return buttonRow;
    },

    /**
     * Create attach image button
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Attach image button element
     */
    createAttachImageButton(theme) {
        const attachButton = document.createElement('div');
        attachButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            width: 40px;
            background-color: ${theme.toggleInactiveBg} !important;
            border: 1px solid ${theme.buttonBorder};
            border-radius: 8px;
            cursor: pointer;
            box-shadow: ${window.CaptureAI.UITheme.getButtonShadow()};
            box-sizing: border-box !important;
            transition: background-color 0.2s;
        `;

        // Attach icon
        const attachIcon = document.createElement('img');
        attachIcon.src = window.CaptureAI.ICONS.ATTACH;
        attachIcon.alt = 'Attach image';
        attachIcon.style.cssText = `
            width: 20px;
            height: 20px;
        `;

        attachButton.appendChild(attachIcon);
        attachButton.title = 'Attach image';

        return attachButton;
    },

    /**
     * Create text input wrapper with image preview
     * @returns {HTMLElement} Wrapper element
     */
    createTextInputWrapper() {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position: relative;
            width: 100%;
        `;

        wrapper.appendChild(this.askTextInput);
        wrapper.appendChild(this.imagePreview);
        
        return wrapper;
    },

    /**
     * Create image preview container
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Image preview element
     */
    createImagePreview(theme) {
        const previewContainer = document.createElement('div');
        previewContainer.style.cssText = `
            display: none;
            position: absolute;
            top: 8px;
            left: 8px;
            width: 80px;
            height: 80px;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid ${theme.border};
            background-color: ${theme.toggleBg};
            z-index: 10;
        `;

        const previewImage = document.createElement('img');
        previewImage.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;

        const removeButton = document.createElement('div');
        removeButton.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            width: 18px;
            height: 18px;
            border-radius: 46%;
            background-color: white;
            color: #333333;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
            line-height: 1;
        `;
        removeButton.textContent = '✕';

        removeButton.addEventListener('click', () => this.removeAttachedImage());

        previewContainer.appendChild(previewImage);
        previewContainer.appendChild(removeButton);
        
        return previewContainer;
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
     * Set up attach image button click handler
     */
    setupAttachImageHandler() {
        if (!this.attachImageButton) return;

        this.attachImageButton.addEventListener('click', () => {
            this.startImageCapture();
        });
    },

    /**
     * Start image capture process
     */
    async startImageCapture() {
        try {
            // Use the existing capture system to get a screenshot
            if (window.CaptureAI.CaptureSystem?.startCapture) {
                // Store reference to this ask mode instance for the callback
                window.CaptureAI.STATE.askModeInstance = this;
                window.CaptureAI.CaptureSystem.startCapture(true); // Pass true to indicate this is for ask mode
            }
        } catch (error) {
            console.error('Failed to start image capture:', error);
        }
    },

    /**
     * Set attached image data and show preview
     * @param {string} imageData - Base64 image data
     */
    setAttachedImage(imageData) {
        this.attachedImageData = imageData;
        
        // Update preview
        const previewImage = this.imagePreview.querySelector('img');
        if (previewImage) {
            previewImage.src = imageData;
        }
        
        // Show preview
        this.imagePreview.style.display = 'block';
        
        // Add padding to text input to make room for image above
        this.askTextInput.style.paddingTop = '88px';
        
        // Update button appearance to indicate image is attached
        this.attachImageButton.style.backgroundColor = '#888888';
        
        // Change icon to attached state
        const attachIcon = this.attachImageButton.querySelector('img');
        if (attachIcon) {
            attachIcon.src = window.CaptureAI.ICONS.ATTACHED;
        }
    },

    /**
     * Remove attached image and hide preview
     */
    removeAttachedImage() {
        this.attachedImageData = null;
        this.imagePreview.style.display = 'none';
        
        // Reset text input padding
        this.askTextInput.style.paddingTop = '10px';
        
        // Reset button appearance
        const theme = window.CaptureAI.UITheme.getCurrentTheme();
        this.attachImageButton.style.backgroundColor = theme.toggleInactiveBg;
        
        // Restore original attach icon
        const attachIcon = this.attachImageButton.querySelector('img');
        if (attachIcon) {
            attachIcon.src = window.CaptureAI.ICONS.ATTACH;
        }
    },

    /**
     * Handle ask question processing
     * @param {string} question - Question text
     */
    handleAskQuestion(question) {
        if (window.CaptureAI.UIMessaging) {
            // Pass both question and optional image data
            window.CaptureAI.UIMessaging.handleAskQuestion(question, this.attachedImageData);
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
        
        // Also clear any attached image
        this.removeAttachedImage();
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