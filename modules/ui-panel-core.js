/**
 * Core floating panel structure and basic components
 * Creates main panel container, header, and response area
 */

export const UIPanelCore = {
    /**
     * Create main panel structure
     * @returns {HTMLElement} Panel element
     */
    create() {
        const { STATE, CONFIG, DOM_CACHE } = window.CaptureAI;
        const theme = window.CaptureAI.UITheme.getCurrentTheme();

        // Create main panel
        const panel = this.createPanel(theme);
        const header = this.createHeader(theme);
        const responseContainer = this.createResponseContainer(theme);

        // Assemble panel
        panel.appendChild(header);
        panel.appendChild(responseContainer);

        // Make draggable if handler available
        if (window.CaptureAI.UIHandlers?.makeDraggable) {
            window.CaptureAI.UIHandlers.makeDraggable(panel, header);
        }

        // Add to DOM
        document.body.appendChild(panel);

        // Update state and cache
        STATE.uiElements.panel = panel;
        DOM_CACHE.panel = panel;
        DOM_CACHE.resultElement = document.getElementById(CONFIG.RESULT_ID);

        STATE.isPanelVisible = false;

        return panel;
    },

    /**
     * Create main panel container
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Panel element
     */
    createPanel(theme) {
        const { CONFIG } = window.CaptureAI;
        
        const panel = document.createElement('div');
        panel.id = CONFIG.PANEL_ID;
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 250px !important;
            background-color: ${theme.primaryBg} !important;
            border-radius: 10px;
            box-shadow: ${window.CaptureAI.UITheme.getPanelShadow()};
            z-index: 9999;
            font-family: 'Inter', sans-serif;
            color: ${theme.primaryText} !important;
            overflow: hidden;
            transition: opacity 0.3s ease;
            display: none;
        `;
        
        return panel;
    },

    /**
     * Create panel header with logo and title
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Header element
     */
    createHeader(theme) {
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            padding: 10px 15px;
            justify-content: space-between;
            background-color: ${theme.headerBg} !important;
            border-bottom: 1px solid ${theme.border} !important;
            cursor: move;
        `;

        // Create title container with logo
        const titleContainer = this.createTitleContainer(theme);
        header.appendChild(titleContainer);

        return header;
    },

    /**
     * Create title container with logo and text
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Title container element
     */
    createTitleContainer(theme) {
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            display: flex;
            align-items: center;
            background-color: transparent;
        `;

        // Logo
        const logo = document.createElement('img');
        logo.src = window.CaptureAI.ICONS.CHECKMARK;
        logo.style.cssText = `
            width: 24px;
            height: 24px;
            margin-right: 10px;
            color: #333333 !important;
        `;

        // Title text
        const title = document.createElement('span');
        title.textContent = 'CaptureAI';
        title.style.cssText = `
            font-weight: bold;
            font-size: 16px;
            margin-right: 10px;
            color: ${theme.primaryText} !important;
        `;

        titleContainer.appendChild(logo);
        titleContainer.appendChild(title);

        return titleContainer;
    },

    /**
     * Create response container area
     * @param {Object} theme - Theme colors
     * @returns {HTMLElement} Response container element
     */
    createResponseContainer(theme) {
        const { STATE, CONFIG } = window.CaptureAI;

        const responseContainer = document.createElement('div');
        responseContainer.style.cssText = `
            padding: 10px 15px;
            background-color: ${theme.primaryBg} !important;
            border-bottom: none;
            font-size: 14px;
            color: ${theme.primaryText} !important;
            min-height: 52px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        `;

        // Response title
        const responseTitle = document.createElement('div');
        responseTitle.textContent = 'Response:';
        responseTitle.style.cssText = `
            font-size: 12px;
            color: ${theme.secondaryText} !important;
            margin-bottom: 5px;
        `;

        // Response content
        const responseContent = document.createElement('div');
        responseContent.id = CONFIG.RESULT_ID;
        responseContent.style.cssText = `
            font-size: 14px;
            color: ${theme.primaryText} !important;
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
            responseContent.style.color = `${theme.errorText} !important`;
        }

        responseContainer.appendChild(responseTitle);
        responseContainer.appendChild(responseContent);

        return responseContainer;
    },

    /**
     * Get header element for attaching additional components
     * @returns {HTMLElement|null} Header element
     */
    getHeader() {
        const { CONFIG } = window.CaptureAI;
        const panel = document.getElementById(CONFIG.PANEL_ID);
        return panel?.querySelector('div[style*="cursor: move"]');
    },

    /**
     * Get main panel element
     * @returns {HTMLElement|null} Panel element
     */
    getPanel() {
        const { CONFIG } = window.CaptureAI;
        return document.getElementById(CONFIG.PANEL_ID);
    },

    /**
     * Attach component to panel
     * @param {HTMLElement} component - Component to attach
     * @param {string} position - Where to attach ('after-response', 'bottom')
     */
    attachComponent(component, position = 'bottom') {
        const panel = this.getPanel();
        if (!panel) return;

        switch (position) {
            case 'after-response':
                // Insert after response container
                const responseContainer = panel.children[1]; // Header is [0], response is [1]
                if (responseContainer?.nextSibling) {
                    panel.insertBefore(component, responseContainer.nextSibling);
                } else {
                    panel.appendChild(component);
                }
                break;
            case 'bottom':
            default:
                panel.appendChild(component);
                break;
        }
    }
};