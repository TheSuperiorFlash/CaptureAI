# GEMINI.md

> **Self-update rule:** When you change coding standards, commands, key concepts, or storage keys — update this file, [CLAUDE.md](CLAUDE.md), and [.github/copilot-instructions.md](.github/copilot-instructions.md).

Development guide for CaptureAI Chrome extension.

## Documentation Maintenance — MANDATORY

**After every code change, update the relevant markdown files before committing.** Stale docs poison future sessions. This is not optional.

| What you changed | Update these files |
|------------------|--------------------|
| API routes, auth, rate limits, AI models, webhooks | [api/ARCHITECTURE.md](api/ARCHITECTURE.md) + [CLAUDE.md](CLAUDE.md) |
| Extension modules, storage keys, message actions, Privacy Guard | [extension/ARCHITECTURE.md](extension/ARCHITECTURE.md) + [CLAUDE.md](CLAUDE.md) |
| Database tables, columns, indexes, views | [api/DATABASE_GUIDE.md](api/DATABASE_GUIDE.md) |
| New migration file added | [api/migrations/README.md](api/migrations/README.md) |
| CORS config, extension IDs | [api/CHROME_EXTENSIONS.md](api/CHROME_EXTENSIONS.md) |
| Test files added/removed, coverage thresholds, test setup | [tests/README.md](tests/README.md) |
| Website components, design tokens, pages | [website/DESIGN_SYSTEM.md](website/DESIGN_SYSTEM.md) |
| npm scripts, dependencies, dev tooling | This file + [CLAUDE.md](CLAUDE.md) (Commands) + [.github/copilot-instructions.md](.github/copilot-instructions.md) |
| Coding standards, critical rules, git workflow | This file + [CLAUDE.md](CLAUDE.md) + [.github/copilot-instructions.md](.github/copilot-instructions.md) |

**Every doc has a self-update reminder at the top. Follow it.**

## Project Overview

Full-stack Chrome extension with Cloudflare Workers backend for AI-powered screenshot analysis. Users capture screen areas, text is extracted via OCR, and AI provides answers.

**Stack:** Chrome Extension (Manifest V3) + Cloudflare Workers + D1 (SQLite) + OpenAI via AI Gateway + Stripe + Resend + Tesseract.js v7

**Tiers:** Basic ($1.99/week or $5.99/month, 50 req/day) | Pro ($3.49/week or $9.99/month, unlimited requests, 20 req/min rate limit)

## Commands

```bash
npm test                    # Run all tests (Jest, 25 test files)
npm run test:coverage       # Coverage report (thresholds: 40%)
npm run test:e2e            # Playwright e2e tests
npm run test:all            # All tests (extension + API + e2e)
npm run lint                # ESLint
npm run lint:fix            # ESLint auto-fix
cd api && npm run dev       # Local dev server on http://localhost:8787
cd api && npm run deploy    # Deploy to production
cd api && npm run db:migrate  # Run migrations
```

## Working Principles

**Planning:** Enter plan mode for any non-trivial task (3+ steps or architectural decisions). Write detailed specs upfront. If something goes sideways, stop and re-plan — don't keep pushing.

**Subagents:** Use subagents liberally to keep the main context window clean. Offload research, exploration, and parallel analysis. One task per subagent for focused execution.

**Verification:** Never mark a task complete without proving it works. Run tests, check logs, demonstrate correctness.

**Elegance:** For non-trivial changes, ask "is there a more elegant way?" If a fix feels hacky, implement the elegant solution. Skip for simple, obvious fixes.

**Bug Fixing:** Given a bug report, fix it — don't ask for hand-holding. Point at logs, errors, and failing tests, then resolve them.

**Self-Improvement:** After any correction from the user, update `tasks/lessons.md` with the pattern to prevent the same mistake.

**Task Management:**
1. Write plan to `tasks/todo.md` with checkable items before starting
2. Check in with user before implementation
3. Mark items complete as you go
4. Add review section to `tasks/todo.md` when done
5. Update `tasks/lessons.md` after corrections

## Quick Reference

