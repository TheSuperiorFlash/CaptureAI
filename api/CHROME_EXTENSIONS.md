# Chrome Extension Configuration

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

- **Comma-separated list** with automatic whitespace trimming
- **Production mode**: Only exact IDs in `CHROME_EXTENSION_IDS` + `https://captureai.dev`
- **Development mode**: Also allows localhost:3000/8080

## Adding a New Extension ID

1. Find the ID at `chrome://extensions/` (Developer mode) — 32-character string
2. Append to `CHROME_EXTENSION_IDS` in `api/wrangler.toml`
3. Deploy: `cd api && wrangler deploy`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS blocks extension | Verify ID is in `CHROME_EXTENSION_IDS`, redeploy |
| Dev extension blocked | Add dev ID to list, or use `wrangler dev` (local mode) |
