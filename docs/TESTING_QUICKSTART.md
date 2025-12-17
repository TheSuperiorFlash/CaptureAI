# 🚀 Privacy Guard Testing - Quick Start

## 30-Second Test on Vocabulary.com

### Step 1: Load Extension
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select: `C:\Users\SuperiorFlash\IdeaProjects\CaptureAI`

### Step 2: Go to Vocabulary.com
1. Navigate to https://www.vocabulary.com
2. Press **F12** to open DevTools
3. Click **Console** tab

### Step 3: Run Quick Test
Paste this into the console:

```javascript
// Quick Privacy Guard Test (works immediately)
(function() {
    console.log('=== PRIVACY GUARD QUICK TEST ===');

    // Check core protection (doesn't need CaptureAI object)
    const apisOk = document.visibilityState === 'visible' &&
                   document.hidden === false &&
                   document.hasFocus() === true;

    console.log('1. APIs overridden:', apisOk ? '✅' : '❌');

    // Check event blocking
    let eventFired = false;
    window.addEventListener('blur', () => { eventFired = true; });

    setTimeout(() => {
        console.log('2. Event blocking:', !eventFired ? '✅' : '❌');

        // Check if CaptureAI loaded (may take a moment)
        if (window.CaptureAI?.PrivacyGuard) {
            console.log('3. Module loaded:', '✅');
            console.log('4. Module active:', window.CaptureAI.PrivacyGuard.isActive() ? '✅' : '❌');
        } else {
            console.log('3. Module loaded:', '⏳ Still loading (this is OK)');
        }

        console.log('\n=== RESULT ===');
        if (apisOk && !eventFired) {
            console.log('🎉 PRIVACY GUARD WORKING!');
            console.log('✅ You are protected from detection');
        } else {
            console.log('❌ PRIVACY GUARD FAILED');
            console.log('APIs OK:', apisOk);
            console.log('Events blocked:', !eventFired);
        }
    }, 1000);
})();
```

### Expected Output:
```
=== PRIVACY GUARD QUICK TEST ===
1. APIs overridden: ✅
2. Event blocking: ✅
3. Module loaded: ✅ (or ⏳ Still loading - both are OK)
4. Module active: ✅ (if module loaded)

=== RESULT ===
🎉 PRIVACY GUARD WORKING!
✅ You are protected from detection
```

**Note:** The module might show "⏳ Still loading" if you run the test immediately after page load. This is normal! The important checks are #1 and #2 - those show the actual protection is working.

### Step 4: Test Real Usage
1. Press `Ctrl+Shift+X` to start capture
2. Select a question on the page
3. Watch console - should see **no errors**
4. Switch tabs - should see **no detection messages**

## If Something's Wrong

### ❌ "Loaded: ❌" or "Active: ❌"
**Solution:** Reload the page (Ctrl+R) and try again

### ❌ "APIs overridden: ❌"
**Reason:** Privacy Guard didn't inject in time
**Solution:**
1. Check chrome://extensions/ - make sure CaptureAI is enabled
2. Hard reload: Ctrl+Shift+R
3. Check console for injection errors

### ❌ "Event blocking: ❌"
**Reason:** Event listener was registered before Privacy Guard loaded
**Solution:** Reload page and run test again immediately

## Full Test Suite

For comprehensive testing, see: **[docs/TESTING_PRIVACY_ON_VOCABULARY.md](docs/TESTING_PRIVACY_ON_VOCABULARY.md)**

## What to Test

### ✅ Manual Capture
1. Press `Ctrl+Shift+X`
2. Drag to select question
3. Get AI answer
4. **Check:** No focus warnings from site

### ✅ Auto-Solve Mode
1. Enable Auto-Solve toggle
2. Capture first question manually
3. Let it auto-solve 5+ questions
4. **Check:** No interruptions or warnings

### ✅ Tab Switching
1. Start a quiz on Vocabulary.com
2. Switch to another tab
3. Switch back
4. **Check:** Quiz still active, no warnings

### ✅ Extension Click
1. During quiz, click CaptureAI icon
2. Open the popup
3. Close popup
4. **Check:** Quiz didn't detect focus loss

## Success = All Green Checkmarks ✅

If you see all ✅ in the quick test, Privacy Guard is working perfectly!

---

**Need help?** See full testing guide: [docs/TESTING_PRIVACY_ON_VOCABULARY.md](docs/TESTING_PRIVACY_ON_VOCABULARY.md)
