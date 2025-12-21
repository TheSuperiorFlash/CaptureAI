# CaptureAI Project Structure

## Overview

This document describes the organized file structure of the CaptureAI Chrome extension project.

## Root Directory Files

The root directory contains only essential Chrome extension files:

```
CaptureAI/
├── background.js                     # Service worker (screenshot, API, messaging)
├── build.bat                         # Windows build script for packaging extension
├── build.ps1                         # PowerShell build script (alternative)
├── content.js                        # Main entry point, module loader
├── inject.js                         # Injected script for page interaction
├── manifest.json                     # Chrome Extension Manifest V3
├── popup.html                        # Extension popup UI
├── popup.js                          # Popup logic and state management
├── privacy-policy.html               # Privacy policy page
├── README.md                         # Project overview and getting started
├── CLOUDFLARE_WORKERS_README.md      # Overview of Cloudflare Workers backend
├── package.json                      # NPM dependencies and scripts
├── package-lock.json                 # NPM lock file
└── babel.config.js                   # Babel configuration for testing
```

## Directory Structure

### `/config` - Configuration Files
Build tool and development configuration files:
```
config/
├── .editorconfig              # Editor configuration for consistent code style
├── eslint.config.mjs          # ESLint flat config (ES modules)
└── jest.config.js             # Jest testing configuration
```

**Note:** Config files are referenced in npm scripts with `--config` flag.

### `/docs` - Documentation
All project documentation:
```
docs/
├── README.md                           # Documentation index
├── CLAUDE.md                           # Development philosophy and coding standards
├── CLOUDFLARE_WORKERS_SETUP.md         # Complete Cloudflare Workers setup guide
├── WORKERS_VS_TRADITIONAL.md           # Why Workers is better than traditional backend
├── PROJECT_STRUCTURE.md                # This file
├── PRIVACY_GUARD.md                    # Privacy protection features
├── PRIVACY_IMPLEMENTATION_SUMMARY.md   # Privacy feature implementation details
└── MONITOR_PROTECTION.md               # Monitor/surveillance protection
```

### `/cloudflare-workers-backend` - Serverless Backend
Cloudflare Workers backend with AI Gateway integration:
```
cloudflare-workers-backend/
├── src/
│   ├── index.js            # Main Worker entry point
│   ├── router.js           # Request routing
│   ├── auth.js             # JWT authentication
│   ├── ai.js               # AI Gateway integration
│   ├── subscription.js     # Stripe payment processing
│   └── utils.js            # Helper functions (JWT, crypto, validation)
├── schema.sql              # D1 database schema (SQLite)
├── wrangler.toml           # Cloudflare Workers configuration
├── package.json            # Dependencies
├── QUICK_START.md          # 10-minute deployment guide
└── README.md               # Backend overview
```

### `/modules` - Extension Modules
Modular components organized by functionality:
```
modules/
├── config.js                  # Constants, storage keys, state management
├── storage.js                 # Chrome storage utilities
├── domains.js                 # Domain detection and CSP checking
├── utils.js                   # General utility functions
├── image-processing.js        # Image crop, compress, canvas operations
├── messaging.js               # Chrome message passing handlers
├── keyboard.js                # Keyboard shortcut handlers
├── event-manager.js           # Global error handling
├── capture-system.js          # Screenshot selection logic
├── auto-solve.js              # Auto-solve mode for educational sites
├── auth-service.js            # Backend authentication & API integration
├── ui-core.js                 # Main UI panel
├── ui-components.js           # Reusable UI components
└── ui-stealthy-result.js      # Stealthy answer overlay
```

### `/icons` - Extension Icons
All icon assets for the extension:
```
icons/
├── icon16.png                 # 16x16 toolbar icon
├── icon48.png                 # 48x48 management page icon
├── icon128.png                # 128x128 Chrome Web Store icon
└── [UI icons]                 # Additional UI icons loaded at runtime
```

### `/tests` - Test Suite
Comprehensive Jest testing infrastructure:
```
tests/
├── setup/                     # Test configuration and mocks
│   ├── test-setup.js          # Global test setup
│   └── chrome-mock.js         # Chrome API mocks
├── unit/                      # Unit tests (186 tests)
│   ├── message-builder.test.js
│   ├── url-validator.test.js
│   ├── screenshot.test.js
│   ├── storage.test.js
│   ├── storage-module.test.js
│   ├── utils.test.js
│   ├── openai-api.test.js
│   ├── domains.test.js
│   ├── format-error.test.js
│   └── edge-cases.test.js
├── integration/               # Integration tests (future)
├── fixtures/                  # Test data and mocks (future)
└── README.md                  # Testing guide
```

### Generated/Ignored Directories
These directories are automatically generated and git-ignored:

```
.git/                          # Git version control
.claude/                       # Claude Code configuration
.idea/                         # IntelliJ IDEA project files
node_modules/                  # NPM dependencies
coverage/                      # Jest coverage reports
dist/                          # Build output (packaged extension)
```

## File Organization Principles

### Root Files Only
✅ **Keep in root:**
- Core Chrome extension files (manifest.json, background.js, content.js, popup.*)
- Essential project files (README.md, package.json)
- Build scripts (build.bat)

❌ **Move to subdirectories:**
- Configuration files → `/config`
- Documentation → `/docs`
- Test files → `/tests`
- Module code → `/modules`
- Icons/assets → `/icons`

### Configuration Files
All build tool and development configuration files are in `/config`:
- ESLint: `config/eslint.config.mjs`
- Jest: `config/jest.config.js`
- EditorConfig: `config/.editorconfig`

**NPM Scripts Reference:**
```json
"scripts": {
  "lint": "eslint . --config config/eslint.config.mjs",
  "test": "jest --config config/jest.config.js"
}
```

### Documentation Organization
All `.md` files (except root README.md) are in `/docs`:
- Development guides
- Architecture documentation
- Setup instructions
- Historical decision records

**Navigation:** Start with `/docs/README.md` for a complete documentation index.

## Benefits of This Structure

### 1. Clean Root Directory
- Only essential extension files visible
- Easy to identify core functionality
- Professional appearance

### 2. Logical Organization
- Related files grouped together
- Clear separation of concerns
- Easy to navigate and find files

### 3. Scalability
- Easy to add new modules
- Documentation has dedicated space
- Tests organized by type

### 4. Developer Experience
- Configuration files don't clutter workspace
- Documentation is centralized
- Clear project structure at a glance

## Quick Reference

| Looking for... | Go to... |
|----------------|----------|
| How to use the extension | `/README.md` |
| Development guidelines | `/docs/CLAUDE.md` |
| All documentation | `/docs/README.md` |
| Testing guide | `/tests/README.md` |
| Config files | `/config/` |
| Extension modules | `/modules/` |
| Test files | `/tests/unit/` |

## Maintenance

### Adding New Files

**Documentation:** Add to `/docs/` and update `/docs/README.md`
**Config files:** Add to `/config/` and update npm scripts if needed
**Module code:** Add to `/modules/` following existing patterns
**Tests:** Add to `/tests/unit/` with `.test.js` suffix

### Moving Files

When moving files to new locations:
1. Update import paths in code
2. Update npm scripts in package.json
3. Update .gitignore if needed
4. Update documentation references
5. Test that everything still works

---

**Last Updated:** December 13, 2024
**Structure Version:** 1.0
