/**
 * Auto-solve functionality for educational websites
 */

export const AutoSolve = {
        /**
         * Toggle auto-solve mode
         * @param {boolean} enabled - Whether to enable auto-solve
         */
        async toggleAutoSolveMode(enabled = null) {
            if (!window.CaptureAI || !window.CaptureAI.STATE || !window.CaptureAI.STORAGE_KEYS) {
                return;
            }
            
            const { STATE, STORAGE_KEYS } = window.CaptureAI;
            
            if (enabled === null) {
                enabled = !STATE.isAutoSolveMode;
            }

            // If enabling, check for capture area first (like original implementation)
            if (enabled) {
                const lastCaptureArea = await window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.LAST_CAPTURE_AREA);
                
                if (!lastCaptureArea) {
                    if (window.CaptureAI.UIHandlers && window.CaptureAI.UIHandlers.showStealthyResult) {
                        window.CaptureAI.UIHandlers.showStealthyResult('Please capture an area first before enabling auto-solve');
                    }
                    // Don't change the state, keep it disabled
                    STATE.isAutoSolveMode = false; // Explicitly set to false
                    this.updateAutoSolveToggleUI(); // Reset toggle to off position
                    return;
                }
            }

            STATE.isAutoSolveMode = enabled;
            
            if (window.CaptureAI.StorageUtils && window.CaptureAI.StorageUtils.setValue) {
                await window.CaptureAI.StorageUtils.setValue(STORAGE_KEYS.AUTO_SOLVE_MODE, enabled);
            }

            this.updateAutoSolveToggleUI();

            if (enabled) {
                STATE.invalidQuestionCount = 0;
                // Don't automatically start the loop! Wait for user to manually capture first
                if (window.CaptureAI.UIHandlers && window.CaptureAI.UIHandlers.showStealthyResult) {
                    window.CaptureAI.UIHandlers.showStealthyResult('Auto-solve enabled - capture an area to start');
                }
            } else {
                this.cancelAutoSolve();
                if (window.CaptureAI.UIHandlers && window.CaptureAI.UIHandlers.showStealthyResult) {
                    window.CaptureAI.UIHandlers.showStealthyResult('Auto-solve disabled');
                }
            }
        },

        /**
         * Update auto-solve toggle UI
         */
        updateAutoSolveToggleUI() {
            const { STATE } = window.CaptureAI;
            
            // Update header toggle (the one in the floating UI)
            const headerToggle = document.getElementById('captureai-header-auto-solve-toggle');
            if (headerToggle) {
                headerToggle.checked = STATE.isAutoSolveMode;
                
                // Update toggle visual appearance
                const toggleSlider = headerToggle.parentElement.querySelector('span');
                const toggleButton = toggleSlider?.querySelector('span');

                if (toggleSlider) {
                    toggleSlider.style.backgroundColor = STATE.isAutoSolveMode ? '#4caf65' : '#f1f1f1';
                }
                if (toggleButton) {
                    toggleButton.style.left = STATE.isAutoSolveMode ? '12px' : '2px';
                }
            }
            
            // Also update any other toggle with the old ID for backward compatibility
            const toggle = document.getElementById('auto-solve-toggle');
            if (toggle) {
                toggle.checked = STATE.isAutoSolveMode;
            }
        },

        /**
         * Schedule next auto-solve cycle
         */
        scheduleNextAutoSolve() {
            const { STATE, CONFIG } = window.CaptureAI;
            
            if (!STATE.isAutoSolveMode) {
                return;
            }

            // Clear existing timer to prevent duplicates
            this.cancelAutoSolve();

            // Schedule next capture with delay
            STATE.autoSolveTimer = setTimeout(() => {
                this.performAutoSolve();
            }, CONFIG.AUTO_SOLVE_CYCLE_DELAY);
        },

        /**
         * Cancel auto-solve timer
         */
        cancelAutoSolve() {
            const { STATE } = window.CaptureAI;
            
            if (STATE.autoSolveTimer) {
                clearTimeout(STATE.autoSolveTimer);
                STATE.autoSolveTimer = null;
            }
        },

        /**
         * Perform auto-solve capture
         */
        async performAutoSolve() {
            const { STATE, CONFIG } = window.CaptureAI;
            
            if (!STATE.isAutoSolveMode || STATE.isProcessing) {
                return;
            }

            // Double-check we're still on a supported site
            if (!window.CaptureAI.DomainUtils.isOnSupportedSite()) {
                await this.toggleAutoSolveMode(false);
                return;
            }

            try {
                // Check if we've had too many invalid questions
                if (STATE.invalidQuestionCount >= CONFIG.MAX_INVALID_QUESTIONS) {
                    await this.toggleAutoSolveMode(false);
                    window.CaptureAI.UIHandlers.showStealthyResult('Auto-solve stopped: too many invalid questions');
                    return;
                }

                // Determine capture area - use stored last capture area like original
                const captureArea = await this.getAutoSolveCaptureArea();
                
                if (!captureArea) {
                    this.scheduleNextAutoSolve();
                    return;
                }

                // Set processing state to prevent overlapping captures
                STATE.isProcessing = true;
                STATE.currentPromptType = window.CaptureAI.PROMPT_TYPES.AUTO_SOLVE;

                // Send to background script with timeout handling
                chrome.runtime.sendMessage({
                    action: 'captureArea',
                    coordinates: captureArea,
                    promptType: window.CaptureAI.PROMPT_TYPES.AUTO_SOLVE
                }, () => {
                    if (chrome.runtime.lastError) {
                        STATE.isProcessing = false;
                        this.scheduleNextAutoSolve();
                    }
                });

                // Set a safety timeout to reset processing state if no response received after a long time
                setTimeout(() => {
                    if (STATE.isProcessing && STATE.currentPromptType === window.CaptureAI.PROMPT_TYPES.AUTO_SOLVE) {
                        STATE.isProcessing = false;
                        this.scheduleNextAutoSolve();
                    }
                }, 30000);

            } catch (error) {
                STATE.isProcessing = false;
                // Wait longer before retrying on errors
                setTimeout(() => {
                    this.scheduleNextAutoSolve();
                }, 5000);
            }
        },

        /**
         * Get capture area for auto-solve - uses stored last capture area like original
         * @returns {Object|null}
         */
        async getAutoSolveCaptureArea() {
            // Use the last manually captured area, just like the original implementation
            const lastCaptureArea = await window.CaptureAI.StorageUtils.getValue(window.CaptureAI.STORAGE_KEYS.LAST_CAPTURE_AREA);
            
            if (lastCaptureArea) {
                // Convert from stored format to coordinates format
                // Handle different possible storage formats
                const coordinates = {
                    startX: lastCaptureArea.left || lastCaptureArea.startX,
                    startY: lastCaptureArea.top || lastCaptureArea.startY,
                    width: lastCaptureArea.width,
                    height: lastCaptureArea.height
                };
                
                // Validate coordinates are not undefined
                if (coordinates.startX !== undefined && coordinates.startY !== undefined && 
                    coordinates.width !== undefined && coordinates.height !== undefined) {
                    return coordinates;
                } else {
                    return null;
                }
            }
            
            return null;
        },

        /**
         * Handle auto-solve response - simplified like the backup
         * @param {string} response - AI response
         */
        async handleAutoSolveResponse(response) {
            const { STATE, CONFIG } = window.CaptureAI;
            
            // Simple duplicate prevention - ignore exact same response immediately following
            if (this.lastAutoSolveResponse === response && Date.now() - this.lastAutoSolveTime < 1000) {
                return;
            }
            this.lastAutoSolveResponse = response;
            this.lastAutoSolveTime = Date.now();
            
            // Reset processing state (if it was set)
            STATE.isProcessing = false;

            if (!STATE.isAutoSolveMode) {
                return;
            }

            // Simple response processing like the backup
            const cleanResponse = response.trim().toLowerCase();

            // Check for invalid responses: 'invalid question', 'no response found', or any error
            if (cleanResponse.includes('invalid question') || 
                cleanResponse.includes('no response found') || 
                cleanResponse.startsWith('error:')) {
                STATE.invalidQuestionCount++;

                if (STATE.invalidQuestionCount >= CONFIG.MAX_INVALID_QUESTIONS) {
                    await this.toggleAutoSolveMode(false);
                    window.CaptureAI.UIHandlers.showStealthyResult('Too many invalid questions. Stopping auto-solve.');
                    return;
                }

                // Press Enter for invalid questions (like backup: simulateKeypress('', true))
                setTimeout(() => {
                    this.simulateKeypress('', true);
                }, CONFIG.AUTO_SOLVE_ANSWER_DELAY);
            } else {
                // Valid response, reset counter (like backup)
                STATE.invalidQuestionCount = 0;

                // Try to extract answer number [1-4] like backup
                const answerMatch = cleanResponse.match(/[1-4]/);
                if (answerMatch) {
                    const answerNumber = answerMatch[0];
                    
                    setTimeout(() => {
                        // Like backup: simulateKeypress(answerNumber, true) - number + Enter
                        this.simulateKeypress(answerNumber, true);
                    }, CONFIG.AUTO_SOLVE_ANSWER_DELAY);
                } else {
                    // If no number found, treat as invalid and just press Enter
                    setTimeout(() => {
                        this.simulateKeypress('', true);
                    }, CONFIG.AUTO_SOLVE_ANSWER_DELAY);
                }
            }

            // Schedule next auto-solve cycle if still enabled (like backup)
            if (STATE.isAutoSolveMode) {
                this.scheduleNextAutoSolve();
            }
        },

        /**
         * Simulate keypress for answer - exactly like the backup
         * @param {string} key - Key to press (or empty for just Enter)
         * @param {boolean} pressEnter - Whether to press Enter after the key
         */
        simulateKeypress(key, pressEnter = false) {
            
            const activeElement = document.activeElement;
            let success = false;

            // If key is provided, try to input it (like backup)
            if (key && key.trim() !== '') {
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
                    // InputEvent failed, will try KeyboardEvent
                }

                // Fallback approach if InputEvent didn't work
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
                        activeElement.dispatchEvent(event);
                        success = true;
                    } catch (e) {
                        // KeyboardEvent failed
                    }
                }

                // Last resort - dispatch to document
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
                        // Document dispatch failed
                    }
                }
            }

            // Press Enter if requested (like backup)
            if (pressEnter) {
                setTimeout(() => {
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
                        
                        // Also try document.activeElement
                        if (document.activeElement && document.activeElement.dispatchEvent) {
                            document.activeElement.dispatchEvent(enterEvent);
                        }
                    } catch (e) {
                        // Enter dispatch failed
                    }
                }, 500); // Use backup's timing
            }
        },


        /**
         * Initialize auto-solve system
         */
        async init() {
            const { STATE, STORAGE_KEYS } = window.CaptureAI;
            
            
            // Load auto-solve state from storage
            const isAutoSolveMode = await window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.AUTO_SOLVE_MODE, false);
            
            if (isAutoSolveMode && window.CaptureAI.DomainUtils.isOnSupportedSite()) {
                // Check if we have a last capture area before enabling auto-solve
                const lastCaptureArea = await window.CaptureAI.StorageUtils.getValue(STORAGE_KEYS.LAST_CAPTURE_AREA);
                
                if (lastCaptureArea) {
                    STATE.isAutoSolveMode = true;
                    this.updateAutoSolveToggleUI();
                    // Don't auto-start on initialization - wait for manual trigger
                } else {
                    // Don't enable auto-solve without a capture area
                    STATE.isAutoSolveMode = false;
                    await window.CaptureAI.StorageUtils.setValue(STORAGE_KEYS.AUTO_SOLVE_MODE, false);
                }
            }
            
        }
    };