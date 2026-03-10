# Chrome Extension Configuration

> **Self-update rule:** When you change CORS origins, extension IDs, or allowed-origin logic in `src/index.js` or `wrangler.toml` — update this file.

The backend restricts CORS access to specific Chrome extension IDs.

## Current Configuration

**File:** `api/wrangler.toml`

```toml
CHROME_EXTENSION_IDS = "idpdleplccjjbmdmjkpmmkecmoeomnjd,pnlbkbjpefcjfaidkmickcaicecbkdio"
```

| Type | Extension ID | Purpose |
|------|-------------|---------|
| Production | `idpdleplccjjbmdmjkpmmkecmoeomnjd` | Chrome Web Store |
| Development | `pnlbkbjpefcjfaidkmickcaicecbkdio` | Local unpacked testing |

## How It Works

- **`CHROME_EXTENSION_IDS`**: Comma-separated list with automatic whitespace trimming
- **Production mode**: Only exact IDs in `CHROME_EXTENSION_IDS` + `https://captureai.dev` + `https://thesuperiorflash.github.io`
- **Development mode**: Also allows `http://localhost:3000`, `http://localhost:8080`, and `http://127.0.0.1:3000`

## Adding a New Extension ID

1. Find the ID at `chrome://extensions/` (Developer mode) — 32-character string
2. Append to `CHROME_EXTENSION_IDS` in `api/wrangler.toml`
3. Deploy: `cd api && wrangler deploy`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS blocks extension | Verify ID is in `CHROME_EXTENSION_IDS`, redeploy |
| Dev extension blocked | Add dev ID to list, or use `wrangler dev` (local mode) |
