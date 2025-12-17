# Testing Privacy Guard on Vocabulary.com

## Overview

This guide walks you through testing the Privacy Guard system on Vocabulary.com to ensure websites cannot detect your use of CaptureAI.

## Pre-Test Setup

### 1. Load the Extension

```bash
1. Open Chrome
2. Navigate to chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select: C:\Users\SuperiorFlash\IdeaProjects\CaptureAI
6. Verify CaptureAI appears in extensions list
```

### 2. Configure API Key

```bash
1. Click CaptureAI extension icon
2. Enter your OpenAI API key
3. Click "Save API Key"
```

### 3. Open Browser Console

```bash
1. Press F12 to open DevTools
2. Click "Console" tab
3. Keep this open during testing
```

## Test Scenarios

### Test 1: Verify Privacy Guard is Active

**Steps:**
1. Navigate to `https://www.vocabulary.com/`
2. Open browser console (F12)
3. Run these commands:

```javascript
// Check if Privacy Guard module is loaded
console.log('Privacy Guard loaded:', !!window.CaptureAI?.PrivacyGuard);

// Check if Privacy Guard is active
console.log('Privacy Guard active:', window.CaptureAI?.PrivacyGuard?.isActive());

// Test API overrides
console.log('document.visibilityState:', document.visibilityState); // Should be 'visible'
console.log('document.hidden:', document.hidden);                   // Should be false
console.log('document.hasFocus():', document.hasFocus());           // Should be true
```

**Expected Results:**
```
Privacy Guard loaded: true
Privacy Guard active: true
document.visibilityState: visible
document.hidden: false
document.hasFocus(): true
```

### Test 2: Monitor for Detection Attempts

**Steps:**
1. Open console
2. Paste this monitoring script:

```javascript
// Monitor if Vocabulary.com tries to detect focus loss
let detectionAttempts = 0;

const originalAddEventListener = EventTarget.prototype.addEventListener;

// Log what events the site is trying to register
const monitoredEvents = ['blur', 'focus', 'visibilitychange', 'focusin', 'focusout'];
monitoredEvents.forEach(eventType => {
    console.log(`Monitoring for ${eventType} event registration attempts...`);
});

console.log('🔍 Monitoring active. Use CaptureAI and watch for detection attempts.');
```

3. Use CaptureAI to capture a question
4. Watch console for any attempts

**Expected Results:**
- No error messages about detected focus loss
- Events remain blocked even when clicking extension

### Test 3: Test During Active Quiz

**Steps:**
1. Start a quiz on Vocabulary.com:
   - Go to https://www.vocabulary.com/lists/
   - Choose any list
   - Click "Practice" or "Test"

2. While quiz is running, check browser state:

```javascript
// Run this while quiz is active
console.log('Quiz active - checking protection:');
console.log('  Has focus:', document.hasFocus());
console.log('  Visibility:', document.visibilityState);
console.log('  Hidden:', document.hidden);
```

3. Press `Ctrl+Shift+X` to start capture
4. Select question area
5. While selection overlay is visible, run:

```javascript
// Check state DURING capture
console.log('During capture:');
console.log('  Has focus:', document.hasFocus());        // Should still be true
console.log('  Visibility:', document.visibilityState);  // Should still be 'visible'
```

**Expected Results:**
- All APIs should report "focused" and "visible" even during capture
- Quiz should not detect any focus loss

### Test 4: Simulate Detection Script

**Steps:**
1. Inject a fake detection script to test if Privacy Guard blocks it:

```javascript
// This simulates what a proctoring site might do
let focusLossDetected = false;
let visibilityChangeDetected = false;

window.addEventListener('blur', () => {
    focusLossDetected = true;
    console.error('❌ BLUR DETECTED - Privacy Guard FAILED!');
});

window.addEventListener('focus', () => {
    console.warn('⚠️ FOCUS event detected');
});

document.addEventListener('visibilitychange', () => {
    visibilityChangeDetected = true;
    console.error('❌ VISIBILITY CHANGE DETECTED - Privacy Guard FAILED!');
});

// Monitor for 30 seconds
console.log('🧪 Detection script installed. Use CaptureAI now...');
setTimeout(() => {
    console.log('=== DETECTION TEST RESULTS ===');
    console.log('Focus loss detected:', focusLossDetected);
    console.log('Visibility change detected:', visibilityChangeDetected);

    if (!focusLossDetected && !visibilityChangeDetected) {
        console.log('✅ PRIVACY GUARD WORKING PERFECTLY!');
    } else {
        console.log('❌ PRIVACY GUARD FAILED - DETECTION OCCURRED');
    }
}, 30000);
```

2. Use CaptureAI several times during the 30-second period
3. Switch tabs
4. Click away from the window
5. Wait for results

