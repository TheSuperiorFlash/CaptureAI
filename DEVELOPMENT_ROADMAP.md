# CaptureAI Development Roadmap

## Project Status
**Current Version:** 1.0.0
**Status:** Pre-release (preparing for Chrome Web Store)

---

## Immediate Priorities

### 1. Initialize Version Control (Critical) ⚠️
**Status:** Not Started
**Estimated Time:** 15 minutes

#### Tasks:
- [ ] Initialize git repository
- [ ] Review and update `.gitignore`
- [ ] Make initial commit with current working state
- [ ] Create GitHub repository (optional but recommended)
- [ ] Push to remote repository

#### Commands:
```bash
git init
git add .
git commit -m "Initial commit - CaptureAI v1.0.0"
# Optional: Create GitHub repo and push
git remote add origin <your-github-url>
git push -u origin main
```

---

### 2. Complete Refactoring Plan (High Priority)
**Status:** Planned (see REFACTORING_PLAN.md)
**Estimated Time:** 8-11 hours total

#### Phase 1: Reorganize background.js (2-3 hours)
- [ ] Add section markers and table of contents
- [ ] Add JSDoc comments to all functions
- [ ] Improve error handling with consistent error messages
- [ ] Extract magic strings to constants
- [ ] Test thoroughly after each change

#### Phase 2: Add Unit Tests (5-7 hours)
- [ ] Set up Jest testing framework
- [ ] Write tests for pure functions (`buildMessages`, `isValidUrl`)
- [ ] Write tests for async functions (`getStoredApiKey`, `captureScreenshot`)
- [ ] Mock Chrome APIs
- [ ] Achieve 70-80% code coverage
- [ ] Document testing setup in README

#### Phase 3: Documentation (1 hour)
- [ ] Update CLAUDE.md with new structure
- [ ] Create testing guide
- [ ] Document all JSDoc additions

---

### 3. Pre-Submission Testing (Before Chrome Web Store)
**Status:** Not Started
**Estimated Time:** 3-4 hours

#### Functional Testing:
- [ ] Test manual capture on 5+ different websites
- [ ] Test auto-solve on Vocabulary.com
- [ ] Test auto-solve on Quizlet.com
- [ ] Test Ask mode (text-only)
- [ ] Test Ask mode (with image attachment)
- [ ] Test quick recapture functionality
- [ ] Verify all keyboard shortcuts work:
  - [ ] `Ctrl+Shift+X` - Start capture
  - [ ] `Ctrl+Shift+F` - Quick recapture
  - [ ] `Ctrl+Shift+E` - Toggle panel
  - [ ] `Escape` - Cancel operations
  - [ ] `Enter` - Submit in Ask mode

#### Technical Testing:
- [ ] Check for console errors in background worker
- [ ] Check for console errors in content script
- [ ] Check for console errors in popup
- [ ] Test on CSP-restricted sites (Google Docs, Outlook)
- [ ] Validate API key handling (save, reset, validation)
- [ ] Test with invalid/expired API key
- [ ] Test with no API key
- [ ] Verify icons display correctly (16px, 48px, 128px)

#### Browser Compatibility:
- [ ] Test on Chrome (latest version)
- [ ] Test on Edge (Chromium-based)
- [ ] Test on Brave (optional)

#### Performance Testing:
- [ ] Test with multiple rapid captures
- [ ] Test with large screenshot areas
- [ ] Verify auto-solve stops after invalid questions
- [ ] Check memory usage during extended use

---

## Medium-Term Improvements

### 4. Testing Infrastructure
**Status:** Not Started
**Estimated Time:** 6-8 hours

- [ ] Install Jest and testing dependencies
- [ ] Create test file structure (`tests/` directory)
- [ ] Set up Chrome API mocks
- [ ] Write unit tests for modules:
  - [ ] `modules/config.js`
  - [ ] `modules/storage.js`
  - [ ] `modules/domains.js`
  - [ ] `modules/utils.js`
  - [ ] `modules/image-processing.js`
- [ ] Set up continuous integration (GitHub Actions)
- [ ] Add test coverage reporting
- [ ] Document test running procedures

---

### 5. Privacy Policy & Legal Compliance
**Status:** Needs Verification
**Estimated Time:** 2-3 hours

- [ ] Verify `privacy-policy.html` exists and is complete
- [ ] Create LICENSE file (MIT as mentioned in README)
- [ ] Review Chrome Web Store Developer Agreement
- [ ] Ensure compliance with data collection policies
- [ ] Add terms of service if needed
- [ ] Review OpenAI API usage compliance
- [ ] Document data handling practices

---

### 6. Chrome Web Store Preparation
**Status:** Not Started
**Estimated Time:** 4-6 hours

#### Assets & Marketing:
- [ ] Create promotional screenshots (1280x800 or 640x400)
- [ ] Create promotional tiles (440x280 small tile)
- [ ] Create marquee promotional image (1400x560)
- [ ] Write detailed store description (132 chars short, full description)
- [ ] Prepare icon in multiple sizes
- [ ] Create demo video (optional but recommended)

