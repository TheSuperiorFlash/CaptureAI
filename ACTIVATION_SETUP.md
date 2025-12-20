# CaptureAI Activation Setup

## GitHub Pages Activation Page

The activation page is now hosted on GitHub Pages for easy access and abuse prevention.

### Setup Instructions

1. **Enable GitHub Pages** (if not already enabled):
   - Go to your repository settings
   - Navigate to "Pages" section
   - Under "Source", select "Deploy from a branch"
   - Choose branch: `main` and folder: `/ (root)`
   - Click "Save"

2. **Access Your Activation Page**:
   ```
   https://thesuperiorflash.github.io/CaptureAI/activate.html
   ```

3. **How It Works**:
   - Users visit the activation page
   - Enter their email address
   - Backend checks if email already has a free key
   - If yes: Returns existing key
   - If no: Creates new key
   - User copies the key and activates in extension

### Files Modified

- `activate.html` - New activation page
- `popup.html` - Simplified to show only license key input
- `popup.js` - Removed email input handling, simplified flow

### Benefits

✅ **Simpler UX**: One field, one button in extension
✅ **Abuse Prevention**: Email validation on separate page
✅ **Better Analytics**: Track activations on website
✅ **Marketing**: Can add features, testimonials, etc.
✅ **Rate Limiting**: Easier to implement on website

### Next Steps (Optional)

1. **Add CAPTCHA** to prevent bots (Google reCAPTCHA or Cloudflare Turnstile)
2. **Custom Domain**: Point a domain to GitHub Pages
3. **Email Verification**: Send verification email before key generation
4. **Analytics**: Add Google Analytics or Plausible

### Testing

1. Commit and push the changes
2. Wait 1-2 minutes for GitHub Pages to deploy
3. Visit: `https://thesuperiorflash.github.io/CaptureAI/activate.html`
4. Test the activation flow
5. Open extension popup and activate with the key
