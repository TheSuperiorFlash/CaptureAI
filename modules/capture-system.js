/**
 * Screen capture and area selection system
 */

export const CaptureSystem = {
        /**
         * Start capture process
         */
        startCapture() {
            const { STATE } = window.CaptureAI;
            
            if (STATE.isProcessing) {
                if (window.CaptureAI.UIHandlers && window.CaptureAI.UIHandlers.showMessage) {
                    window.CaptureAI.UIHandlers.showMessage('Processing in progress...', 'info');
                }
                return;
            }

            // Store original panel visibility state before hiding
            this.wasVisible = STATE.isPanelVisible;

            // Hide panel during capture
            if (window.CaptureAI.DOM_CACHE && window.CaptureAI.DOM_CACHE.panel) {
                window.CaptureAI.DOM_CACHE.panel.style.display = 'none';
            }

            // Set current prompt type based on auto-solve mode (like original)
            STATE.currentPromptType = STATE.isAutoSolveMode ? window.CaptureAI.PROMPT_TYPES.AUTO_SOLVE : window.CaptureAI.PROMPT_TYPES.ANSWER;

            this.startSelectionProcess();
        },

        /**
         * Quick capture using last area
         */
        async quickCapture() {
            const { STATE, STORAGE_KEYS } = window.CaptureAI;
            
            if (STATE.isProcessing) {
                if (window.CaptureAI.UIHandlers && window.CaptureAI.UIHandlers.showMessage) {
                    window.CaptureAI.UIHandlers.showMessage('Processing in progress...', 'info');
                }
                return;
            }

            if (!window.CaptureAI.StorageUtils || !STORAGE_KEYS) {
                return;
            }

            const lastArea = await window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.LAST_CAPTURE_AREA);
            
            if (!lastArea) {
                if (window.CaptureAI.UIHandlers && window.CaptureAI.UIHandlers.showMessage) {
                    window.CaptureAI.UIHandlers.showMessage('No previous capture area found', 'error');
                }
                return;
            }

            STATE.isProcessing = true;

            // Set current prompt type based on auto-solve mode for quick capture (like original)
            STATE.currentPromptType = STATE.isAutoSolveMode ? window.CaptureAI.PROMPT_TYPES.AUTO_SOLVE : window.CaptureAI.PROMPT_TYPES.ANSWER;

            // Send message to background script
            chrome.runtime.sendMessage({
                action: 'captureArea',
                coordinates: lastArea,
                promptType: STATE.currentPromptType
            });
        },

        /**
         * Start area selection process
         */
        startSelectionProcess() {
            const { STATE } = window.CaptureAI;
            
            // Create overlay
            const overlay = this.createOverlay();
            document.body.appendChild(overlay);

            // Reset drag state
            STATE.isDragging = false;
            STATE.startX = 0;
            STATE.startY = 0;
            STATE.endX = 0;
            STATE.endY = 0;

            // Add event listeners
            overlay.addEventListener('mousedown', this.onMouseDown.bind(this));
            overlay.addEventListener('mousemove', this.onMouseMove.bind(this));
            overlay.addEventListener('mouseup', this.onMouseUp.bind(this));
            overlay.addEventListener('keydown', this.onKeyDown.bind(this));

            // Focus overlay for keyboard events
            overlay.focus();

            window.CaptureAI.UIHandlers.showMessage('Select an area by dragging', 'info');
        },

        /**
         * Create selection overlay
         * @returns {HTMLElement}
         */
        createOverlay() {
            const { STATE } = window.CaptureAI;
            const overlay = document.createElement('div');
            overlay.id = 'captureai-overlay';
            
            // In stealth mode (UI hidden), don't show the translucent gray background
            const isStealthMode = !STATE.isPanelVisible;
            
            Object.assign(overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                backgroundColor: isStealthMode ? 'transparent' : 'rgba(0, 0, 0, 0.3)',
                cursor: isStealthMode ? 'default' : 'crosshair',
                zIndex: '2147483646',
                outline: 'none'
            });

            overlay.tabIndex = -1;
            return overlay;
        },

        /**
         * Create selection box
         * @returns {HTMLElement}
         */
        createSelectionBox() {
            if (window.CaptureAI.STATE.selectionBox) {
                window.CaptureAI.STATE.selectionBox.remove();
            }

            const { STATE } = window.CaptureAI;
            const selectionBox = document.createElement('div');
            selectionBox.id = 'captureai-selection';
            
            // In stealth mode (UI hidden), hide the selection box
            const isStealthMode = !STATE.isPanelVisible;
            
            Object.assign(selectionBox.style, {
                position: 'absolute',
                border: isStealthMode ? 'none' : '2px dashed #2e7d32',
                backgroundColor: isStealthMode ? 'transparent' : 'rgba(46, 125, 50, 0.2)',
                pointerEvents: 'none',
                zIndex: '2147483647'
            });

            const overlay = document.getElementById('captureai-overlay');
            if (overlay) {
                overlay.appendChild(selectionBox);
            }

            window.CaptureAI.STATE.selectionBox = selectionBox;
            return selectionBox;
        },

        /**
         * Handle mouse down event
         * @param {MouseEvent} e - Mouse event
         */
        onMouseDown(e) {
            const { STATE } = window.CaptureAI;
            
            STATE.isDragging = true;
            STATE.startX = e.clientX;
            STATE.startY = e.clientY;
            STATE.endX = e.clientX;
            STATE.endY = e.clientY;

            this.createSelectionBox();
            this.updateSelectionBox();
        },

        /**
         * Handle mouse move event
         * @param {MouseEvent} e - Mouse event
         */
        onMouseMove(e) {
            const { STATE } = window.CaptureAI;
            
            if (!STATE.isDragging) return;

            STATE.endX = e.clientX;
            STATE.endY = e.clientY;
            this.updateSelectionBox();
        },

        /**
         * Handle mouse up event
         * @param {MouseEvent} e - Mouse event
         */
        onMouseUp(e) {
            const { STATE } = window.CaptureAI;
            
            if (!STATE.isDragging) return;

            STATE.isDragging = false;
            STATE.endX = e.clientX;
            STATE.endY = e.clientY;

            // Calculate selection area
            const width = Math.abs(STATE.endX - STATE.startX);
            const height = Math.abs(STATE.endY - STATE.startY);

            if (width < 10 || height < 10) {
                window.CaptureAI.UIHandlers.showMessage('Selection too small, try again', 'error');
                this.cancelSelection();
                return;
            }

            this.completeSelection();
        },

        /**
         * Handle keyboard events
         * @param {KeyboardEvent} e - Keyboard event
         */
        onKeyDown(e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                this.cancelSelection();
            }
        },

        /**
         * Update selection box dimensions
         */
        updateSelectionBox() {
            const { STATE } = window.CaptureAI;
            
            if (!STATE.selectionBox) return;

            const left = Math.min(STATE.startX, STATE.endX);
            const top = Math.min(STATE.startY, STATE.endY);
            const width = Math.abs(STATE.endX - STATE.startX);
            const height = Math.abs(STATE.endY - STATE.startY);

            Object.assign(STATE.selectionBox.style, {
                left: left + 'px',
                top: top + 'px',
                width: width + 'px',
                height: height + 'px'
            });
        },

        /**
         * Complete selection and initiate capture
         */
        async completeSelection() {
            const { STATE, STORAGE_KEYS } = window.CaptureAI;
            
            // Calculate final coordinates
            const left = Math.min(STATE.startX, STATE.endX);
            const top = Math.min(STATE.startY, STATE.endY);
            const width = Math.abs(STATE.endX - STATE.startX);
            const height = Math.abs(STATE.endY - STATE.startY);

            const coordinates = {
                startX: left + window.scrollX,
                startY: top + window.scrollY,
                width: width,
                height: height
            };

            // Store for quick capture
            await window.CaptureAI.StorageUtils.setValue(STORAGE_KEYS.LAST_CAPTURE_AREA, coordinates);

            // Clean up selection UI
            this.cleanupSelection();

            // Show processing message
            window.CaptureAI.UIHandlers.showMessage('Processing capture...', 'info');
            STATE.isProcessing = true;

            // Set current prompt type based on auto-solve mode (like original)
            STATE.currentPromptType = STATE.isAutoSolveMode ? window.CaptureAI.PROMPT_TYPES.AUTO_SOLVE : window.CaptureAI.PROMPT_TYPES.ANSWER;

            // Send to background script
            chrome.runtime.sendMessage({
                action: 'captureArea',
                coordinates: coordinates,
                promptType: STATE.currentPromptType
            });
        },

        /**
         * Cancel selection process
         */
        cancelSelection() {
            this.cleanupSelection();
            window.CaptureAI.UIHandlers.showMessage('Selection cancelled', 'info');
            
            // Restore panel to original visibility state
            this.restorePanelVisibility();
        },

        /**
         * Clean up selection UI elements
         */
        cleanupSelection() {
            const { STATE } = window.CaptureAI;
            
            // Remove overlay
            const overlay = document.getElementById('captureai-overlay');
            if (overlay) {
                overlay.remove();
            }

            // Clear selection box reference
            if (STATE.selectionBox) {
                STATE.selectionBox.remove();
                STATE.selectionBox = null;
            }

            // Reset drag state
            STATE.isDragging = false;

            // Restore panel to original visibility state
            this.restorePanelVisibility();
        },

        /**
         * Restore panel visibility to original state before capture
         */
        restorePanelVisibility() {
            const { STATE } = window.CaptureAI;
            
            if (window.CaptureAI.DOM_CACHE.panel) {
                // Only show panel if it was originally visible
                if (this.wasVisible) {
                    window.CaptureAI.DOM_CACHE.panel.style.display = 'block';
                    STATE.isPanelVisible = true;
                } else {
                    // Keep it hidden if it was originally hidden
                    window.CaptureAI.DOM_CACHE.panel.style.display = 'none';
                    STATE.isPanelVisible = false;
                }
            }
        },

        /**
         * Initialize capture system
         */
        init() {
            // Any initialization code for capture system
        }
    };