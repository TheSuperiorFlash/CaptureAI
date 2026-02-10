/**
 * CaptureAI Privacy Guard - MAIN World Injection
 *
 * This script runs in the MAIN world (same context as page scripts)
 * BEFORE page scripts load (document_start) to override browser APIs
 * and prevent websites from detecting:
 * - Tab visibility changes
 * - Window focus/blur events
 * - Page lifecycle events
 * - Extension activity
 */

(function() {
  'use strict';

  // ============================================================================
  // SECTION 0: PRESERVE ORIGINAL CONSOLE
  // ============================================================================

  /**
   * Store reference to original console.log before page scripts can override it
   * Some pages override console methods to detect extensions
   */
  const originalConsoleLog = console.log.bind(console);
  const originalConsoleWarn = console.warn.bind(console);
  const originalConsoleError = console.error.bind(console);

  // Create a safe logging function that can't be overridden
  const safeLog = function(...args) {
    try {
      originalConsoleLog(...args);
    } catch (e) {
      // Silently fail if console is completely broken
    }
  };

  // ============================================================================
  // SECTION 1: VISIBILITY STATE OVERRIDES
  // ============================================================================

  /**
   * Override document.visibilityState to always return 'visible'
   * Prevents detection of tab switches, minimization, etc.
   */
  Object.defineProperty(Document.prototype, 'visibilityState', {
    configurable: true,
    get: function() {
      return 'visible';
    }
  });

  /**
   * Override document.hidden to always return false
   * Another way pages check if they're visible
   */
  Object.defineProperty(Document.prototype, 'hidden', {
    configurable: true,
    get: function() {
      return false;
    }
  });

  /**
   * Override webkit-specific visibility properties for Safari/older Chrome
   */
  if ('webkitVisibilityState' in Document.prototype) {
    Object.defineProperty(Document.prototype, 'webkitVisibilityState', {
      configurable: true,
      get: function() {
        return 'visible';
      }
    });
  }

  if ('webkitHidden' in Document.prototype) {
    Object.defineProperty(Document.prototype, 'webkitHidden', {
      configurable: true,
      get: function() {
        return false;
      }
    });
  }

  /**
   * Override document.hasFocus() to always return true
   * Prevents detection of window/tab losing focus
   */
  Document.prototype.hasFocus = function() {
    return true;
  };

  // ============================================================================
  // SECTION 2: EVENT LISTENER BLOCKING
  // ============================================================================

  /**
   * Events blocked on ALL targets (visibility detection)
   */
  const ALWAYS_BLOCKED_EVENTS = new Set([
    'visibilitychange',
    'webkitvisibilitychange',
    'mozvisibilitychange',
    'msvisibilitychange',
    'pagehide',
    'pageshow'
  ]);

  /**
   * Events blocked only on window and document (focus detection)
   * Allowed on individual elements so forms/inputs work normally
   */
  const WINDOW_DOC_BLOCKED_EVENTS = new Set([
    'blur',
    'focus',
    'focusin',
    'focusout'
  ]);

  // Debug mode - set to true to log blocked events
  const DEBUG_PRIVACY_GUARD = false;

  /**
   * Store blocked listeners so removeEventListener works correctly
   * Maps target -> event type -> array of listeners
   */
  const blockedListeners = new WeakMap();

  /**
   * Store original addEventListener for internal use
   */
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

  /**
   * Override addEventListener to silently drop blocked events
   * Website tries to listen for focus/blur but we don't register it
   */
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Check if this event type should be blocked
    if (ALWAYS_BLOCKED_EVENTS.has(type) ||
        (WINDOW_DOC_BLOCKED_EVENTS.has(type) &&
          (this === window || this === document))) {
      // Debug logging (optional)
      if (DEBUG_PRIVACY_GUARD) {
        safeLog(`[Privacy Guard] '${type}' event listener subscription prevented.`);
      }

      // Store the listener so removeEventListener can find it
      // WeakMap requires object keys, so check if 'this' is an object
      if (this && typeof this === 'object') {
        try {
          if (!blockedListeners.has(this)) {
            blockedListeners.set(this, new Map());
          }
          const targetListeners = blockedListeners.get(this);
          if (!targetListeners.has(type)) {
            targetListeners.set(type, []);
          }
          targetListeners.get(type).push({ listener, options });
        } catch (e) {
          // Silently ignore WeakMap errors for non-object targets
        }
      }

      // Silently return without registering the listener
      return;
    }

    // Allow all other events to register normally
    return originalAddEventListener.call(this, type, listener, options);
  };

  /**
   * Override removeEventListener to handle blocked events
   * If website tries to remove a listener we blocked, pretend it worked
   */
  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    // Check if this is a blocked event type
    if (ALWAYS_BLOCKED_EVENTS.has(type) ||
        (WINDOW_DOC_BLOCKED_EVENTS.has(type) &&
          (this === window || this === document))) {
      // Debug logging (optional)
      if (DEBUG_PRIVACY_GUARD) {
        safeLog(`[Privacy Guard] '${type}' event listener removal prevented.`);
      }

      // Only try to access WeakMap if 'this' is an object
      if (this && typeof this === 'object') {
        try {
          const targetListeners = blockedListeners.get(this);
          if (targetListeners?.has(type)) {
            const listeners = targetListeners.get(type);
            const index = listeners.findIndex(l => l.listener === listener);
            if (index !== -1) {
              listeners.splice(index, 1);
            }
          }
        } catch (e) {
          // Silently ignore WeakMap errors
        }
      }
      // Silently return
      return;
    }

    // Allow normal removeEventListener for other events
    return originalRemoveEventListener.call(this, type, listener, options);
  };

  // ============================================================================
  // SECTION 2.5: BLOCK DIRECT EVENT PROPERTY ASSIGNMENTS
  // ============================================================================

  /**
   * Block direct event property assignments (e.g., window.onfocus = ...)
   * Some websites use this older method instead of addEventListener
   */
  const eventProperties = [
    'onvisibilitychange',
    'onwebkitvisibilitychange',
    'onmozvisibilitychange',
    'onmsvisibilitychange',
    'onblur',
    'onfocus',
    'onfocusin',
    'onfocusout',
    'onpagehide',
    'onpageshow'
  ];

  // Override on window
  eventProperties.forEach(prop => {
    let value = null;
    Object.defineProperty(window, prop, {
      configurable: true,
      enumerable: true,
      get: function() {
        return value;
      },
      set: function(newValue) {
        if (DEBUG_PRIVACY_GUARD) {
          safeLog(`[Privacy Guard] Blocked direct property assignment: window.${prop}`);
        }
        // Silently ignore the assignment
        value = null;
      }
    });
  });

  // Override on document
  eventProperties.forEach(prop => {
    let value = null;
    Object.defineProperty(document, prop, {
      configurable: true,
      enumerable: true,
      get: function() {
        return value;
      },
      set: function(newValue) {
        if (DEBUG_PRIVACY_GUARD) {
          safeLog(`[Privacy Guard] Blocked direct property assignment: document.${prop}`);
        }
        // Silently ignore the assignment
        value = null;
      }
    });
  });

  // ============================================================================
  // SECTION 2.7: CLIPBOARD & SELECTION PROTECTION
  // ============================================================================

  /**
   * Prevent websites from blocking copy/paste or detecting clipboard usage
   * Enables copy/paste even on protected content
   */
  function protectClipboard() {
    // List of clipboard events that websites try to block
    const clipboardEvents = ['copy', 'cut', 'paste', 'beforecopy', 'beforecut', 'beforepaste'];

    // Intercept clipboard events in capture phase (before page handlers)
    clipboardEvents.forEach(eventType => {
      document.addEventListener(eventType, function(e) {
        // Stop the event from reaching page handlers that might block it
        e.stopImmediatePropagation();

        if (DEBUG_PRIVACY_GUARD) {
          safeLog(`[Privacy Guard] Protected clipboard event: ${eventType}`);
        }
      }, true); // 'true' = capture phase (runs before page handlers)
    });

    // Block websites from setting oncopy/oncut/onpaste handlers
    ['oncopy', 'oncut', 'onpaste'].forEach(prop => {
      let value = null;
      Object.defineProperty(document, prop, {
        configurable: true,
        enumerable: true,
        get: function() {
          return value;
        },
        set: function(newValue) {
          if (DEBUG_PRIVACY_GUARD) {
            safeLog(`[Privacy Guard] Blocked clipboard blocker: ${prop}`);
          }
          // Silently discard the blocker
          value = null;
        }
      });

      // Also block on window
      Object.defineProperty(window, prop, {
        configurable: true,
        enumerable: true,
        get: function() {
          return value;
        },
        set: function(newValue) {
          if (DEBUG_PRIVACY_GUARD) {
            safeLog(`[Privacy Guard] Blocked clipboard blocker: window.${prop}`);
          }
          value = null;
        }
      });
    });

    // Prevent text selection blocking
    Object.defineProperty(document, 'onselectstart', {
      configurable: true,
      enumerable: true,
      get: function() {
        return null;
      },
      set: function(newValue) {
        if (DEBUG_PRIVACY_GUARD) {
          safeLog('[Privacy Guard] Blocked text selection blocker: document.onselectstart');
        }
        // Don't set the blocker
      }
    });

    Object.defineProperty(window, 'onselectstart', {
      configurable: true,
      enumerable: true,
      get: function() {
        return null;
      },
      set: function(newValue) {
        if (DEBUG_PRIVACY_GUARD) {
          safeLog('[Privacy Guard] Blocked text selection blocker: window.onselectstart');
        }
      }
    });

    // Block oncontextmenu (right-click blocking)
    Object.defineProperty(document, 'oncontextmenu', {
      configurable: true,
      enumerable: true,
      get: function() {
        return null;
      },
      set: function(newValue) {
        if (DEBUG_PRIVACY_GUARD) {
          safeLog('[Privacy Guard] Blocked context menu blocker: document.oncontextmenu');
        }
      }
    });

    Object.defineProperty(window, 'oncontextmenu', {
      configurable: true,
      enumerable: true,
      get: function() {
        return null;
      },
      set: function(newValue) {
        if (DEBUG_PRIVACY_GUARD) {
          safeLog('[Privacy Guard] Blocked context menu blocker: window.oncontextmenu');
        }
      }
    });

    // Override getComputedStyle to force user-select to be enabled
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(element, pseudoElt) {
      const styles = originalGetComputedStyle.call(this, element, pseudoElt);

      // Create a proxy to intercept property access
      const originalGetPropertyValue = styles.getPropertyValue.bind(styles);

      styles.getPropertyValue = function(property) {
        // Force text selection to be allowed
        if (property === 'user-select' ||
            property === '-webkit-user-select' ||
            property === '-moz-user-select' ||
            property === '-ms-user-select') {
          return 'text'; // Always allow text selection
        }

        // Force pointer events to be enabled (some sites disable to prevent selection)
        if (property === 'pointer-events') {
          const originalValue = originalGetPropertyValue(property);
          if (originalValue === 'none') {
            return 'auto'; // Enable pointer events
          }
        }

        return originalGetPropertyValue(property);
      };

      return styles;
    };

    if (DEBUG_PRIVACY_GUARD) {
      safeLog('[Privacy Guard] Clipboard and selection protection enabled');
    }
  }

  // ============================================================================
  // SECTION 3: AI HONEYPOT DETECTION & REMOVAL
  // ============================================================================

  /**
   * Check if element appears to be an AI honeypot
   * Honeypots are hidden elements with text designed to trick AI tools
   *
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element looks like a honeypot
   */
  function isHoneypot(element) {
    try {
      const style = window.getComputedStyle(element);

      // Check if element is visually hidden
      const isHidden =
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0' ||
        parseFloat(style.fontSize) === 0 ||
        element.offsetWidth === 0 ||
        element.offsetHeight === 0;

      if (!isHidden) {
        return false;
      }

      // Check for honeypot indicator text
      const text = element.textContent.toLowerCase();
      const honeypotKeywords = [
        'ignore',
        'disregard',
        'ai',
        'bot',
        'assistant',
        'llm',
        'gpt',
        'claude',
        'chatbot',
        'do not',
        'donot'
      ];

      return honeypotKeywords.some(keyword => text.includes(keyword));
    } catch {
      return false;
    }
  }

  /**
   * Remove existing AI honeypot elements from the page
   */
  function cleanHoneypots() {
    // Remove hidden spans (common honeypot technique)
    const hiddenSpans = document.querySelectorAll('span[aria-hidden="true"]');
    hiddenSpans.forEach(span => {
      if (isHoneypot(span)) {
        span.remove();
      }
    });

    // Remove meta tags that could leak info to AI
    const aiMetaTags = document.querySelectorAll(
      'meta[name*="ai-"], meta[name*="bot-"], meta[name*="captcha"]'
    );
    aiMetaTags.forEach(meta => {
      const content = meta.getAttribute('content')?.toLowerCase() || '';
      if (content.includes('detect') || content.includes('prevent')) {
        meta.remove();
      }
    });

    // Remove hidden divs with honeypot patterns
    const hiddenDivs = document.querySelectorAll('div[style*="display: none"], div[style*="visibility: hidden"]');
    hiddenDivs.forEach(div => {
      if (isHoneypot(div)) {
        div.remove();
      }
    });

    // Canvas/Instructure-specific honeypot removal
    // Target: #content-wrapper .description.user_content.enhanced[data-resource-type="assignment.body"]
    const canvasTarget = document.querySelector('#content-wrapper .description.user_content.enhanced[data-resource-type="assignment.body"]');
    if (canvasTarget) {
      const canvasSpans = canvasTarget.querySelectorAll('span[aria-hidden="true"]');
      canvasSpans.forEach(span => {
        try {
          span.remove();
        } catch (e) {
          // Fallback to hiding if removal fails
          span.style.display = 'none';
        }
      });
      if (DEBUG_PRIVACY_GUARD) {
        safeLog('[Privacy Guard] Canvas honeypot protection applied');
      }
    }
  }

  /**
   * Monitor DOM for new honeypots being added dynamically
   * Uses MutationObserver to catch honeypots added after page load
   */
  function watchForHoneypots() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check the node itself
            if (node.hasAttribute?.('aria-hidden') && isHoneypot(node)) {
              node.remove();
              continue;
            }

            // Check for honeypot children
            try {
              const hiddenChildren = node.querySelectorAll?.(
                'span[aria-hidden="true"], div[style*="display: none"]'
              );
              hiddenChildren?.forEach(child => {
                if (isHoneypot(child)) {
                  child.remove();
                }
              });
            } catch {
              // Ignore errors from removed nodes
            }
          }
        }
      }
    });

    // Start observing when DOM is ready
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    } else {
      // Wait for documentElement if not ready
      const intervalId = setInterval(() => {
        if (document.documentElement) {
          clearInterval(intervalId);
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true
          });
        }
      }, 10);
    }
  }

  // ============================================================================
  // SECTION 4: INITIALIZATION
  // ============================================================================

  /**
   * Check if this is a Canvas/Instructure site that needs extra protection
   */
  function checkCanvasSite() {
    // Check for Canvas meta tag (Apple iTunes app indicator)
    const metaElement = document.querySelector('meta[name="apple-itunes-app"][content="app-id=480883488"]');
    return !!metaElement;
  }

  /**
   * Initialize privacy protection immediately
   * Runs as soon as script loads (document_start)
   */
  function init() {
    // Check if this is a Canvas site
    const isCanvasSite = checkCanvasSite();

    if (isCanvasSite && DEBUG_PRIVACY_GUARD) {
      safeLog('[Privacy Guard] Canvas/Instructure site detected - Enhanced protection active');
    }

    // Enable clipboard and selection protection
    protectClipboard();

    // Clean existing honeypots
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cleanHoneypots);
    } else {
      cleanHoneypots();
    }

    // Watch for new honeypots (always enabled, more aggressive on Canvas)
    watchForHoneypots();

    if (DEBUG_PRIVACY_GUARD) {
      safeLog('[Privacy Guard] Initialization complete');
      safeLog('  - Visibility APIs: Overridden');
      safeLog('  - Event blocking: Active');
      safeLog('  - Clipboard protection: Active');
      safeLog('  - Text selection: Enabled');
      safeLog('  - Right-click: Enabled');
      safeLog('  - Honeypot protection: Active');
      safeLog(`  - Events always blocked: ${Array.from(ALWAYS_BLOCKED_EVENTS).join(', ')}`);
      safeLog(`  - Events blocked on window/document: ${Array.from(WINDOW_DOC_BLOCKED_EVENTS).join(', ')}`);
    }
  }

  // Run initialization
  init();

})();
