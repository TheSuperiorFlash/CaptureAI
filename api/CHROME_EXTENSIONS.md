# Chrome Extension Configuration

This document explains how to configure multiple Chrome extension IDs for your CaptureAI backend.

## Overview

The backend supports multiple Chrome extension IDs to allow both:
- **Production extension** (published on Chrome Web Store)
- **Development/testing extensions** (unpacked local versions)

## Current Configuration

**File:** `api/wrangler.toml`

```toml
CHROME_EXTENSION_IDS = "idpdleplccjjbmdmjkpmmkecmoeomnjd,pnlbkbjpefcjfaidkmickcaicecbkdio"
```

### Configured Extensions

| Type | Extension ID | Purpose |
|------|-------------|---------|
| Production | `idpdleplccjjbmdmjkpmmkecmoeomnjd` | Published on Chrome Web Store |
| Development | `pnlbkbjpefcjfaidkmickcaicecbkdio` | Local unpacked extension for testing |

## How It Works

1. **Comma-separated list:** Multiple extension IDs are separated by commas
2. **Whitespace handling:** Spaces are automatically trimmed, so you can format it as:
   - `"id1,id2,id3"` (compact)
   - `"id1, id2, id3"` (readable - spaces will be trimmed)
3. **Security:** Only the exact extension IDs in this list can access the backend
4. **Development mode:** When `ENVIRONMENT=development`, ALL extensions are allowed for easier testing

## Adding New Extension IDs

### Step 1: Find Extension ID

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Find your extension and copy the ID (it will be a 32-character string like `abcdefghijklmnopqrstuvwxyz123456`)

### Step 2: Update Configuration

Edit `api/wrangler.toml`:

```toml
# Add the new ID to the comma-separated list
CHROME_EXTENSION_IDS = "idpdleplccjjbmdmjkpmmkecmoeomnjd,pnlbkbjpefcjfaidkmickcaicecbkdio,NEW_EXTENSION_ID_HERE"
```

### Step 3: Deploy

```bash
cd backend
wrangler deploy
```

## Security Considerations

### ✅ Best Practices

- **Whitelist only trusted extensions:** Only add extension IDs you control
- **Remove old IDs:** When retiring an extension version, remove its ID from the list
- **Monitor logs:** Check Cloudflare Workers logs for unauthorized access attempts

### ⚠️ Security Rules

The backend enforces these CORS rules:

1. **Production mode:** ONLY the exact extension IDs in `CHROME_EXTENSION_IDS` are allowed
2. **Development mode:** ALL extensions allowed when `ENVIRONMENT=development`
3. **Unknown origins:** Any other origin is blocked with CORS error

### Example CORS Logic

```javascript
// Chrome extension support - only allow specific extension IDs
if (origin.startsWith('chrome-extension://')) {
  const extensionIds = env?.CHROME_EXTENSION_IDS;
  if (extensionIds) {
    // Support comma-separated list of extension IDs
    const allowedExtensionIds = extensionIds.split(',').map(id => id.trim());
    const allowedExtensions = allowedExtensionIds.map(id => `chrome-extension://${id}`);

    if (allowedExtensions.includes(origin)) {
      allowedOrigin = origin; // ✅ Allowed
    }
  }
}
```

## Troubleshooting

### Extension can't connect to backend

**Error:** CORS policy blocks requests

**Solutions:**
1. Verify extension ID is in `CHROME_EXTENSION_IDS` list
2. Check extension ID is correct (32 characters)
3. Redeploy backend after changes: `wrangler deploy`
4. Check browser console for exact error message

### Development extension blocked

**Error:** CORS blocks unpacked extension during development

**Solutions:**
1. Add development extension ID to `CHROME_EXTENSION_IDS`
2. **OR** set `ENVIRONMENT=development` in `wrangler.toml` (allows all extensions)

### Multiple versions of same extension

**Scenario:** You have multiple test versions of the extension

**Solution:** Add all version IDs to the comma-separated list:

```toml
CHROME_EXTENSION_IDS = "production_id,test_v1_id,test_v2_id,test_v3_id"
```

## Testing

### Verify CORS Configuration

1. **Test with allowed extension:**
   ```javascript
   // In extension background.js or content script
   fetch('https://your-worker.workers.dev/health')
     .then(r => r.json())
     .then(data => console.log('✅ Success:', data))
     .catch(err => console.error('❌ Failed:', err));
   ```

2. **Expected result:** Should receive successful response with health data

3. **If blocked:** Check response headers in Network tab:
   ```
   Access-Control-Allow-Origin: chrome-extension://YOUR_EXTENSION_ID
   ```

### Check Cloudflare Workers Logs

```bash
wrangler tail
```

Look for CORS-related log entries to debug access issues.

## Migration from Single ID

If you previously used `CHROME_EXTENSION_ID` (singular), the code is backward compatible but you should migrate:

### Old Configuration (Deprecated)
```toml
CHROME_EXTENSION_ID = "idpdleplccjjbmdmjkpmmkecmoeomnjd"
```

### New Configuration (Current)
```toml
CHROME_EXTENSION_IDS = "idpdleplccjjbmdmjkpmmkecmoeomnjd,pnlbkbjpefcjfaidkmickcaicecbkdio"
```

**Note:** The code now looks for `CHROME_EXTENSION_IDS` (plural). Update your configuration to use the new variable name.

## Summary

✅ **Benefits:**
- Support multiple extension versions simultaneously
- Separate production and development extensions
- Easy to add/remove extension IDs
- Secure by default (whitelist approach)

✅ **Current Setup:**
- Production extension: `idpdleplccjjbmdmjkpmmkecmoeomnjd`
- Development extension: `pnlbkbjpefcjfaidkmickcaicecbkdio`
- Both can access backend API

🔒 **Security:**
- Only whitelisted extensions allowed
- No other Chrome extensions can access backend
- Development mode allows all extensions (use only for local testing)
