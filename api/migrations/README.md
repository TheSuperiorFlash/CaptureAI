# Database Migrations

## Running Migrations

**Fresh database:** Use the main schema file:
```bash
wrangler d1 execute captureai-db --file=schema.sql
```

**Existing database:** Run migrations in order:
```bash
wrangler d1 execute captureai-db --file=migrations/001_add_indexes_and_webhook_tracking.sql
```

## Migration List

| Migration | Description |
|-----------|-------------|
| `001_add_indexes_and_webhook_tracking.sql` | Adds `webhook_events` table, performance indexes for users/usage_records/webhook_events. Safe to re-run (uses `IF NOT EXISTS`). |

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

## Performance Tips

- Clean old `usage_records` and `webhook_events` periodically
- Use `EXPLAIN QUERY PLAN` for slow queries
- The `user_date` composite index on `usage_records` speeds up per-user time-range queries
