# CaptureAI Extension Support Website - Product Requirements Document

## 1. Executive Summary
A modern, dark-themed support website for CaptureAI - an AI-powered Chrome extension that uses OCR to solve questions from screenshots. This is NOT a marketing website. Primary functions: license key activation, payment verification, basic extension info, and user support.

## 2. Design System

### 2.1 Visual Identity
- **Theme**: Dark mode with blue accents
- **Primary Color**: Blue (#3b82f6, #60a5fa)
- **Secondary Color**: Cyan (#06b6d4)
- **Background**: Near-black (#08070e)
- **Text Colors**: White, Gray-300, Gray-400
- **Design Style**: Modern SaaS, glassmorphism, animated gradients

### 2.2 Typography
- **Headings**: Bold, 40-72px, white
- **Subheadings**: Semi-bold, 24-32px, white
- **Body**: Regular, 16-20px, gray-300/400
- **Font Family**: Inter (currently used)

### 2.3 Component Style
- **Cards**: Semi-transparent (gray-900/50), backdrop blur, rounded-2xl
- **Buttons**: Blue-600 with glow shadows, scale on hover
- **Borders**: Gray-800, blue-500/50 on hover
- **Animations**: Floating gradient blobs, pulse effects, smooth transitions

## 3. Core Pages & Features

### 3.1 Homepage ✅ (Implemented - Needs Accuracy Check)
- [x] Hero section with animated gradient blobs
- [x] Feature cards (must match actual extension features)
- [x] How it works (3 steps)
- [x] CTA section (links to Chrome Web Store)
- [ ] **TODO**: Verify all features listed match actual extension capabilities
- [ ] **TODO**: Ensure OCR and license key system are prominently mentioned
- [ ] **NOT NEEDED**: Testimonials, social proof, stats sections (not a marketing site)

### 3.2 Activation Page (/activate) ❌ (Missing Next.js version)
- [x] Standalone activate.html exists with dark theme ✅
- [ ] **TODO**: Create Next.js version at /activate route
- [ ] Email input for license key generation
- [ ] Pricing tier selection (Free/Pro)
- [ ] Integration with Cloudflare Workers backend
- [ ] Stripe checkout redirect for Pro tier
- [ ] Success/error message handling

### 3.3 Payment Success Page (/payment-success) ❌ (Missing Next.js version)
- [x] Standalone payment-success.html exists with dark theme ✅
- [ ] **TODO**: Create Next.js version at /payment-success route
- [ ] Payment verification from URL params
- [ ] Display Pro tier activation steps
- [ ] Email confirmation message
- [ ] Return to activation page link

### 3.4 Pricing Page ✅ (Implemented)
- [x] Two-tier pricing (Free: 10 requests/day, Pro: Unlimited at $9.99/mo)
- [x] Feature comparison
- [x] FAQ section
- [ ] **TODO**: Verify pricing matches backend configuration
- [ ] **NOT NEEDED**: Annual billing, enterprise plans (not in extension scope)

### 3.5 Download Page ✅ (Implemented)
- [x] Chrome Web Store link
- [x] Installation guide
- [x] System requirements
- [ ] **TODO**: Add link to /activate page after installation
- [ ] **TODO**: Mention OCR technology (90% token savings)

### 3.6 Documentation Page ✅ (Implemented - Needs Accuracy Check)
- [x] Getting started guide
- [x] Features documentation
- [x] FAQ section
- [ ] **TODO**: Verify keyboard shortcuts match manifest.json
- [ ] **TODO**: Document OCR system and license key activation
- [ ] **TODO**: Add troubleshooting section for common issues

### 3.7 Contact Page ✅ (Implemented)
- [x] Email support (wonhappyheart@gmail.com)
- [x] Feature requests
- [x] GitHub link
- [ ] **NOT NEEDED**: Live chat, team pages (solo developer project)

### 3.8 Privacy Policy Page ❌ (Missing)
- [ ] **TODO**: Create /privacy route
- [ ] Data collection policy (currently: no data collection)
- [ ] OpenAI API usage disclosure
- [ ] License key storage information
- [ ] Chrome storage usage

### 3.9 Terms of Service Page ❌ (Missing)
- [ ] **TODO**: Create /terms route
- [ ] License key terms
- [ ] Free vs Pro tier limitations
- [ ] Refund policy
- [ ] Acceptable use policy

### 3.10 Pages NOT NEEDED (This is NOT a marketing site)
- ❌ About/Team page
- ❌ Blog
- ❌ Changelog (can add if desired, but not priority)
- ❌ Testimonials page
- ❌ Case studies

## 4. Components & Elements

### 4.1 Navigation ✅ (Implemented)
- [x] Sticky header with dark theme
- [x] Logo and branding (CaptureAI)
- [x] Main navigation links (Pricing, Download, Docs, Contact)
- [x] CTA button (Get Started - links to Chrome Web Store)
- [x] Mobile responsive menu
- [ ] **TODO**: Add "Activate" link to navigation
- [ ] **NOT NEEDED**: Search bar, language selector, user accounts (extension handles auth)

### 4.2 Footer ✅ (Implemented)
- [x] Brand section
- [x] Product links
- [x] Support links (GitHub, email)
- [x] Copyright
- [ ] **TODO**: Add Privacy Policy and Terms of Service links
- [ ] **NOT NEEDED**: Social media, newsletter, trust badges (not a marketing site)

### 4.3 Extension-Specific Components
- [ ] **TODO**: License key activation form component
- [ ] **TODO**: Payment verification status component
- [ ] **TODO**: Tier comparison component (Free vs Pro)
- [ ] **TODO**: Error/success message component for activation
- [ ] **TODO**: Loading spinner for API calls

### 4.4 NOT NEEDED (Marketing Site Elements)
- ❌ Screenshot carousels
- ❌ Interactive product demos
- ❌ Video players
- ❌ Customer testimonials
- ❌ Review aggregation
- ❌ User statistics
- ❌ Exit-intent popups
- ❌ Newsletter signups

## 5. Technical Features

### 5.1 Performance
- [x] Next.js 15 with App Router
- [x] Tailwind CSS for styling
- [x] Vercel deployment
- [ ] **TODO**: Optimize images with next/image where applicable
- [ ] **OPTIONAL**: Performance monitoring if needed

### 5.2 Backend Integration
- [x] Cloudflare Workers backend (backend.captureai.workers.dev)
- [ ] **TODO**: Integrate activation form with /api/auth/create-free-key endpoint
- [ ] **TODO**: Integrate Pro signup with /api/subscription/create-checkout endpoint
- [ ] **TODO**: Integrate payment verification with /api/subscription/verify-payment endpoint
- [ ] **TODO**: Handle API errors gracefully with user-friendly messages

### 5.3 SEO (Basic Only - Not a Marketing Priority)
- [x] Meta tags (basic)
- [ ] **OPTIONAL**: Open Graph tags
- [ ] **OPTIONAL**: Sitemap.xml
- [ ] **NOT PRIORITY**: Advanced SEO, structured data, Twitter cards

### 5.4 Analytics (Minimal - Privacy Focus)
- [ ] **OPTIONAL**: Basic analytics if desired
- [ ] **NOT NEEDED**: Heatmaps, conversion tracking, A/B testing (not a marketing site)

### 5.5 Accessibility (Basic Compliance)
- [ ] **TODO**: Ensure keyboard navigation works for activation form
- [ ] **TODO**: Add ARIA labels to form inputs
- [ ] **TODO**: Verify color contrast meets WCAG standards (already good with dark theme)

## 6. Extension-Specific Content

### 6.1 Actual Extension Features to Highlight
- ✅ **OCR Technology**: 90% token cost reduction using Tesseract.js
- ✅ **License Key System**: Free tier (10/day) and Pro tier (unlimited)
- ✅ **Auto-Solve Mode**: For Vocabulary.com
- ✅ **Quick Capture**: Keyboard shortcuts (Ctrl+Shift+X, Ctrl+Shift+F, Ctrl+Shift+E)
- ✅ **Privacy Guard**: Prevents websites from detecting extension usage
- ✅ **Stealth Mode**: Invisible operation when UI is hidden
- ✅ **Ask Mode**: Custom questions with image attachments

### 6.2 Backend Architecture to Document
- ✅ **Cloudflare Workers**: Serverless backend (api.captureai.workers.dev)
- ✅ **Stripe Integration**: Payment processing for Pro tier
- ✅ **Email System**: License key delivery via email
- ✅ **API Endpoints**:
  - POST /api/auth/create-free-key
  - POST /api/subscription/create-checkout
  - POST /api/subscription/verify-payment
  - POST /api/query (extension usage)

### 6.3 Visual Assets (From Extension)
- [x] Extension icons (icon16, icon48, icon128)
- [ ] **TODO**: Extension screenshots for homepage
- [ ] **OPTIONAL**: Demo GIF of extension in action
- [ ] **NOT NEEDED**: Team photos, marketing videos

## 7. Implementation Priority

### Phase 1: Critical Functionality (Immediate)
1. ✅ Revised PRD.md to reflect extension support site (not marketing)
2. **TODO**: Create /activate Next.js page
3. **TODO**: Create /payment-success Next.js page
4. **TODO**: Add "Activate" link to navigation
5. **TODO**: Update homepage features to match actual extension

### Phase 2: Legal & Compliance (Soon)
6. **TODO**: Create /privacy page
7. **TODO**: Create /terms page
8. **TODO**: Add Privacy/Terms links to footer

### Phase 3: Content Accuracy (Next)
9. **TODO**: Verify documentation matches actual extension features
10. **TODO**: Update pricing page to ensure accuracy with backend
11. **TODO**: Add OCR and license key info to download page

### Phase 4: Polish (Optional)
12. **OPTIONAL**: Improve accessibility (ARIA labels)
13. **OPTIONAL**: Add basic analytics if desired
14. **OPTIONAL**: Performance optimizations

## 8. Success Criteria
- ✅ Users can activate Free tier license keys via /activate
- ✅ Users can purchase and verify Pro tier via Stripe integration
- ✅ All extension features are accurately documented
- ✅ Privacy policy and terms are clear and accessible
- ✅ Dark theme consistent across all pages
- ✅ Website accurately represents what the extension does (NO fake features)

## 9. NOT IN SCOPE (Marketing Site Features)
- ❌ Blog, testimonials, case studies
- ❌ Social proof sections, user statistics
- ❌ About/team pages, company story
- ❌ Newsletter signups, social media integration
- ❌ Advanced SEO, A/B testing, conversion optimization
- ❌ Interactive demos, video players
- ❌ Changelog (nice to have, but not priority)

---

**Status Legend:**
- ✅ Implemented or Correct
- ❌ Not Needed / Out of Scope
- **TODO**: Needs Implementation
- **OPTIONAL**: Nice to Have