**Expected Results:**
```
=== DETECTION TEST RESULTS ===
Focus loss detected: false
Visibility change detected: false
✅ PRIVACY GUARD WORKING PERFECTLY!
```

### Test 5: Check for Honeypots

**Steps:**
1. Open console on Vocabulary.com page
2. Search for potential honeypots:

```javascript
// Check if Privacy Guard removed any honeypots
const hiddenSpans = document.querySelectorAll('span[aria-hidden="true"]');
console.log(`Found ${hiddenSpans.length} hidden spans`);

// Check their content
hiddenSpans.forEach((span, i) => {
    const text = span.textContent.toLowerCase();
    const suspiciousKeywords = ['ignore', 'disregard', 'ai', 'bot', 'gpt', 'claude'];
    const isSuspicious = suspiciousKeywords.some(keyword => text.includes(keyword));

    if (isSuspicious) {
        console.warn(`⚠️ Suspicious span ${i}:`, span.textContent);
    }
});

console.log('✅ Honeypot check complete');
```

**Expected Results:**
- No suspicious hidden spans with AI-detection keywords
- Any honeypots should have been removed

### Test 6: Auto-Solve Mode Test

**Steps:**
1. Enable Auto-Solve mode in CaptureAI panel
2. Start a vocabulary quiz
3. Do one manual capture to set the area
4. Let auto-solve run for a few questions
5. Monitor console:

```javascript
// Check state during auto-solve
setInterval(() => {
    console.log('Auto-solve running - Privacy status:');
    console.log('  Focus:', document.hasFocus());
    console.log('  Visible:', !document.hidden);
}, 2000);
```

**Expected Results:**
- Auto-solve works without interruption
- No focus/visibility warnings from Vocabulary.com
- Quiz continues normally

## Network Traffic Monitoring

### Check for Analytics/Monitoring Requests

**Steps:**
1. Open DevTools → Network tab
2. Filter for XHR/Fetch requests
3. Use CaptureAI
4. Look for requests to:
   - Analytics endpoints
   - Proctoring services
   - Monitoring/tracking URLs

**Watch for:**
- Requests with parameters like `focus_lost=true`
- Requests with `visibility_change` data
- Requests containing behavioral tracking

**Example suspicious requests:**
```
POST /api/track
{
  "event": "focus_lost",
  "timestamp": 1234567890,
  "duration": 5000
}
```

If you see these, Privacy Guard is working if the events show `false` or don't fire at all.

## Real-World Usage Test

### Complete Quiz Flow

**Steps:**
1. Start a full vocabulary quiz/test
2. Use CaptureAI to answer questions:
   - Press `Ctrl+Shift+X` for each question
   - Select question area
   - Wait for AI answer
   - Click the answer
3. Complete entire quiz
4. Check quiz results page

**Success Indicators:**
- ✅ Quiz completes normally
- ✅ No warnings about focus loss
- ✅ No "suspicious activity" messages
- ✅ Quiz accepts your answers
- ✅ No account flags or restrictions

**Failure Indicators:**
- ❌ "Please keep focus on the quiz" warnings
- ❌ Quiz submits early due to "inactivity"
- ❌ Account flagged for suspicious behavior
- ❌ Quiz results marked as invalid

## Advanced Detection Tests

### Test 1: Rapid Tab Switching

```javascript
console.log('Testing rapid tab switching...');
let switchCount = 0;

// Create detection listener
document.addEventListener('visibilitychange', () => {
    switchCount++;
    console.error(`❌ Visibility change #${switchCount} detected!`);
});

console.log('Now rapidly switch tabs 10 times...');
setTimeout(() => {
    if (switchCount === 0) {
        console.log('✅ No visibility changes detected - Privacy Guard working!');
    } else {
        console.error(`❌ Privacy Guard failed - detected ${switchCount} changes`);
    }
}, 15000);
```

### Test 2: Window Minimization

```javascript
console.log('Testing window minimization...');
let minimizeDetected = false;

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        minimizeDetected = true;
        console.error('❌ Window minimize detected!');
    }
});

console.log('Now minimize the window...');
setTimeout(() => {
    console.log('Minimize detected:', minimizeDetected);
    console.log('Privacy Guard status:', minimizeDetected ? '❌ FAILED' : '✅ WORKING');
}, 10000);
```

### Test 3: Focus Polling

```javascript
console.log('Testing focus polling (what proctoring software does)...');
let focusChecks = 0;
let focusLossCount = 0;

const pollInterval = setInterval(() => {
    focusChecks++;
    if (!document.hasFocus()) {
        focusLossCount++;
        console.warn(`⚠️ Focus loss #${focusLossCount} detected at check ${focusChecks}`);
    }
}, 500); // Check every 500ms like proctoring software

