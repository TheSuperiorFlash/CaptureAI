/**
 * UI Theme system - colors, fonts, and styling constants
 * Shared by floating UI and stealthy result
 */

export const UITheme = {
    initialized: false,
    currentTheme: null,

    /**
     * Initialize theme system
     */
    init() {
        if (this.initialized) return;

        // Add Roboto font
        this.loadFont();

        // Set default theme
        this.currentTheme = this.getThemeColors(false); // Light theme default
        this.initialized = true;
    },

    /**
     * Load Inter font if not already loaded
     */
    loadFont() {
        if (!document.querySelector('link[href*="Inter"]')) {
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);
        }
    },

    /**
     * Get theme colors based on dark mode setting
     * @param {boolean} isDarkMode - Whether to use dark theme
     * @returns {Object} Theme color object
     */
    getThemeColors(isDarkMode = false) {
        return isDarkMode ? {
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
            autoSolveInactiveBg: '#ccc',           // Auto-solve toggle inactive state
            
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
    },

    /**
     * Switch theme between light and dark
     * @param {boolean} isDarkMode - Whether to use dark theme
     */
    switchTheme(isDarkMode) {
        this.currentTheme = this.getThemeColors(isDarkMode);
        // Could emit event here for components to update
    },

    /**
     * Get current theme colors
     * @returns {Object} Current theme color object
     */
    getCurrentTheme() {
        if (!this.initialized) {
            this.init();
        }
        return this.currentTheme;
    },

    /**
     * Get specific color from current theme
     * @param {string} colorKey - Key for the color (e.g., 'primaryBg', 'errorText')
     * @returns {string} Color value
     */
    getColor(colorKey) {
        const theme = this.getCurrentTheme();
        return theme[colorKey] || '#000000';
    },

    /**
     * Common CSS styles for UI elements
     */
    getCommonStyles() {
        return {
            fontFamily: "'Inter', sans-serif",
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box'
        };
    },

    /**
     * Get panel shadow style
     * @returns {string} Box shadow CSS value
     */
    getPanelShadow() {
        return '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
    },

    /**
     * Get button shadow style
     * @returns {string} Box shadow CSS value
     */
    getButtonShadow() {
        return '0 2px 4px rgba(0,0,0,0.15)';
    }
};