- **Backend URL**: `https://api.captureai.dev`
- **AI Models**: `gpt-4.1-nano` (L0) | `gpt-5-nano` low (L1, default) | `gpt-5-nano` medium (L2, Pro only)
- **Auth header**: `Authorization: LicenseKey XXXX-XXXX-XXXX-XXXX-XXXX`
- **Rate limit presets**: AUTH (5/min) | LICENSE (10/min) | CHECKOUT (10/min) | GLOBAL (60/min) | PRO_AI (20/min)
- **Privacy Guard**: Pro only + `settings.privacyGuard.enabled`; `inject.js` runs in MAIN world at `document_start`
- **OCR threshold**: confidence >60% → send text only; else fallback to image
- **Extension namespace**: 14 modules loaded via `window.CaptureAI`; shared state at `window.CaptureAI.STATE`

## Coding Standards

### Formatting & Language

- Vanilla JS only (extension), 2-space indentation, single quotes, semicolons required
- `camelCase` variables/functions, `UPPER_SNAKE_CASE` constants, `PascalCase` classes
- `isX`/`hasX`/`canX` booleans, `handleEventName` event handlers
- kebab-case filenames (`auth-service.js`)
- Meaningful, pronounceable, searchable names — never single letters; no Hungarian notation or type prefixes
- One declaration per `const`/`let` statement; no `var`

### Functions

- Each function does exactly one thing at a single level of abstraction
- Keep functions short (≤ 50 lines); extract when logic branches or nests deeply
- **Command Query Separation**: a function either performs an action OR returns a value, never both
- Eliminate side effects — a function should not modify state outside its scope unless that is its sole declared purpose
- Apply DRY: if logic repeats three or more times, extract it; two similar lines are fine
- JSDoc all public functions; omit for trivial internal helpers

### Comments

- Delete comments that restate what the code does syntactically
- Retain comments only to explain *why* — business rules, historical context, non-obvious tradeoffs

### Error Handling

- Catch specific exceptions; never swallow errors with empty `catch` blocks
- Do not use exceptions for standard control flow
- Always check `chrome.runtime.lastError` in extension callbacks
- Try-catch all async operations; surface meaningful error messages

### Chrome Extension Specifics

- Manifest V3: service workers, not background pages — handle lifecycle restarts
- Persist state in `chrome.storage.local`, never in service worker memory
- `textContent` over `innerHTML`; never inject untrusted content via `innerHTML`
- Access shared state only via `window.CaptureAI.STATE` / `window.CaptureAI.CONFIG`
- Message passing: `chrome.runtime.sendMessage()` (content → background), `chrome.tabs.sendMessage()` (background → content)
- `wasm-unsafe-eval` required in CSP for Tesseract.js

### API / Backend Specifics

- Parameterized D1 queries (`.bind()`) — no string concatenation in SQL
- Validate all input at the handler boundary
- Verify Stripe webhook signatures (HMAC-SHA256 + timestamp)
- Never hardcode secrets; never log sensitive data

## Critical Rules

**Always:** Read files before editing | Parameterized DB queries | Validate input at boundaries | Verify webhook signatures | Try-catch async ops | Check `chrome.runtime.lastError` | Extract magic values into constants | Find root causes — no temp fixes | Make changes as simple and minimal as possible

**Never:** `innerHTML` with untrusted content | Hardcode secrets | Log sensitive data | Bypass tier restrictions | Modify schema without migrations | Commit secrets | Swallow errors with empty catch | Use exceptions for control flow

## Git Workflow

Commit format: `<type>(<scope>): <subject>`
Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

## Debugging

- **Background**: `chrome://extensions` -> CaptureAI service worker
- **Content**: F12 console on any webpage
- **Popup**: Right-click extension icon -> "Inspect popup"
- **State**: `window.CaptureAI.STATE` in content script console

## Deep Documentation

- **API Architecture**: [api/ARCHITECTURE.md](api/ARCHITECTURE.md) — routes, auth, rate limiting, AI integration
- **Extension Architecture**: [extension/ARCHITECTURE.md](extension/ARCHITECTURE.md) — modules, storage keys, privacy guard
- **Chrome Extension Config**: [api/CHROME_EXTENSIONS.md](api/CHROME_EXTENSIONS.md) — CORS extension ID management
- **Database Guide**: [api/DATABASE_GUIDE.md](api/DATABASE_GUIDE.md) — schema, queries, maintenance
- **Migration Scripts**: [api/migrations/README.md](api/migrations/README.md) — all 9 migrations
- **Testing Guide**: [tests/README.md](tests/README.md) — 25 test files, setup, patterns
- **Website Design System**: [website/DESIGN_SYSTEM.md](website/DESIGN_SYSTEM.md) — tokens, components, patterns