#### Store Listing Content:
- [ ] Write compelling short description
- [ ] Write detailed description highlighting features
- [ ] Prepare list of permissions with justifications
- [ ] Create changelog for v1.0.0
- [ ] Add support email/contact information
- [ ] Prepare FAQ section

#### Technical Preparation:
- [ ] Package extension as ZIP file
- [ ] Verify manifest.json completeness
- [ ] Test packaged extension locally
- [ ] Prepare privacy policy URL (if hosting externally)
- [ ] Set up developer account ($5 one-time fee)

#### Submission Checklist:
- [ ] Review all Chrome Web Store policies
- [ ] Ensure no policy violations
- [ ] Prepare for review process (can take 1-7 days)
- [ ] Set up monitoring for user feedback

---

## Future Feature Enhancements (Post-Launch)

### Phase 1: Enhanced Site Support
**Priority:** High
**Estimated Time:** 10-15 hours

- [ ] Add support for Khan Academy
- [ ] Add support for Duolingo
- [ ] Add support for Coursera
- [ ] Add support for edX
- [ ] Create site detection framework for easy additions
- [ ] Document process for adding new sites

---

### Phase 2: OCR Integration
**Priority:** Medium
**Estimated Time:** 20-30 hours

- [ ] Research OCR libraries (Tesseract.js)
- [ ] Implement text extraction from images
- [ ] Add OCR preprocessing (image enhancement)
- [ ] Create fallback mechanism (OCR → AI)
- [ ] Add confidence scoring for OCR results
- [ ] Test with various fonts and handwriting

---

### Phase 3: Formula & Equation Recognition
**Priority:** Medium
**Estimated Time:** 15-20 hours

- [ ] Research math OCR solutions (MathPix, etc.)
- [ ] Implement LaTeX rendering support
- [ ] Add support for chemical formulas
- [ ] Test with complex equations
- [ ] Add equation editor integration

---

### Phase 4: Advanced Settings & Configuration
**Priority:** Low
**Estimated Time:** 8-10 hours

- [ ] Create `options.html` page
- [ ] Add settings for:
  - [ ] AI model selection
  - [ ] Response verbosity control
  - [ ] Custom prompts
  - [ ] Keyboard shortcut customization
  - [ ] Auto-solve timing adjustments
  - [ ] Theme/appearance options
- [ ] Implement settings persistence
- [ ] Add import/export settings feature

---

### Phase 5: Multi-AI Provider Support
**Priority:** Low
**Estimated Time:** 15-20 hours

- [ ] Abstract AI provider interface
- [ ] Add Anthropic Claude support
- [ ] Add Google Gemini support
- [ ] Add local model support (Ollama)
- [ ] Create provider selection UI
- [ ] Handle provider-specific features
- [ ] Add cost tracking per provider

---

## Bug Fixes & Maintenance

### Known Issues
- [ ] Document any known bugs
- [ ] Prioritize critical bugs
- [ ] Create issue templates

### Regular Maintenance Tasks
- [ ] Update dependencies monthly
- [ ] Review and respond to user feedback
- [ ] Monitor API changes (OpenAI)
- [ ] Update documentation as needed
- [ ] Review security vulnerabilities
- [ ] Update Chrome extension permissions if needed

---

## Version Planning

### v1.0.0 (Current - Pre-release)
- Core capture functionality
- Auto-solve mode
- Ask mode
- Basic keyboard shortcuts

### v1.1.0 (Planned)
- Enhanced error handling
- Better CSP site support
- Additional educational sites
- UI/UX improvements based on user feedback

### v1.2.0 (Planned)
- OCR integration
- Offline mode
- Performance optimizations

### v2.0.0 (Future)
- Formula recognition
- Multi-AI provider support
- Advanced customization options
- Team/classroom features

---

## Success Metrics

### Pre-Launch Goals:
- [ ] Zero critical bugs
- [ ] 70%+ code coverage
- [ ] All features tested
- [ ] Documentation complete

### Post-Launch Goals (First 3 Months):
- [ ] 100+ active users
- [ ] 4.0+ star rating
- [ ] < 5% uninstall rate
- [ ] Positive user reviews

### Long-Term Goals (1 Year):
- [ ] 1,000+ active users
- [ ] Featured on Chrome Web Store
- [ ] Community contributions
- [ ] Educational institution adoption

---

## Resources & Links

### Documentation:
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Jest Testing Framework](https://jestjs.io/)

### Tools:
- Chrome Web Store Developer Dashboard
- Extension Reload Extension (for development)
- Chrome DevTools
- GitHub (version control)

### Community:
- Chrome Extension Discord
- Stack Overflow (chrome-extension tag)
- Reddit r/chrome_extensions

---

**Last Updated:** December 13, 2024
**Maintained By:** Development Team
**Next Review Date:** After v1.0.0 launch
