# Chrome Extension Configuration

The backend supports multiple Chrome extension IDs for both production and development extensions.

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
- **Production mode**: Only exact IDs in `CHROME_EXTENSION_IDS` can access the backend
- **Development mode** (`ENVIRONMENT=development`): All extensions allowed

## Adding a New Extension ID

1. Find the ID at `chrome://extensions/` (Developer mode enabled) — a 32-character string
2. Append it to `CHROME_EXTENSION_IDS` in `api/wrangler.toml`
3. Deploy: `cd api && wrangler deploy`

## Security

- Whitelist only extensions you control
- Remove retired extension IDs promptly
- Monitor Workers logs (`wrangler tail`) for unauthorized access

## Migration from Single ID

The old `CHROME_EXTENSION_ID` (singular) variable is deprecated. Use the plural `CHROME_EXTENSION_IDS` with comma-separated values.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS blocks extension | Verify ID is in `CHROME_EXTENSION_IDS`, redeploy |
| Dev extension blocked | Add dev ID to list, or set `ENVIRONMENT=development` |
| Multiple test versions | Add all version IDs to the comma-separated list |
