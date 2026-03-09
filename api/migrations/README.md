# Database Migrations

## Running Migrations

**Fresh database:** Use the main schema file (includes all optimizations):
```bash
wrangler d1 execute captureai-db --file=schema.sql
```

**Existing database:** Run migrations sequentially:
```bash
wrangler d1 execute captureai-db --file=migrations/001_add_indexes_and_webhook_tracking.sql
# ... through 007
```

## Migration List

| # | File | Description |
|---|------|-------------|
| 001 | `add_indexes_and_webhook_tracking.sql` | `webhook_events` table, performance indexes for users/usage_records |
| 002 | `add_token_breakdown.sql` | Token breakdown columns (input, output, reasoning, cached tokens) |
| 003 | `remove_unused_columns.sql` | Cleanup of deprecated columns |
| 004 | `usage_records_user_id_to_email.sql` | Schema refactor: `user_id` -> `email` in usage_records |
| 005 | `add_cached_column.sql` | `cached` (yes/no) tracking on usage_records |
| 006 | `create_total_usage_view.sql` | SQL views: `total_usage`, `user_usage`, `total_usage_daily` |
| 007 | `add_usage_daily.sql` | `usage_daily` table for O(1) daily rate limit checks |

All migrations use `IF NOT EXISTS` for idempotency.

## Maintenance

```sql
-- Clean old webhook events (run periodically)
DELETE FROM webhook_events WHERE created_at < datetime('now', '-7 days');
```

```bash
# Verify indexes
wrangler d1 execute captureai-db --command="SELECT name, tbl_name FROM sqlite_master WHERE type='index';"
```

## Rollback

```sql
-- Rollback migration 001
DROP TABLE IF EXISTS webhook_events;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_stripe_subscription;
DROP INDEX IF EXISTS idx_users_tier;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_usage_records_user_id;
DROP INDEX IF EXISTS idx_usage_records_model;
```

See individual migration files for specific rollback instructions.
