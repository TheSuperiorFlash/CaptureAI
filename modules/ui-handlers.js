/**
 * UI event handlers and interactions
 */

export const UIHandlers = {
        /**
         * Toggle panel visibility
         */
        togglePanelVisibility() {
            const { STATE, DOM_CACHE } = window.CaptureAI;
            
            // Create UI if it doesn't exist
            if (!DOM_CACHE.panel && window.CaptureAI.UIComponents && window.CaptureAI.UIComponents.createUI) {
                window.CaptureAI.UIComponents.createUI();
            }
            
            if (DOM_CACHE.panel) {
                DOM_CACHE.panel.style.display = STATE.isPanelVisible ? 'none' : 'block';
                STATE.isPanelVisible = !STATE.isPanelVisible;
            }
        },

        /**
         * Make element draggable
         * @param {HTMLElement} element - Element to make draggable
         * @param {HTMLElement} handle - Drag handle element
         */
        makeDraggable(element, handle) {
            let isDragging = false;
            let startX, startY, initialX, initialY;

            handle.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = element.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                e.preventDefault();
            });

            function onMouseMove(e) {
                if (!isDragging) return;
                
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                element.style.left = (initialX + dx) + 'px';
                element.style.top = (initialY + dy) + 'px';
                element.style.right = 'auto';
            }

            function onMouseUp() {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
        },

        /**
         * Switch to ask mode
         */
        switchToAskMode() {
            const { STATE, DOM_CACHE } = window.CaptureAI;
            
            STATE.isAskMode = true;
            if (window.CaptureAI.StorageUtils && window.CaptureAI.STORAGE_KEYS) {
                window.CaptureAI.StorageUtils.setValue(window.CaptureAI.STORAGE_KEYS.ASK_MODE, true);
            }
            
            // Update UI to show ask interface
            this.showAskInterface();
        },

        /**
         * Switch to capture mode
         */
        switchToCaptureMode() {
            const { STATE } = window.CaptureAI;
            
            STATE.isAskMode = false;
            if (window.CaptureAI.StorageUtils && window.CaptureAI.STORAGE_KEYS) {
                window.CaptureAI.StorageUtils.setValue(window.CaptureAI.STORAGE_KEYS.ASK_MODE, false);
            }
            
            // Hide ask interface and show capture interface
            this.hideAskInterface();
        },

        /**
         * Show ask question interface
         */
        showAskInterface() {
            const { DOM_CACHE } = window.CaptureAI;
            
            if (!DOM_CACHE.panel) return;

            // Find button section and replace with ask interface
            const buttonSection = DOM_CACHE.panel.querySelector('.button-section');
            if (buttonSection) {
                buttonSection.innerHTML = '';
                
                // Create ask input
                const askContainer = document.createElement('div');
                askContainer.className = 'ask-container';
                
                const questionInput = document.createElement('textarea');
                questionInput.placeholder = 'Type your question here...';
                questionInput.className = 'question-input';
                Object.assign(questionInput.style, {
                    width: '100%',
                    minHeight: '60px',
                    padding: '10px',
                    border: '1px solid #4a5f7a',
                    borderRadius: '6px',
                    backgroundColor: '#34495e',
                    color: '#ecf0f1',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none'
                });

                const buttonContainer = document.createElement('div');
                Object.assign(buttonContainer.style, {
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px'
                });

                let askButton, backButton;
                
                if (window.CaptureAI.UIComponents && window.CaptureAI.UIComponents.createButton) {
                    askButton = window.CaptureAI.UIComponents.createButton('Ask', 'ask-submit-btn', () => {
                        this.handleAskQuestion(questionInput.value);
                    });
                    askButton.style.flex = '1';

                    backButton = window.CaptureAI.UIComponents.createButton('← Back', 'back-btn', () => {
                        this.switchToCaptureMode();
                        if (window.CaptureAI.UIComponents && window.CaptureAI.UIComponents.createUI) {
                            window.CaptureAI.UIComponents.createUI();
                        }
                    });
                } else {
                    // Fallback buttons if UIComponents not available
                    askButton = document.createElement('button');
                    askButton.textContent = 'Ask';
                    askButton.onclick = () => this.handleAskQuestion(questionInput.value);
                    
                    backButton = document.createElement('button');
                    backButton.textContent = '← Back';
                    backButton.onclick = () => this.switchToCaptureMode();
                }
                backButton.style.backgroundColor = '#7f8c8d';
                backButton.style.flex = '0 0 auto';

                buttonContainer.appendChild(backButton);
                buttonContainer.appendChild(askButton);
                
                askContainer.appendChild(questionInput);
                askContainer.appendChild(buttonContainer);
                buttonSection.appendChild(askContainer);
            }
        },

        /**
         * Hide ask question interface
         */
        hideAskInterface() {
            // This will be handled by recreating the UI
        },

        /**
         * Handle ask question submission
         * @param {string} question - Question to ask
         */
        async handleAskQuestion(question) {
            if (!question || question.trim().length === 0) {
                this.showMessage('Please enter a question', 'error');
                return;
            }

            this.showMessage('Asking question...', 'info');

            try {
                const response = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({
                        action: 'askQuestion',
                        question: question.trim()
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                });

                if (response && response.success) {
                    // Response will be handled by the displayResponse message
                } else {
                    this.showMessage('Failed to get response', 'error');
                }
            } catch (error) {
                this.showMessage('Error asking question', 'error');
            }
        },

        // Pro Mode toggle removed - direct image processing is now the default

        /**
         * Show message in result area
         * @param {string} message - Message to show
         * @param {string} type - Message type ('info', 'error', 'success')
         */
        showMessage(message, type = 'info') {
            const { CONFIG, DOM_CACHE } = window.CaptureAI;
            
            const resultElement = DOM_CACHE.panel?.querySelector(`#${CONFIG.RESULT_ID}`) || 
                                 document.getElementById(CONFIG.RESULT_ID);
            
            if (resultElement) {
                resultElement.textContent = message;
                
                // Apply light theme styling based on type - no backgrounds, just text color
                resultElement.style.backgroundColor = 'transparent';
                resultElement.style.background = 'transparent';
                resultElement.style.border = 'none';
                resultElement.style.borderColor = 'transparent';
                
                switch (type) {
                    case 'error':
                        resultElement.style.color = '#ff6b6b !important';
                        break;
                    case 'success':
                        resultElement.style.color = '#4caf65 !important';
                        break;
                    case 'info':
                    default:
                        resultElement.style.color = '#333333 !important'; // Light theme primary text color
                        break;
                }
            }
        },

        /**
         * Clear message from result area
         */
        clearMessage() {
            const { CONFIG } = window.CaptureAI;
            
            const resultElement = document.getElementById(CONFIG.RESULT_ID);
            if (resultElement) {
                resultElement.textContent = '';
                resultElement.style.color = '#ecf0f1';
                resultElement.style.backgroundColor = '#34495e';
                resultElement.style.borderColor = '#4a5f7a';
            }
        },

        /**
         * Show stealthy result (for auto-solve)
         * @param {string} message - Message to show
         */
        showStealthyResult(message) {
            const { DOM_CACHE, CONFIG } = window.CaptureAI;
            
            if (DOM_CACHE.stealthyResult) {
                DOM_CACHE.stealthyResult.textContent = message;
                DOM_CACHE.stealthyResult.style.display = 'block';
                
                // Auto-hide after delay
                setTimeout(() => {
                    if (DOM_CACHE.stealthyResult) {
                        DOM_CACHE.stealthyResult.style.display = 'none';
                    }
                }, CONFIG.ANSWER_FADEOUT_TIME);
            }
        },

        /**
         * Initialize UI handlers
         */
        init() {
            // Any initialization code for handlers
        }
    };