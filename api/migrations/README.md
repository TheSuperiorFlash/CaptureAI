# Database Migrations

> **Self-update rule:** When you add a new migration file, add it to the Migration List table below and update [api/DATABASE_GUIDE.md](../DATABASE_GUIDE.md).

## Running Migrations

**Fresh database (first setup):**
```bash
wrangler d1 execute captureai-db --file=migrations/0001_initial_schema.sql
```

**Or apply schema directly (includes DROP TABLE guards for a clean reset):**
```bash
wrangler d1 execute captureai-db --file=schema.sql
```

## Migration List

| # | File | Description |
|---|------|-------------|
| 0001 | `0001_initial_schema.sql` | Complete initial schema — all tables, indexes, and views |
| 0002 | `0002_add_billing_period.sql` | Add `billing_period TEXT DEFAULT 'weekly'` to `users` table |

Migration `0001` uses `IF NOT EXISTS` guards and is idempotent. Migration `0002` uses `ALTER TABLE ADD COLUMN` which SQLite does not support with `IF NOT EXISTS` — re-running it on a database that already has the column will fail. Run each migration exactly once.

## Historical Note

Migrations 001–009 (pre-launch schema evolution) were collapsed into `0001_initial_schema.sql` before any production data existed. The changes they represented:
- Added webhook_events, usage tracking, indexes (001, 002)
- Cleaned up deprecated columns (003)
- Renamed user_id → email in usage_records (004)
- Added cached column (005)
- Created SQL views (006)
- Added usage_daily for O(1) rate limits (007)
- Renamed tier 'free' → 'basic' (008)
- Added verification_codes for OTP (009)

## Rollback

To reset to a clean state (destroys all data):
```bash
wrangler d1 execute captureai-db --file=schema.sql
```