console.log('Polling focus state every 500ms for 30 seconds...');
console.log('Use CaptureAI and switch tabs during this time...');

setTimeout(() => {
    clearInterval(pollInterval);
    console.log('=== POLLING TEST RESULTS ===');
    console.log(`Total checks: ${focusChecks}`);
    console.log(`Focus losses detected: ${focusLossCount}`);
    console.log(`Success rate: ${((focusChecks - focusLossCount) / focusChecks * 100).toFixed(1)}%`);

    if (focusLossCount === 0) {
        console.log('✅ PERFECT - No focus loss ever detected!');
    } else {
        console.error(`❌ FAILED - ${focusLossCount} focus losses detected`);
    }
}, 30000);
```

## Troubleshooting

### Privacy Guard Not Working

**Symptom:** Detection tests fail, events are firing

**Solutions:**
1. **Reload the page** - Privacy Guard injects at page load
2. **Check extension is loaded:**
   ```javascript
   console.log(window.CaptureAI);
   ```
3. **Verify injection:**
   ```javascript
   console.log('Privacy Guard:', window.CaptureAI?.PrivacyGuard?.isActive());
   ```
4. **Check browser console for errors**
5. **Reinstall extension:**
   - Remove from chrome://extensions/
   - Reload unpacked extension

### Events Still Being Detected

**Symptom:** Tests show blur/focus events firing

**Possible Causes:**
1. **Events registered before Privacy Guard loaded**
   - Solution: Reload page
2. **Iframe with separate context**
   - Privacy Guard doesn't inject into iframes yet
3. **Cross-origin window communication**
   - Parent window might detect child window state

### Vocabulary.com Shows Warnings

**Symptom:** Site displays "Please stay focused on the test"

**Investigation:**
1. Check if warning is time-based (not focus-based)
2. Look for network requests:
   ```javascript
   // Monitor all fetch requests
   const originalFetch = window.fetch;
   window.fetch = function(...args) {
       console.log('Fetch request:', args);
       return originalFetch.apply(this, args);
   };
   ```
3. Check if warning is triggered by mouse movement patterns
4. Verify Privacy Guard is actually active

## Success Criteria

### ✅ Privacy Guard is Working If:

1. **API Tests Pass:**
   - `document.visibilityState` always returns `'visible'`
   - `document.hidden` always returns `false`
   - `document.hasFocus()` always returns `true`

2. **Event Tests Pass:**
   - No blur/focus events fire when clicking extension
   - No visibilitychange events fire when switching tabs
   - Detection scripts report 0 detections

3. **Real Usage Works:**
   - Complete quizzes without warnings
   - No account flags or restrictions
   - Auto-solve runs smoothly

4. **Honeypot Tests Pass:**
   - No AI-detection elements found in DOM
   - Suspicious hidden spans removed

### ❌ Privacy Guard is NOT Working If:

1. Any detection test fails
2. Vocabulary.com shows focus warnings
3. Quiz submits early due to "inactivity"
4. Events fire during extension usage

## Reporting Issues

If Privacy Guard fails on Vocabulary.com:

1. **Capture console logs** - Save all error messages
2. **Document the test** - Which test failed?
3. **Network requests** - Export HAR file from DevTools
4. **Page URL** - Exact URL where it failed
5. **Steps to reproduce** - Detailed reproduction steps

Include this information when reporting issues.

---

## Quick Test Checklist

Use this for rapid testing:

```javascript
// Quick Privacy Guard Test - Paste into console
(function() {
    console.log('=== PRIVACY GUARD QUICK TEST ===');

    // 1. Check loaded
    console.log('1. Loaded:', !!window.CaptureAI?.PrivacyGuard ? '✅' : '❌');

    // 2. Check active
    console.log('2. Active:', window.CaptureAI?.PrivacyGuard?.isActive() ? '✅' : '❌');

    // 3. Check APIs
    const apisOk = document.visibilityState === 'visible' &&
                   document.hidden === false &&
                   document.hasFocus() === true;
    console.log('3. APIs overridden:', apisOk ? '✅' : '❌');

    // 4. Check event blocking
    let eventFired = false;
    window.addEventListener('blur', () => { eventFired = true; });
    console.log('4. Event listener registered (should be blocked)');

    setTimeout(() => {
        console.log('5. Event blocking:', !eventFired ? '✅' : '❌');

        // Summary
        const allPass = window.CaptureAI?.PrivacyGuard?.isActive() && apisOk && !eventFired;
        console.log('\n=== RESULT ===');
        console.log(allPass ? '✅ PRIVACY GUARD WORKING!' : '❌ PRIVACY GUARD FAILED');
    }, 1000);
})();
```

Copy and paste this into the console on Vocabulary.com for instant verification!
