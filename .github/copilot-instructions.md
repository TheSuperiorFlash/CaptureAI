# CaptureAI - GitHub Copilot Instructions

## Project Overview

CaptureAI is a Chrome extension for capturing questions from webpages and receiving AI-powered answers.

**Components:** Chrome Extension (Manifest V3) | Cloudflare Workers API (D1 database) | Next.js Website

See [CLAUDE.md](../CLAUDE.md) for full project structure, commands, and coding standards.

## Technology Stack

- **Extension**: Manifest V3, ES6 Modules, Tesseract.js OCR, Chrome Storage API
- **Backend**: Cloudflare Workers, D1 (SQLite), OpenAI via AI Gateway, Stripe
- **Dev tools**: ESLint v9 (flat config), Jest v30 (jsdom), bash/PowerShell scripts

## Code Conventions

- **Files**: kebab-case (`auth-service.js`)
- **Classes**: PascalCase (`CaptureSystem`)
- **Functions/Variables**: camelCase (`handleCapture`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_INVALID_QUESTIONS`)
- **Style**: Single quotes, semicolons, 2-space indent, 80-100 char lines
- **Errors**: Try-catch all async ops, user-friendly UI messages, never expose secrets

## Chrome Extension Guidelines

### Script Contexts
- **Content scripts**: Isolated world, DOM access
- **Background script**: Service worker, API calls and storage
- **Inject script**: MAIN world, privacy protection

### Key Patterns
- Message passing: `chrome.runtime.sendMessage()` (content -> background), `chrome.tabs.sendMessage()` (background -> content)
- Storage: Always use `chrome.storage.local` via `modules/storage.js` utilities
- Permissions: Minimal, prefer `activeTab` over broad permissions
- Security: `textContent` over `innerHTML`, no `eval()`, validate message sources

### Manifest V3 Requirements
- Service workers (not background pages), handle lifecycle restarts
- `chrome.scripting.executeScript` for dynamic injection
- State in `chrome.storage`, not memory
- `wasm-unsafe-eval` required for Tesseract.js

## API Development Guidelines

- D1 prepared statements (`.bind()`) for all queries
- CORS restricted to `CHROME_EXTENSION_IDS`
- AI Gateway for OpenAI calls (caching, rate limiting)
- Validate license key format (`XXXX-XXXX-XXXX-XXXX-XXXX`) on every request
- Durable Objects for distributed rate limiting
- Stripe webhook signature verification required

## Common Tasks

| Task | Steps |
|------|-------|
| New module | Create in `extension/modules/`, export ES6, import in consumer, add to `web_accessible_resources` if needed, write tests |
| New API endpoint | Add route in `router.js`, implement in appropriate module, add auth check, return JSON |
| New supported site | Add detection in `domains.js`, update `isOnSupportedSite()`, implement in `auto-solve.js` |

## Commands

```bash
npm test && npm run lint          # Validate before committing
cd api && npm run dev             # Local API server
cd api && npm run deploy          # Deploy to Cloudflare
```

## Resources

- [Chrome Extensions](https://developer.chrome.com/docs/extensions/) | [Cloudflare Workers](https://developers.cloudflare.com/workers/) | [D1](https://developers.cloudflare.com/d1/)
- [OpenAI API](https://platform.openai.com/docs/) | [Tesseract.js](https://tesseract.projectnaptha.com/) | [Jest](https://jestjs.io/)
