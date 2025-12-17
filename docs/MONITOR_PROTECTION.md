# 🔍 Privacy Guard Monitor

## Continuous Monitoring Script

Paste this into the console to continuously monitor Privacy Guard protection:

```javascript
// Privacy Guard Continuous Monitor
(function() {
    console.log('🔍 Starting Privacy Guard Monitor...');
    console.log('This will alert you if protection fails.\n');

    let checkCount = 0;
    let failureCount = 0;

    // Initial status
    console.log('Initial State:');
    console.log('  visibilityState:', document.visibilityState);
    console.log('  hidden:', document.hidden);
    console.log('  hasFocus():', document.hasFocus());
    console.log('\nMonitoring every 2 seconds...\n');

    const monitor = setInterval(() => {
        checkCount++;

        // Check if any protected value changed to "bad" state
        const visibilityBad = document.visibilityState !== 'visible';
        const hiddenBad = document.hidden !== false;
        const focusBad = document.hasFocus() !== true;

        if (visibilityBad || hiddenBad || focusBad) {
            failureCount++;

            console.error('⚠️ PROTECTION BREACH DETECTED! ⚠️');
            console.error(`Check #${checkCount}:`);

            if (visibilityBad) {
                console.error(`  ❌ visibilityState changed to: "${document.visibilityState}"`);
            }
            if (hiddenBad) {
                console.error(`  ❌ hidden changed to: ${document.hidden}`);
            }
            if (focusBad) {
                console.error(`  ❌ hasFocus() changed to: ${document.hasFocus()}`);
            }

            console.error(`  Total failures: ${failureCount}`);
            console.error('');

            // Play alert sound (browser will beep)
            console.log('\a'); // Bell character
        } else {
            // Silent check - only log every 10 checks
            if (checkCount % 10 === 0) {
                console.log(`✅ Check #${checkCount}: All protected (${failureCount} failures so far)`);
            }
        }
    }, 2000); // Check every 2 seconds

    // Save monitor ID for stopping later
    window.privacyMonitor = monitor;

    console.log('Monitor started! To stop: clearInterval(window.privacyMonitor)');
    console.log('Switch tabs, click away, minimize window - I\'ll watch for breaches!\n');
})();
```

## What This Does

- ✅ Checks every 2 seconds
- ✅ Alerts immediately if any protected value changes
- ✅ Shows which specific value failed
- ✅ Counts total failures
- ✅ Logs status every 10 checks if all is good

## Expected Output

### If Privacy Guard is Working:
```
🔍 Starting Privacy Guard Monitor...
This will alert you if protection fails.

Initial State:
  visibilityState: visible
  hidden: false
  hasFocus(): true

Monitoring every 2 seconds...

✅ Check #10: All protected (0 failures so far)
✅ Check #20: All protected (0 failures so far)
✅ Check #30: All protected (0 failures so far)
```

### If Privacy Guard Fails:
```
⚠️ PROTECTION BREACH DETECTED! ⚠️
Check #5:
  ❌ visibilityState changed to: "hidden"
  ❌ hidden changed to: true
  Total failures: 1
```

## How to Test

1. **Start the monitor** (paste script above)
2. **Switch to another tab** for a few seconds
3. **Come back** to the console

**Expected:** No breach alerts (all checks show ✅)
**If it fails:** You'll see ❌ alerts showing what changed

## Stop Monitoring

To stop the monitor:
```javascript
clearInterval(window.privacyMonitor);
console.log('Monitor stopped');
```

## Event Detection Monitor

Want to monitor if events are being blocked? Use this:

```javascript
// Event Blocking Monitor
(function() {
    console.log('🎯 Monitoring Event Blocking...\n');

    const events = ['blur', 'focus', 'visibilitychange', 'focusin', 'focusout'];
    let eventCounts = {};

    events.forEach(eventType => {
        eventCounts[eventType] = 0;

        window.addEventListener(eventType, () => {
            eventCounts[eventType]++;
            console.error(`❌ ${eventType} event FIRED! (Count: ${eventCounts[eventType]})`);
            console.error('   Privacy Guard failed to block this event!');
        });

        document.addEventListener(eventType, () => {
            eventCounts[eventType]++;
            console.error(`❌ ${eventType} event FIRED on document! (Count: ${eventCounts[eventType]})`);
        });
    });

    console.log('Registered listeners for:', events.join(', '));
    console.log('\nIf Privacy Guard is working, these events will NEVER fire.');
    console.log('Try switching tabs, clicking away, etc.\n');

    // Status check every 10 seconds
    setInterval(() => {
        const totalEvents = Object.values(eventCounts).reduce((a, b) => a + b, 0);
        if (totalEvents === 0) {
            console.log('✅ Still protected - no events detected');
        } else {
            console.error(`❌ ${totalEvents} events detected - Privacy Guard FAILING!`);
            console.error('Event counts:', eventCounts);
        }
    }, 10000);
})();
```

## Combined Monitor (All-in-One)

For complete monitoring, use this comprehensive script:

```javascript
// Complete Privacy Guard Monitor
(function() {
    console.log('═══════════════════════════════════════');
    console.log('   🛡️ PRIVACY GUARD MONITOR ACTIVE');
    console.log('═══════════════════════════════════════\n');

    // 1. Monitor API values
    let apiChecks = 0;
    let apiFailures = 0;

    const apiMonitor = setInterval(() => {
        apiChecks++;
        const bad = document.visibilityState !== 'visible' ||
                    document.hidden !== false ||
                    document.hasFocus() !== true;

        if (bad) {
            apiFailures++;
            console.error(`⚠️ API BREACH #${apiFailures}:`);
            console.error('  visibilityState:', document.visibilityState);
            console.error('  hidden:', document.hidden);
            console.error('  hasFocus():', document.hasFocus());
        }
    }, 2000);

    // 2. Monitor blocked events
    const blockedEvents = ['blur', 'focus', 'visibilitychange', 'focusin', 'focusout', 'pagehide', 'pageshow'];
    let eventsFired = 0;

    blockedEvents.forEach(evt => {
        window.addEventListener(evt, () => {
            eventsFired++;
            console.error(`❌ EVENT LEAKED: "${evt}" fired! (Total: ${eventsFired})`);
        });
    });

    // 3. Status report every 10 seconds
    setInterval(() => {
        console.log('\n─── STATUS REPORT ───');
        console.log(`API Checks: ${apiChecks} | Failures: ${apiFailures}`);
        console.log(`Events Blocked: ${eventsFired === 0 ? '✅ All' : `❌ ${eventsFired} leaked`}`);

        if (apiFailures === 0 && eventsFired === 0) {
            console.log('🎉 Privacy Guard: FULLY OPERATIONAL');
        } else {
            console.error('⚠️ Privacy Guard: COMPROMISED');
        }
        console.log('─────────────────────\n');
    }, 10000);

    console.log('✅ Monitor active - watching for breaches...');
    console.log('Try: Switch tabs, minimize window, click away\n');

    // Save cleanup function
    window.stopPrivacyMonitor = () => {
        clearInterval(apiMonitor);
        console.log('Monitor stopped');
    };
})();
```

## Quick One-Liner Test

Just want a quick check right now?

```javascript
console.log('Protection:', document.visibilityState === 'visible' && document.hidden === false && document.hasFocus() === true ? '✅ ACTIVE' : '❌ FAILED');
```

---

## Usage Recommendations

### During Development
Use the **Combined Monitor** to watch everything

### During Real Use
Use the **API Monitor** (first script) - runs quietly, alerts on problems

### Quick Checks
Use the **One-Liner** - instant status

All monitors run silently in the background and only alert you if something breaks! 🛡️
