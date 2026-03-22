# CaptureAI - GitHub Copilot Instructions

> **Self-update rule:** When you change the tech stack, npm scripts, coding conventions, or development workflow — update this file, [CLAUDE.md](../CLAUDE.md), and [GEMINI.md](../GEMINI.md).

## Project Overview

CaptureAI is a Chrome extension for capturing questions from webpages and receiving AI-powered answers.

**Components:** Chrome Extension (Manifest V3) | Cloudflare Workers API (D1 database) | Next.js Website

See [CLAUDE.md](../CLAUDE.md) for full commands, coding standards, and critical rules.
See [api/ARCHITECTURE.md](../api/ARCHITECTURE.md) for API routes, rate limiting, and auth flow.
See [extension/ARCHITECTURE.md](../extension/ARCHITECTURE.md) for module system, storage keys, and privacy guard.

## Technology Stack

- **Extension**: Manifest V3, ES6 Modules, Tesseract.js v7 OCR, Chrome Storage API
- **Backend**: Cloudflare Workers, D1 (SQLite), OpenAI via AI Gateway, Stripe, Cloudflare native Rate Limiting API
- **Website**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Dev tools**: ESLint v9 (flat config), Jest v30, Playwright e2e

## Working Principles

**Planning:** Enter plan mode for any non-trivial task (3+ steps or architectural decisions). Write detailed specs upfront. If something goes sideways, stop and re-plan — don't keep pushing.

**Verification:** Never mark a task complete without proving it works. Run tests, check logs, demonstrate correctness.

**Bug Fixing:** Given a bug report, fix it — don't ask for hand-holding. Find root causes; no temp fixes.

**Elegance:** For non-trivial changes, ask "is there a more elegant way?" If a fix feels hacky, implement the elegant solution.

**Task Management:** Write plan to `tasks/todo.md` before starting. Mark items complete as you go. Update `tasks/lessons.md` after any correction.

## Code Conventions

- **Files**: kebab-case (`auth-service.js`)
- **Classes**: PascalCase (`CaptureSystem`)
- **Functions/Variables**: camelCase (`handleCapture`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_INVALID_QUESTIONS`)
- **Booleans**: `isX`/`hasX`/`canX`; **Handlers**: `handleEventName`
- **Style**: Vanilla JS, single quotes, semicolons, 2-space indent; meaningful names — no Hungarian notation

### Clean Code Rules

- **Functions**: Do one thing, single abstraction level, ≤ 50 lines. Enforce Command Query Separation (action OR return, never both). Eliminate side effects. DRY at 3+ repetitions
- **Comments**: Delete syntactic restatements; keep only *why* comments (business rules, historical context, non-obvious tradeoffs)
- **Errors**: Catch specific exceptions, never swallow with empty `catch`, no exceptions for control flow. Always check `chrome.runtime.lastError`

## Chrome Extension Guidelines

### Script Contexts
- **Content scripts**: Isolated world, DOM access, 14 ES6 modules via `window.CaptureAI`
- **Background script**: Service worker, API calls, screenshot capture, Privacy Guard registration
- **Inject script**: MAIN world at `document_start`, privacy protection (Pro only)

### Key Patterns
- Message passing: `chrome.runtime.sendMessage()` (content -> background), `chrome.tabs.sendMessage()` (background -> content)
- Storage: Always use `chrome.storage.local` via `modules/storage.js` wrappers
- Auth: License key system (`XXXX-XXXX-XXXX-XXXX-XXXX`), header `Authorization: LicenseKey`
- AI Models: `gpt-4.1-nano` (level 0) | `gpt-5-nano` low (level 1, default) | `gpt-5-nano` medium (level 2, Pro)

### Manifest V3 Requirements
- Service workers (not background pages), handle lifecycle restarts
- State in `chrome.storage`, not memory
- `wasm-unsafe-eval` required for Tesseract.js

## API Development Guidelines

- D1 prepared statements (`.bind()`) for all queries
- CORS restricted to `CHROME_EXTENSION_IDS` env var
- Rate limiting via Cloudflare native bindings (5 presets: AUTH, LICENSE, CHECKOUT, GLOBAL, PRO_AI)
- Stripe webhook: HMAC-SHA256 + timestamp validation + event deduplication
- Usage tracking: dual-table (`usage_breakdown` + `usage_daily`)

## Critical Rules

**Always:** Read files before editing | Parameterized DB queries | Validate input at boundaries | Try-catch async ops | Check `chrome.runtime.lastError` | Find root causes — no temp fixes | Make changes as simple and minimal as possible

**Never:** `innerHTML` with untrusted content | Hardcode secrets | Log sensitive data | Bypass tier restrictions | Modify schema without migrations | Swallow errors with empty catch

## Commands

```bash
npm test && npm run lint          # Validate before committing
npm run test:e2e                  # End-to-end tests
cd api && npm run dev             # Local API server
cd api && npm run deploy          # Deploy to Cloudflare
```
